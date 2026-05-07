# WebHookHub 🚀

**WebHookHub** is a powerful developer platform designed to intercept, debug, and tunnel cloud webhooks directly to local development environments. It eliminates the need for expensive third-party tunneling services while providing a professional dashboard for payload inspection, signature verification, and event replay.

🔗 **Live Demo**: [https://web-hook-hub-ld3z.vercel.app/](https://web-hook-hub-ld3z.vercel.app/)  
🔗 **Live Backend API**: [https://webhookhub-api.onrender.com](https://webhookhub-api.onrender.com)

---

## 🌟 Key Features

- **Real-Time Tunneling**: Intercept webhooks from Stripe, GitHub, Razorpay, etc., and forward them to your local `localhost` server via a custom Node.js proxy.
- **Signature Verification**: Built-in cryptographic verification for HMAC-SHA256 signatures, ensuring payload authenticity from major providers.
- **Intelligent Rate Limiting**: Protection against DDoS and API abuse using **Bucket4j**, with per-IP bucket allocation.
- **High-Performance Caching**: Optimized data retrieval using **Caffeine Cache**, reducing database load for frequently accessed project configurations.
- **Live Inspection**: A modern React-based dashboard that streams incoming events in real-time using WebSockets (STOMP).
- **Event Replay**: Re-fire any saved webhook with its original headers and payload to rapidly debug integration logic.
- **Analytics Dashboard**: High-visibility charts to monitor webhook success rates, volume, and trends over time.

---

## 🏗️ Architecture

WebHookHub is built as a distributed full-stack application:

- **Frontend**: React 19 (Vite) deployed on **Vercel**.
- **Backend**: Spring Boot 3.5 (Java 17) deployed on **Render**.
- **Database**: Managed MySQL instance on **Aiven**.
- **Local Bridge**: Node.js Proxy CLI for cloud-to-local tunneling.

---

## 🛠️ Tech Stack

- **Backend**: Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Spring WebSocket.
- **Frontend**: React 19, Framer Motion (Animations), Chart.js (Analytics), Axios.
- **Testing**: JUnit 5, Mockito (100% backend logic coverage).
- **Tooling**: Node.js, Maven, Docker, Postman.

---

## 🚀 Getting Started

### 1. The Local Proxy (Bridge)
To receive cloud events on your local machine, use the provided proxy tool:

```bash
cd frontend
node proxy.js --user YOUR_USER_ID --project PROJECT_SLUG --to http://localhost:3000/api/webhook
```

### 2. Manual Installation

#### Backend
```bash
cd backend
mvn clean install
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security

WebHookHub prioritizes data integrity:
- **JWT Authentication**: All API endpoints are protected via JSON Web Tokens.
- **CORS Configuration**: Hardened for production-grade cross-domain communication.
- **HMAC Validation**: Ensures that webhooks from providers like Stripe or Razorpay are cryptographically verified before they touch your application.

---

## 📄 License
This project is licensed under the MIT License.
