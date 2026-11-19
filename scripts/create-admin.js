'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const envPath=path.join(__dirname,'..','.env');
if(fs.existsSync(envPath))process.loadEnvFile(envPath);

const email=String(process.env.INITIAL_ADMIN_EMAIL||'pmagusin@seznam.cz').trim().toLowerCase();
const name=String(process.env.INITIAL_ADMIN_NAME||'Správce ML Work').trim();
const password=String(process.env.INITIAL_ADMIN_PASSWORD||'');
if(!email||!password){console.error('Doplňte INITIAL_ADMIN_EMAIL a INITIAL_ADMIN_PASSWORD do .env. Heslo nikdy nevkládejte do zdrojových souborů.');process.exit(1);}
if(password.length<8){console.error('Pro účet správce nastavte jedinečné heslo o délce alespoň 8 znaků.');process.exit(1);}

const {query,close}=require('../database/connection');
(async()=>{
  try{
    const salt=crypto.randomBytes(16);
    const derived=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
    const passwordHash=`scrypt$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`;
    const result=await query(`INSERT INTO app_users(id,email,full_name,role,password_hash,is_active)
      VALUES($1,$2,$3,'admin',$4,1) ON CONFLICT DO NOTHING RETURNING id,email,role`,[crypto.randomUUID(),email,name,passwordHash]);
    if(result.rowCount){console.log(`Účet správce ${result.rows[0].email} byl vytvořen.`);return;}
    const existing=await query('SELECT email,role FROM app_users WHERE lower(email)=lower($1) LIMIT 1',[email]);
    if(existing.rows[0]?.role==='admin')console.log(`Účet správce ${email} již existuje; heslo nebylo změněno.`);
    else throw new Error(`E-mail ${email} již patří jinému účtu. Změňte INITIAL_ADMIN_EMAIL nebo upravte roli v administraci.`);
  }catch(error){console.error(`Vytvoření správce selhalo: ${error.message||String(error)}`);process.exitCode=1;}
  finally{close();}
})();
