(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = "daywise.tasks.v1";
  const today = localDate(new Date());
  let tasks = loadTasks();
  let selectedDate = today;
  let shownMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let activePage = "calendar";
  let activeFilter = "all";
  let deferredInstallPrompt = null;
  let toastTimer;

  function localDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function parseDate(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d,12); }
  function niceDate(s, options={day:"numeric",month:"short",year:"numeric"}) {
    return parseDate(s).toLocaleDateString(undefined, options);
  }
  function loadTasks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(t => t && typeof t.name==="string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date)).map(t=>({...t,done:!!t.done,id:String(t.id||crypto.randomUUID())})) : [];
    } catch { return []; }
  }
  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { showToast("Could not save. Check your device storage."); }
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function showToast(message) {
    const el=$("toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2300);
  }
  function setPage(page) {
    activePage=page;
    $("calendarPage").hidden=page!=="calendar";
    $("unfinishedPage").hidden=page!=="unfinished";
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    render();
  }
  function openDialog(date=selectedDate) {
    $("taskForm").reset(); $("taskDate").value=date; $("formError").textContent="";
    $("dialogTitle").textContent="New task"; $("taskDialog").showModal();
    setTimeout(()=>$("taskName").focus(),50);
  }
  function renderCalendar() {
    const year=shownMonth.getFullYear(), month=shownMonth.getMonth();
    $("monthTitle").textContent=shownMonth.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const first=new Date(year,month,1), offset=(first.getDay()+6)%7, days=new Date(year,month+1,0).getDate();
    let html="";
    for(let i=0;i<offset;i++) html+='<span class="calendar-cell blank" aria-hidden="true"></span>';
    for(let day=1;day<=days;day++) {
      const date=localDate(new Date(year,month,day));
      const dayTasks=tasks.filter(t=>t.date===date);
      const open=dayTasks.some(t=>!t.done), done=dayTasks.some(t=>t.done);
      const classes=["calendar-cell",date===selectedDate?"selected":"",date===today?"today":""].filter(Boolean).join(" ");
      const dots=(open?'<i class="dot dot-open"></i>':"")+(done?'<i class="dot dot-done"></i>':"");
      html+=`<button class="${classes}" data-date="${date}" aria-label="${niceDate(date)}${dayTasks.length?`, ${dayTasks.length} tasks`:""}" aria-pressed="${date===selectedDate}"><span class="day-number">${day}</span><span class="day-dots">${dots}</span></button>`;
    }
    $("calendarGrid").innerHTML=html;
    $("calendarGrid").querySelectorAll("[data-date]").forEach(b=>b.addEventListener("click",()=>{selectedDate=b.dataset.date;render();}));
    $("selectedDateTitle").textContent=selectedDate===today?"Today · "+niceDate(today,{weekday:"long",day:"numeric",month:"long"}):niceDate(selectedDate,{weekday:"long",day:"numeric",month:"long"});
    const selectedTasks=tasks.filter(t=>t.date===selectedDate);
    $("daySummary").textContent=`${selectedTasks.filter(t=>!t.done).length} unfinished · ${selectedTasks.filter(t=>t.done).length} completed`;
    $("dayTasks").innerHTML=selectedTasks.length ? selectedTasks.map(taskCard).join("") : emptyState("Nothing planned yet","Add a task to start organizing this day.",true);
    wireTaskCards($("dayTasks"));
  }
  function taskCard(t, includeDate=false) {
    const overdue=!t.done&&t.date<today;
    return `<article class="task-card" data-task-card="${escapeHTML(t.id)}">
      <div class="task-main"><input class="task-check" type="checkbox" data-toggle="${escapeHTML(t.id)}" ${t.done?"checked":""} aria-label="${t.done?"Mark incomplete":"Mark complete"}: ${escapeHTML(t.name)}"><span class="task-name ${t.done?"done":""}">${escapeHTML(t.name)}</span><button class="task-action" data-delete="${escapeHTML(t.id)}" aria-label="Delete ${escapeHTML(t.name)}" title="Delete task">×</button></div>
      <div class="task-meta">${includeDate?`<span class="${overdue?"overdue":""}">${overdue?"Overdue · ":"Due "}${niceDate(t.date)}</span><button class="view-day" data-view-date="${t.date}">View day ↗</button>`:`<span class="${overdue?"overdue":""}">${t.done?"Completed":overdue?"Overdue · ":"Due "}${t.done?"":niceDate(t.date)}</span>`}</div>
    </article>`;
  }
  function emptyState(title,message,withButton=false) {
    return `<div class="empty-state"><div class="empty-icon">✧</div><h3>${title}</h3><p>${message}</p>${withButton?'<button class="button button-outline" id="emptyAdd">＋ Create task</button>':""}</div>`;
  }
  function wireTaskCards(container) {
    container.querySelectorAll("[data-toggle]").forEach(el=>el.addEventListener("change",()=>toggleTask(el.dataset.toggle)));
    container.querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>deleteTask(el.dataset.delete)));
    container.querySelectorAll("[data-view-date]").forEach(el=>el.addEventListener("click",()=>{selectedDate=el.dataset.viewDate;shownMonth=new Date(parseDate(selectedDate).getFullYear(),parseDate(selectedDate).getMonth(),1);setPage("calendar");}));
    const add=container.querySelector("#emptyAdd"); if(add) add.addEventListener("click",()=>openDialog(selectedDate));
  }
  function renderUnfinished() {
    const open=tasks.filter(t=>!t.done);
    $("navCount").textContent=open.length;
    $("remainingStat").textContent=open.length;
    $("completedStat").textContent=tasks.filter(t=>t.done).length;
    const q=$("searchInput").value.trim().toLowerCase();
    const filtered=open.filter(t=>{
      const match=t.name.toLowerCase().includes(q);
      const byFilter=activeFilter==="all" || (activeFilter==="overdue"&&t.date<today) || (activeFilter==="today"&&t.date===today) || (activeFilter==="upcoming"&&t.date>today);
      return match&&byFilter;
    }).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
    $("unfinishedTasks").innerHTML=filtered.length?filtered.map(t=>taskCard(t,true)).join(""):emptyState(open.length===0?"You're all caught up!":"No matching tasks",open.length===0?"All your tasks are completed. Add something new whenever you need.":"Try another filter or search term.",open.length===0);
    wireTaskCards($("unfinishedTasks"));
  }
  function render() {
    $("navCount").textContent=tasks.filter(t=>!t.done).length;
    renderCalendar(); renderUnfinished();
    document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===activeFilter));
  }
  function toggleTask(id) {
    const t=tasks.find(t=>t.id===id); if(!t)return;
    t.done=!t.done; saveTasks(); render(); showToast(t.done?"Task completed":"Task marked unfinished");
  }
  function deleteTask(id) {
    const t=tasks.find(t=>t.id===id); if(!t)return;
    if(!confirm(`Delete "${t.name}"?`))return;
    tasks=tasks.filter(t=>t.id!==id); saveTasks(); render(); showToast("Task deleted");
  }
  function addTask(event) {
    event.preventDefault();
    const name=$("taskName").value.trim(), date=$("taskDate").value;
    if(!name||!date){$("formError").textContent="Enter a task name and due date.";return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ $("formError").textContent="Choose a valid due date.";return;}
    tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),name,date,done:false,createdAt:new Date().toISOString()});
    saveTasks(); selectedDate=date; const d=parseDate(date); shownMonth=new Date(d.getFullYear(),d.getMonth(),1);
    $("taskDialog").close(); setPage("calendar"); showToast("Task added");
  }

  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
  $("addTaskBtn").addEventListener("click",()=>openDialog(selectedDate));
  $("addTaskBtn2").addEventListener("click",()=>openDialog(selectedDate));
  $("addForDayBtn").addEventListener("click",()=>openDialog(selectedDate));
  $("prevMonth").addEventListener("click",()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);renderCalendar();});
  $("nextMonth").addEventListener("click",()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);renderCalendar();});
  $("taskForm").addEventListener("submit",addTask);
  $("closeDialog").addEventListener("click",()=>$("taskDialog").close());
  $("cancelDialog").addEventListener("click",()=>$("taskDialog").close());
  $("taskDialog").addEventListener("click",e=>{if(e.target===$("taskDialog"))$("taskDialog").close();});
  $("searchInput").addEventListener("input",renderUnfinished);
  document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;renderUnfinished();document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));}));
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").hidden=false;});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstallPrompt){showToast("Use your browser menu and choose Install app or Add to Home screen.");return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").hidden=true;});
  window.addEventListener("appinstalled",()=>{showToast("Daywise installed");$("installBtn").hidden=true;});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")) {
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  render();
})();
