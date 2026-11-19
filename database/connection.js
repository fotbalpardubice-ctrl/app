'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');

const root=path.resolve(__dirname,'..');
const databasePath=path.resolve(root,process.env.SQLITE_FILE||'.data/ml-work.sqlite');
fs.mkdirSync(path.dirname(databasePath),{recursive:true});

const database=new DatabaseSync(databasePath,{timeout:5000});
database.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
database.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
const stockMovementColumns=database.prepare('PRAGMA table_info(stock_movements)').all();
if(!stockMovementColumns.some(column=>column.name==='direction'))
  database.exec("ALTER TABLE stock_movements ADD COLUMN direction TEXT NOT NULL DEFAULT 'in' CHECK (direction IN ('in','out'))");
const appUserColumns=database.prepare('PRAGMA table_info(app_users)').all();
if(!appUserColumns.some(column=>column.name==='phone'))
  database.exec("ALTER TABLE app_users ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
if(!appUserColumns.some(column=>column.name==='hourly_rate'))
  database.exec('ALTER TABLE app_users ADD COLUMN hourly_rate REAL NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0)');
const projectAssignmentColumns=database.prepare('PRAGMA table_info(project_assignments)').all();
if(!projectAssignmentColumns.some(column=>column.name==='hourly_rate'))
  database.exec('ALTER TABLE project_assignments ADD COLUMN hourly_rate REAL NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0)');
const materialColumns=database.prepare('PRAGMA table_info(materials)').all();
if(!materialColumns.some(column=>column.name==='purchase_unit_price'))
  database.exec('ALTER TABLE materials ADD COLUMN purchase_unit_price REAL NOT NULL DEFAULT 0 CHECK (purchase_unit_price >= 0)');

function normalizeParameter(value){
  if(value instanceof Date)return value.getTime();
  if(typeof value==='boolean')return value?1:0;
  return value;
}

function query(sql,parameters=[]){
  const statementSql=sql.replace(/\$\d+/g,'?');
  const statement=database.prepare(statementSql);
  const values=parameters.map(normalizeParameter);
  if(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(statementSql)||/\bRETURNING\b/i.test(statementSql)){
    const rows=statement.all(...values);
    return Promise.resolve({rows,rowCount:rows.length});
  }
  const result=statement.run(...values);
  return Promise.resolve({rows:[],rowCount:Number(result.changes),lastInsertRowid:result.lastInsertRowid});
}

function close(){if(database.isOpen)database.close();}

module.exports={database,databasePath,query,close};
