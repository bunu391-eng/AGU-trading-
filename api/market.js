// Secure backend for AGU Trading.
// Deploy on Vercel/Render/your Node host. Set TWELVE_DATA_API_KEY as a server environment variable.
// Optional SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY can persist provider signals.
const fetchFn = globalThis.fetch;
const API = "https://api.twelvedata.com";

function json(res, body, status=200){
  res.statusCode=status;res.setHeader("Content-Type","application/json");res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");return res.end(JSON.stringify(body));
}
function validSymbol(s){return /^[A-Z]{2,6}\/[A-Z]{2,6}$/.test(s||"") || s==="XAU/USD"}
function validInterval(s){return ["1min","5min","15min","30min","45min","1h","2h","4h","8h","1day","1week"].includes(s||"")}
module.exports = async (req,res)=>{
  if(req.method==="OPTIONS"){res.statusCode=204;return res.end()}
  const u=new URL(req.url,"http://localhost");
  if(u.pathname==="/api/market"){
    const symbol=u.searchParams.get("symbol")||"EUR/USD", interval=u.searchParams.get("interval")||"1h", outputsize=Math.min(+u.searchParams.get("outputsize")||100,500);
    if(!validSymbol(symbol)||!validInterval(interval))return json(res,{error:"Invalid symbol or interval"},400);
    if(!process.env.TWELVE_DATA_API_KEY)return json(res,{error:"Backend is not configured with TWELVE_DATA_API_KEY"},503);
    const url=`${API}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&outputsize=${outputsize}&apikey=${encodeURIComponent(process.env.TWELVE_DATA_API_KEY)}`;
    const r=await fetchFn(url);const d=await r.json();
    if(!r.ok||d.status==="error")return json(res,{error:d.message||"Provider error"},502);
    const candles=(d.values||[]).reverse().map(x=>({time:x.datetime,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:x.volume?+x.volume:null}));
    return json(res,{live:true,source:"Twelve Data",provider:"Twelve Data",symbol,interval,candles,updated_at:new Date().toISOString()});
  }
  return json(res,{error:"Not found"},404);
};
