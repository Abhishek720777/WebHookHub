import http from 'http';

const PORT = 3001;

const server = http.createServer((req, res) => {
    let body = '';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        console.log('--------------------------------------------------');
        console.log(`🚀 [${new Date().toLocaleTimeString()}] RECEIVED FORWARDED WEBHOOK`);
        console.log(`📝 Method: ${req.method}`);
        console.log(`🔗 Path: ${req.url}`);
        console.log('📄 Headers:', JSON.stringify(req.headers, null, 2));
        try {
            const json = JSON.parse(body);
            console.log('📦 Payload (JSON):', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('📦 Payload (Raw):', body);
        }
        console.log('--------------------------------------------------\n');

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Webhook Forwarded Successfully to Local Listener!');
    });
});

server.listen(PORT, () => {
    console.log(`✅ Webhook Listener is running at: http://localhost:${PORT}`);
    console.log(`👉 Step 1: Copy this URL: http://localhost:${PORT}/my-local-api`);
    console.log(`👉 Step 2: Paste it into the "Forwarding" section of your WebHookHub Dashboard.`);
    console.log(`👉 Step 3: Click "Update Target".`);
    console.log(`👉 Step 4: Run 'npm run simulate' and watch the logs here!`);
});
