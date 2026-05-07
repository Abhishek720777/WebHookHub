#!/usr/bin/env node

import { program } from 'commander';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';

program
  .name('webhookhub')
  .description('Tunnel cloud webhooks from WebHookHub directly to your localhost.')
  .version('1.0.0')
  .requiredOption('-u, --user <id>', 'Your WebHookHub User ID')
  .option('-p, --project <slug>', 'The project slug (e.g., github-dev)', 'default')
  .option('-t, --to <url>', 'Local target URL', 'http://localhost:3000')
  .option('-s, --server <url>', 'WebHookHub WS URL', 'https://webhookhub-api.onrender.com/ws')
  .action((options) => {
    const { user, project, to, server } = options;

    const client = new Client({
        webSocketFactory: () => new SockJS(server),
        onConnect: () => {
            console.log('\n----------------------------------------');
            console.log('🚀 WebHookHub CLI Active');
            console.log(`🔗 Watching: ${project}`);
            console.log(`🎯 Forwarding to: ${to}`);
            console.log('----------------------------------------\n');

            client.subscribe(`/topic/events/${user}`, (message) => {
                const event = JSON.parse(message.body);

                // Match by slug or endpoint path
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
            console.error('❌ STOMP Error: ' + frame.headers['message']);
        }
    });

    client.activate();
  });

program.parse();
