(() => {
  'use strict';
  const roleNames={admin:'Administrátor',project_manager:'Projektový manažer',foreman:'Vedoucí montáže',technician:'Technik',office:'Administrativa',employee:'Zaměstnanec'};
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
    let data={};try{data=await response.json();}catch{}
    if(!response.ok)throw new Error(data.error||'Služba není dostupná.');
    return data;
  }
  async function health(){try{return (await request('./api/health')).ok===true;}catch{return false;}}
  async function signIn(email,password){
    const data=await request('./api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    return data.user;
  }
  async function currentSession(){return request('./api/auth/session');}
  async function adminState(){return request('./api/admin/state');}
  async function employeeSummary(){return request('./api/employee/summary');}
  async function clockAttendance(action,projectId){return request('./api/employee/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,projectId})});}
  async function saveAdminState(state,revision){return request('./api/admin/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state,revision})});}
  async function createUser(user){return request('./api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(user)});}
  async function setUserActive(id,is_active){return request(`./api/admin/users/${encodeURIComponent(id)}/active`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active})});}
  async function deleteUser(id){return request(`./api/admin/users/${encodeURIComponent(id)}`,{method:'DELETE'});}
  async function updateUser(id,user){return request(`./api/admin/users/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(user)});}
  async function mailStatus(){return request('./api/admin/mail/status');}
  async function syncMail(){return request('./api/admin/mail/sync',{method:'POST'});}
  async function uploadIncomingFile(file){
    const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
    for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));
    return request('./api/admin/incoming/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,data:btoa(binary)})});
  }
  const isAdmin=(user)=>user?.role==='admin';
  const displayRole=(user)=>roleNames[user?.role]||user?.role||'Zaměstnanec';
  async function guard(expectedRole){
    let session;
    try{session=await currentSession();}catch{location.replace('./login.html');return null;}
    if(!session.authenticated||!session.user){location.replace('./login.html');return null;}
    if(expectedRole==='admin'&&!isAdmin(session.user)){location.replace('./zamestnanec.html');return null;}
    if(expectedRole==='employee'&&isAdmin(session.user)){location.replace('./admin.html');return null;}
    return {allowed:true,user:session.user,profile:{...session.user,role:displayRole(session.user)}};
  }
  async function signOut(){try{await request('./api/auth/logout',{method:'POST'});}finally{location.replace('./login.html');}}
  window.MLAuth={configured:true,health,signIn,currentSession,employeeSummary,clockAttendance,adminState,saveAdminState,createUser,setUserActive,deleteUser,updateUser,mailStatus,syncMail,uploadIncomingFile,guard,signOut,isAdmin,displayRole};
})();
