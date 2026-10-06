globalThis.ThreadsEvidence = {
 SCAN: 5,
 valid(user, author, datetime, now = Date.now()) {
  if (!user || user !== author || typeof datetime !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(datetime)) return null;
  const time = Date.parse(datetime);
  return Number.isFinite(time) && time > 0 && time <= now ? time : null;
 },
 cutoff(months, now = Date.now()) {
  const date = new Date(now), day = date.getUTCDate();
  date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-months);
  const last = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  date.setUTCDate(Math.min(day,last));return date.getTime();
 },
 classify(record, days, now = Date.now(), months = null) {
  if(record?.manual==='active')return 'active';
  if(record?.manual==='inactive')return 'inactive';
  if(this.active(record,days,now,months))return 'active';
  if(record?.scanVersion===this.SCAN && (record.result==='empty' || (record.result==='observed' && record.evidenceVersion===3 && Number.isFinite(record.reply) && record.reply<=now)))return 'inactive';
  return record?.status==='unknown'?'error':'unknown';
 },
 active(record, days, now = Date.now(), months = null) {
  return record?.evidenceVersion === 3 && Number.isFinite(record.reply) &&
   record.reply <= now && (Number.isInteger(months) && months > 0 ? record.reply >= this.cutoff(months,now) : now - record.reply <= days * 86400000);
 },
 // Gelukte controles 24 uur bewaren, mislukte na 15 minuten opnieuw proberen.
 due(record, now = Date.now()) {
  if(record?.manual)return false;
  if(record?.status==='checking' && now-(record.checkingSince||0)<45000)return false;
  if(!record?.checked || record.scanVersion!==this.SCAN)return true;
  return now-record.checked >= (record.status==='observed'?86400000:900000);
 }
};
