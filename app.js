const $=id=>document.getElementById(id);
let chart, liveSeries=[], timer;
const demoBase={"EUR/USD":1.0842,"GBP/USD":1.2760,"USD/JPY":149.82,"USD/CHF":.8541,"AUD/USD":.6618,"USD/CAD":1.3542,"NZD/USD":.6152,"EUR/GBP":.8508,"XAU/USD":2650.0};
const demoVol={"EUR/USD":.0048,"GBP/USD":.0062,"USD/JPY":.82,"USD/CHF":.0041,"AUD/USD":.0046,"USD/CAD":.0048,"NZD/USD":.0043,"EUR/GBP":.0032,"XAU/USD":12};
const api=()=>String(window.AGU_CONFIG?.API_BASE_URL||"").replace(/\/$/,"");
const pair=()=>$("#pair").value, tf=()=>$("#tf").value;

function demoCandles(sym,n=80){
 let v=demoBase[sym]||1.0, vol=demoVol[sym]||.005, out=[];
 for(let i=0;i<n;i++){v*=1+(Math.random()-.49)*vol/12;out.push({time:i,close:+v.toFixed(sym==="USD/JPY"?3:sym==="XAU/USD"?2:5),open:v*(1+(Math.random()-.5)*.001),high:v*(1+Math.random()*.0015),low:v*(1-Math.random()*.0015)})}
 return out;
}
function sma(a,n){return a.length<n?null:a.slice(-n).reduce((x,y)=>x+y,0)/n}
function ema(a,n){if(a.length<n)return null;let k=2/(n+1),e=a.slice(0,n).reduce((x,y)=>x+y,0)/n;for(let i=n;i<a.length;i++)e=a[i]*k+e*(1-k);return e}
function calcRsi(a,n=14){if(a.length<=n)return null;let g=0,l=0;for(let i=1;i<=n;i++){let d=a[i]-a[i-1];if(d>=0)g+=d;else l-=d}let ag=g/n,al=l/n;for(let i=n+1;i<a.length;i++){let d=a[i]-a[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n}return al===0?100:100-100/(1+ag/al)}
function atr(c,n=14){if(c.length<=n)return null;let tr=[];for(let i=1;i<c.length;i++)tr.push(Math.max(c[i].high-c[i].low,Math.abs(c[i].high-c[i-1].close),Math.abs(c[i].low-c[i-1].close)));return sma(tr,n)}
function calcMacd(a){let e12=ema(a,12),e26=ema(a,26);return e12!=null&&e26!=null?e12-e26:null}
function localAnalysis(c){
 const closes=c.map(x=>x.close), r=calcRsi(closes), e20=ema(closes,20),e50=ema(closes,50),e200=ema(closes,Math.min(200,closes.length)),m=calcMacd(closes),at=atr(c),last=closes.at(-1);
 const vals={rsi:r,ema20:e20,ema50:e50,ema200,macd:m,atr:at,last};
 let score=0; score+=e20>e50?1:e20<e50?-1:0;score+=last>e200?1:-1;score+=r>50&&r<70?1:r<50&&r>30?-1:0;score+=m>0?1:-1;
 return {...vals,score,trend:score>=2?"Bullish conditions":score<=-2?"Bearish conditions":"Mixed conditions"};
}
async function fetchLive(){
 const url=api(); if(!url)return null;
 const u=`${url}/api/market?symbol=${encodeURIComponent(pair())}&interval=${encodeURIComponent(tf())}&outputsize=100`;
 const r=await fetch(u,{cache:"no-store"}); if(!r.ok)throw Error("Market API "+r.status); return await r.json();
}
async function refresh(){
 let data=null, live=false;
 try{data=await fetchLive();live=!!data?.live}catch(e){data=null}
 if(!data){
   if(!window.AGU_CONFIG?.DEMO_FALLBACK){setStatus("OFFLINE","demo");return}
   liveSeries=demoCandles(pair()); data={live:false,source:"Demo generator",provider:"Demo",candles:liveSeries};
 }else liveSeries=data.candles||[];
 setStatus(data.live?"● LIVE DATA":"● DEMO DATA",data.live?"live":"demo");
 const a=localAnalysis(liveSeries), p=a.last;
 $("#price").textContent=p==null?"—":p;
 $("#rsi").textContent=a.rsi==null?"—":a.rsi.toFixed(1);
 $("#rsiState").textContent=a.rsi>70?"Potentially overbought":a.rsi<30?"Potentially oversold":"Neutral zone";
 $("#atr").textContent=a.atr==null?"—":a.atr.toFixed(pair().includes("JPY")?3:pair()==="XAU/USD"?2:5);
 $("#trend").textContent=a.trend;$("#trendMeta").textContent=a.ema20>a.ema50?"EMA20 > EMA50":"EMA20 < EMA50";
 $("#pairTitle").textContent=pair();$("#chartInfo").textContent=tf();$("#lastUpdate").textContent=new Date().toLocaleTimeString();
 $("#feedSource").textContent=data.source||"Backend";$("#feedProvider").textContent=data.provider||"Market provider";$("#feedTime").textContent=new Date().toLocaleTimeString();
 const prev=liveSeries.at(-2)?.close||p;$("#move").textContent=((p-prev)/prev*100).toFixed(3)+"%";
 renderMatrix(a);renderChart(liveSeries);loadSignals();
}
function setStatus(t,c){$("#connection").textContent=t;$("#connection").className="status "+c}
function renderMatrix(a){
 const rows=[["EMA 20/50",a.ema20>a.ema50?"Bullish":"Bearish",a.ema20>a.ema50?"bull":"bear"],["Price / EMA200",a.last>a.ema200?"Bullish":"Bearish",a.last>a.ema200?"bull":"bear"],["RSI (14)",a.rsi>70?"Overbought":a.rsi<30?"Oversold":"Neutral","neutral"],["MACD",a.macd>0?"Positive":"Negative",a.macd>0?"bull":"bear"]];
 $("#matrix").innerHTML=rows.map(x=>`<div class="matrix-row"><span>${x[0]}</span><span class="pill ${x[2]}">${x[1]}</span></div>`).join("");
 $("#composite").textContent=a.trend;$("#compositeText").textContent="Rule-based indicator alignment. This is analysis, not a guarantee or instruction to trade.";
}
function renderChart(c){
 if(chart)chart.destroy();const labels=c.map((_,i)=>i+1);
 chart=new Chart($("#chart"),{type:"line",data:{labels,datasets:[{data:c.map(x=>x.close),borderWidth:2,pointRadius:0,tension:.2,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{grid:{color:"rgba(100,170,145,.08)"},ticks:{color:"#78958b"}}}}});
}
async function loadSignals(){
 const u=api();if(!u){$("#signalStatus").textContent="NO SIGNAL FEED";$("#signalsTable").innerHTML='<p class="muted">Connect the backend to receive provider signals.</p>';return}
 try{const r=await fetch(`${u}/api/signals`,{cache:"no-store"});const j=await r.json();const arr=j.signals||[];$("#signalStatus").textContent=arr.length?`${arr.length} ACTIVE/RECENT`:"NO SIGNALS";$("#signalsTable").innerHTML=arr.length?`<table><thead><tr><th>Provider</th><th>Pair</th><th>Direction</th><th>Entry</th><th>SL</th><th>TP</th><th>TF</th><th>Received</th></tr></thead><tbody>${arr.map(s=>`<tr><td>${esc(s.provider)}</td><td>${esc(s.symbol)}</td><td>${esc(s.direction)}</td><td>${s.entry??"—"}</td><td>${s.stop_loss??"—"}</td><td>${s.take_profit??"—"}</td><td>${esc(s.timeframe||"—")}</td><td>${new Date(s.received_at||Date.now()).toLocaleString()}</td></tr>`).join("")}</tbody></table>`:'<p class="muted">No provider signals received yet.</p>'}catch(e){$("#signalsTable").innerHTML='<p class="muted">Signal backend unavailable.</p>'}
}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function runAnalysis(){
 const r=+$("#aRsi").value,ema=$("#aEma").value,macd=$("#aMacd").value,e=$("#a200").value,adx=+$("#aAdx").value;let s=(ema==="bull"?1:ema==="bear"?-1:0)+(macd==="bull"?1:macd==="bear"?-1:0)+(e==="bull"?1:-1)+(r>50&&r<70?1:r<50?-1:0)+(adx>=25?1:0);$("#analysisResult").innerHTML=`<h3>${s>=3?"Bullish conditions":s<=-3?"Bearish conditions":"Mixed conditions"}</h3><div class="score">${s>0?"+":""}${s}</div><p class="muted">RSI ${r}; EMA ${ema}; MACD ${macd}; EMA200 ${e}; ADX ${adx}. Indicator alignment is not a probability of success.</p>`;
}
function risk(){const b=+$("bal").value,p=+$("rp").value,e=+$("en").value,s=+$("st").value,ps=+$("ps").value,pv=+$("pv").value,m=b*p/100,pips=Math.abs(e-s)/ps,l=pips?m/(pips*pv):0;$("rm").textContent="$"+m.toFixed(2);$("rps").textContent=pips.toFixed(1)+" pips";$("lots").textContent=l.toFixed(2)+" lots";$("rt").textContent=(e+Math.abs(e-s)).toFixed(5)}
function journalLoad(){const d=JSON.parse(localStorage.getItem("aguTrades")||"[]");$("#journalTable").innerHTML=d.length?`<table><thead><tr><th>Date</th><th>Pair</th><th>Side</th><th>Entry</th><th>Exit</th><th>Result</th><th>Notes</th></tr></thead><tbody>${d.map(x=>`<tr><td>${x.date}</td><td>${esc(x.pair)}</td><td>${x.side}</td><td>${x.entry}</td><td>${x.exit}</td><td>${x.result}</td><td>${esc(x.notes)}</td></tr>`).join("")}</tbody></table>`:'<p class="muted">No journal entries.</p>'}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");$("#title").textContent=b.textContent.replace(/^[^A-Za-z]+/,"").trim()});
$("#pair").onchange=refresh;$("#tf").onchange=refresh;$("#refresh").onclick=refresh;$("#runAnalysis").onclick=runAnalysis;$("#calc").onclick=risk;$("#theme").onclick=()=>document.body.classList.toggle("light");
$("#saveBackend").onclick=()=>{const u=$("#backendUrl").value.trim().replace(/\/$/,"");localStorage.setItem("aguApiBaseUrl",u);window.AGU_CONFIG.API_BASE_URL=u;$("#saved").textContent="Backend URL saved. Refreshing…";setTimeout(refresh,300)};
$("#backendUrl").value=api();
$("#journalForm").onsubmit=e=>{e.preventDefault();const d=JSON.parse(localStorage.getItem("aguTrades")||"[]"),entry=+$("je").value,exit=+$("jx").value,side=$("#js").value;d.unshift({date:new Date().toLocaleDateString(),pair:$("#jp").value,side,entry,exit,result:(side==="Long"?exit-entry:entry-exit)>=0?"Positive":"Negative",notes:$("#jn").value});localStorage.setItem("aguTrades",JSON.stringify(d));e.target.reset();journalLoad()};
$("#clear").onclick=()=>{if(confirm("Clear journal?")){localStorage.removeItem("aguTrades");journalLoad()}};
journalLoad();risk();refresh();timer=setInterval(refresh,window.AGU_CONFIG?.REFRESH_MS||60000);
