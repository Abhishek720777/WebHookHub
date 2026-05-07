import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';

// Parse CLI arguments
const args = process.argv.slice(2);
let userId = null;
let projectSlug = 'default';
let targetUrl = 'http://localhost:3000';
let serverUrl = 'https://webhookhub-api.onrender.com/ws';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--user') userId = args[i + 1];
    if (args[i] === '--project') projectSlug = args[i + 1];
    if (args[i] === '--to') targetUrl = args[i + 1];
    if (args[i] === '--server') serverUrl = args[i + 1];
}

if (!userId) {
    console.error("❌ Error: Missing required argument --user");
    console.error("Usage: node proxy.js --user <ID> [--project <slug>] [--to <url>]");
    process.exit(1);
}

const client = new Client({
    webSocketFactory: () => new SockJS(serverUrl),
    onConnect: () => {
        console.log(`🚀 Connected! Watching for webhooks on: ${projectSlug}`);
        client.subscribe(`/topic/events/${userId}`, (message) => {
            const event = JSON.parse(message.body);

            if (event.channelSlug === projectSlug || event.endpointPath === projectSlug) {
                console.log(`📬 Event Received! Forwarding to ${targetUrl}...`);

                axios.post(targetUrl, JSON.parse(event.payload), {
                    headers: JSON.parse(event.headers)
                }).then(res => {
                    console.log(`✅ Forwarded successfully! (Status: ${res.status})`);
                }).catch(err => {
                    console.error(`❌ Forwarding failed: ${err.message}`);
                });
            }
        });
    }
});

client.activate();
