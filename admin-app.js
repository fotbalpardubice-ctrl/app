(() => {
  'use strict';

  const storageKey = 'ml-work-demo-v2';
  const pragueDateParts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const day = `${pragueDateParts.year}-${pragueDateParts.month}-${pragueDateParts.day}`;
  const isoOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const demo = {
    projects: [
      {id:'ML-2408',name:'Rekonstrukce rozvodů – Nová 18',client:'Bytové družstvo Nová',address:'Nová 18, Praha 2',manager:'Martin Dvořák',status:'Probíhá',due:isoOffset(12)},
      {id:'ML-2407',name:'Elektroinstalace hala C',client:'Stavmont CZ',address:'Průmyslová 420, Kladno',manager:'Jan Novák',status:'Probíhá',due:isoOffset(24)},
      {id:'ML-2406',name:'Osvětlení kanceláří',client:'TechPark s.r.o.',address:'Plynární 8, Praha 7',manager:'Martin Dvořák',status:'Čeká na zahájení',due:isoOffset(35)},
      {id:'ML-2405',name:'Přípojka rodinného domu',client:'Pavel Horák',address:'Javorová 31, Beroun',manager:'Jan Novák',status:'Dokončeno',due:isoOffset(-4)}
    ],
    materials: [
      {id:'MAT-001',name:'Kabel CYKY-J 3×2,5',category:'Kabely',unit:'m',stock:860,min:200,price:28.5,location:'Regál A1'},
      {id:'MAT-002',name:'Kabel CYKY-J 3×1,5',category:'Kabely',unit:'m',stock:1240,min:300,price:19.9,location:'Regál A2'},
      {id:'MAT-003',name:'Jistič B16 1P',category:'Jištění',unit:'ks',stock:42,min:20,price:89,location:'Regál B1'},
      {id:'MAT-004',name:'Instalační krabice KU 68',category:'Instalační materiál',unit:'ks',stock:17,min:25,price:12.5,location:'Regál C1'},
      {id:'MAT-005',name:'Chránička 20 mm',category:'Instalační materiál',unit:'m',stock:320,min:100,price:8.2,location:'Regál C2'},
      {id:'MAT-006',name:'Rozvaděč 24 modulů',category:'Rozvaděče',unit:'ks',stock:8,min:3,price:1450,location:'Regál D1'}
    ],
    movements: [],
    deliveries: [
      {id:'DL-2026-041',date:isoOffset(-1),projectId:'ML-2408',person:'Jan Novák',note:'První etapa – hrubá instalace',billed:false,items:[{materialId:'MAT-001',qty:120},{materialId:'MAT-004',qty:10}]},
      {id:'DL-2026-040',date:isoOffset(-2),projectId:'ML-2407',person:'Tomáš Král',note:'Doplnění materiálu',billed:true,items:[{materialId:'MAT-003',qty:12},{materialId:'MAT-005',qty:45}]},
      {id:'DL-2026-039',date:isoOffset(-4),projectId:'ML-2408',person:'Petra Malá',note:'Kabeláž podlaží 2',billed:false,items:[{materialId:'MAT-002',qty:200},{materialId:'MAT-005',qty:70}]}
    ],
    invoices: [
      {id:'FA-2026-018',date:isoOffset(-2),due:isoOffset(12),projectId:'ML-2407',deliveryId:'DL-2026-040',status:'Neuhrazeno',amount:4750.8}
    ],
    incomingReceipts: [],
    invoiceTemplate: {company:'ML Work',address:'',ico:'',dic:'',bankAccount:'',dueDays:14,vatRate:0,footer:'Děkujeme za spolupráci.'},
    attendance: [
      {id:'AT-1',date:isoOffset(0),employee:'Jan Novák',projectId:'ML-2408',start:'07:00',end:'',note:'',status:'Na pracovišti'},
      {id:'AT-2',date:isoOffset(-1),employee:'Jan Novák',projectId:'ML-2408',start:'07:02',end:'15:36',note:'',status:'Uzavřeno'},
      {id:'AT-3',date:isoOffset(-1),employee:'Tomáš Král',projectId:'ML-2407',start:'06:48',end:'15:12',note:'Přesun materiálu',status:'Uzavřeno'},
      {id:'AT-4',date:isoOffset(-1),employee:'Petra Malá',projectId:'ML-2408',start:'07:10',end:'15:30',note:'',status:'Uzavřeno'},
      {id:'AT-5',date:isoOffset(-2),employee:'Lukáš Beneš',projectId:'ML-2407',start:'07:00',end:'15:00',note:'',status:'Uzavřeno'}
    ],
    requests: [
      {name:'Tomáš Král',email:'tomas.kral@firma.cz',initials:'TK',role:'Vedoucí montáže',date:isoOffset(-5),status:'Schváleno'},
      {name:'Petra Malá',email:'petra.mala@firma.cz',initials:'PM',role:'Technik',date:isoOffset(-4),status:'Schváleno'},
      {name:'Lukáš Beneš',email:'lukas.benes@firma.cz',initials:'LB',role:'Projektový manažer',date:isoOffset(-3),status:'Schváleno'},
      {name:'Eva Horáková',email:'eva.horakova@firma.cz',initials:'EH',role:'Administrativa',date:isoOffset(-2),status:'Schváleno'}
    ],
    users: [
      {name:'Správce ML Work',email:'pmagusin@seznam.cz',role:'Administrátor',status:'Aktivní'},
      {name:'Jan Novák',email:'jan.novak@firma.cz',role:'Technik',status:'Aktivní'},
      {name:'Martin Dvořák',email:'martin.dvorak@firma.cz',role:'Projektový manažer',status:'Aktivní'},
      {name:'Tomáš Král',email:'tomas.kral@firma.cz',role:'Vedoucí montáže',status:'Aktivní'},
      {name:'Petra Malá',email:'petra.mala@firma.cz',role:'Technik',status:'Aktivní'},
      {name:'Lukáš Beneš',email:'lukas.benes@firma.cz',role:'Projektový manažer',status:'Aktivní'},
      {name:'Eva Horáková',email:'eva.horakova@firma.cz',role:'Administrativa',status:'Aktivní'}
    ],
    activity: [
      {date:isoOffset(-1),text:'Jan Novák vytvořil dodací list DL-2026-041.',kind:'Doklad'},
      {date:isoOffset(-1),text:'Petra Malá uzavřela docházku na zakázce ML-2408.',kind:'Docházka'},
      {date:isoOffset(-2),text:'Faktura FA-2026-018 byla vystavena.',kind:'Fakturace'},
      {date:isoOffset(-2),text:'Tomáš Král doplnil materiál na zakázku ML-2407.',kind:'Sklad'}
    ]
  };

  let state = loadState();
  let databaseRevision = 0;
  let databaseReady = false;
  let databaseWriteBlocked = false;
  let databaseSaveQueue = Promise.resolve();
  let databaseWritesPending = 0;
  let mailStatus={configured:false,user:'pmagusin@seznam.cz',host:'imap.seznam.cz',port:993,folder:'INBOX',lastSyncAt:null,lastError:'',lastImported:0,running:false};
  let incomingUploadRunning=false;
  let toastTimer;
  const pageNames = {overview:'Přehled',projects:'Zakázky',attendance:'Docházka',materials:'Sklad materiálu',deliveries:'Dodací listy',invoices:'Fakturace',users:'Uživatelé',activity:'Aktivita',settings:'Nastavení'};
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
  function nextNumberId(prefix,records){
    const escaped=prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const matcher=new RegExp(`^${escaped}(\\d+)$`);
    const max=records.reduce((value,record)=>Math.max(value,Number(String(record.id||'').match(matcher)?.[1]||0)),0);
    return `${prefix}${String(max+1).padStart(3,'0')}`;
  }
  const dateFmt = (value) => value ? new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(`${value}T12:00:00`)) : '—';
  const datePlusDays = (value,days) => {const date=new Date(`${value||day}T12:00:00`);date.setDate(date.getDate()+Number(days||0));return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
  const money = (value) => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:2}).format(Number(value)||0);
  const activeProjects = () => state.projects.filter(p => p.status !== 'Dokončeno');
  const project = (projectId) => state.projects.find(p => p.id === projectId);
  const material = (materialId) => state.materials.find(m => m.id === materialId);
  const projectName = (projectId) => project(projectId)?.name || projectId || '—';
  const materialName = (materialId) => material(materialId)?.name || materialId || '—';
  const duplicateKey = (value) => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const assignedNames = (p) => (Array.isArray(p.assignedUsers)?p.assignedUsers:[]).map(userId=>state.users.find(user=>user.id===userId)?.name).filter(Boolean);
  const lowStock = () => state.materials.filter(m => Number(m.stock) <= Number(m.min));
  const statusPill = (status) => `<span class="status ${statusClass(status)}"><i></i>${esc(status)}</span>`;
  function statusClass(status) {
    if (/probíhá|aktivní|schváleno|uhrazeno|uzavřeno|dokončeno/i.test(status)) return 'status--approved';
    if (/čeká|neuhrazeno|na pracovišti|nízký|nová/i.test(status)) return 'status--new';
    if (/zamítnuto|pozastaveno|zrušeno/i.test(status)) return 'status--rejected';
    return 'status--neutral';
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && Array.isArray(saved.projects) && Array.isArray(saved.materials)) return {...demo,...saved};
    } catch (_) { /* local storage may be disabled in private browsing */ }
    return structuredClone(demo);
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch (_) { notify('Prohlížeč neumožnil uložit změny. Zkuste povolit místní úložiště.'); }
    if(!databaseReady||databaseWriteBlocked)return Promise.resolve(false);
    const {users,...snapshot}=state;
    const payload=JSON.stringify(snapshot);
    databaseWritesPending++;
    databaseSaveQueue=databaseSaveQueue.then(async()=>{
      if(databaseWriteBlocked)return false;
      const result=await window.MLAuth.saveAdminState(JSON.parse(payload),databaseRevision);
      databaseRevision=result.revision;
    }).then(result=>result!==false).catch(error=>{
      databaseWriteBlocked=true;
      notify(`Zápis do databáze se nepodařil: ${error.message}`);
      return false;
    }).finally(()=>{databaseWritesPending=Math.max(0,databaseWritesPending-1);});
    return databaseSaveQueue;
  }
  function mapDatabaseUser(user) {
    return {id:user.id,name:user.full_name,email:user.email,role:window.MLAuth.displayRole(user),status:user.is_active?'Aktivní':'Pozastaveno',is_active:user.is_active};
  }
  async function loadDatabaseState() {
    const remote=await window.MLAuth.adminState();
    if(remote.state&&typeof remote.state==='object')state={...demo,...remote.state};
    else state=loadState();
    state.users=(remote.users||[]).map(mapDatabaseUser);
    databaseRevision=remote.revision||0;
    if(!remote.state){
      const {users,...snapshot}=state;
      const result=await window.MLAuth.saveAdminState(snapshot,databaseRevision);
      databaseRevision=result.revision;
    }
    databaseReady=true;
    try { localStorage.setItem(storageKey,JSON.stringify(state)); } catch (_) { /* Database remains the primary store. */ }
  }
  async function refreshEmployeeRecords() {
    if(!databaseReady||databaseWritesPending||databaseWriteBlocked||document.visibilityState!=='visible'||$('#app-modal').open)return;
    const page=location.hash.slice(1)||'overview';
    if(!['overview','attendance','materials','settings'].includes(page))return;
    try{
      const remote=await window.MLAuth.adminState();
      if(databaseWritesPending||$('#app-modal').open||document.visibilityState!=='visible')return;
      let changed=false;
      if(Number(remote.revision||0)>databaseRevision){
        if(remote.state&&typeof remote.state==='object')state={...demo,...remote.state};
        state.users=(remote.users||[]).map(mapDatabaseUser);
        databaseRevision=Number(remote.revision||0);
        try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){/* The database remains the primary store. */}
        changed=true;
      }
      if(['materials','settings'].includes(page)){
        const status=await window.MLAuth.mailStatus();
        if(JSON.stringify(status)!==JSON.stringify(mailStatus)){mailStatus=status;changed=true;}
      }
      if(!changed)return;
      render();
    }catch(error){
      if(error.message?.includes('Přihlášení'))location.replace('./login.html');
    }
  }
  function log(text, kind='Změna') {
    state.activity.unshift({date:new Date().toISOString().slice(0,10),text,kind});
    state.activity = state.activity.slice(0,80);
    save();
  }
  function notify(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }
  function pageHeader(title, description, action='') {
    return `<div class="welcome-row"><div><p class="eyebrow">ML WORK · PRACOVNÍ PROSTOR</p><h1>${title}</h1><p class="subheading">${description}</p></div>${action}</div>`;
  }
  function button(label, action, extra='') { return `<button class="export" type="button" data-action="${action}" ${extra}>${label}</button>`; }
  function csvTools(page) {
    return `<span class="header-actions">${button('Importovat CSV','import-csv',`data-import-page="${page}"`)}${button('Exportovat CSV',`export-${page}`)}<input type="file" data-csv-input="${page}" accept=".csv,text/csv" hidden></span>`;
  }
  function searchTools(placeholder='Hledat…', filters='') {
    return `<div class="table-tools"><label class="search"><input type="search" data-table-search placeholder="${placeholder}" aria-label="${placeholder}"></label>${filters}</div>`;
  }
  function statusFilter(statuses) {
    return `<select data-status-filter aria-label="Filtrovat podle stavu"><option value="">Všechny stavy</option>${statuses.map(s=>`<option>${esc(s)}</option>`).join('')}</select>`;
  }
  function projectOptions(selected='') {
    return state.projects.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.id)} · ${esc(p.name)}</option>`).join('');
  }
  function materialOptions(selected='') {
    return state.materials.map(m=>`<option value="${esc(m.id)}" ${m.id===selected?'selected':''}>${esc(m.id)} · ${esc(m.name)} (${Number(m.stock)} ${esc(m.unit)})</option>`).join('');
  }
  function render() {
    const key = location.hash.slice(1) || 'overview';
    const page = pageNames[key] ? key : 'overview';
    if (!location.hash) history.replaceState(null,'','#overview');
    $('#breadcrumb-current').textContent = pageNames[page];
    $('#today-label').textContent = new Intl.DateTimeFormat('cs-CZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    document.title = `${pageNames[page]} | ML Work`;
    document.querySelectorAll('[data-page]').forEach(link => link.classList.toggle('active', link.dataset.page === page));
    $('#page-content').innerHTML = (pages[page] || pages.overview)();
    $('#nav-project-count').textContent = activeProjects().length;
    $('#nav-low-stock').textContent = lowStock().length;
    bindFilters();
  }
  function bindFilters() {
    const root = $('#page-content');
    const apply = () => {
      const q = ($('[data-table-search]',root)?.value || '').toLocaleLowerCase('cs');
      const status = $('[data-status-filter]',root)?.value || '';
      root.querySelectorAll('tbody tr[data-search]').forEach(row => {
        row.hidden = !row.dataset.search.toLocaleLowerCase('cs').includes(q) || (!!status && row.dataset.status !== status);
      });
    };
    $('[data-table-search]',root)?.addEventListener('input',apply);
    $('[data-status-filter]',root)?.addEventListener('change',apply);
  }

  const pages = {
    overview() {
      const active = activeProjects();
      const openHours = state.attendance.filter(a=>a.date===day && !a.end).length;
      const outstanding = state.invoices.filter(i=>i.status!=='Uhrazeno').reduce((sum,i)=>sum+Number(i.amount),0);
      const todaysAttendance=[...state.attendance].filter(item=>item.date===day).sort((a,b)=>b.start.localeCompare(a.start));
      const attendanceRows=todaysAttendance.map(item=>`<tr><td><b>${esc(item.employee)}</b></td><td>${esc(projectName(item.projectId))}</td><td>${esc(item.start||'—')}</td><td>${esc(item.end||'—')}</td><td>${item.end?statusPill('Uzavřeno'):statusPill('Na pracovišti')}</td></tr>`).join('');
      const rows = active.slice(0,4).map(p=>`<tr data-search="${esc(`${p.id} ${p.name} ${p.client} ${p.manager}`)}" data-status="${esc(p.status)}"><td><b>${esc(p.id)}</b><small class="cell-sub">${esc(p.client)}</small></td><td><b>${esc(p.name)}</b><small class="cell-sub">${esc(p.address)}</small></td><td>${esc(p.manager)}</td><td>${dateFmt(p.due)}</td><td>${statusPill(p.status)}</td><td><button class="text-button" data-action="project-detail" data-id="${esc(p.id)}">Detail →</button></td></tr>`).join('');
      return `${pageHeader('Přehled firmy','Zakázky, čas lidí a materiál na jednom místě.',button('Nová zakázka','new-project'))}
        <section class="stats" aria-label="Souhrn firmy">
          <button class="stat stat-link" data-navigate="projects"><span class="stat-top"><span>Aktivní zakázky</span><span class="stat-mark">01</span></span><b class="stat-value">${active.length}</b><span class="stat-foot">Zobrazit rozpracované zakázky →</span></button>
          <button class="stat stat-link" data-navigate="attendance"><span class="stat-top"><span>Lidé na pracovišti</span><span class="stat-mark stat-mark--yellow">02</span></span><b class="stat-value">${openHours}</b><span class="stat-foot">Docházka za dnešek →</span></button>
          <button class="stat stat-link" data-navigate="materials"><span class="stat-top"><span>Materiály pod limitem</span><span class="stat-mark">03</span></span><b class="stat-value">${lowStock().length}</b><span class="stat-foot">Zkontrolovat sklad →</span></button>
          <button class="stat stat-link" data-navigate="invoices"><span class="stat-top"><span>Neuhrazené faktury</span><span class="stat-mark">04</span></span><b class="stat-value stat-value--money">${money(outstanding)}</b><span class="stat-foot">Otevřít fakturaci →</span></button>
        </section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Zakázky v běhu</h2><p>Termíny, odpovědní lidé a průběh realizace.</p></div><a class="view-link" href="#projects">Všechny zakázky <span>→</span></a></div>
          <div class="table-wrap"><table><thead><tr><th>ČÍSLO / ZÁKAZNÍK</th><th>ZAKÁZKA / MÍSTO</th><th>ODPOVĚDNÝ</th><th>TERMÍN</th><th>STAV</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty-cell">Zatím nejsou žádné aktivní zakázky.</td></tr>'}</tbody></table></div></section>
        <section class="overview-grid">
          <article class="panel page-panel"><div class="panel-heading"><div><h2>Poslední dodací listy</h2><p>Materiál vydaný na zakázky.</p></div><a class="view-link" href="#deliveries">Všechny listy →</a></div>
            ${state.deliveries.slice(0,3).map(d=>`<div class="compact-row"><span class="compact-icon">DL</span><span><b>${esc(d.id)}</b><small>${esc(projectName(d.projectId))}</small></span><span class="compact-end">${dateFmt(d.date)}<small>${d.items.reduce((n,i)=>n+Number(i.qty),0)} položek</small></span></div>`).join('') || '<p class="muted">Zatím tu nejsou žádné dodací listy.</p>'}</article>
          <article class="panel page-panel"><div class="panel-heading"><div><h2>Rychlé akce</h2><p>Nejčastější provozní úkony.</p></div></div><div class="quick-actions">${button('Vystavit dodací list','new-delivery')}${button('Zapsat docházku','attendance-clock')}${button('Doplnit sklad','stock-adjust')}${button('Vystavit fakturu','new-invoice')}</div></article>
        </section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Dnešní docházka</h2><p>Příchody a odchody zaměstnanců podle zakázek.</p></div><a class="view-link" href="#attendance">Celá docházka →</a></div>
          <div class="table-wrap"><table><thead><tr><th>PRACOVNÍK</th><th>ZAKÁZKA</th><th>PŘÍCHOD</th><th>ODCHOD</th><th>STAV</th></tr></thead><tbody>${attendanceRows||'<tr><td colspan="5" class="empty-cell">Dnes zatím nikdo nepípnul příchod.</td></tr>'}</tbody></table></div></section>`;
    },
    projects() {
      const rows = state.projects.map(p=>`<tr data-search="${esc(`${p.id} ${p.name} ${p.client} ${p.manager} ${p.address} ${assignedNames(p).join(' ')}`)}" data-status="${esc(p.status)}"><td><b>${esc(p.id)}</b></td><td><b>${esc(p.name)}</b><small class="cell-sub">${esc(p.address)}</small></td><td>${esc(p.client)}</td><td>${esc(p.manager)}</td><td>${assignedNames(p).map(esc).join(', ')||'—'}</td><td>${dateFmt(p.due)}</td><td>${statusPill(p.status)}</td><td class="row-actions"><button class="text-button" data-action="project-detail" data-id="${esc(p.id)}">Detail</button><button class="text-button" data-action="edit-project" data-id="${esc(p.id)}">Upravit</button><button class="text-button text-button--danger" data-action="delete-project" data-id="${esc(p.id)}">Odstranit</button></td></tr>`).join('');
      return `${pageHeader('Zakázky','Přehled realizací, zákazníků, termínů a materiálu použitého na stavbě.',`<div class="header-actions">${button('＋ Nová zakázka','new-project')}${csvTools('projects')}</div>`)}
        <div class="stats stats--compact"><div class="stat"><span class="stat-top">Celkem zakázek</span><b class="stat-value">${state.projects.length}</b></div><div class="stat"><span class="stat-top">Probíhá</span><b class="stat-value">${state.projects.filter(p=>p.status==='Probíhá').length}</b></div><div class="stat"><span class="stat-top">Čeká na zahájení</span><b class="stat-value">${state.projects.filter(p=>p.status==='Čeká na zahájení').length}</b></div><div class="stat"><span class="stat-top">Dokončeno</span><b class="stat-value">${state.projects.filter(p=>p.status==='Dokončeno').length}</b></div></div>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Seznam zakázek</h2><p>Otevřete detail, materiál i přiřazené pracovníky.</p></div></div>${searchTools('Hledat zakázku, zákazníka nebo adresu',statusFilter(['Probíhá','Čeká na zahájení','Dokončeno']))}<div class="table-wrap"><table><thead><tr><th>ČÍSLO</th><th>NÁZEV / MÍSTO</th><th>ZÁKAZNÍK</th><th>ODPOVĚDNÝ</th><th>PŘIŘAZENÍ PRACOVNÍCI</th><th>TERMÍN</th><th>STAV</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty-cell">Žádné zakázky.</td></tr>'}</tbody></table></div></section>`;
    },
    materials() {
      const rows = state.materials.map(m=>`<tr data-search="${esc(`${m.id} ${m.name} ${m.category} ${m.location}`)}" data-status="${Number(m.stock)<=Number(m.min)?'Nízký stav':'V pořádku'}"><td><b>${esc(m.id)}</b></td><td><b>${esc(m.name)}</b><small class="cell-sub">${esc(m.category)} · ${esc(m.location)}</small></td><td>${esc(m.unit)}</td><td><b class="stock-qty ${Number(m.stock)<=Number(m.min)?'stock-qty--low':''}">${Number(m.stock)} ${esc(m.unit)}</b><small class="cell-sub">Min. ${Number(m.min)} ${esc(m.unit)}</small></td><td>${money(m.price)}</td><td>${statusPill(Number(m.stock)<=Number(m.min)?'Nízký stav':'V pořádku')}</td><td class="row-actions"><button class="text-button" data-action="stock-adjust" data-id="${esc(m.id)}">Pohyb</button><button class="text-button" data-action="edit-material" data-id="${esc(m.id)}">Upravit</button><button class="text-button text-button--danger" data-action="delete-material" data-id="${esc(m.id)}">Odstranit</button></td></tr>`).join('');
      const stockValue = state.materials.reduce((sum,m)=>sum+Number(m.stock)*Number(m.price),0);
      const pendingReceipts=state.incomingReceipts.filter(receipt=>receipt.status==='Čeká na kontrolu');
      const receiptRows=[...state.incomingReceipts].filter(receipt=>receipt.status!=='Ignorováno').sort((a,b)=>(a.status==='Čeká na kontrolu'?-1:1)-(b.status==='Čeká na kontrolu'?-1:1)||String(b.date).localeCompare(String(a.date))).map(receipt=>{
        const duplicate=receipt.duplicateOf?state.incomingReceipts.find(item=>item.id===receipt.duplicateOf):null;
        return `<article class="incoming-receipt"><div><b>${esc(receipt.documentNumber||receipt.emailSubject||'Nový dodací list')}</b>${duplicate?`<span class="duplicate-warning">Možný duplikát dokladu ${esc(duplicate.documentNumber||duplicate.id)}</span>`:''}<small>${esc(receipt.supplier||receipt.emailFrom||'Ruční příjem')} · ${dateFmt(receipt.date)}${receipt.status==='Potvrzeno'?` · ${receipt.destination==='project'?`Zakázka ${esc(projectName(receipt.projectId))}`:'Zařazeno na sklad'}`:''}</small></div><div class="incoming-attachments">${(receipt.attachments||[]).map(file=>`<a href="./api/admin/incoming/${encodeURIComponent(receipt.id)}/attachments/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">${esc(file.name)}</a>`).join(' ')}</div><div class="row-actions">${receipt.status==='Čeká na kontrolu'?`<button class="text-button" data-action="review-incoming-receipt" data-id="${esc(receipt.id)}">Zkontrolovat a zařadit</button><button class="text-button text-button--danger" data-action="ignore-incoming-receipt" data-id="${esc(receipt.id)}">Ignorovat</button>`:statusPill(receipt.status)}<button class="text-button text-button--danger" data-action="delete-incoming-receipt" data-id="${esc(receipt.id)}">Smazat</button></div></article>`;
      }).join('');
      return `${pageHeader('Sklad materiálu','Katalog, skladové zásoby a výdeje materiálu na jednotlivé zakázky.',`<div class="header-actions">${button('Vyskladnit na zakázku','new-stock-delivery')}${button('＋ Nahrát fakturu / dodací list', 'upload-incoming-file',incomingUploadRunning?'disabled':'')}${button('＋ Nová položka','new-material')} ${button('Pohyb skladu','stock-adjust')}${csvTools('materials')}</div>`)}
        <div class="stats stats--compact"><div class="stat"><span class="stat-top">Položek v katalogu</span><b class="stat-value">${state.materials.length}</b></div><div class="stat"><span class="stat-top">Položek pod limitem</span><b class="stat-value">${lowStock().length}</b></div><div class="stat"><span class="stat-top">Odhadovaná hodnota skladu</span><b class="stat-value stat-value--money">${money(stockValue)}</b></div><div class="stat"><span class="stat-top">Výdej se eviduje přes</span><b class="stat-value stat-value--word">Dodací list</b></div></div>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Příchozí dodací listy</h2><p>${pendingReceipts.length} čekají na kontrolu · nejdřív vyberte sklad nebo konkrétní zakázku.</p></div><div class="header-actions">${button('＋ Zadat příjem','new-incoming-receipt')}${button(mailStatus.running?'Načítám poštu…':'Synchronizovat e-mail','mail-sync',mailStatus.running?'disabled':'')}</div></div><p class="mail-status">${mailStatus.configured?`Schránka ${esc(mailStatus.user)} se kontroluje každé dvě minuty.`:'E-mail čeká na přístupové heslo pro poštovní aplikaci. Více v Nastavení.'}</p>${mailStatus.lastError?`<p class="mail-warning">${esc(mailStatus.lastError)}</p>`:''}<div class="incoming-list">${receiptRows||'<p class="muted">Zatím tu nejsou žádné příchozí dodací listy.</p>'}</div></section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Stav skladu</h2><p>Výdej na zakázku vytvoří dodací list a sníží dostupné množství.</p></div></div>${searchTools('Hledat kód, materiál nebo kategorii',statusFilter(['Nízký stav','V pořádku']))}<div class="table-wrap"><table><thead><tr><th>KÓD</th><th>MATERIÁL</th><th>JEDNOTKA</th><th>SKLADEM</th><th>CENA / JEDN.</th><th>STAV</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-cell">Katalog materiálu je prázdný.</td></tr>'}</tbody></table></div></section>`;
    },
    deliveries() {
      const rows = state.deliveries.map(d=>`<tr data-search="${esc(`${d.id} ${projectName(d.projectId)} ${d.person} ${d.note}`)}" data-status="${d.billed?'Vyúčtováno':'K vyúčtování'}"><td><b>${esc(d.id)}</b><small class="cell-sub">${esc(d.person)}</small></td><td>${dateFmt(d.date)}</td><td><button class="text-button text-button--project" data-action="project-detail" data-id="${esc(d.projectId)}">${esc(d.projectId)} · ${esc(projectName(d.projectId))}</button></td><td>${d.items.map(i=>`<span class="item-line">${esc(materialName(i.materialId))} <b>${Number(i.qty)} ${esc(material(i.materialId)?.unit||'')}</b></span>`).join('')}</td><td>${statusPill(d.billed?'Vyúčtováno':'K vyúčtování')}</td><td class="row-actions"><button class="text-button" data-action="print-delivery" data-id="${esc(d.id)}">Tisk</button>${d.billed?'':`<button class="text-button" data-action="edit-delivery" data-id="${esc(d.id)}">Upravit</button><button class="text-button" data-action="invoice-delivery" data-id="${esc(d.id)}">Fakturovat</button>`}<button class="text-button text-button--danger" data-action="delete-delivery" data-id="${esc(d.id)}">Odstranit</button></td></tr>`).join('');
      return `${pageHeader('Dodací listy','Evidence materiálu vydaného na stavbu. Každá položka je propojená se zakázkou i skladem.',`<div class="header-actions">${button('＋ Nový dodací list','new-delivery')} ${button('Vystavit fakturu','new-invoice')}${csvTools('deliveries')}</div>`)}
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Vydaný materiál</h2><p>Dodací listy vytvořené v aplikaci.</p></div></div>${searchTools('Hledat číslo listu, zakázku nebo pracovníka',statusFilter(['K vyúčtování','Vyúčtováno']))}<div class="table-wrap"><table><thead><tr><th>DODACÍ LIST</th><th>DATUM</th><th>ZAKÁZKA</th><th>VYDANÝ MATERIÁL</th><th>FAKTURACE</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty-cell">Zatím nejsou žádné dodací listy.</td></tr>'}</tbody></table></div><div class="table-bottom"><span>${state.deliveries.length} dodacích listů · vydané množství je odečteno ze skladu</span></div></section>`;
    },
    invoices() {
      const rows = state.invoices.map(i=>`<tr data-search="${esc(`${i.id} ${i.projectId} ${projectName(i.projectId)} ${i.deliveryId}`)}" data-status="${esc(i.status)}"><td><b>${esc(i.id)}</b><small class="cell-sub">${esc(i.deliveryId||'')}</small></td><td>${dateFmt(i.date)}</td><td>${dateFmt(i.due)}</td><td><button class="text-button text-button--project" data-action="project-detail" data-id="${esc(i.projectId)}">${esc(i.projectId)} · ${esc(projectName(i.projectId))}</button></td><td><b>${money(i.amount)}</b></td><td>${statusPill(i.status)}</td><td class="row-actions"><button class="text-button" data-action="print-invoice" data-id="${esc(i.id)}">Tisk faktury</button>${i.status==='Uhrazeno'?'':`<button class="text-button" data-action="mark-paid" data-id="${esc(i.id)}">Označit uhrazenou</button>`}<button class="text-button" data-action="edit-invoice" data-id="${esc(i.id)}">Upravit</button><button class="text-button text-button--danger" data-action="delete-invoice" data-id="${esc(i.id)}">Odstranit</button></td></tr>`).join('');
      const totalOpen = state.invoices.filter(i=>i.status!=='Uhrazeno').reduce((s,i)=>s+Number(i.amount),0);
      return `${pageHeader('Fakturace materiálu','Vytvářejte faktury z dodacích listů a sledujte, které doklady čekají na úhradu.',`<div class="header-actions">${button('＋ Vystavit fakturu','new-invoice')}${csvTools('invoices')}</div>`)}
        <div class="stats stats--compact"><div class="stat"><span class="stat-top">Vystavené faktury</span><b class="stat-value">${state.invoices.length}</b></div><div class="stat"><span class="stat-top">Čeká na úhradu</span><b class="stat-value">${state.invoices.filter(i=>i.status!=='Uhrazeno').length}</b></div><div class="stat"><span class="stat-top">Neuhrazená částka</span><b class="stat-value stat-value--money">${money(totalOpen)}</b></div><div class="stat"><span class="stat-top">K vyúčtování</span><b class="stat-value">${state.deliveries.filter(d=>!d.billed).length}</b><span class="stat-foot">Dodacích listů</span></div></div>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Faktury</h2><p>Faktura vzniká z dodacího listu podle evidovaného množství a ceny v katalogu.</p></div></div>${searchTools('Hledat číslo faktury nebo zakázku',statusFilter(['Neuhrazeno','Uhrazeno','Po splatnosti']))}<div class="table-wrap"><table><thead><tr><th>FAKTURA / LIST</th><th>VYSTAVENO</th><th>SPLATNOST</th><th>ZAKÁZKA</th><th>ČÁSTKA</th><th>STAV</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-cell">Zatím nejsou vystavené faktury.</td></tr>'}</tbody></table></div></section>`;
    },
    attendance() {
      const todayLogs = state.attendance.filter(a=>a.date===day);
      const active = todayLogs.filter(a=>!a.end);
      const hours = todayLogs.reduce((s,a)=>s+(a.end?duration(a.start,a.end):0),0);
      const rows = [...state.attendance].sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<tr data-search="${esc(`${a.employee} ${a.projectId} ${projectName(a.projectId)} ${a.note}`)}" data-status="${a.end?'Uzavřeno':'Na pracovišti'}"><td>${dateFmt(a.date)}</td><td><b>${esc(a.employee)}</b></td><td><button class="text-button text-button--project" data-action="project-detail" data-id="${esc(a.projectId)}">${esc(a.projectId)} · ${esc(projectName(a.projectId))}</button></td><td>${esc(a.start)}</td><td>${a.end?esc(a.end):'—'}</td><td>${a.end?`${duration(a.start,a.end).toFixed(1)} h`:statusPill('Na pracovišti')}</td><td>${a.note?esc(a.note):'—'}</td><td class="row-actions"><button class="text-button" data-action="edit-attendance" data-id="${esc(a.id)}">Upravit</button><button class="text-button text-button--danger" data-action="delete-attendance" data-id="${esc(a.id)}">Odstranit</button></td></tr>`).join('');
      return `${pageHeader('Docházka','Denní příchody, odchody a odpracovaný čas přiřazený ke konkrétní zakázce.',`<div class="header-actions">${button('＋ Ruční zápis','new-attendance')}${button(active.length?'Zapsat odchod':'Zapsat příchod','attendance-clock')}${csvTools('attendance')}</div>`)}
        <div class="stats stats--compact"><div class="stat"><span class="stat-top">Dnes na pracovišti</span><b class="stat-value">${active.length}</b></div><div class="stat"><span class="stat-top">Záznamů dnes</span><b class="stat-value">${todayLogs.length}</b></div><div class="stat"><span class="stat-top">Uzavřené hodiny dnes</span><b class="stat-value">${hours.toFixed(1)} h</b></div><div class="stat"><span class="stat-top">Tento týden</span><b class="stat-value">${state.attendance.filter(a=>a.date>=isoOffset(-6)).length}</b><span class="stat-foot">docházkových záznamů</span></div></div>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Docházkové záznamy</h2><p>Aktivní pracovní záznam zůstane otevřený do zapsání odchodu.</p></div></div>${searchTools('Hledat jméno nebo zakázku',statusFilter(['Na pracovišti','Uzavřeno']))}<div class="table-wrap"><table><thead><tr><th>DATUM</th><th>PRACOVNÍK</th><th>ZAKÁZKA</th><th>PŘÍCHOD</th><th>ODCHOD</th><th>ČAS</th><th>POZNÁMKA</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty-cell">Zatím nejsou žádné docházkové záznamy.</td></tr>'}</tbody></table></div></section>`;
    },
    users() {
      const rows = state.users.map(u=>`<tr data-search="${esc(`${u.name} ${u.email} ${u.role}`)}" data-status="${esc(u.status)}"><td><div class="person"><span class="avatar avatar--table">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><small>${esc(u.email)}</small></span></div></td><td>${esc(u.role)}</td><td>${statusPill(u.status)}</td><td>${u.role==='Administrátor'?'Správce':`<button class="text-button" data-action="edit-user" data-id="${esc(u.id)}">Upravit</button><button class="text-button" data-action="user-toggle" data-id="${esc(u.id)}">${u.status==='Aktivní'?'Pozastavit':'Aktivovat'}</button><button class="text-button text-button--danger" data-action="delete-user" data-id="${esc(u.id)}">Odstranit</button>`}</td></tr>`).join('');
      return `${pageHeader('Uživatelé','Přehled členů týmu a jejich oprávnění.',`<div class="header-actions">${button('＋ Přidat uživatele','new-user')}${csvTools('users')}</div>`)}<section class="panel page-panel"><div class="panel-heading"><div><h2>Členové týmu</h2><p>${state.users.filter(u=>u.status==='Aktivní').length} aktivních uživatelů</p></div></div>${searchTools('Hledat jméno, e-mail nebo roli',statusFilter(['Aktivní','Pozastaveno']))}<div class="table-wrap"><table><thead><tr><th>UŽIVATEL</th><th>ROLE</th><th>STAV ÚČTU</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
    },
    activity() {
      return `${pageHeader('Aktivita','Časová osa důležitých změn v zakázkách, skladu, docházce a dokladech.',csvTools('activity'))}
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Provozní záznamy</h2><p>Nejnovější události jsou nahoře.</p></div></div><div class="activity-feed">${state.activity.map((a,index)=>`<article class="feed-item"><span class="activity-icon">${esc(a.kind.slice(0,3).toUpperCase())}</span><div><b>${esc(a.text)}</b><small>${dateFmt(a.date)} · ${esc(a.kind)}</small></div><button class="text-button text-button--danger" data-action="delete-activity" data-index="${index}">Odstranit</button></article>`).join('') || '<p class="muted">Zatím tu nejsou zaznamenané změny.</p>'}</div></section>`;
    },
    settings() {
      const invoiceTemplate=state.invoiceTemplate||demo.invoiceTemplate;
      const mailConnection=mailStatus.configured?`Připojeno k ${esc(mailStatus.user)} přes zabezpečený IMAP. Kontrola nové pošty probíhá každé 2 minuty.`:`Čeká na heslo pro poštovní aplikaci. Přístupové údaje se doplní do místního nastavení serveru.`;
      return `${pageHeader('Nastavení','Základní nastavení pracovního prostoru a správa uložených dat.')}
        <div class="settings-grid"><section class="panel page-panel"><div class="panel-heading"><div><h2>Pracovní prostor</h2><p>Informace používané v přehledech a dokladech.</p></div></div><dl class="settings-list"><div><dt>Název firmy</dt><dd>ML Work</dd></div><div><dt>Výchozí správce</dt><dd>Účet přihlášeného správce</dd></div><div><dt>Měna</dt><dd>Česká koruna (Kč)</dd></div><div><dt>Úložiště</dt><dd>Lokální SQLite databáze</dd></div></dl></section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Vzor faktury</h2><p>Společné údaje a výchozí podmínky pro nově vystavené faktury.</p></div><div class="header-actions">${button('Náhled vzoru','preview-invoice-template')}${button('Upravit vzor','edit-invoice-template')}</div></div><dl class="settings-list"><div><dt>Dodavatel</dt><dd>${esc(invoiceTemplate.company||'ML Work')}</dd></div><div><dt>Adresa</dt><dd>${esc(invoiceTemplate.address||'Doplnit')}</dd></div><div><dt>IČO / DIČ</dt><dd>${esc(invoiceTemplate.ico||'Doplnit')} / ${esc(invoiceTemplate.dic||'—')}</dd></div><div><dt>Bankovní účet</dt><dd>${esc(invoiceTemplate.bankAccount||'Doplnit')}</dd></div><div><dt>Splatnost / DPH</dt><dd>${Number(invoiceTemplate.dueDays||14)} dní / ${Number(invoiceTemplate.vatRate||0)} %</dd></div></dl><p class="notice-box">Údaje faktury doplňte před prvním ostrým vystavením. Provozní ukázková faktura není účetní ani daňový doklad.</p></section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Příchozí dodací listy e-mailem</h2><p>${esc(mailConnection)}</p></div>${button('Synchronizovat e-mail','mail-sync',mailStatus.running?'disabled':'')}</div><dl class="settings-list"><div><dt>Schránka</dt><dd>${esc(mailStatus.user)}</dd></div><div><dt>Server</dt><dd>${esc(mailStatus.host)}:${Number(mailStatus.port)}</dd></div><div><dt>Složka</dt><dd>${esc(mailStatus.folder)}</dd></div><div><dt>Poslední kontrola</dt><dd>${mailStatus.lastSyncAt?new Date(mailStatus.lastSyncAt).toLocaleString('cs-CZ'):'Zatím neproběhla'}</dd></div></dl>${mailStatus.lastError?`<p class="mail-warning">${esc(mailStatus.lastError)}</p>`:''}<div class="notice-box">Aplikace projde nepřečtené zprávy, které zmiňují dodací list nebo mají přílohu PDF, CSV, Excel či obrázek, a zařadí je do kontroly. Příloha se nezaúčtuje automaticky; před potvrzením zkontrolujete materiál a vyberete sklad nebo zakázku.</div></section>
        <section class="panel page-panel"><div class="panel-heading"><div><h2>Data a export</h2><p>Stáhněte si zálohu nebo exportujte tabulku.</p></div></div><div class="settings-actions"><button class="export" data-action="backup">Stáhnout zálohu dat (.json)</button><button class="export" data-action="export-projects">Exportovat zakázky (.csv)</button><button class="export" data-action="export-materials">Exportovat sklad (.csv)</button><button class="export" data-action="export-deliveries">Exportovat dodací listy (.csv)</button></div><div class="notice-box">Provozní záznamy a uživatelské účty se ukládají do lokální databáze tohoto počítače. Zálohu pravidelně stáhněte a uložte mimo tento počítač.</div></section>
        <section class="panel page-panel settings-danger"><div class="panel-heading"><div><h2>Obnovit ukázková data</h2><p>Odstraní místní změny a vrátí původní demonstrační záznamy.</p></div></div><button class="export export--danger" data-action="reset-data">Obnovit ukázková data</button></section></div>`;
    }
  };

  function duration(start,end) {
    if (!start || !end) return 0;
    const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
    return Math.max(0,(eh*60+em-sh*60-sm)/60);
  }
  function initials(name) { return name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase(); }
  function openModal(title, body, submitLabel='Uložit', submitAction='save-form') {
    $('#modal-content').innerHTML = `<div class="modal-heading"><div><p class="eyebrow">ML WORK · FORMULÁŘ</p><h2>${title}</h2></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Zavřít">×</button></div><div class="modal-body">${body}</div><div class="modal-actions"><button type="button" class="button-quiet" data-action="close-modal">Zrušit</button><button type="submit" class="export" data-submit-action="${submitAction}">${submitLabel}</button></div>`;
    $('#app-modal').showModal();
  }
  const field = (label,name,value='',type='text',required=true,extra='') => `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${extra}></label>`;
  const selectField = (label,name,options,selected='') => `<label class="form-field"><span>${label}</span><select name="${name}" required>${options.map(([value,text])=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
  function assignmentField(selected=[]){
    const employees=state.users.filter(user=>user.is_active&&user.role!=='Administrátor');
    return `<fieldset class="assignment-field"><legend>Přiřazení pracovníci</legend>${employees.length?`<div class="assignment-list">${employees.map(user=>`<label><input type="checkbox" name="assignedUsers" value="${esc(user.id)}" ${selected.includes(user.id)?'checked':''}><span><b>${esc(user.name)}</b><small>${esc(user.role)}</small></span></label>`).join('')}</div>`:'<p class="form-hint">Nejdřív přidejte a aktivujte zaměstnance v části Uživatelé.</p>'}</fieldset>`;
  }
  function openProjectForm(projectId='') {
    const p = project(projectId) || {name:'',client:'',address:'',manager:'',status:'Probíhá',due:isoOffset(14),assignedUsers:[]};
    const body = `<input type="hidden" name="recordId" value="${esc(projectId)}"><div class="form-grid">${field('Název zakázky','name',p.name)}${field('Zákazník','client',p.client)}${field('Adresa realizace','address',p.address)}${field('Odpovědná osoba','manager',p.manager)}${field('Termín dokončení','due',p.due,'date')}${selectField('Stav','status',['Probíhá','Čeká na zahájení','Dokončeno','Pozastaveno'].map(x=>[x,x]),p.status)}${assignmentField(Array.isArray(p.assignedUsers)?p.assignedUsers:[])}</div>`;
    openModal(projectId?'Upravit zakázku':'Nová zakázka',body,projectId?'Uložit změny':'Vytvořit zakázku','save-project');
  }
  function openMaterialForm(materialId='') {
    const item=material(materialId)||{name:'',category:'',unit:'ks',stock:0,min:0,price:0,location:'Regál'};
    const body = `<input type="hidden" name="recordId" value="${esc(materialId)}"><div class="form-grid">${field('Název materiálu','name',item.name)}${field('Kategorie','category',item.category)}${field('Jednotka (ks, m, bal)','unit',item.unit)}${field('Skladem','stock',item.stock,'number',true,'min="0" step="0.01"')}${field('Minimální zásoba','min',item.min,'number',true,'min="0" step="0.01"')}${field('Cena za jednotku (Kč)','price',item.price,'number',true,'min="0" step="0.01"')}${field('Umístění ve skladu','location',item.location)}</div>`;
    openModal(materialId?'Upravit materiál':'Nová položka skladu',body,materialId?'Uložit změny':'Přidat do skladu','save-material');
  }
  function openStockForm(materialId='') {
    const selected = material(materialId)?.id || state.materials[0]?.id || '';
    const body = `<div class="form-grid">${selectField('Materiál','materialId',state.materials.map(m=>[m.id,`${m.id} · ${m.name} (skladem ${m.stock} ${m.unit})`]),selected)}${selectField('Typ pohybu','direction',[['in','Příjem na sklad'],['out','Výdej / korekce ze skladu']])}${field('Množství','qty','1','number',true,'min="0.01" step="0.01"')}${field('Poznámka','note','Ruční skladový pohyb', 'text',false)}<p class="form-hint">Výdej materiálu na konkrétní stavbu zapište dodacím listem, aby se spojil se zakázkou.</p></div>`;
    openModal('Pohyb skladu',body,'Zapsat pohyb','save-stock');
  }
  function deliveryLine(item={}) {
    return `<div class="delivery-item-row"><label class="form-field"><span>Materiál</span><select name="materialId" required>${state.materials.map(m=>`<option value="${esc(m.id)}" ${m.id===item.materialId?'selected':''}>${esc(m.id)} · ${esc(m.name)} (${Number(m.stock)} ${esc(m.unit)})</option>`).join('')}</select></label><label class="form-field"><span>Množství</span><input name="qty" type="number" min="0.01" step="0.01" value="${esc(item.qty??1)}" required></label><button class="remove-line" type="button" data-action="remove-delivery-line" aria-label="Odebrat položku">×</button></div>`;
  }
  function openDeliveryForm(projectId='',deliveryId='') {
    const existing=state.deliveries.find(item=>item.id===deliveryId);
    if(existing?.billed){notify('Vyfakturovaný dodací list nelze upravit.');return;}
    const item=existing||{projectId,date:day,person:'Jan Novák',note:'',items:[{}]};
    const lines=item.items.map(deliveryLine).join('')||deliveryLine();
    const body = `<input type="hidden" name="recordId" value="${esc(deliveryId)}"><div class="form-grid">${selectField('Zakázka','projectId',state.projects.map(p=>[p.id,`${p.id} · ${p.name}`]),item.projectId)}${field('Datum výdeje','date',item.date,'date')}${field('Vydal / převzal','person',item.person)}${field('Poznámka','note',item.note,'text',false)}</div><div class="form-section-heading"><b>Položky dodacího listu</b><button class="text-button" type="button" data-action="add-delivery-line">＋ Přidat položku</button></div><div id="delivery-lines">${lines}</div><p class="form-hint">Do jednoho výdeje přidejte více různých materiálů tlačítkem „Přidat položku“. Před uložením se ověří dostupné množství každého materiálu; po uložení se souhrnně odečte ze skladu.</p>`;
    openModal(existing?'Upravit dodací list':'Nový dodací list',body,existing?'Uložit změny':'Vytvořit dodací list',existing?'save-delivery-edit':'save-delivery');
  }
  function incomingReceiptLine(item={}){
    const selected=material(item.materialId);
    return `<div class="incoming-item-row"><label class="form-field"><span>Existující materiál (volitelné)</span><select name="materialId"><option value="">Nová položka nebo doplnění názvu</option>${state.materials.map(m=>`<option value="${esc(m.id)}" ${m.id===item.materialId?'selected':''}>${esc(m.id)} · ${esc(m.name)} (${esc(m.unit)})</option>`).join('')}</select></label><label class="form-field"><span>Název materiálu</span><input name="name" value="${esc(item.name||selected?.name||'')}" required></label><label class="form-field"><span>Kategorie</span><input name="category" value="${esc(item.category||selected?.category||'Přijaté dodávky')}"></label><label class="form-field"><span>Jednotka</span><input name="unit" value="${esc(item.unit||selected?.unit||'ks')}" required></label><label class="form-field"><span>Množství</span><input name="qty" type="number" min="0.01" step="0.01" value="${esc(item.qty??1)}" required></label><label class="form-field"><span>Nákupní cena / jednotku</span><input name="purchasePrice" type="number" min="0" step="0.01" value="${esc(item.purchasePrice??0)}"></label><button class="remove-line" type="button" data-action="remove-receipt-line" aria-label="Odebrat položku">×</button></div>`;
  }
  function openIncomingReceiptForm(receiptId=''){
    const existing=state.incomingReceipts.find(item=>item.id===receiptId);
    if(existing&&existing.status!=='Čeká na kontrolu'){notify('Tento dodací list už byl zpracován.');return;}
    const item=existing||{id:receiptId||id('RC'),source:'manual',date:day,supplier:'',documentNumber:'',destination:'warehouse',projectId:'',note:'',attachments:[],items:[{}]};
    const lines=(item.items?.length?item.items:[{}]).map(incomingReceiptLine).join('');
    const attachmentLinks=(item.attachments||[]).map(file=>`<a href="./api/admin/incoming/${encodeURIComponent(item.id)}/attachments/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">${esc(file.name)}</a>`).join(' · ');
    const duplicate=item.duplicateOf?state.incomingReceipts.find(receipt=>receipt.id===item.duplicateOf):null;
    const sourceInfo=item.source==='email'?`<div class="mail-source"><b>E-mail:</b> ${esc(item.emailFrom||'Neznámý odesílatel')} · ${esc(item.emailSubject||'Bez předmětu')}${attachmentLinks?`<br><b>Přílohy:</b> ${attachmentLinks}`:''}<p>${esc(item.extractionSummary||'Příjem zatím není zaúčtovaný. Před potvrzením doplňte položky a vyberte cíl.')}</p>${item.extractedText?`<details><summary>Zobrazit rozpoznaný text</summary><pre class="extracted-document-text">${esc(item.extractedText)}</pre></details>`:''}</div>`:item.source==='upload'?`<div class="mail-source"><b>Nahraný dokument:</b> ${attachmentLinks||esc(item.attachments?.[0]?.name||'soubor')}<p>${esc(item.extractionSummary||'Před zařazením doplňte a zkontrolujte položky.')}</p>${item.extractedText?`<details><summary>Zobrazit rozpoznaný text</summary><pre class="extracted-document-text">${esc(item.extractedText)}</pre></details>`:''}</div>`:'<p class="form-hint">Příjem se zatím nepropíše do zásoby. Nejdřív doplňte položky a vyberte, kam materiál zařadit.</p>';
    const body=`<input type="hidden" name="receiptId" value="${esc(item.id)}">${duplicate?`<div class="duplicate-notice">Tento doklad se podobá příjmu ${esc(duplicate.documentNumber||duplicate.id)}. Ověřte, že nejde o duplicitní zápis.</div>`:''}<div class="form-grid">${field('Dodavatel','supplier',item.supplier,'text',false)}${field('Číslo dodacího listu','documentNumber',item.documentNumber,'text',false)}${field('Datum dodání','date',item.date||day,'date')}${selectField('Zařadit materiál do','destination',[['warehouse','Sklad'],['project','Konkrétní zakázka']],item.destination==='project'?'project':'warehouse')}<label class="form-field"><span>Zakázka při přímé dodávce</span><select name="projectId"><option value="">Vyberte zakázku</option>${state.projects.map(project=>`<option value="${esc(project.id)}" ${project.id===item.projectId?'selected':''}>${esc(project.id)} · ${esc(project.name)}</option>`).join('')}</select></label>${field('Poznámka','note',item.note,'text',false)}</div>${sourceInfo}<div class="form-section-heading"><b>Položky dodávky</b><button class="text-button" type="button" data-action="add-receipt-line">＋ Přidat položku</button></div><div id="incoming-receipt-lines">${lines}</div><p class="form-hint">Při zařazení na sklad se zvýší skladový stav. Při přímém přiřazení na zakázku se množství zaznamená u zakázky, ale nepřičte se do centrálního skladu. Nákupní cena nepřepíše prodejní cenu v katalogu.</p>`;
    openModal(existing?'Zkontrolovat příchozí dodací list':'Zadat příjem materiálu',body,'Potvrdit zařazení','save-incoming-receipt');
  }
  function openInvoiceForm(deliveryId='') {
    const available = state.deliveries.filter(d=>!d.billed);
    const selected = deliveryId || available[0]?.id || '';
    if (!available.length) { notify('Všechny dodací listy jsou již vyúčtované.'); return; }
    const body = `<div class="form-grid">${selectField('Dodací list','deliveryId',available.map(d=>[d.id,`${d.id} · ${projectName(d.projectId)} · ${dateFmt(d.date)}`]),selected)}${field('Datum vystavení','date',day,'date')}${field('Splatnost','due',datePlusDays(day,state.invoiceTemplate?.dueDays??14),'date')}</div><p class="form-hint">Částka se vypočítá z katalogové prodejní ceny a výchozí sazby DPH z předlohy faktury.</p>`;
    openModal('Vystavit fakturu',body,'Vytvořit fakturu','save-invoice');
  }
  function openInvoiceTemplateForm(){
    const item={...demo.invoiceTemplate,...(state.invoiceTemplate||{})};
    const body=`<div class="form-grid">${field('Název / jméno dodavatele','company',item.company)}${field('Adresa dodavatele','address',item.address,'text',false)}${field('IČO','ico',item.ico,'text',false)}${field('DIČ','dic',item.dic,'text',false)}${field('Bankovní účet / IBAN','bankAccount',item.bankAccount,'text',false)}${field('Splatnost (dny)','dueDays',item.dueDays,'number',true,'min="0" max="365"')}${field('Výchozí DPH (%)','vatRate',item.vatRate,'number',true,'min="0" max="100" step="0.1"')}${field('Text v patičce','footer',item.footer,'text',false)}</div><p class="form-hint">Výchozí DPH je 0 %. Sazbu nastavte podle svého daňového režimu před vystavením skutečných faktur.</p>`;
    openModal('Předloha faktury',body,'Uložit předlohu','save-invoice-template');
  }
  function openAttendanceForm(attendanceId='') {
    const item=state.attendance.find(record=>record.id===attendanceId)||{employee:'Jan Novák',projectId:'',date:day,start:'07:00',end:'15:30',note:''};
    const body = `<input type="hidden" name="recordId" value="${esc(attendanceId)}"><div class="form-grid">${field('Pracovník','employee',item.employee)}${selectField('Zakázka','projectId',state.projects.map(p=>[p.id,`${p.id} · ${p.name}`]),item.projectId)}${field('Datum','date',item.date,'date')}${field('Příchod','start',item.start,'time')}${field('Odchod','end',item.end||'','time',false)}${field('Poznámka','note',item.note,'text',false)}</div>`;
    openModal(attendanceId?'Upravit docházku':'Ruční zápis docházky',body,'Uložit docházku',attendanceId?'save-attendance-edit':'save-attendance');
  }
  function openInvoiceEditForm(invoiceId='') {
    const item=state.invoices.find(record=>record.id===invoiceId);if(!item)return;
    const body=`<input type="hidden" name="recordId" value="${esc(invoiceId)}"><div class="form-grid">${field('Datum vystavení','date',item.date,'date')}${field('Splatnost','due',item.due,'date')}${field('Částka (Kč)','amount',item.amount,'number',true,'min="0" step="0.01"')}${selectField('Stav','status',[['Neuhrazeno','Neuhrazeno'],['Uhrazeno','Uhrazeno']],item.status)}</div>`;
    openModal('Upravit fakturu',body,'Uložit změny','save-invoice-edit');
  }
  function openUserForm(userId='') {
    const item=state.users.find(user=>user.id===userId);
    const roleCodes={Technik:'technician','Vedoucí montáže':'foreman','Projektový manažer':'project_manager',Administrativa:'office','Zaměstnanec':'employee'};
    const role=roleCodes[item?.role]||'employee';
    const body = `<input type="hidden" name="recordId" value="${esc(userId)}"><div class="form-grid">${field('Jméno a příjmení','name',item?.name||'')}${field('Firemní e-mail','email',item?.email||'','email')}${selectField('Role','role',[['technician','Technik'],['foreman','Vedoucí montáže'],['project_manager','Projektový manažer'],['office','Administrativa'],['employee','Zaměstnanec']],role)}${item?'':'<label class="form-field"><span>Počáteční heslo</span><input name="password" type="password" required minlength="8" autocomplete="new-password"></label>'}</div>${item?'':'<p class="form-hint">Uživatel se bude moci přihlásit tímto e-mailem a počátečním heslem. Heslo se uloží pouze jako zabezpečený otisk.</p>'}`;
    openModal(item?'Upravit uživatele':'Přidat uživatele',body,item?'Uložit změny':'Přidat uživatele',item?'save-user-edit':'save-user');
  }
  function projectDetail(projectId) {
    const p = project(projectId);
    if (!p) return;
    const docs = state.deliveries.filter(d=>d.projectId===p.id);
    const directReceipts=state.incomingReceipts.filter(receipt=>receipt.status==='Potvrzeno'&&receipt.destination==='project'&&receipt.projectId===p.id);
    const totals = new Map();
    const addTotal=(item)=>{const key=item.materialId||`name:${item.name}`;const total=totals.get(key)||{qty:0,unit:item.unit||material(item.materialId)?.unit||''};total.qty+=Number(item.qty);totals.set(key,total);};
    docs.forEach(d=>d.items.forEach(addTotal));
    directReceipts.forEach(receipt=>receipt.items.forEach(addTotal));
    const used = [...totals.entries()].map(([key,total])=>{const materialId=key.startsWith('name:')?'':key,name=materialId?materialName(materialId):key.slice(5);const refs=[...docs.filter(d=>d.items.some(i=>(i.materialId||`name:${i.name}`)===key)).map(d=>d.id),...directReceipts.filter(r=>r.items.some(i=>(i.materialId||`name:${i.name}`)===key)).map(r=>r.documentNumber||r.id)];return `<tr><td>${esc(name)}</td><td>${total.qty} ${esc(total.unit)}</td><td>${refs.map(esc).join(', ')}</td></tr>`;}).join('');
    const docsHtml=[...docs.map(d=>`<div class="compact-row"><span class="compact-icon">DL</span><span><b>${esc(d.id)}</b><small>${dateFmt(d.date)} · Výdej na stavbu · ${esc(d.person)}</small></span><button class="text-button" data-action="print-delivery" data-id="${esc(d.id)}">Tisk</button></div>`),...directReceipts.map(receipt=>`<div class="compact-row"><span class="compact-icon">PŘ</span><span><b>${esc(receipt.documentNumber||receipt.id)}</b><small>${dateFmt(receipt.date)} · Přímá dodávka od ${esc(receipt.supplier||receipt.emailFrom||'dodavatele')}</small></span></div>`)].join('');
    const body = `<div class="detail-summary"><div><span>Číslo zakázky</span><b>${esc(p.id)}</b></div><div><span>Zákazník</span><b>${esc(p.client)}</b></div><div><span>Termín</span><b>${dateFmt(p.due)}</b></div><div><span>Odpovědný</span><b>${esc(p.manager)}</b></div><div><span>Přiřazení pracovníci</span><b>${assignedNames(p).map(esc).join(', ')||'—'}</b></div><div><span>Stav</span>${statusPill(p.status)}</div><div><span>Místo</span><b>${esc(p.address)}</b></div></div><h3 class="modal-subheading">Materiál dodaný na zakázku</h3><div class="table-wrap"><table><thead><tr><th>MATERIÁL</th><th>CELKOVÉ MNOŽSTVÍ</th><th>DODACÍ LISTY</th></tr></thead><tbody>${used||'<tr><td colspan="3" class="empty-cell">Na tuto zakázku zatím nebyl dodán materiál.</td></tr>'}</tbody></table></div><h3 class="modal-subheading">Dodací listy (${docs.length+directReceipts.length})</h3>${docsHtml||'<p class="muted">Zatím žádné doklady.</p>'}`;
    openModal(`Detail zakázky · ${esc(p.id)}`,body,'','');
    $('.modal-actions', $('#app-modal')).innerHTML = `<button type="button" class="button-quiet" data-action="close-modal">Zavřít</button><button type="button" class="export" data-action="new-delivery-for-project" data-id="${esc(p.id)}">＋ Dodací list</button><button type="button" class="export" data-action="edit-project" data-id="${esc(p.id)}">Upravit zakázku</button>`;
  }
  function serializeForm(form) { const entries=new FormData(form),data=Object.fromEntries(entries.entries());data.assignedUsers=entries.getAll('assignedUsers');return data; }
  function closeModal() { $('#app-modal').close(); }
  function csvDownload(filename, rows) {
    const csv = '\uFEFF' + rows.map(row=>row.map(cell=>`"${String(cell??'').replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  }
  const csvKey=(value)=>String(value||'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function parseCsv(text) {
    const source=String(text||'').replace(/^\uFEFF/,'');
    let delimiter=';';
    const firstLine=source.split(/\r?\n/,1)[0]||'';
    let quoted=false,commas=0,semicolons=0;
    for(const char of firstLine){if(char==='"')quoted=!quoted;else if(!quoted&&char===',')commas++;else if(!quoted&&char===';')semicolons++;}
    if(commas>semicolons)delimiter=',';
    const records=[];let row=[],cell='',inQuotes=false;
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(ch==='"'&&inQuotes&&source[i+1]==='"'){cell+='"';i++;}
      else if(ch==='"')inQuotes=!inQuotes;
      else if(ch===delimiter&&!inQuotes){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!inQuotes){if(ch==='\r'&&source[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(value=>value.trim()))records.push(row);row=[];}
      else cell+=ch;
    }
    row.push(cell);if(row.some(value=>value.trim()))records.push(row);
    if(records.length<2)throw new Error('CSV musí obsahovat záhlaví a alespoň jeden řádek.');
    const headers=records.shift().map(csvKey);
    return records.map(values=>Object.fromEntries(headers.map((header,index)=>[header,String(values[index]??'').trim()])));
  }
  function csvValue(row,...aliases) {
    for(const alias of aliases){const value=row[csvKey(alias)];if(value!==undefined&&value!=='')return value;}
    return '';
  }
  function importRows(page,rows) {
    const errors=[];
    const number=(row,aliases,label,rowNumber,required=true)=>{
      const raw=csvValue(row,...aliases);
      const parsed=Number(raw.replace(/\s/g,'').replace(',','.'));
      if(raw===''&&!required)return 0;
      if(raw===''||!Number.isFinite(parsed)||parsed<0){errors.push(`řádek ${rowNumber}: ${label} musí být nezáporné číslo`);return null;}
      return parsed;
    };
    if(page==='projects'){
      const output=rows.map((row,index)=>{const n=index+2,idValue=csvValue(row,'Číslo','ID','Zakázka ID')||`ML-${String(2500+state.projects.length+index).padStart(4,'0')}`;const name=csvValue(row,'Název','Zakázka','Název zakázky'),status=csvValue(row,'Stav')||'Čeká na zahájení';if(!name)errors.push(`řádek ${n}: chybí název zakázky`);if(!['Probíhá','Čeká na zahájení','Dokončeno','Pozastaveno'].includes(status))errors.push(`řádek ${n}: stav zakázky není platný`);return {id:idValue,name,client:csvValue(row,'Zákazník','Klient'),address:csvValue(row,'Adresa','Místo'),manager:csvValue(row,'Odpovědný','Vedoucí','Manažer'),status,due:csvValue(row,'Termín','Termín dokončení','Splatnost')};});
      if(!errors.length)for(const item of output){const current=project(item.id);if(current)Object.assign(current,item);else state.projects.unshift(item);}return errors;
    }
    if(page==='materials'){
      const output=rows.map((row,index)=>{const n=index+2,idValue=csvValue(row,'Kód','ID','Materiál ID')||id('MAT'),stock=number(row,['Skladem','Množství','Stav skladu'],'sklad',n),min=number(row,['Minimální zásoba','Minimum','Min'],'minimum',n,false),price=number(row,['Cena','Cena za jednotku','Cena / jedn.'],'cena',n,false),name=csvValue(row,'Materiál','Název','Název materiálu');if(!name)errors.push(`řádek ${n}: chybí název materiálu`);return {id:idValue,name,category:csvValue(row,'Kategorie')||'Ostatní',unit:csvValue(row,'Jednotka','MJ')||'ks',stock,min,price,location:csvValue(row,'Umístění','Regál')};});
      if(!errors.length)for(const item of output){const current=material(item.id);if(current){const delta=Number(item.stock)-Number(current.stock);Object.assign(current,item);if(delta)state.movements.unshift({id:id('SM'),materialId:item.id,date:day,direction:delta>0?'in':'out',qty:Math.abs(delta),note:'Úprava při importu CSV'});}else{state.materials.unshift(item);if(item.stock)state.movements.unshift({id:id('SM'),materialId:item.id,date:day,direction:'in',qty:item.stock,note:'Počáteční stav při importu CSV'});}}return errors;
    }
    if(page==='attendance'){
      const output=rows.map((row,index)=>{const n=index+2,projectId=csvValue(row,'Zakázka ID','Zakázka','Projekt ID'),date=csvValue(row,'Datum'),start=csvValue(row,'Příchod','Začátek'),employee=csvValue(row,'Pracovník','Jméno');if(!employee||!date||!start||!project(projectId))errors.push(`řádek ${n}: chybí pracovník, datum, příchod nebo platná zakázka`);return {id:csvValue(row,'ID','Číslo')||id('AT'),date,employee,projectId,start,end:csvValue(row,'Odchod','Konec'),note:csvValue(row,'Poznámka'),status:csvValue(row,'Odchod','Konec')?'Uzavřeno':'Na pracovišti'};});
      if(!errors.length)for(const item of output){const index=state.attendance.findIndex(current=>current.id===item.id);if(index>=0)state.attendance[index]=item;else state.attendance.unshift(item);}return errors;
    }
    if(page==='deliveries'){
      const grouped=new Map();
      rows.forEach((row,index)=>{const n=index+2,deliveryId=csvValue(row,'Dodací list','Číslo','ID'),projectId=csvValue(row,'Zakázka ID','Zakázka'),materialId=csvValue(row,'Materiál ID','Kód materiálu'),qty=number(row,['Množství','Ks','Qty'],'množství',n);if(!deliveryId||!project(projectId)||!material(materialId)||!qty||qty<=0){errors.push(`řádek ${n}: zkontrolujte číslo listu, zakázku, materiál a množství`);return;}if(state.deliveries.some(item=>item.id===deliveryId)){errors.push(`řádek ${n}: dodací list ${deliveryId} už existuje`);return;}let delivery=grouped.get(deliveryId);if(!delivery){delivery={id:deliveryId,date:csvValue(row,'Datum')||day,projectId,person:csvValue(row,'Vydal','Převzal'),note:csvValue(row,'Poznámka'),billed:false,items:[]};grouped.set(deliveryId,delivery);}if(delivery.projectId!==projectId)errors.push(`řádek ${n}: jeden dodací list nemůže patřit k více zakázkám`);delivery.items.push({materialId,qty});});
      const totals=new Map();for(const delivery of grouped.values())for(const line of delivery.items)totals.set(line.materialId,(totals.get(line.materialId)||0)+line.qty);
      for(const [materialId,qty] of totals)if(qty>Number(material(materialId).stock))errors.push(`${material(materialId).name}: po importu by množství překročilo sklad`);
      if(!errors.length){for(const delivery of grouped.values()){for(const line of delivery.items)material(line.materialId).stock=Number(material(line.materialId).stock)-line.qty;state.deliveries.unshift(delivery);}}return errors;
    }
    if(page==='invoices'){
      const output=rows.map((row,index)=>{const n=index+2,idValue=csvValue(row,'Faktura','Číslo','ID'),deliveryId=csvValue(row,'Dodací list','Dodací list ID'),delivery=state.deliveries.find(item=>item.id===deliveryId),amount=number(row,['Částka','Celkem','Cena'],'částka',n),status=csvValue(row,'Stav')||'Neuhrazeno',projectId=csvValue(row,'Zakázka ID')||delivery?.projectId;if(!delivery||delivery.billed||!idValue)errors.push(`řádek ${n}: faktura potřebuje nové číslo a dosud nevyúčtovaný dodací list`);if(!['Neuhrazeno','Uhrazeno'].includes(status))errors.push(`řádek ${n}: stav faktury není platný`);if(delivery&&projectId!==delivery.projectId)errors.push(`řádek ${n}: zakázka neodpovídá zvolenému dodacímu listu`);return {id:idValue,date:csvValue(row,'Vystaveno','Datum')||day,due:csvValue(row,'Splatnost')||day,projectId,deliveryId,status,amount};});
      if(!errors.length)for(const item of output){if(state.invoices.some(invoice=>invoice.id===item.id))errors.push(`Faktura ${item.id} už existuje`);else{state.invoices.unshift(item);const delivery=state.deliveries.find(value=>value.id===item.deliveryId);if(delivery)delivery.billed=true;}}return errors;
    }
    if(page==='requests'){
      for(const [index,row] of rows.entries()){const name=csvValue(row,'Žadatel','Jméno','Jméno a příjmení'),email=csvValue(row,'E-mail','Email').toLowerCase(),status=csvValue(row,'Stav')||'Nová';if(!name||!/\S+@\S+\.\S+/.test(email)){errors.push(`řádek ${index+2}: chybí jméno nebo platný e-mail`);continue;}if(!['Nová','Schváleno','Zamítnuto'].includes(status)){errors.push(`řádek ${index+2}: stav žádosti není platný`);continue;}const request={name,email,initials:name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),role:csvValue(row,'Role','Požadovaná role')||'Zaměstnanec',date:csvValue(row,'Datum')||day,status};const existing=state.requests.find(item=>item.email.toLowerCase()===email);if(existing)Object.assign(existing,request);else state.requests.unshift(request);}return errors;
    }
    if(page==='activity'){
      for(const [index,row] of rows.entries()){const textValue=csvValue(row,'Událost','Popis','Text');if(!textValue)errors.push(`řádek ${index+2}: chybí popis události`);else state.activity.unshift({date:csvValue(row,'Datum')||day,text:textValue,kind:csvValue(row,'Typ','Kategorie')||'Import'});}return errors;
    }
    return errors;
  }
  async function importCsvFile(page,file) {
    if(!file)return;
    try{
      const rows=parseCsv(await file.text());
      if(page==='users'){
        const pending=rows.map((row,index)=>({row,index})), errors=[];
        for(const {row,index} of pending){
          const full_name=csvValue(row,'Jméno','Jméno a příjmení','Celé jméno'),email=csvValue(row,'E-mail','Email'),password=csvValue(row,'Heslo','Počáteční heslo'),rawRole=csvValue(row,'Role')||'employee';
          const roleMap={'administrátor':'admin','projektový manažer':'project_manager','vedoucí montáže':'foreman','technik':'technician','administrativa':'office','zaměstnanec':'employee'};
          const role=roleMap[rawRole.toLocaleLowerCase('cs')]||rawRole;
          if(!full_name||!email||password.length<8){errors.push(`řádek ${index+2}: vyplňte jméno, e-mail a heslo alespoň 8 znaků`);continue;}
          try{await window.MLAuth.createUser({full_name,email,role,password});}catch(error){errors.push(`řádek ${index+2}: ${error.message}`);}
        }
        const remote=await window.MLAuth.adminState();state.users=(remote.users||[]).map(mapDatabaseUser);
        log(`Proběhl import uživatelských účtů z CSV (${rows.length} řádků).`,'Uživatelé');
        await save();render();notify(errors.length?`Import dokončen s chybami: ${errors.slice(0,3).join('; ')}`:`Importováno ${rows.length} uživatelských účtů.`);return;
      }
      const previous=structuredClone(state),errors=importRows(page,rows);
      if(errors.length){state=previous;notify(`CSV nebylo importováno: ${errors.slice(0,4).join('; ')}`);return;}
      log(`Byl importován soubor ${file.name} (${rows.length} řádků).`,'Import');
      const persisted=await save();render();notify(persisted?`Importováno ${rows.length} řádků z CSV.`:'Změny se nepodařilo uložit do databáze.');
    }catch(error){notify(error.message||'Soubor CSV se nepodařilo načíst.');}
  }
  function exportPageCsv(page) {
    const definitions={
      projects:['ml-work-zakazky.csv',[['Číslo','Název','Zákazník','Adresa','Odpovědný','Termín','Stav'],...state.projects.map(p=>[p.id,p.name,p.client,p.address,p.manager,p.due,p.status])]],
      materials:['ml-work-sklad.csv',[['Kód','Materiál','Kategorie','Jednotka','Skladem','Minimální zásoba','Cena','Umístění'],...state.materials.map(m=>[m.id,m.name,m.category,m.unit,m.stock,m.min,m.price,m.location])]],
      deliveries:['ml-work-dodaci-listy.csv',[['Dodací list','Datum','Zakázka ID','Vydal','Poznámka','Materiál ID','Množství'],...state.deliveries.flatMap(d=>d.items.map(i=>[d.id,d.date,d.projectId,d.person,d.note,i.materialId,i.qty]))]],
      invoices:['ml-work-faktury.csv',[['Faktura','Dodací list','Zakázka ID','Vystaveno','Splatnost','Stav','Částka'],...state.invoices.map(i=>[i.id,i.deliveryId,i.projectId,i.date,i.due,i.status,i.amount])]],
      attendance:['ml-work-dochazka.csv',[['ID','Datum','Pracovník','Zakázka ID','Příchod','Odchod','Poznámka'],...state.attendance.map(a=>[a.id,a.date,a.employee,a.projectId,a.start,a.end,a.note])]],
      requests:['ml-work-zadosti.csv',[['Jméno','E-mail','Role','Datum','Stav'],...state.requests.map(r=>[r.name,r.email,r.role,r.date,r.status])]],
      users:['ml-work-uzivatele.csv',[['Jméno','E-mail','Role','Stav'],...state.users.map(u=>[u.name,u.email,u.role,u.status])]],
      activity:['ml-work-aktivita.csv',[['Datum','Typ','Událost'],...state.activity.map(a=>[a.date,a.kind,a.text])]]
    };
    const definition=definitions[page];if(definition)csvDownload(definition[0],definition[1]);
  }
  function printDelivery(deliveryId) {
    const d = state.deliveries.find(item=>item.id===deliveryId); if (!d) return;
    const p = project(d.projectId);
    const rows = d.items.map(item=>`<tr><td>${esc(material(item.materialId)?.name||item.materialId)}</td><td>${Number(item.qty)} ${esc(material(item.materialId)?.unit||'')}</td><td>${money(Number(item.qty)*Number(material(item.materialId)?.price||0))}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'width=900,height=750');
    if (!popup) { notify('Pro tisk povolte otevírání vyskakovacích oken.'); return; }
    popup.document.write(`<!doctype html><html lang="cs"><meta charset="utf-8"><title>Dodací list ${esc(d.id)}</title><style>body{font:15px Arial,sans-serif;color:#152238;margin:48px}h1{font-size:28px}small{color:#718096}.top{display:flex;justify-content:space-between;border-bottom:2px solid #172b45;padding-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:30px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{font-size:12px;color:#718096}footer{margin-top:70px;display:flex;justify-content:space-between} @media print{body{margin:15mm}}</style><div class="top"><div><b>ML Work</b><h1>Dodací list</h1><b>${esc(d.id)}</b></div><div>${dateFmt(d.date)}<br><small>${esc(d.person)}</small></div></div><p><b>Zakázka:</b> ${esc(p?.id||d.projectId)} · ${esc(p?.name||'')}<br><b>Zákazník:</b> ${esc(p?.client||'')}<br><b>Místo:</b> ${esc(p?.address||'')}</p><p>${esc(d.note||'')}</p><table><thead><tr><th>MATERIÁL</th><th>MNOŽSTVÍ</th><th>HODNOTA MATERIÁLU</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Vydal: ____________________</span><span>Převzal: ____________________</span></footer><script>window.onload=()=>window.print()<\/script></html>`);
    popup.document.close();
  }
  function printInvoice(invoiceId){
    const invoice=state.invoices.find(item=>item.id===invoiceId);if(!invoice)return;
    const template={...demo.invoiceTemplate,...(state.invoiceTemplate||{})};
    const delivery=state.deliveries.find(item=>item.id===invoice.deliveryId);
    const p=project(invoice.projectId);
    const lines=Array.isArray(invoice.items)&&invoice.items.length?invoice.items:(delivery?.items||[]).map(item=>({materialId:item.materialId,name:material(item.materialId)?.name||item.materialId,qty:item.qty,unit:material(item.materialId)?.unit||'ks',unitPrice:material(item.materialId)?.price||0}));
    const subtotal=invoice.subtotal??(lines.length?lines.reduce((sum,item)=>sum+Number(item.qty)*Number(item.unitPrice||0),0):Number(invoice.amount||0));
    const taxRate=Number(invoice.taxRate??0),taxAmount=Number(invoice.taxAmount??subtotal*taxRate/100),total=Number(invoice.amount??subtotal+taxAmount);
    const rows=lines.map(item=>`<tr><td>${esc(item.name||material(item.materialId)?.name||'Materiál')}</td><td>${Number(item.qty)} ${esc(item.unit||material(item.materialId)?.unit||'ks')}</td><td>${money(item.unitPrice||0)}</td><td>${money(Number(item.qty)*Number(item.unitPrice||0))}</td></tr>`).join('')||`<tr><td>Materiál dle dodacího listu ${esc(invoice.deliveryId)}</td><td>1 soubor</td><td>${money(subtotal)}</td><td>${money(subtotal)}</td></tr>`;
    const popup=window.open('','_blank','width=980,height=800');
    if(!popup){notify('Pro tisk povolte otevírání vyskakovacích oken.');return;}
    popup.document.write(`<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Faktura ${esc(invoice.id)}</title><style>body{font:15px Arial,sans-serif;color:#17243a;margin:38px auto;max-width:950px;padding:0 25px}h1{font-size:32px;margin:0 0 6px}.muted{color:#6e7c90}.top{display:flex;justify-content:space-between;gap:30px;padding-bottom:20px;border-bottom:2px solid #172b45}.top section{max-width:55%}.meta,.parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0}.meta div,.parties div{padding:14px;border:1px solid #e1e6ec;border-radius:8px}.label{display:block;margin-bottom:7px;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.08em}b{line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:12px 9px;border-bottom:1px solid #e1e6ec}th{font-size:11px;color:#748196;text-transform:uppercase}td:last-child,th:last-child{text-align:right}.totals{width:min(100%,340px);margin:20px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:7px 0}.totals .grand{margin-top:6px;padding-top:12px;border-top:2px solid #172b45;font-size:20px;font-weight:700}.footer{margin-top:42px;padding-top:14px;border-top:1px solid #e1e6ec;color:#68778e}.draft{display:inline-block;padding:6px 9px;border-radius:5px;background:#fff3bd;color:#705800;font-size:12px;font-weight:700}@media print{body{margin:0 auto;padding:0 5mm}}</style><div class="top"><section><b>${esc(template.company||'ML Work')}</b><p class="muted">${esc(template.address||'Adresa dodavatele')}</p><p class="muted">${template.ico?`IČO: ${esc(template.ico)}`:'IČO: —'}${template.dic?` · DIČ: ${esc(template.dic)}`:''}<br>${template.bankAccount?`Bankovní účet: ${esc(template.bankAccount)}`:''}</p></section><section><h1>Faktura</h1>${invoice.preview?'<span class="draft">VZOROVÁ PŘEDLOHA</span>':''}<p><b>${esc(invoice.id)}</b><br><span class="muted">Zakázka ${esc(invoice.projectId||'—')} · ${esc(p?.name||'')}</span></p></section></div><div class="meta"><div><span class="label">Vystaveno</span><b>${dateFmt(invoice.date)}</b></div><div><span class="label">Splatnost</span><b>${dateFmt(invoice.due)}</b><br><span class="muted">${esc(template.bankAccount||'Bankovní účet doplňte v předloze')}</span></div></div><div class="parties"><div><span class="label">Dodavatel</span><b>${esc(template.company||'ML Work')}</b><br>${esc(template.address||'Adresa dodavatele')}<br>${template.ico?`IČO: ${esc(template.ico)}`:'IČO: —'}${template.dic?`<br>DIČ: ${esc(template.dic)}`:''}</div><div><span class="label">Odběratel</span><b>${esc(p?.client||'Zákazník')}</b><br>${esc(p?.address||'Adresa odběratele')}<br><span class="muted">Zakázka: ${esc(p?.name||invoice.projectId||'—')}</span></div></div><table><thead><tr><th>Položka</th><th>Množství</th><th>Cena za jednotku</th><th>Celkem</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Základ daně</span><b>${money(subtotal)}</b></div><div><span>DPH ${taxRate}%</span><b>${money(taxAmount)}</b></div><div class="grand"><span>Celkem k úhradě</span><b>${money(total)}</b></div></div><div class="footer">${esc(template.footer||'Děkujeme za spolupráci.')}</div><script>window.onload=()=>window.print()<\/script></html>`);
    popup.document.close();
  }
  function previewInvoiceTemplate(){
    const product=state.materials[0],p=state.projects[0];
    const lines=product?[{name:product.name,qty:12,unit:product.unit,unitPrice:Number(product.price)}]:[];
    const subtotal=lines.reduce((sum,item)=>sum+item.qty*item.unitPrice,0),taxRate=Number(state.invoiceTemplate?.vatRate||0),taxAmount=subtotal*taxRate/100;
    const sample={id:'VZOR-2026-001',projectId:p?.id||'VZOR',date:day,due:datePlusDays(day,state.invoiceTemplate?.dueDays||14),items:lines,subtotal,taxRate,taxAmount,amount:subtotal+taxAmount,preview:true};
    const saved=state.invoices;state.invoices=[sample];printInvoice(sample.id);state.invoices=saved;
  }
  async function synchronizeIncomingMail(){
    if(mailStatus.running)return;
    mailStatus={...mailStatus,running:true};
    try{
      const result=await window.MLAuth.syncMail();
      mailStatus=result;
      if(!result.configured){notify(result.message||'Doplňte přístup pro poštovní aplikaci v místním nastavení.');return;}
      const remote=await window.MLAuth.adminState();
      if(remote.state&&typeof remote.state==='object')state={...demo,...remote.state};
      state.users=(remote.users||[]).map(mapDatabaseUser);databaseRevision=Number(remote.revision||0);
      notify(result.imported?`Načteno ${result.imported} dodacích listů ke kontrole.`:'Nebyly nalezeny nové dodací listy.');
    }catch(error){
      try{mailStatus=await window.MLAuth.mailStatus();}catch{}
      notify(error.message||'E-mail se nepodařilo synchronizovat.');
    }finally{
      mailStatus.running=false;render();
    }
  }
  function chooseIncomingFile(){
    if(incomingUploadRunning)return;
    const picker=document.createElement('input');picker.type='file';picker.accept='.pdf,.csv,.png,.jpg,.jpeg,application/pdf,text/csv,image/png,image/jpeg';
    picker.onchange=async()=>{
      const file=picker.files?.[0];if(!file)return;
      if(file.size>12*1024*1024){notify('Soubor musí mít nejvýše 12 MB.');return;}
      incomingUploadRunning=true;render();
      try{
        const result=await window.MLAuth.uploadIncomingFile(file);
        const remote=await window.MLAuth.adminState();
        if(remote.state&&typeof remote.state==='object')state={...demo,...remote.state};
        state.users=(remote.users||[]).map(mapDatabaseUser);databaseRevision=Number(remote.revision||0);
        try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}
        render();
        openIncomingReceiptForm(result.receipt.id);
        notify('Dokument nahrán. Zkontrolujte údaje; do skladu se zapíše až po potvrzení.');
      }catch(error){notify(error.message||'Doklad se nepodařilo nahrát.');}
      finally{incomingUploadRunning=false;render();}
    };
    picker.click();
  }

  function onAction(action, button) {
    const recordId = button.dataset.id;
    switch(action) {
      case 'new-project': openProjectForm(); break;
      case 'edit-project': openProjectForm(recordId); break;
      case 'project-detail': projectDetail(recordId); break;
      case 'new-material': openMaterialForm(); break;
      case 'edit-material': openMaterialForm(recordId); break;
      case 'stock-adjust': openStockForm(recordId); break;
      case 'new-incoming-receipt': openIncomingReceiptForm(); break;
      case 'upload-incoming-file': chooseIncomingFile(); break;
      case 'review-incoming-receipt': openIncomingReceiptForm(recordId); break;
      case 'ignore-incoming-receipt': {
        const receipt=state.incomingReceipts.find(item=>item.id===recordId);if(receipt&&confirm('Označit tento e-mail jako nesouvisející? Materiál se nezařadí do skladu.')){receipt.status='Ignorováno';log(`Příchozí doklad ${receipt.documentNumber||receipt.emailSubject||receipt.id} byl ignorován.`,'Příjem materiálu');render();}break;
      }
      case 'delete-incoming-receipt': {
        const receipt=state.incomingReceipts.find(item=>item.id===recordId);if(!receipt)break;
        const duplicate=receipt.duplicateOf?state.incomingReceipts.find(item=>item.id===receipt.duplicateOf):null;
        const totals=new Map();
        if(receipt.status==='Potvrzeno'&&receipt.destination==='warehouse'){
          if((receipt.items||[]).some(line=>!line.materialId)){notify('Doklad nelze bezpečně zrušit, protože u položky chybí vazba na materiál.');break;}
          for(const line of receipt.items||[])totals.set(line.materialId,(totals.get(line.materialId)||0)+Number(line.qty));
        }
        if(receipt.status==='Potvrzeno'&&receipt.destination==='warehouse'){
          const invalid=[...totals].find(([materialId,qty])=>!material(materialId)||Number(material(materialId).stock)<qty);
          if(invalid){notify('Doklad nelze smazat: část přijatého materiálu už byla vydána nebo není skladem. Nejprve opravte skladový stav.');break;}
        }
        const reason=duplicate?`Je označen jako možný duplikát dokladu ${duplicate.documentNumber||duplicate.id}. `:'';
        const reversal=totals.size?' Uskladněné množství se odečte zpět.':'';
        if(!confirm(`${reason}Opravdu smazat příjmový doklad ${receipt.documentNumber||receipt.id}?${reversal}`))break;
        for(const [materialId,qty] of totals){const item=material(materialId);item.stock=Number(item.stock)-qty;state.movements.unshift({id:id('SM'),materialId,date:day,direction:'out',qty,note:`Storno příjmového dokladu ${receipt.documentNumber||receipt.id}`});}
        for(const item of state.incomingReceipts)if(item.duplicateOf===recordId)item.duplicateOf='';
        state.incomingReceipts=state.incomingReceipts.filter(item=>item.id!==recordId);
        log(`Příjmový doklad ${receipt.documentNumber||receipt.id} byl odstraněn${duplicate?' jako duplicitní':''}.`,'Příjem materiálu');render();notify('Příjmový doklad byl odstraněn.');break;
      }
      case 'mail-sync': synchronizeIncomingMail(); break;
      case 'new-delivery': openDeliveryForm(); break;
      case 'new-stock-delivery': openDeliveryForm(); break;
      case 'edit-delivery': openDeliveryForm('',recordId); break;
      case 'new-delivery-for-project': closeModal(); openDeliveryForm(recordId); break;
      case 'new-invoice': openInvoiceForm(); break;
      case 'invoice-delivery': openInvoiceForm(recordId); break;
      case 'new-attendance': openAttendanceForm(); break;
      case 'edit-attendance': openAttendanceForm(recordId); break;
      case 'attendance-clock': clockAttendance(); break;
      case 'new-user': openUserForm(); break;
      case 'edit-user': openUserForm(recordId); break;
      case 'add-delivery-line': $('#delivery-lines').insertAdjacentHTML('beforeend',deliveryLine()); break;
      case 'remove-delivery-line': if ($('#delivery-lines').children.length>1) button.closest('.delivery-item-row').remove(); break;
      case 'close-modal': closeModal(); break;
      case 'print-delivery': printDelivery(recordId); break;
      case 'print-invoice': printInvoice(recordId); break;
      case 'edit-invoice-template': openInvoiceTemplateForm(); break;
      case 'preview-invoice-template': previewInvoiceTemplate(); break;
      case 'add-receipt-line': $('#incoming-receipt-lines').insertAdjacentHTML('beforeend',incomingReceiptLine()); break;
      case 'remove-receipt-line': if ($('#incoming-receipt-lines').children.length>1)button.closest('.incoming-item-row').remove(); break;
      case 'import-csv': {
        const input=document.querySelector(`[data-csv-input="${button.dataset.importPage}"]`);if(input){input.value='';input.click();}break;
      }
      case 'export-projects': exportPageCsv('projects'); break;
      case 'export-materials': exportPageCsv('materials'); break;
      case 'export-deliveries': exportPageCsv('deliveries'); break;
      case 'export-invoices': exportPageCsv('invoices'); break;
      case 'export-attendance': exportPageCsv('attendance'); break;
      case 'export-requests': exportPageCsv('requests'); break;
      case 'export-users': exportPageCsv('users'); break;
      case 'export-activity': exportPageCsv('activity'); break;
      case 'edit-invoice': openInvoiceEditForm(recordId); break;
      case 'delete-project': {
        const linked=state.deliveries.some(item=>item.projectId===recordId)||state.attendance.some(item=>item.projectId===recordId)||state.incomingReceipts.some(item=>item.status==='Potvrzeno'&&item.destination==='project'&&item.projectId===recordId);
        if(linked){notify('Zakázku nelze odstranit, protože má navázanou docházku nebo dodací list.');break;}
        if(confirm(`Opravdu odstranit zakázku ${recordId}?`)){state.projects=state.projects.filter(item=>item.id!==recordId);log(`Zakázka ${recordId} byla odstraněna.`,'Zakázky');render();notify('Zakázka byla odstraněna.');}break;
      }
      case 'delete-material': {
        if(state.deliveries.some(delivery=>delivery.items.some(line=>line.materialId===recordId))||state.incomingReceipts.some(receipt=>receipt.items?.some(line=>line.materialId===recordId))){notify('Materiál nelze odstranit, protože je uveden na dodacím listu.');break;}
        const item=material(recordId);if(item&&confirm(`Opravdu odstranit materiál ${item.name}?`)){state.materials=state.materials.filter(value=>value.id!==recordId);state.movements=state.movements.filter(value=>value.materialId!==recordId);log(`Materiál ${item.name} byl odstraněn ze skladu.`,'Sklad');render();notify('Materiál byl odstraněn.');}break;
      }
      case 'delete-attendance': {
        const item=state.attendance.find(value=>value.id===recordId);if(item&&confirm(`Odstranit docházku ${item.employee} z ${dateFmt(item.date)}?`)){state.attendance=state.attendance.filter(value=>value.id!==recordId);log(`Docházkový záznam ${item.id} byl odstraněn.`,'Docházka');render();notify('Docházkový záznam byl odstraněn.');}break;
      }
      case 'delete-delivery': {
        const item=state.deliveries.find(value=>value.id===recordId);if(!item)break;
        const invoice=state.invoices.find(value=>value.deliveryId===recordId);
        const invoiceWarning=invoice?` Navázaná faktura ${invoice.id}${invoice.status==='Uhrazeno'?' je označena jako uhrazená a':''} bude také odstraněna.`:'';
        if(!confirm(`Odstranit dodací list ${recordId} včetně všech jeho položek? Vydané množství se vrátí do skladu.${invoiceWarning}`))break;
        if(invoice?.status==='Uhrazeno'&&!confirm(`Pozor: faktura ${invoice.id} je uhrazena. Opravdu odstranit i tuto fakturu z evidence?`))break;
        for(const line of item.items){const stockItem=material(line.materialId);if(stockItem){stockItem.stock=Number(stockItem.stock)+Number(line.qty);state.movements.unshift({id:id('SM'),materialId:line.materialId,date:day,direction:'in',qty:Number(line.qty),note:`Storno výdeje dodacího listu ${recordId}`});}}
        state.invoices=state.invoices.filter(value=>value.deliveryId!==recordId);
        state.deliveries=state.deliveries.filter(value=>value.id!==recordId);
        log(`Dodací list ${recordId} a jeho položky byly odstraněny; materiál byl vrácen na sklad${invoice?` a faktura ${invoice.id} byla odstraněna`:''}.`,'Doklady');render();notify('Dodací list, jeho položky a případná navázaná faktura byly odstraněny.');break;
      }
      case 'delete-invoice': {
        const item=state.invoices.find(value=>value.id===recordId);if(item&&confirm(`Odstranit fakturu ${recordId}?`)){state.invoices=state.invoices.filter(value=>value.id!==recordId);const delivery=state.deliveries.find(value=>value.id===item.deliveryId);if(delivery)delivery.billed=false;log(`Faktura ${recordId} byla odstraněna.`,'Fakturace');render();notify('Faktura byla odstraněna.');}break;
      }
      case 'delete-request': {
        const item=state.requests.find(value=>value.email===recordId);if(item){state.requests=state.requests.filter(value=>value.email!==recordId);log(`Žádost ${recordId} byla odstraněna.`,'Uživatelé');render();notify('Žádost byla odstraněna.');}break;
      }
      case 'delete-activity': {
        const index=Number(button.dataset.index);if(Number.isInteger(index)&&index>=0&&index<state.activity.length){state.activity.splice(index,1);save();render();notify('Záznam aktivity byl odstraněn.');}break;
      }
      case 'delete-user': {
        const account=state.users.find(item=>item.id===recordId);if(!account)break;
        if(confirm(`Odstranit účet ${account.email}? Jeho přístup bude zrušen.`))window.MLAuth.deleteUser(account.id).then(()=>{state.users=state.users.filter(item=>item.id!==account.id);log(`Účet ${account.email} byl odstraněn.`,'Uživatelé');render();notify('Uživatelský účet byl odstraněn.');}).catch(error=>notify(error.message||'Účet se nepodařilo odstranit.'));
        break;
      }
      case 'mark-paid': {
        const invoice=state.invoices.find(i=>i.id===recordId); if(invoice){invoice.status='Uhrazeno';log(`Faktura ${invoice.id} byla označena jako uhrazená.`,'Fakturace');render();notify('Faktura byla označena jako uhrazená.');} break;
      }
      case 'request-approve': case 'request-reject': {
        const request=state.requests.find(r=>r.email===recordId); if(request){request.status=action==='request-approve'?'Schváleno':'Zamítnuto';log(`Žádost ${request.email} byla ${request.status.toLocaleLowerCase('cs')}.`,'Uživatelé');save();render();notify(`Žádost: ${request.status.toLocaleLowerCase('cs')}.`);} break;
      }
      case 'user-toggle': {
        const user=state.users.find(item=>item.id===recordId); if(user){
          window.MLAuth.setUserActive(user.id,!user.is_active).then(({user:updated})=>{
            Object.assign(user,mapDatabaseUser(updated));
            log(`Účet ${user.email} je nyní ${user.status.toLocaleLowerCase('cs')}.`,'Uživatelé');render();notify('Stav účtu byl změněn.');
          }).catch(error=>notify(error.message||'Stav účtu se nepodařilo změnit.'));
        } break;
      }
      case 'backup': downloadBackup(); break;
      case 'export-projects': exportPageCsv('projects'); break;
      case 'export-materials': exportPageCsv('materials'); break;
      case 'export-deliveries': exportPageCsv('deliveries'); break;
      case 'reset-data': if(confirm('Obnovit ukázková data? Uložené změny v databázi budou nahrazeny ukázkovými daty.')){const users=state.users;state=structuredClone(demo);state.users=users;save();render();notify('Ukázková data byla obnovena.');} break;
    }
  }
  function clockAttendance() {
    const employee=$('#current-user-name')?.textContent||'Správce ML Work';
    const open=state.attendance.find(a=>a.employee===employee&&!a.end);
    if(open){const now=new Date();open.end=now.toTimeString().slice(0,5);open.status='Uzavřeno';log(`${employee} zapsal odchod ze zakázky ${open.projectId}.`,'Docházka');render();notify(`Odchod zapsán v ${open.end}.`);return;}
    if(!state.projects.length){notify('Nejdříve vytvořte zakázku.');return;}
    const p=activeProjects()[0]||state.projects[0],now=new Date(),start=now.toTimeString().slice(0,5);
    state.attendance.unshift({id:id('AT'),date:new Date().toISOString().slice(0,10),employee,projectId:p.id,start,end:'',note:'',status:'Na pracovišti'});
    log(`${employee} zapsal příchod na zakázku ${p.id}.`,'Docházka');render();notify(`Příchod na ${p.id} zapsán v ${start}.`);
  }
  async function handleFormSubmit(event) {
    event.preventDefault();
    const form=event.currentTarget,action=$('[data-submit-action]',form)?.dataset.submitAction, data=serializeForm(form);
    if(action==='save-user'){
      if(state.users.some(u=>u.email.toLowerCase()===data.email.toLowerCase())){notify('Uživatel s tímto e-mailem již existuje.');return;}
      try{
        const {user}=await window.MLAuth.createUser({full_name:data.name,email:data.email,role:data.role,password:data.password});
        state.users.unshift(mapDatabaseUser(user));
        log(`Byl vytvořen účet ${user.full_name} (${window.MLAuth.displayRole(user)}).`,'Uživatelé');
        closeModal();render();notify('Uživatel byl vytvořen a může se přihlásit.');
      }catch(error){notify(error.message||'Uživatele se nepodařilo vytvořit.');}
      return;
    }
    if(action==='save-user-edit'){
      try{
        const previousUser=state.users.find(item=>item.id===data.recordId),previousName=previousUser?.name||'';
        const {user}=await window.MLAuth.updateUser(data.recordId,{full_name:data.name,email:data.email,role:data.role});
        const index=state.users.findIndex(item=>item.id===user.id);if(index>=0)state.users[index]=mapDatabaseUser(user);
        if(previousName&&previousName!==user.full_name){for(const project of state.projects)if(project.manager===previousName)project.manager=user.full_name;for(const attendance of state.attendance)if(attendance.employee===previousName)attendance.employee=user.full_name;}
        log(`Účet ${user.email} byl upraven.`,'Uživatelé');await save();closeModal();render();notify('Uživatelský účet byl upraven.');
      }catch(error){notify(error.message||'Uživatele se nepodařilo upravit.');}
      return;
    }
    if(action==='save-project') {
      const assignedUsers=Array.isArray(data.assignedUsers)?data.assignedUsers:[];
      if(data.recordId){const p=project(data.recordId);Object.assign(p,{name:data.name,client:data.client,address:data.address,manager:data.manager,status:data.status,due:data.due,assignedUsers});log(`Zakázka ${p.id} byla upravena.`,'Zakázky');}
      else {const p={id:nextNumberId('ML-',state.projects),name:data.name,client:data.client,address:data.address,manager:data.manager,status:data.status,due:data.due,assignedUsers};state.projects.unshift(p);log(`Byla vytvořena zakázka ${p.id} – ${p.name}.`,'Zakázky');}
    } else if(action==='save-material') {
      const m={id:data.recordId||id('MAT'),name:data.name,category:data.category,unit:data.unit,stock:Number(data.stock),min:Number(data.min),price:Number(data.price),location:data.location};
      if(data.recordId){const old=material(data.recordId),delta=Number(m.stock)-Number(old.stock);Object.assign(old,m);if(delta)state.movements.unshift({id:id('SM'),materialId:m.id,date:day,direction:delta>0?'in':'out',qty:Math.abs(delta),note:'Úprava stavu při editaci materiálu'});log(`Materiál ${m.name} byl upraven.`,'Sklad');}
      else {state.materials.unshift(m);if(m.stock)state.movements.unshift({id:id('SM'),materialId:m.id,date:day,direction:'in',qty:m.stock,note:'Počáteční stav materiálu'});log(`Do skladu byla přidána položka ${m.name}.`,'Sklad');}
    } else if(action==='save-incoming-receipt') {
      const receiptId=data.receiptId,receipt=state.incomingReceipts.find(item=>item.id===receiptId)||{id:receiptId,source:'manual',attachments:[]};
      if(!['warehouse','project'].includes(data.destination)){notify('Vyberte, zda materiál patří na sklad nebo přímo na zakázku.');return;}
      if(data.destination==='project'&&!project(data.projectId)){notify('Pro přímou dodávku vyberte konkrétní zakázku.');return;}
      const rows=[...form.querySelectorAll('.incoming-item-row')];
      if(!rows.length){notify('Přidejte alespoň jednu položku dodávky.');return;}
      const lines=rows.map(row=>({materialId:row.querySelector('[name="materialId"]').value,name:row.querySelector('[name="name"]').value.trim(),category:row.querySelector('[name="category"]').value.trim()||'Přijaté dodávky',unit:row.querySelector('[name="unit"]').value.trim(),qty:Number(row.querySelector('[name="qty"]').value),purchasePrice:Number(row.querySelector('[name="purchasePrice"]').value||0)}));
      if(lines.some(line=>!line.name||!line.unit||!Number.isFinite(line.qty)||line.qty<=0||!Number.isFinite(line.purchasePrice)||line.purchasePrice<0)){notify('Zkontrolujte názvy, jednotky, množství a nákupní ceny všech položek.');return;}
      const matchingReceipt=state.incomingReceipts.find(item=>item.id!==receiptId&&duplicateKey(data.supplier)&&duplicateKey(data.documentNumber)&&duplicateKey(item.supplier)===duplicateKey(data.supplier)&&duplicateKey(item.documentNumber)===duplicateKey(data.documentNumber));
      if(matchingReceipt&&!receipt.duplicateOf){if(!confirm(`Ve frontě už je příjem ${matchingReceipt.documentNumber||matchingReceipt.id} od stejného dodavatele. Přesto chcete pokračovat?`))return;receipt.duplicateOf=matchingReceipt.id;}
      for(const line of lines){
        let item=line.materialId?material(line.materialId):null;
        if(line.materialId&&!item){notify('Vybraný materiál už v katalogu není. Obnovte formulář a zkuste to znovu.');return;}
        if(!item&&data.destination==='warehouse'){
          item={id:nextNumberId('MAT-',state.materials),name:line.name,category:line.category,unit:line.unit,stock:0,min:0,price:0,location:'Příjem'};
          state.materials.unshift(item);line.materialId=item.id;
        }
        if(item){line.name=item.name;line.category=item.category;line.unit=item.unit;}
        if(data.destination==='warehouse'&&item){item.stock=Number(item.stock)+line.qty;state.movements.unshift({id:id('SM'),materialId:item.id,date:data.date,direction:'in',qty:line.qty,note:`Příjem ${data.documentNumber||receiptId} od ${data.supplier||'dodavatele'}`});}
      }
      Object.assign(receipt,{supplier:data.supplier.trim(),documentNumber:data.documentNumber.trim(),date:data.date,destination:data.destination,projectId:data.destination==='project'?data.projectId:'',note:data.note.trim(),status:'Potvrzeno',items:lines,source:receipt.source||'manual'});
      if(!state.incomingReceipts.some(item=>item.id===receiptId))state.incomingReceipts.unshift(receipt);
      log(`Dodávka ${receipt.documentNumber||receipt.id} byla zařazena ${data.destination==='project'?`na zakázku ${data.projectId}`:'na sklad'}.`,'Příjem materiálu');
    } else if(action==='save-stock') {
      const m=material(data.materialId),qty=Number(data.qty);if(!m||qty<=0){notify('Zkontrolujte materiál a množství.');return;}if(data.direction==='out'&&qty>Number(m.stock)){notify(`Na skladě je pouze ${m.stock} ${m.unit}.`);return;}m.stock=Number(m.stock)+(data.direction==='in'?qty:-qty);state.movements.unshift({id:id('SM'),materialId:m.id,date:day,direction:data.direction==='in'?'in':'out',qty,note:data.note||'Ruční skladový pohyb'});log(`${data.direction==='in'?'Příjem':'Výdej'} ${qty} ${m.unit} materiálu ${m.name}. ${data.note||''}`,'Sklad');
    } else if(action==='save-delivery') {
      const lines=[...form.querySelectorAll('.delivery-item-row')].map(row=>({materialId:row.querySelector('[name="materialId"]').value,qty:Number(row.querySelector('[name="qty"]').value)}));
      const totals=new Map();for(const line of lines){if(!line.qty||line.qty<=0){notify('Zadejte platné množství materiálu.');return;}totals.set(line.materialId,(totals.get(line.materialId)||0)+line.qty);}
      for(const [materialId,qty] of totals){const m=material(materialId);if(!m||qty>Number(m.stock)){notify(`${m?.name||'Materiál'}: na skladě je pouze ${m?.stock||0} ${m?.unit||''}.`);return;}}
      const d={id:nextNumberId('DL-2026-',state.deliveries),date:data.date,projectId:data.projectId,person:data.person,note:data.note,billed:false,items:lines};lines.forEach(line=>material(line.materialId).stock=Number(material(line.materialId).stock)-line.qty);state.deliveries.unshift(d);log(`Byl vytvořen dodací list ${d.id} pro zakázku ${d.projectId}.`,'Doklady');
    } else if(action==='save-delivery-edit') {
      const delivery=state.deliveries.find(item=>item.id===data.recordId);if(!delivery||delivery.billed){notify('Tento dodací list už nelze upravit.');return;}
      const lines=[...form.querySelectorAll('.delivery-item-row')].map(row=>({materialId:row.querySelector('[name="materialId"]').value,qty:Number(row.querySelector('[name="qty"]').value)}));
      const oldTotals=new Map(),newTotals=new Map();for(const line of delivery.items)oldTotals.set(line.materialId,(oldTotals.get(line.materialId)||0)+Number(line.qty));for(const line of lines)newTotals.set(line.materialId,(newTotals.get(line.materialId)||0)+Number(line.qty));
      for(const line of lines){if(!line.qty||line.qty<=0||!material(line.materialId)){notify('Zkontrolujte materiál a jeho množství.');return;}}
      for(const [materialId,qty] of newTotals){const available=Number(material(materialId)?.stock||0)+(oldTotals.get(materialId)||0);if(qty>available){notify(`${material(materialId)?.name||'Materiál'}: množství přesahuje dostupnou zásobu.`);return;}}
      for(const materialId of new Set([...oldTotals.keys(),...newTotals.keys()])){const item=material(materialId);if(item)item.stock=Number(item.stock)+(oldTotals.get(materialId)||0)-(newTotals.get(materialId)||0);}
      Object.assign(delivery,{date:data.date,projectId:data.projectId,person:data.person,note:data.note,items:lines});log(`Dodací list ${delivery.id} byl upraven.`,'Doklady');
    } else if(action==='save-invoice') {
      const d=state.deliveries.find(x=>x.id===data.deliveryId);if(!d){notify('Vyberte dodací list.');return;}if(d.billed){notify('Tento dodací list již byl vyúčtován.');return;}const items=d.items.map(line=>({materialId:line.materialId,name:material(line.materialId)?.name||line.materialId,qty:Number(line.qty),unit:material(line.materialId)?.unit||'ks',unitPrice:Number(material(line.materialId)?.price||0)}));const subtotal=items.reduce((sum,line)=>sum+line.qty*line.unitPrice,0),taxRate=Math.max(0,Math.min(100,Number(state.invoiceTemplate?.vatRate||0))),taxAmount=subtotal*taxRate/100,amount=subtotal+taxAmount;const invoice={id:nextNumberId('FA-2026-',state.invoices),date:data.date,due:data.due,projectId:d.projectId,deliveryId:d.id,status:'Neuhrazeno',items,subtotal,taxRate,taxAmount,amount};state.invoices.unshift(invoice);d.billed=true;log(`Byla vystavena faktura ${invoice.id} k dodacímu listu ${d.id}.`,'Fakturace');
    } else if(action==='save-attendance') {
      const record={id:id('AT'),date:data.date,employee:data.employee,projectId:data.projectId,start:data.start,end:data.end,note:data.note,status:data.end?'Uzavřeno':'Na pracovišti'};if(!data.end&&state.attendance.some(a=>a.employee===record.employee&&!a.end)){notify('Tento pracovník už má otevřený docházkový záznam.');return;}state.attendance.unshift(record);log(`Byla zapsána docházka ${record.employee} na zakázce ${record.projectId}.`,'Docházka');
    } else if(action==='save-attendance-edit') {
      const record=state.attendance.find(item=>item.id===data.recordId);if(!record){notify('Docházkový záznam už neexistuje.');return;}if(!data.end&&state.attendance.some(item=>item.id!==record.id&&item.employee===data.employee&&!item.end)){notify('Tento pracovník už má otevřený docházkový záznam.');return;}Object.assign(record,{date:data.date,employee:data.employee,projectId:data.projectId,start:data.start,end:data.end,note:data.note,status:data.end?'Uzavřeno':'Na pracovišti'});log(`Docházkový záznam ${record.id} byl upraven.`,'Docházka');
    } else if(action==='save-invoice-edit') {
      const invoice=state.invoices.find(item=>item.id===data.recordId);if(!invoice){notify('Faktura už neexistuje.');return;}const total=Math.max(0,Number(data.amount)||0),taxRate=Number(invoice.taxRate||0),subtotal=taxRate?total/(1+taxRate/100):total;Object.assign(invoice,{date:data.date,due:data.due,amount:total,subtotal,taxRate,taxAmount:total-subtotal,status:data.status});log(`Faktura ${invoice.id} byla upravena.`,'Fakturace');
    } else if(action==='save-invoice-template') {
      state.invoiceTemplate={company:data.company.trim(),address:data.address.trim(),ico:data.ico.trim(),dic:data.dic.trim(),bankAccount:data.bankAccount.trim(),dueDays:Math.max(0,Math.min(365,Math.trunc(Number(data.dueDays)||0))),vatRate:Math.max(0,Math.min(100,Number(data.vatRate)||0)),footer:data.footer.trim()};
      log('Předloha faktury byla upravena.','Fakturace');
    }
    const persisted=await save();closeModal();render();notify(persisted?'Změny byly uloženy do databáze.':'Databáze zápis nepotvrdila; změny se neuložily.');
  }
  function downloadBackup() {
    const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ml-work-zaloha.json';a.click();URL.revokeObjectURL(url);notify('Záloha dat byla stažena.');
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-page]');
    if(nav){document.body.classList.remove('sidebar-open');return;}
    const jump=event.target.closest('[data-navigate]');
    if(jump){location.hash=`#${jump.dataset.navigate}`;return;}
    const actionButton=event.target.closest('[data-action]');
    if(actionButton){onAction(actionButton.dataset.action,actionButton);return;}
    if(event.target.closest('#menu-toggle')) document.body.classList.toggle('sidebar-open');
    if(event.target.closest('#profile-menu')) {
      if(window.MLAuth?.configured) window.MLAuth.signOut();
      else notify('Ukázkový režim: odhlášení se aktivuje po připojení přihlašovací služby.');
    }
    if(event.target.closest('#notification-button')) notify(`${lowStock().length} položek pod minimální zásobou · ${state.invoices.filter(item=>item.status!=='Uhrazeno').length} neuhrazených faktur`);
  });
  document.addEventListener('change',event=>{
    const materialSelect=event.target.closest('.incoming-item-row select[name="materialId"]');
    if(materialSelect?.value){const item=material(materialSelect.value),row=materialSelect.closest('.incoming-item-row');if(item&&row){row.querySelector('[name="name"]').value=item.name;row.querySelector('[name="category"]').value=item.category;row.querySelector('[name="unit"]').value=item.unit;}}
    const input=event.target.closest('[data-csv-input]');if(input?.files?.[0])importCsvFile(input.dataset.csvInput,input.files[0]);
  });
  $('#modal-form').addEventListener('submit',handleFormSubmit);
  $('#app-modal').addEventListener('click',event=>{if(event.target===$('#app-modal'))closeModal();});
  window.addEventListener('hashchange',render);
  if(window.MLAuth?.configured){
    window.MLAuth.guard('admin').then(async access=>{
      if(!access)return;
      const profile=access.profile;
      if(profile){
        const name=profile.full_name||access.user.email;
        $('#current-user-name').textContent=name;
        $('#current-user-role').textContent=profile.role;
        const userInitials=name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
        $('#current-user-initials').textContent=userInitials;
        $('#top-user-initials').textContent=userInitials;
      }
      try{await loadDatabaseState();try{mailStatus=await window.MLAuth.mailStatus();}catch{}render();}
      catch(error){notify(`Data z databáze se nepodařilo načíst: ${error.message}`);}
      window.setInterval(refreshEmployeeRecords,5000);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshEmployeeRecords();});
      window.addEventListener('focus',refreshEmployeeRecords);
    });
  } else render();
})();
