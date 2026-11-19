(() => {
  'use strict';
  const form=document.getElementById('login-form');
  const message=document.getElementById('message');
  const info=document.getElementById('config-message');
  const submit=document.getElementById('submit-login');
  const showMessage=(text,kind='error')=>{message.textContent=text;message.className=`message message--${kind} show`;};
  async function directSignIn(email,password){
    const response=await fetch('./api/auth/login',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    let data={};try{data=await response.json();}catch{}
    if(!response.ok)throw new Error(data.error||'Služba není dostupná.');
    return data.user;
  }
  window.MLAuth.health().then(available=>{
    if(!available){
      info.hidden=false;
      info.textContent='Místní databáze není dostupná. Zkontrolujte, že je spuštěná aplikace ML Work.';
    }
  });
  document.querySelector('[data-toggle="password"]').addEventListener('click',event=>{
    const button=event.currentTarget,input=document.getElementById(button.dataset.toggle);
    input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'Zobrazit':'Skrýt';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    submit.disabled=true;submit.textContent='Ověřuji účet…';message.className='message';
    try{
      const signIn=typeof window.MLAuth?.signIn==='function'?window.MLAuth.signIn:directSignIn;
      const user=await signIn(form.elements.email.value.trim(),form.elements.password.value);
      const isAdmin=typeof window.MLAuth?.isAdmin==='function'?window.MLAuth.isAdmin(user):user?.role==='admin';
      location.replace(isAdmin?'./admin.html':'./zamestnanec.html');
    }catch(error){showMessage(error.message||'E-mail nebo heslo nesouhlasí.');}
    finally{submit.disabled=false;submit.textContent='Přihlásit se';}
  });
  document.getElementById('forgot').addEventListener('click',async()=>{
    const email=document.getElementById('email').value.trim();
    if(!email){showMessage('Nejprve zadejte firemní e-mail.','info');document.getElementById('email').focus();return;}
    showMessage('Obnovu hesla zatím spravuje administrátor.','info');
  });
})();
