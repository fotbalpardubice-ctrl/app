'use strict';

const fs=require('node:fs');
const path=require('node:path');
const envPath=path.join(__dirname,'..','.env');
if(fs.existsSync(envPath))process.loadEnvFile(envPath);
const {databasePath,close}=require('../database/connection');

try{
  console.log(`SQLite databáze je připravená: ${databasePath}`);
}catch(error){
  console.error(`Inicializace databáze selhala: ${error.message||String(error)}`);
  process.exitCode=1;
}finally{
  close();
}
