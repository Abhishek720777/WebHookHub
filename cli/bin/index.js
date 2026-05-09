#!/usr/bin/env node

import { program } from 'commander';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import inquirer from 'inquirer';
import Conf from 'conf';

const config = new Conf({ projectName: 'webhookhub' });
const DEFAULT_API_URL = 'https://webhookhub-api.onrender.com';
const DEFAULT_WS_URL = 'https://webhookhub-api.onrender.com/ws';

program
  .name('webhookhub')
  .description('Professional CLI for WebHookHub tunneling and debugging.')
  .version('1.1.0');

// --- Login Command ---
program
  .command('login')
  .description('Log into your WebHookHub account')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter your WebHookHub username (or email):',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        mask: '*',
      }
    ]);

    try {
      console.log('⏳ Authenticating...');
      const response = await axios.post(`${DEFAULT_API_URL}/api/auth/login`, {
        username: answers.username,
        password: answers.password
      });

      if (response.data && response.data.token) {
        config.set('token', response.data.token);
        config.set('userId', response.data.userId);
        config.set('username', answers.username);
        console.log('✅ Success! You are now logged in as ' + answers.username);
      }
    } catch (err) {
      console.error('❌ Login failed: ' + (err.response?.data?.message || err.message));
    }
  });

// --- Logout Command ---
program
  .command('logout')
  .description('Clear your local credentials')
  .action(() => {
    config.clear();
    console.log('👋 Logged out successfully.');
  });

// --- Main Tunnel Command (Default) ---
program
  .command('forward', { isDefault: true })
  .description('Forward webhooks to localhost')
  .requiredOption('-p, --project <slug>', 'The project slug (e.g., github-dev)')
  .option('-t, --to <url>', 'Local target URL', 'http://localhost:3000')
  .option('-u, --user <id>', 'User ID (auto-filled if logged in)')
  .option('-a, --auth <token>', 'Auth token (auto-filled if logged in)')
  .action((options) => {
    // Priority: Command line flag > Saved config
    const userId = options.user || config.get('userId');
    const token = options.auth || config.get('token');
    const { project, to } = options;

    if (!userId || !token) {
      console.error('❌ Error: You must be logged in to use WebHookHub.');
      console.log('👉 Run: webhookhub login');
      process.exit(1);
    }

    const client = new Client({
        webSocketFactory: () => new SockJS(DEFAULT_WS_URL),
        connectHeaders: { 'Authorization': `Bearer ${token}` },
        onConnect: () => {
            console.log('\n----------------------------------------');
            console.log('🚀 WebHookHub Tunnel Active');
            console.log(`👤 User: ${config.get('username') || userId}`);
            console.log(`🔗 Watching: ${project}`);
            console.log(`🎯 Forwarding to: ${to}`);
            console.log('----------------------------------------\n');

            client.subscribe(`/topic/events/${userId}`, (message) => {
                const event = JSON.parse(message.body);
                console.log(`[${new Date().toLocaleTimeString()}] ☁️  Cloud Event: ${event.channelSlug || 'default'}`);

                if (event.channelSlug === project || event.endpointPath === project) {
                    console.log(`[${new Date().toLocaleTimeString()}] 📬 Event Received!`);
                    
                    axios.post(to, JSON.parse(event.payload), {
                        headers: JSON.parse(event.headers)
                    }).then(res => {
                        console.log(`✅ Forwarded! (Status: ${res.status})`);
                    }).catch(err => {
                        console.error(`❌ Forwarding failed: ${err.message}`);
                    });
                }
            });
        },
        onStompError: (frame) => {
            console.error('❌ Connection Error: ' + frame.headers['message']);
            if (frame.headers['message']?.includes('Unauthorized')) {
                console.log('👉 Your session might have expired. Try: webhookhub login');
            }
        }
    });

    client.activate();
  });

program.parse();
