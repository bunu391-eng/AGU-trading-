# FOREX ANALYZER

A standalone responsive forex technical-analysis dashboard.

## Included
- Responsive dashboard
- Currency-pair selector
- Timeframe selector
- Interactive Chart.js price chart
- RSI, EMA, MACD, ADX and ATR-style analysis
- Rule-based technical signal matrix
- Adjustable technical-analysis engine
- Risk/position-size calculator
- Trade journal saved to browser localStorage
- Market-session reference
- Local settings page
- Demo-data status clearly shown
- No trade execution
- No claims of guaranteed or predictive results

## Run
Open `index.html` in a modern browser.

For a production deployment, serve it over HTTPS and connect it to a licensed market-data backend.

## Live market data
The current build intentionally uses generated demo data. To make it live, connect `app.js` to a market-data provider through a server-side endpoint. Keep provider API secrets on the server; do not place private credentials in browser JavaScript.

## Safety
This is an analysis/calculation tool, not financial advice. Forex and leveraged trading can result in substantial losses. Verify pip-value and contract specifications with your broker before relying on calculations.
