const axios = require('axios');

const ENDPOINT = 'http://localhost:8080/webhook/1';

const payloads = [
  {
    name: 'Stripe: Payment Succeeded',
    headers: { 'Stripe-Signature': 't=161421,v1=abcdef', 'Content-Type': 'application/json' },
    data: {
      "id": "evt_1If",
      "object": "event",
      "type": "payment_intent.succeeded",
      "data": {
        "object": {
          "id": "pi_1If",
          "amount": 2000,
          "currency": "usd",
          "status": "succeeded",
          "customer": "cus_9s8"
        }
      }
    }
  },
  {
    name: 'GitHub: Push Event',
    headers: { 'X-GitHub-Event': 'push', 'Content-Type': 'application/json' },
    data: {
      "ref": "refs/heads/main",
      "repository": {
        "name": "WebHookHub",
        "full_name": "developer/WebHookHub",
        "private": false,
        "owner": { "login": "developer" }
      },
      "pusher": { "name": "developer", "email": "dev@example.com" },
      "commits": [
        {
          "id": "3d4f",
          "message": "Fix webhook parsing bug",
          "author": { "name": "developer" }
        }
      ]
    }
  },
  {
    name: 'Shopify: Order Created',
    headers: { 'X-Shopify-Topic': 'orders/create', 'Content-Type': 'application/json' },
    data: {
      "id": 820982911946154508,
      "email": "jon@example.com",
      "closed_at": null,
      "created_at": "2026-05-01T15:00:00-04:00",
      "updated_at": "2026-05-01T15:00:00-04:00",
      "number": 234,
      "total_price": "199.00",
      "subtotal_price": "199.00",
      "currency": "USD"
    }
  },
  {
    name: 'Discord: User Joined',
    headers: { 'X-Discord-Event': 'GUILD_MEMBER_ADD', 'Content-Type': 'application/json' },
    data: {
      "guild_id": "1234567890",
      "member": {
        "user": {
          "id": "9876543210",
          "username": "CoolGamer99",
          "discriminator": "1234"
        },
        "roles": [],
        "joined_at": "2026-05-01T15:05:00.000Z"
      }
    }
  }
];

async function simulate() {
  console.log('Starting real-world webhook simulation...\n');
  for (const p of payloads) {
    try {
      console.log(`Sending [${p.name}]...`);
      await axios.post(ENDPOINT, p.data, { headers: p.headers });
      console.log('✅ Success\n');
    } catch (e) {
      console.error(`❌ Failed: ${e.message}\n`);
    }
    // wait 3 seconds before next
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('Done simulating webhooks!');
}

simulate();
