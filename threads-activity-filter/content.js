(() => {
 if(window!==window.top)return;
 const LIMIT=6, HOSTS=['threads.com','www.threads.com','threads.net','www.threads.net'];
 // De Replies-pagina bevat de eerste replies al als JSON in dit blok (Relay-preload van de Replies-tab).
 const MARK='"RelayPrefetchedStreamCache","next",[],["adp_BarcelonaProfileRepliesTabDirectQueryRelayPreloader_';
 // Firefox: content.fetch gaat als verzoek van de pagina zelf de deur uit, net als fetch in Chrome.
 const pageFetch=typeof content!=='undefined'&&typeof content?.fetch==='function'?content.fetch.bind(content):fetch;
 let accounts={}, settings={days:90,hide:false,auto:true}, timer, running=false, lastQueued=new Map(), badges=new WeakMap(), queue=[], active=new Set(), pausedUntil=0, pauseTimer=null;
 const key=u=>'account:'+u;
 function userOf(a){try{const u=new URL(a.href);if(!HOSTS.includes(u.hostname))return null;return u.pathname.match(/^\/@([a-z0-9._]+)\/?$/i)?.[1]?.toLowerCase();}catch{return null;}}
 function state(u){return ThreadsEvidence.classify(accounts[key(u)],settings.days,Date.now(),settings.months);}
 function cardOf(a){let n=a.parentElement;for(let i=0;n&&i<9;i++,n=n.parentElement){const ids=new Set([...n.querySelectorAll('a[href*="/post/"]')].map(x=>x.pathname));if(n.querySelector('time')&&ids.size===1)return n;}return null;}

 function scan(){
  if(running)return;running=true;
  try{
   const checks=[];
   for(const a of document.querySelectorAll('a[href]')){
    const u=userOf(a);if(!u||a.closest('[data-ta-ui],nav,aside,[role="navigation"]'))continue;
    const name=[...a.childNodes].filter(n=>!(n.nodeType===1&&n.classList?.contains('ta-badge'))).map(n=>n.textContent).join('').trim().replace(/^@/,'').toLowerCase();
    if(name!==u)continue;
    let b=badges.get(a);
    if(!b||!b.isConnected){
     b=document.createElement('span');b.className='ta-badge';b.setAttribute('role','button');b.tabIndex=0;b.dataset.taUi='1';
     a.classList.add('ta-name-link');a.prepend(b);badges.set(a,b);
     b.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();const current=b.dataset.user;
      const value=state(current)==='active'?'inactive':'active';
      accounts[key(current)]={...(accounts[key(current)]||{}),manual:value};
      scan();
      chrome.runtime.sendMessage({type:'manual',user:current,value}).then(r=>{if(!r?.ok)load();}).catch(load);
     });
     b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}});
    }else if(b.parentElement!==a||a.firstChild!==b){a.prepend(b);}

    b.dataset.user=u;
    b.setAttribute('aria-label',state(u)==='active'?'Account rood maken':'Account groen maken');
    const st=state(u),txt={active:'🟢',inactive:'🔴',unknown:'⚪',error:'🟠'}[st];if(b.textContent!==txt)b.textContent=txt;
    b.title={active:accounts[key(u)]?.manual==='active'?'Altijd tonen: jouw keuze':'Eigen reply: '+new Date(accounts[key(u)]?.reply).toLocaleString('nl-NL'),inactive:accounts[key(u)]?.manual==='inactive'?'Verbergen: jouw keuze':accounts[key(u)]?.result==='observed'?'Laatste eigen reply: '+new Date(accounts[key(u)]?.reply).toLocaleString('nl-NL'):'Geen eigen replies gevonden',error:accounts[key(u)]?.reason||'Controle mislukt: geen oordeel over activiteit',unknown:accounts[key(u)]?.status==='checking'?'Wordt op achtergrond gecontroleerd':(accounts[key(u)]?.reason||'In wachtrij of nog onbekend')}[st];
    const card=cardOf(a);if(card){const author=[...card.querySelectorAll('a[href]')].find(x=>userOf(x)&&x.textContent.trim());if(author===a)card.classList.toggle('ta-hidden',settings.hide&&st==='inactive');}
    if(settings.auto&&!active.has(u)&&ThreadsEvidence.due(accounts[key(u)])&&Date.now()-(lastQueued.get(u)||0)>1000){
     lastQueued.set(u,Date.now());const rect=a.getBoundingClientRect();checks.push({user:u,priority:rect.bottom>=0&&rect.top<innerHeight?0:rect.top>=innerHeight&&rect.top<innerHeight*3?1:2});
    }
   }
   if(checks.length)enqueue(checks);
  }finally{running=false;}
 }

 function enqueue(items){
  for(const item of items){const old=queue.find(x=>x.user===item.user);if(old)old.priority=item.priority;else queue.push(item);}
  queue.sort((a,b)=>a.priority-b.priority);if(queue.length>200)queue.length=200;pump();
 }
 function pump(){
  if(!settings.auto)return;
  if(Date.now()<pausedUntil){if(!pauseTimer)pauseTimer=setTimeout(()=>{pauseTimer=null;pump();},pausedUntil-Date.now());return;}
  while(active.size<LIMIT&&queue.length){
   const {user}=queue.shift();
   if(active.has(user)||!ThreadsEvidence.due(accounts[key(user)]))continue;
   active.add(user);check(user).catch(()=>{}).finally(()=>{active.delete(user);pump();});
  }
 }
 async function check(user){
  const claim=await chrome.runtime.sendMessage({type:'claim',user}).catch(()=>null);if(!claim?.ok)return;
  // Eerst zonder cookies (getest), bij een lege of afwijkende pagina nog één keer met de eigen sessie.
  let out=await fetchReplies(user,'omit');
  if(out.retry)out=await fetchReplies(user,'include');
  if(out.rateLimited){pausedUntil=Date.now()+60000;queue.unshift({user,priority:-1});return;}
  await chrome.runtime.sendMessage({type:'result',user,...out}).catch(()=>{});
 }
 async function fetchReplies(user,credentials){
  const started=Date.now(),ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),15000);
  const diagnostics={method:'fetch',credentials,profile:user};
  try{
   const res=await pageFetch(location.origin+'/@'+user+'/replies',{credentials,cache:'no-store',headers:{Accept:'text/html'},signal:ctrl.signal});
   diagnostics.status=res.status;
   if(res.status===429)return {rateLimited:true};
   const path=new URL(res.url).pathname.replace(/\/$/,'').toLowerCase();diagnostics.finalPath=path;
   if(!res.ok||path!=='/@'+user+'/replies')return {retry:true,reason:'Threads gaf geen Replies-pagina terug ('+res.status+')',diagnostics};
   const blob=await readBlob(res,diagnostics);
   if(!blob)return {retry:true,reason:'Replies-gegevens niet gevonden in de pagina',diagnostics};
   let media=null;JSON.parse(blob,(k,v)=>{if(k==='mediaData'&&v&&Array.isArray(v.edges))media=v;return v;});
   if(!media)return {retry:true,reason:'Replies-gegevens niet leesbaar',diagnostics};
   let newest=0,code=null,own=0;
   for(const edge of media.edges)for(const item of edge?.node?.thread_items||[]){
    const post=item?.post,info=post?.text_post_app_info||{};
    if(post?.user?.username?.toLowerCase()!==user)continue;own++;
    // Alleen reacties op anderen tellen; een draadje onder je eigen post is geen deelname.
    const to=info.reply_to_author?.username?.toLowerCase();
    if(to===user||!(to||info.is_reply===true))continue;
    const time=post.taken_at*1000;
    if(Number.isFinite(time)&&time>newest&&/^[\w-]+$/.test(post.code||'')){newest=time;code=post.code;}
   }
   Object.assign(diagnostics,{threads:media.edges.length,ownItems:own,more:!!media.page_info?.has_next_page});
   if(newest)return {result:'observed',evidence:{user,datetime:new Date(newest).toISOString(),url:location.origin+'/@'+user+'/post/'+code},reason:'Eigen reply gevonden',diagnostics};
   return {result:'empty',reason:media.edges.length?'Alleen reacties binnen eigen draadjes gevonden':'Replies-pagina is leeg',diagnostics};
  }catch(e){
   diagnostics.error=e.name;
   return {retry:true,reason:e.name==='AbortError'?'Threads reageerde niet binnen 15 seconden':'Netwerkfout bij controle',diagnostics};
  }finally{clearTimeout(timeout);diagnostics.elapsedMs=Date.now()-started;}
 }
 // Lees de pagina als stream en stop zodra het Replies-blok binnen is (scheelt ~40% downloaden).
 async function readBlob(res,diagnostics){
  const reader=res.body.getReader(),decoder=new TextDecoder();let text='',from=0;
  try{
   for(;;){
    const {done,value}=await reader.read();if(done)return null;
    text+=decoder.decode(value,{stream:true});diagnostics.kb=Math.round(text.length/1024);
    const at=text.indexOf(MARK,from);
    if(at<0){from=Math.max(0,text.length-MARK.length);continue;}
    from=at;const end=text.indexOf('</script>',at);if(end<0)continue;
    return text.slice(text.indexOf('>',text.lastIndexOf('<script',at))+1,end);
   }
  }finally{reader.cancel().catch(()=>{});}
 }

 async function load(){const data=await chrome.storage.local.get(null);accounts=data;settings={days:90,hide:false,auto:true,...data.settings};scan();}
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local')return;
  for(const [k,v] of Object.entries(changes)){
   if(v.newValue===undefined)delete accounts[k];else accounts[k]=v.newValue;
   if(k==='settings')settings={days:90,hide:false,auto:true,...v.newValue};
  }
  scheduleScan();
 });
 chrome.runtime.onMessage.addListener((m,s,reply)=>{if(m.type==='stats')reply({queued:queue.length,user:[...active].join(', @')||null,parallel:LIMIT,pausedUntil:pausedUntil>Date.now()?pausedUntil:null});});
 function scheduleScan(){if(timer)return;timer=requestAnimationFrame(()=>{timer=null;scan();});}
 addEventListener('scroll',scheduleScan,{passive:true});
 const obs=new MutationObserver(m=>{if(m.every(x=>x.target.closest?.('[data-ta-ui],.ta-badge')))return;scheduleScan();});
 obs.observe(document.body,{childList:true,subtree:true});
 setInterval(scan,5000);
 load();
})();
