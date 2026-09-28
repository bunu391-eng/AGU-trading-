// GET /api/signals
// For production, replace the in-memory array with Supabase/another database.
// The TradingView webhook endpoint writes into the same store module.
const store = require("./signalStore");
module.exports = async (req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Content-Type","application/json");
  res.end(JSON.stringify({signals:store.getAll()}));
};
