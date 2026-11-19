(() => {
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let access=null,summary={projects:[],attendance:[],activeAttendance:null},busy=false;
  let activeView='attendance';
  const dateLabel=value=>value?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`)):'—';
  const hoursBetween=(start,end)=>{if(!start||!end)return 0;const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);return Math.max(0,(eh*60+em-sh*60-sm)/60);};
  const projectName=id=>summary.projects.find(project=>project.id===id)?.name||id||'—';
  function message(text='',success=false){const target=$('#employee-message');target.textContent=text;target.classList.toggle('employee-message--success',success);}
  function renderAttendance(){
    const active=summary.activeAttendance;
    const clockableProjects=summary.projects.filter(project=>!['Dokončeno','Pozastaveno'].includes(project.status));
    const history=[...summary.attendance].sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
    const rows=history.map(item=>`<tr><td>${dateLabel(item.date)}</td><td>${esc(projectName(item.projectId))}</td><td>${esc(item.start||'—')}</td><td>${esc(item.end||'—')}</td><td>${item.end?`${hoursBetween(item.start,item.end).toFixed(1)} h`:'Probíhá'}</td></tr>`).join('');
    const projectOptions=`<option value="" selected disabled>Vyberte přiřazenou zakázku</option>${clockableProjects.map(project=>`<option value="${esc(project.id)}">${esc(project.id)} · ${esc(project.name)}</option>`).join('')}`;
    $('#attendance-view').innerHTML=`
      <div class="clock-panel">
        <h2 style="margin:0;font-size:19px">Zaznamenejte pracovní dobu</h2>
        <p style="margin:7px 0 0;color:#68778e;font-size:13px">Při příchodu vyberete zakázku, na které dnes pracujete.</p>
        <div class="clock-actions">
          <button class="clock-button" type="button" data-clock="in" ${busy||active||!clockableProjects.length?'disabled':''}>Zadat příchod</button>
          <button class="clock-button clock-button--out" type="button" data-clock="out" ${busy||!active?'disabled':''}>Zadat odchod</button>
        </div>
        <div class="shift-state ${active?'shift-state--active':''}">${active?`Příchod zaznamenán ${dateLabel(active.date)} v ${esc(active.start)} · ${esc(projectName(active.projectId))}. Směnu ukončíte tlačítkem „Zadat odchod“.`:clockableProjects.length?'Zatím nemáte otevřenou směnu.':'Nemáte přiřazenou aktivní zakázku. Obraťte se na správce.'}</div>
        <form class="project-picker" id="project-picker" ${active||!clockableProjects.length?'hidden':''}>
          <div class="field"><label for="attendance-project">Na jaké zakázce pracujete?</label><select id="attendance-project" name="projectId" required>${projectOptions}</select></div>
          <button type="submit" ${busy?'disabled':''}>Potvrdit příchod</button>
        </form>
      </div>
      <h2 class="history-heading">Moje docházka</h2>
      <div class="history-wrap"><table class="history"><thead><tr><th>DATUM</th><th>ZAKÁZKA</th><th>PŘÍCHOD</th><th>ODCHOD</th><th>ČAS</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty-state">Zatím tu nejsou žádné docházkové záznamy.</td></tr>'}</tbody></table></div>`;
    $('[data-clock="in"]',$('#attendance-view'))?.addEventListener('click',()=>{
      const form=$('#project-picker');if(form)form.hidden=false;
      $('#attendance-project')?.focus();
    });
    $('[data-clock="out"]',$('#attendance-view'))?.addEventListener('click',()=>submitPunch('clock_out'));
    $('#project-picker')?.addEventListener('submit',event=>{event.preventDefault();submitPunch('clock_in',$('#attendance-project').value);});
  }
  function renderProjects(){
    const cards=summary.projects.map(project=>`<article class="project-card"><h2>${esc(project.name)}</h2><p><b>${esc(project.id)}</b> · ${esc(project.client||'')}</p><p>${esc(project.address||'')}</p><p>Odpovědná osoba: ${esc(project.manager||'—')}</p>${project.due?`<p>Termín: ${dateLabel(project.due)}</p>`:''}<span class="project-status">${esc(project.status||'Přiřazeno')}</span></article>`).join('');
    $('#projects-view').innerHTML=`<div class="project-grid">${cards||'<div class="empty-state">Zatím nemáte přiřazenou žádnou zakázku. Přiřazení nastaví správce.</div>'}</div>`;
  }
  function render(){
    $('#attendance-view').hidden=activeView!=='attendance';$('#projects-view').hidden=activeView!=='projects';
    document.querySelectorAll('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===activeView));
    renderAttendance();renderProjects();
  }
  async function refresh(){
    summary=await window.MLAuth.employeeSummary();
    $('#employee-title').textContent=`Dobrý den, ${summary.user.full_name||summary.user.email}`;
    $('#employee-intro').textContent=`Přihlášeno jako ${summary.user.email}. Vaše role: ${window.MLAuth.displayRole(summary.user)}.`;
    $('#role-label').textContent=window.MLAuth.displayRole(summary.user);
    render();
  }
  async function submitPunch(action,projectId=''){
    if(busy)return;
    busy=true;message('Ukládám docházku…');render();
    try{await window.MLAuth.clockAttendance(action,projectId);await refresh();message(action==='clock_in'?'Příchod byl uložen.':'Odchod byl uložen.',true);}
    catch(error){busy=false;render();message(error.message||'Docházku se nepodařilo uložit.');return;}
    busy=false;render();
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{activeView=button.dataset.view;message('');render();}));
  $('#sign-out').addEventListener('click',()=>window.MLAuth.signOut());
  (async()=>{
    const result=await window.MLAuth.guard('employee');if(!result)return;access=result;
    try{await refresh();}catch(error){message(error.message||'Docházku se nepodařilo načíst.');}
  })();
})();
