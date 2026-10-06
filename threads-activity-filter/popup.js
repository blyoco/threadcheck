const days=document.getElementById('days'),hide=document.getElementById('hide'),auto=document.getElementById('auto'),months=document.getElementById('months'),custom=document.getElementById('customPeriod'),error=document.getElementById('periodError');
function showCustom(){custom.hidden=days.value!=='custom';}
chrome.storage.local.get(null).then(d=>{const s={days:90,hide:false,auto:true,...d.settings};days.value=s.months?'custom':String(s.days);months.value=s.months||6;hide.checked=s.hide;auto.checked=s.auto;showCustom();document.getElementById('stats').textContent=Object.keys(d).filter(k=>k.startsWith('account:')).length+' accounts lokaal opgeslagen';});
function save(){showCustom();const value=Number(months.value);if(days.value==='custom'&&(!Number.isInteger(value)||value<1||value>1200)){error.textContent='Vul een heel aantal maanden in van 1 tot 1200.';return;}error.textContent='';chrome.storage.local.set({settings:{days:days.value==='custom'?90:Number(days.value),months:days.value==='custom'?value:null,hide:hide.checked,auto:auto.checked}});}
for(const e of [days,hide,auto,months])e.onchange=save;
document.getElementById('reset').onclick=async()=>{if(!confirm('Alle lokale accountbeoordelingen wissen?'))return;const d=await chrome.storage.local.get(null);await chrome.storage.local.remove(Object.keys(d).filter(k=>k.startsWith('account:')));document.getElementById('stats').textContent='Accountgegevens gewist';};

// Eerst de actieve tab; op Android opent de popup als eigen scherm, dus dan de andere tabs proberen.
async function queueStats(){
 const ask=tab=>chrome.tabs.sendMessage(tab.id,{type:'stats'},{frameId:0}).then(r=>r||Promise.reject());
 try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return await ask(tab);}catch{}
 try{return await Promise.any((await chrome.tabs.query({})).map(ask));}catch{return null;}
}
async function updateStats(){const st=await queueStats();const d=await chrome.storage.local.get(null);document.getElementById('stats').textContent=Object.keys(d).filter(k=>k.startsWith('account:')).length+' accounts opgeslagen | '+(st?st.queued+' in wachtrij'+(st.user?' | Controle: @'+st.user:'')+(st.pausedUntil?' | Threads remt af, even pauze':''):'open een Threads-tab voor de wachtrij');}
updateStats();setInterval(updateStats,2000);

document.getElementById('diagnose').onclick=async()=>{
 const data=await chrome.storage.local.get(null),state=await queueStats();
 const blob=new Blob([JSON.stringify({version:chrome.runtime.getManifest().version,settings:data.settings,state,accounts:Object.fromEntries(Object.entries(data).filter(([k])=>k.startsWith('account:')))},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='threads-diagnose.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
