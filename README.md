# flexpay-demo

A demo full-stack application combining a React front-end with an Express.js back-end.
Integrates Knot API for payment and card management, and uses mock Plaid transactions for demonstration.

## Features
- Create and manage Knot sessions (card switcher, transaction link)
- Webhook processing for card and payment events
- Credit limit adjustment based on risk score
- Mock Plaid integration for transaction data
- Responsive React UI with React Router and Chart.js

## Prerequisites
- Node.js (>=14) and npm
- Knot API account and credentials

## Setup
1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/flexpay-demo.git
   cd flexpay-demo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root:
   ```
   REACT_APP_KNOT_API_KEY=your_knot_api_key
   REACT_APP_KNOT_CLIENT_ID=your_knot_client_id
   REACT_APP_KNOT_SECRET=your_knot_secret
   ```
4. Run in development mode (client on 3000, server on 3001):
   ```bash
   npm run dev
   ```

## Available Scripts
- `npm start` – start the React front-end (port 3000)
- `npm run server` – start the Express back-end (port 3001)
- `npm run dev`    – start both front-end and back-end concurrently

## API Endpoints
Back-end (port 3001):
- `GET /test`  
- `POST /webhook/knot`  
- `POST /api/create-knot-session`  
- `POST /api/adjust-credit-limit`

## Project Structure
```plaintext
/flexpay-demo
├ server.js
├ package.json
├ .env
└ src/           # React front-end
   ├ index.js
   ├ App.js
   └ ...

## License
MIT
