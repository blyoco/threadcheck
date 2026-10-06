// Teksten voor menu en tooltips. Taal 'auto' volgt de browser: Nederlands bij een Nederlandse browser, anders Engels.
globalThis.ThreadsI18n = {
 strings: {
  en: {
   period: 'Recent reply within',
   days30: '30 days', days90: '90 days', year1: '1 year', customMonths: 'Custom number of months',
   periodLabel: 'Period:', months: 'months',
   monthsError: 'Enter a whole number of months from 1 to 1200.',
   autoCheck: 'Check accounts automatically',
   autoInfo: 'Checks up to six accounts at a time in the background by reading their replies on Threads. Accounts on screen go first. Only replies to other people count. Click the dot in front of a name to switch it between green and red. Not every profile can be read automatically.',
   hideRed: 'Hide red accounts',
   language: 'Language', langAuto: 'Automatic (browser language)',
   legendGreen: '🟢 Replied to someone recently',
   legendRed: '🔴 No recent replies',
   legendOrange: '🟠 Check failed, retrying automatically',
   legendWhite: '⚪ Waiting to be checked',
   diagnose: 'Download diagnostics', reset: 'Clear stored data',
   resetConfirm: 'Clear all stored results and your own green/red choices?',
   resetDone: 'Stored data cleared',
   footer: 'No account, no server, no data upload. Everything stays in your browser.',
   stored: n => `${n} accounts stored`,
   queued: n => `${n} in queue`,
   checking: u => `Checking: @${u}`,
   paused: 'Threads is slowing down, pausing briefly',
   openThreads: 'Open a Threads tab to see the queue',
   markRed: 'Mark account red', markGreen: 'Mark account green',
   tipManualActive: 'Always green: your choice',
   tipManualInactive: 'Always red: your choice',
   tipReply: d => `Last reply: ${d}`,
   tipOldReply: d => `Last reply too long ago: ${d}`,
   tipNoReplies: 'No replies found',
   tipChecking: 'Being checked…',
   tipQueued: 'Waiting to be checked',
   tipRetry: 'Will retry automatically.',
   r_noRepliesPage: s => `Threads did not return the replies page (${s}).`,
   r_dataMissing: 'Reply data not found in the page.',
   r_dataUnreadable: 'Reply data could not be read.',
   r_timeout: 'Threads did not respond within 15 seconds.',
   r_network: 'Network error during the check.',
   r_notConfirmed: 'Check not confirmed.'
  },
  nl: {
   period: 'Recente reply binnen',
   days30: '30 dagen', days90: '90 dagen', year1: '1 jaar', customMonths: 'Eigen aantal maanden',
   periodLabel: 'Periode:', months: 'maanden',
   monthsError: 'Vul een heel aantal maanden in van 1 tot 1200.',
   autoCheck: 'Accounts automatisch controleren',
   autoInfo: 'Controleert tot zes accounts tegelijk op de achtergrond door hun replies op Threads te lezen. Accounts in beeld gaan voor. Alleen reacties op anderen tellen. Klik op het bolletje voor een naam om tussen groen en rood te wisselen. Niet elk profiel kan automatisch worden uitgelezen.',
   hideRed: 'Verberg rode accounts',
   language: 'Taal', langAuto: 'Automatisch (browsertaal)',
   legendGreen: '🟢 Heeft recent op iemand gereageerd',
   legendRed: '🔴 Geen recente replies',
   legendOrange: '🟠 Controle mislukt, wordt opnieuw geprobeerd',
   legendWhite: '⚪ Wacht op controle',
   diagnose: 'Diagnose downloaden', reset: 'Opgeslagen gegevens wissen',
   resetConfirm: 'Alle opgeslagen resultaten en je eigen groen/rood-keuzes wissen?',
   resetDone: 'Opgeslagen gegevens gewist',
   footer: 'Geen account, geen server, geen gegevensupload. Alles blijft in je browser.',
   stored: n => `${n} accounts opgeslagen`,
   queued: n => `${n} in wachtrij`,
   checking: u => `Controle: @${u}`,
   paused: 'Threads remt af, even pauze',
   openThreads: 'Open een Threads-tab om de wachtrij te zien',
   markRed: 'Account rood maken', markGreen: 'Account groen maken',
   tipManualActive: 'Altijd groen: jouw keuze',
   tipManualInactive: 'Altijd rood: jouw keuze',
   tipReply: d => `Laatste reply: ${d}`,
   tipOldReply: d => `Laatste reply te lang geleden: ${d}`,
   tipNoReplies: 'Geen replies gevonden',
   tipChecking: 'Wordt gecontroleerd…',
   tipQueued: 'Wacht op controle',
   tipRetry: 'Wordt automatisch opnieuw geprobeerd.',
   r_noRepliesPage: s => `Threads gaf geen Replies-pagina terug (${s}).`,
   r_dataMissing: 'Replies-gegevens niet gevonden in de pagina.',
   r_dataUnreadable: 'Replies-gegevens niet leesbaar.',
   r_timeout: 'Threads reageerde niet binnen 15 seconden.',
   r_network: 'Netwerkfout bij de controle.',
   r_notConfirmed: 'Controle niet bevestigd.'
  }
 },
 lang(setting) {
  if(setting==='en'||setting==='nl')return setting;
  const ui=(globalThis.chrome?.i18n?.getUILanguage?.()||navigator.language||'en').toLowerCase();
  return ui.startsWith('nl')?'nl':'en';
 },
 t(lang, key, ...args) {
  const s=this.strings[lang]?.[key]??this.strings.en[key];
  return s===undefined?key:typeof s==='function'?s(...args):s;
 },
 // Redenen worden als code opgeslagen; oude records bevatten nog losse tekst, die tonen we zoals hij is.
 reason(lang, code, info) {
  return 'r_'+code in this.strings.en?this.t(lang,'r_'+code,info):code;
 }
};
