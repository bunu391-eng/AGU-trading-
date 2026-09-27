# AGU TRADING — LIVE FOREX + SIGNAL PROVIDER UPGRADE

This package upgrades the existing GitHub Pages site from generated demo prices to a secure architecture for real market data and third-party signals.

## Architecture

GitHub Pages frontend
  -> secure backend
  -> Twelve Data API (secret stays server-side)

TradingView
  -> HTTPS webhook
  -> `/api/webhook/tradingview`
  -> signal store
  -> `/api/signals`
  -> GitHub Pages dashboard

Twelve Data documents a Forex API v2 with real-time forex data and aggregated candles, and its WebSocket service can stream quotes on supported plans. Check the provider's current plan/licensing terms before production redistribution.

## Files

Frontend:
- index.html
- styles.css
- app.js
- config.js

Backend:
- api/market.js
- api/signals.js
- api/signalStore.js
- api/webhook/tradingview.js
- package.json
- vercel.json

Database:
- supabase-signals.sql

## Required production secrets

On the backend only:
- TWELVE_DATA_API_KEY
- WEBHOOK_SECRET

Do NOT put these secrets into `config.js`, `app.js`, GitHub Pages, or a public Git repository.

## Deploy backend

Vercel is one option. Deploy the repository as a Node/Vercel project, then add:
TWELVE_DATA_API_KEY=your_secret
WEBHOOK_SECRET=your_random_secret

The frontend's Settings page should then contain the backend URL, e.g.
https://your-backend.vercel.app

## TradingView signal webhook

Use:
https://YOUR-BACKEND/api/webhook/tradingview?token=YOUR_WEBHOOK_SECRET

Example JSON:
{
  "provider":"TradingView",
  "symbol":"EUR/USD",
  "direction":"BUY",
  "entry":1.08420,
  "stop_loss":1.08020,
  "take_profit":1.09220,
  "timeframe":"1H",
  "message":"EMA + MACD setup"
}

Use HTTPS. Do not transmit passwords, broker credentials, or private keys.

## Current signal storage

`signalStore.js` is intentionally a simple in-memory starter so the package works immediately on a serverless runtime. For persistent signals, connect `api/webhook/tradingview.js` and `api/signals.js` to Supabase using a server-side service credential.

## Important

The frontend falls back to clearly labelled demo data until the backend returns live data. It never labels generated data as live.

Forex and leveraged trading carry substantial risk. Technical analysis and provider signals are not guarantees or personalized financial advice.
