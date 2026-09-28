// TradingView -> POST /api/webhook/tradingview
// For a durable production system, replace the in-memory store with Supabase.
// Set WEBHOOK_SECRET in the server environment and put that secret in your webhook URL
// as ?token=... only if your provider's webhook setup permits it. Do not send passwords.
const store=require("../signalStore");
module.exports=async(req,res)=>{
  if(req.method!=="POST"){res.statusCode=405;return res.end("Method Not Allowed")}
  const u=new URL(req.url,"http://localhost");
  if(process.env.WEBHOOK_SECRET && u.searchParams.get("token")!==process.env.WEBHOOK_SECRET){res.statusCode=401;return res.end("Unauthorized")}
  let body=req.body;
  if(typeof body==="string"){try{body=JSON.parse(body)}catch{body={message:body}}}
  body=body||{};
  const signal={
    provider:body.provider||"TradingView",
    symbol:String(body.symbol||"").toUpperCase(),
    direction:String(body.direction||"").toUpperCase(),
    entry:body.entry??null,
    stop_loss:body.stop_loss??null,
    take_profit:body.take_profit??null,
    timeframe:body.timeframe||"",
    message:body.message||"",
    received_at:new Date().toISOString()
  };
  if(!/^[A-Z]{2,6}\/[A-Z]{2,6}$/.test(signal.symbol) && signal.symbol!=="XAU/USD"){res.statusCode=400;return res.end("Invalid symbol")}
  if(!["BUY","SELL","NEUTRAL"].includes(signal.direction)){res.statusCode=400;return res.end("Invalid direction")}
  store.add(signal);res.statusCode=201;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({ok:true,signal}));
};
