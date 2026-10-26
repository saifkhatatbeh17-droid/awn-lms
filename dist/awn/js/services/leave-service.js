/* Shared local leave storage and PDF attachments used by teacher and principal. */
(() => {
  const LEAVE_REQUESTS_KEY="awn_leave_requests_v1";
  const LEAVE_ATTACHMENT_DB="awn_leave_attachments_v1";
  let leaveAttachmentDbPromise;
  function all() { const value=AwnDemo.read(LEAVE_REQUESTS_KEY,[]); return Array.isArray(value)?value.filter(item=>item && typeof item === "object"):[]; }
  function list() {
    if (!AwnDemo.enabled()) return [];
    if (AwnRoles.can('leaves:decide')) return all();
    if (!AwnRoles.can('leaves:create')) return [];
    return all().filter((item)=>item.teacherId === AwnSession.current()?.username);
  }
  function save(items) {
    AwnDemo.assertEnabled();
    if (!Array.isArray(items)) throw new Error('LEAVES_DATA_INVALID');
    const previous=all();
    if (AwnRoles.can('leaves:decide')) {
      const merged=previous.map((record)=>{
        const update=items.find((item)=>item.id === record.id);
        if (!update || record.status !== 'pending' || !['approved','rejected'].includes(update.status)) return record;
        return {...record,status:update.status,decisionNote:String(update.decisionNote || ''),decidedBy:AwnSession.current().name,decidedAt:new Date().toISOString()};
      });
      return AwnDemo.write(LEAVE_REQUESTS_KEY,merged);
    }
    AwnRoles.requirePermission('leaves:create');
    const created=items.filter((item)=>!previous.some((record)=>record.id === item.id));
    const ids=new Set();
    for (const item of created) {
      if (!item.id || ids.has(item.id) || item.teacherId !== AwnSession.current()?.username || item.status !== 'pending' || !['medical','contingent','departure','leave'].includes(item.type) || !AwnUtils.validDate(item.startDate) || !AwnUtils.validDate(item.endDate) || item.endDate < item.startDate || !String(item.reason || '').trim()) throw new Error('LEAVES_DATA_INVALID');
      ids.add(item.id);
    }
    return AwnDemo.write(LEAVE_REQUESTS_KEY,[...previous,...created]);
  }
  function openLeaveAttachmentDb() {
  if (leaveAttachmentDbPromise) return leaveAttachmentDbPromise;
  leaveAttachmentDbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB غير متاح؛ افتح اللوحتين عبر خادم محلي مشترك.")); return; }
    const request = indexedDB.open(LEAVE_ATTACHMENT_DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("تعذر فتح مساحة المرفقات."));
    request.onblocked = () => reject(new Error("أغلق النسخ الأخرى من اللوحة ثم أعد المحاولة."));
  }).catch((error) => { leaveAttachmentDbPromise = null; throw error; });
  return leaveAttachmentDbPromise;
}
async function saveLeaveAttachment(id, file) {
  const db = await openLeaveAttachmentDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put({ id, blob: file.slice(0, file.size, "application/pdf"), name: file.name, size: file.size, type: "application/pdf" });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("تعذر حفظ ملف PDF."));
    transaction.onabort = () => reject(transaction.error || new Error("أُوقف حفظ ملف PDF."));
  });
}
async function getLeaveAttachment(id) {
  const db = await openLeaveAttachmentDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("تعذر قراءة المرفق."));
  });
}
async function deleteLeaveAttachment(id) {
  try {
    const db = await openLeaveAttachmentDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch (error) { console.warn("Could not remove an unused leave attachment", error); }
}

  window.LeaveService=Object.freeze({list,save,saveAttachment:saveLeaveAttachment,getAttachment:getLeaveAttachment,deleteAttachment:deleteLeaveAttachment});
})();
