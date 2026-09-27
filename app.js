const pairs={
 "EUR/USD":{base:1.0842,vol:.0048,bias:1},
 "GBP/USD":{base:1.2741,vol:.0062,bias:1},
 "USD/JPY":{base:149.82,vol:.82,bias:-1},
 "USD/CHF":{base:.8541,vol:.0041,bias:-1},
 "AUD/USD":{base:.6618,vol:.0046,bias:1},
 "USD/CAD":{base:1.3542,vol:.0048,bias:-1},
 "NZD/USD":{base:.6152,vol:.0043,bias:1},
 "EUR/GBP":{base:.8508,vol:.0032,bias:1}
};
let currentPair="EUR/USD", chart;
const $=id=>document.getElementById(id);

function makeSeries(pair,count=72){
 const p=pairs[pair], arr=[]; let v=p.base*(1+(Math.random()-.5)*.006);
 for(let i=0;i<count;i++){
   const drift=p.bias*.00006, noise=(Math.random()-.5)*p.vol*.20;
   v=Math.max(.0001,v*(1+drift+noise/p.base));
   arr.push(+v.toFixed(pair==="USD/JPY"?3:5));
 }
 return arr;
}
function indicators(pair){
 const p=pairs[pair], seed=Math.random();
 const rsi=+(48+p.bias*6+seed*9).toFixed(1);
 const ema=p.bias>0?"Bullish":"Bearish";
 const macd=p.bias>0?"Bullish":"Bearish";
 const adx=+(20+seed*16).toFixed(1);
 return {rsi,ema,macd,adx,trend: p.bias>0?"Bullish":"Bearish"};
}
function render(){
 const p=pairs[currentPair], s=indicators(currentPair), series=makeSeries(currentPair);
 $("price").textContent=series.at(-1);
 $("change").textContent=(p.bias>0?"+":"-")+(Math.random()*.42+.05).toFixed(2)+"%";
 $("rsi").textContent=s.rsi; $("atr").textContent=p.vol.toFixed(5);
 $("trend").textContent=s.trend; $("trendMeta").textContent=p.bias>0?"Above EMA 50":"Below EMA 50";
 $("chartTitle").textContent=currentPair;
 const tf=$("tfSelect").selectedOptions[0].textContent;
 $("chartSub").textContent=tf+" technical view";
 $("signals").innerHTML=[
  ["Trend / EMA",s.ema,s.ema==="Bullish"?"bull":"bear"],
  ["MACD momentum",s.macd,s.macd==="Bullish"?"bull":"bear"],
  ["RSI (14)",s.rsi>70?"Potentially overbought":s.rsi<30?"Potentially oversold":"Neutral",s.rsi>70||s.rsi<30?"neutral":"neutral"],
  ["ADX (14)",s.adx,s.adx>=25?"bull":"neutral"]
 ].map(x=>`<div class="signal-row"><span>${x[0]}</span><span class="pill ${x[2]}">${x[1]}</span></div>`).join("");
 const score=(s.ema==="Bullish"?1:-1)+(s.macd==="Bullish"?1:-1)+(s.rsi>50?1:-1)+(s.adx>=25?(p.bias):0);
 $("composite").textContent=score>=3?"Bullish conditions":score<=-3?"Bearish conditions":"Mixed conditions";
 $("compositeText").textContent="This is a rule-based summary of selected indicators, not a forecast or instruction to trade.";
 $("indicatorList").innerHTML=`<li><span>EMA 20/50</span><b>${s.ema}</b></li><li><span>MACD</span><b>${s.macd}</b></li><li><span>RSI</span><b>${s.rsi}</b></li><li><span>ADX</span><b>${s.adx}</b></li>`;
 if(chart) chart.destroy();
 chart=new Chart($("priceChart"),{type:"line",data:{labels:series.map((_,i)=>i+1),datasets:[{data:series,borderWidth:2,pointRadius:0,tension:.22,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{grid:{color:"rgba(120,170,150,.08)"},ticks:{color:"#78938a"}}}}});
}
function riskCalc(){
 const bal=+$("balance").value||0, pct=+$("riskPct").value||0, entry=+$("entry").value, stop=+$("stop").value, pip=+$("pipSize").value||.0001, pipVal=+$("pipValue").value||10;
 const money=bal*pct/100, pips=Math.abs(entry-stop)/pip, lots=pips?money/(pips*pipVal):0;
 $("riskMoney").textContent="$"+money.toFixed(2);
 $("stopPips").textContent=pips.toFixed(1)+" pips";
 $("lotSize").textContent=lots.toFixed(2)+" lots";
 $("oneR").textContent=(entry+(entry>stop?Math.abs(entry-stop):Math.abs(entry-stop))).toFixed(5);
}
function runTechnical(){
 const r=+$("rsiInput").value, ema=$("emaInput").value, macd=$("macdInput").value, e200=$("ema200Input").value, adx=+$("adxInput").value, act=$("activityInput").value;
 let score=0;
 score+=(ema==="bull"?1:ema==="bear"?-1:0)+(macd==="bull"?1:macd==="bear"?-1:0)+(e200==="bull"?1:-1);
 score+=(r>50&&r<70?1:r<30?1:r>70?-1:r<50?-1:0);
 score+=(adx>=25?(score>=0?1:-1):0);
 const label=score>=3?"Bullish conditions":score<=-3?"Bearish conditions":"Mixed conditions";
 $("technicalResult").innerHTML=`<h3>${label}</h3><div class="score">${score>0?"+":""}${score}</div><p class="muted">RSI: ${r}. EMA alignment: ${ema}. MACD: ${macd}. EMA200: ${e200}. ADX: ${adx}. Activity: ${act}. The score describes indicator alignment only; it is not a probability of success.</p>`;
}
function loadJournal(){
 const data=JSON.parse(localStorage.getItem("fxJournal")||"[]");
 $("journalBody").innerHTML=data.map(t=>`<tr><td>${t.date}</td><td>${t.pair}</td><td>${t.side}</td><td>${t.entry}</td><td>${t.exit}</td><td>${t.result}</td><td>${t.notes||""}</td></tr>`).join("")||`<tr><td colspan="7" class="muted">No journal entries yet.</td></tr>`;
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active");
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); $(b.dataset.view).classList.add("active");
 $("pageTitle").textContent=b.textContent.replace(/^[^A-Za-z]+/,"").trim();
});
$("pairSelect").onchange=e=>{currentPair=e.target.value;render()};
$("tfSelect").onchange=render; $("refreshBtn").onclick=render;
$("runAnalysis").onclick=runTechnical; $("calcRisk").onclick=riskCalc;
$("themeBtn").onclick=()=>document.body.classList.toggle("light");
$("journalForm").onsubmit=e=>{
 e.preventDefault();
 const entry=+$("jEntry").value, exit=+$("jExit").value, side=$("jSide").value;
 const diff=side==="Long"?exit-entry:entry-exit;
 const data=JSON.parse(localStorage.getItem("fxJournal")||"[]");
 data.unshift({date:new Date().toLocaleDateString(),pair:$("jPair").value,side,entry,exit,result:diff>=0?"Positive":"Negative",notes:$("jNotes").value});
 localStorage.setItem("fxJournal",JSON.stringify(data)); e.target.reset(); loadJournal();
};
$("clearJournal").onclick=()=>{if(confirm("Clear all locally saved journal entries?")){localStorage.removeItem("fxJournal");loadJournal()}};
$("saveSettings").onclick=()=>{$("settingsMsg").textContent="Settings saved locally.";localStorage.setItem("fxApiUrl",$("apiUrl").value)};
$("apiUrl").value=localStorage.getItem("fxApiUrl")||"";
loadJournal(); riskCalc(); render();
