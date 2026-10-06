// Chrome laadt evidence.js hier; Firefox laadt het via background.scripts in de manifest.
if(typeof importScripts==='function')importScripts('evidence.js');
let serial=Promise.resolve();
function locked(fn){serial=serial.then(fn,fn);return serial;}
const key=u=>'account:'+u;
const validUser=u=>typeof u==='string'&&/^[a-z0-9._]{1,64}$/i.test(u);
const HOSTS=['threads.com','www.threads.com','threads.net','www.threads.net'];
// Een tab claimt een account voordat hij het ophaalt, zodat twee Threads-tabs niet dubbel controleren.
async function claim(user){
 const data=await chrome.storage.local.get(key(user)),record=data[key(user)];
 if(!ThreadsEvidence.due(record))return {ok:false};
 await chrome.storage.local.set({[key(user)]:{...record,status:'checking',checkingSince:Date.now(),reason:'Replies worden opgehaald'}});
 return {ok:true};
}
async function store(user,m){
 const data=await chrome.storage.local.get(key(user)),record={...(data[key(user)]||{})};
 delete record.checkingSince;
 let ok=m.result==='empty';
 if(m.result==='observed'&&m.evidence?.user===user){
  const ev=m.evidence;let url;try{url=new URL(ev.url);}catch{}
  const author=url?.pathname.match(/^\/@([a-z0-9._]+)\/post\/[^/]+\/?$/i)?.[1]?.toLowerCase();
  const time=ThreadsEvidence.valid(user,author,ev.datetime);
  if(time!==null&&HOSTS.includes(url?.hostname)){ok=true;Object.assign(record,{reply:time,url:url.href,evidenceVersion:3});}
 }
 // Een gelukte controle vervangt het oude resultaat; een mislukte laat het laatst bekende resultaat staan.
 if(ok){record.result=m.result;if(m.result==='empty'){delete record.reply;delete record.url;delete record.evidenceVersion;}}
 await chrome.storage.local.set({[key(user)]:{...record,checked:Date.now(),status:ok?'observed':'unknown',scanVersion:ThreadsEvidence.SCAN,diagnostics:m.diagnostics||null,reason:String(m.reason||'Controle niet bevestigd').slice(0,200)}});
 return {ok:true};
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 let task;
 if(m.type==='claim'&&s.tab&&validUser(m.user))task=locked(()=>claim(m.user));
 if(m.type==='result'&&s.tab&&validUser(m.user))task=locked(()=>store(m.user,m));
 if(m.type==='manual'&&validUser(m.user))task=locked(async()=>{
  const data=await chrome.storage.local.get(key(m.user));
  await chrome.storage.local.set({[key(m.user)]:{...data[key(m.user)],manual:m.value==='active'?'active':m.value==='inactive'?'inactive':null}});return {ok:true};
 });
 if(task){task.then(reply).catch(e=>reply({ok:false,error:String(e)}));return true;}
});
chrome.runtime.onInstalled.addListener(()=>locked(async()=>{
 const data=await chrome.storage.local.get(null),patch={settings:{days:90,hide:false,...data.settings}};
 // Resultaten van de oude frame-controle (scanVersion 4) waren allemaal onbetrouwbaar: opnieuw controleren.
 for(const [k,v] of Object.entries(data)){
  if(!k.startsWith('account:'))continue;
  if(v.scanVersion!==ThreadsEvidence.SCAN)patch[k]=v.manual?{manual:v.manual}:{};
  else if(v.status!=='observed')patch[k]={...v,checked:0,status:'unknown'};
 }
 await chrome.storage.session.clear();
 await chrome.storage.local.set(patch);
}));
