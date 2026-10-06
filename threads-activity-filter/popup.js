const days=document.getElementById('days'),hide=document.getElementById('hide'),auto=document.getElementById('auto'),months=document.getElementById('months'),custom=document.getElementById('customPeriod'),error=document.getElementById('periodError'),lang=document.getElementById('lang');
let L=ThreadsI18n.lang('auto');
const t=(k,...a)=>ThreadsI18n.t(L,k,...a);
function translate(){L=ThreadsI18n.lang(lang.value);document.documentElement.lang=L;for(const e of document.querySelectorAll('[data-i18n]'))e.textContent=t(e.dataset.i18n);updateStats();}
function showCustom(){custom.hidden=days.value!=='custom';}
chrome.storage.local.get(null).then(d=>{const s={days:90,hide:false,auto:true,lang:'auto',...d.settings};days.value=s.months?'custom':String(s.days);months.value=s.months||6;hide.checked=s.hide;auto.checked=s.auto;lang.value=s.lang;showCustom();translate();});
function save(){showCustom();const value=Number(months.value);if(days.value==='custom'&&(!Number.isInteger(value)||value<1||value>1200)){error.textContent=t('monthsError');return;}error.textContent='';chrome.storage.local.set({settings:{days:days.value==='custom'?90:Number(days.value),months:days.value==='custom'?value:null,hide:hide.checked,auto:auto.checked,lang:lang.value}});}
for(const e of [days,hide,auto,months])e.onchange=save;
lang.onchange=()=>{save();translate();};
document.getElementById('reset').onclick=async()=>{if(!confirm(t('resetConfirm')))return;const d=await chrome.storage.local.get(null);await chrome.storage.local.remove(Object.keys(d).filter(k=>k.startsWith('account:')));document.getElementById('stats').textContent=t('resetDone');};

// Eerst de actieve tab; op Android opent de popup als eigen scherm, dus dan de andere tabs proberen.
async function queueStats(){
 const ask=tab=>chrome.tabs.sendMessage(tab.id,{type:'stats'},{frameId:0}).then(r=>r||Promise.reject());
 try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return await ask(tab);}catch{}
 try{return await Promise.any((await chrome.tabs.query({})).map(ask));}catch{return null;}
}
async function updateStats(){const st=await queueStats();const d=await chrome.storage.local.get(null);document.getElementById('stats').textContent=t('stored',Object.keys(d).filter(k=>k.startsWith('account:')).length)+' | '+(st?t('queued',st.queued)+(st.user?' | '+t('checking',st.user):'')+(st.pausedUntil?' | '+t('paused'):''):t('openThreads'));}
translate();setInterval(updateStats,2000);

document.getElementById('diagnose').onclick=async()=>{
 const data=await chrome.storage.local.get(null),state=await queueStats();
 const blob=new Blob([JSON.stringify({version:chrome.runtime.getManifest().version,settings:data.settings,state,accounts:Object.fromEntries(Object.entries(data).filter(([k])=>k.startsWith('account:')))},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='threadcheck-diagnostics.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
