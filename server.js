'use strict';

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {promisify} = require('node:util');
const {ImapFlow}=require('imapflow');
const {simpleParser}=require('mailparser');

const scrypt = promisify(crypto.scrypt);
const root = __dirname;
const cookieName = 'ml_work_session';
const sessionHours = 12;
function loadEnv() {
  const file=path.join(root,'.env');
  if(!fs.existsSync(file))return;
  for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const match=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if(!match||process.env[match[1]]!==undefined)continue;
    let value=match[2].trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    process.env[match[1]]=value;
  }
}
loadEnv();
const port = Number(process.env.PORT || 4173);
const {database,query:dbQuery,close:closeDatabase}=require('./database/connection');
const attempts = new Map();
const incomingFilesPath=path.join(root,'.data','incoming-receipts');
const mailStatus={lastSyncAt:null,lastError:'',lastImported:0,running:false};
let mailSyncPromise=null;
const defaultInvoiceTemplate={company:'ML Work',address:'',ico:'',dic:'',bankAccount:'',dueDays:14,vatRate:0,footer:'Děkujeme za spolupráci.'};
const publicFiles = new Set([
  'login.html','login.js','auth-client.js','auth-pages.css',
  'zamestnanec.html','employee-app.js','admin.html','admin-app.js','admin-ui.css','logo.svg'
]);

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function securityHeaders(res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}
function json(res,status,payload,extraHeaders={}){
  securityHeaders(res);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extraHeaders});res.end(JSON.stringify(payload));
}
function parseCookies(header=''){
  const result={};
  for(const part of header.split(';')){const index=part.indexOf('=');if(index<0)continue;const key=part.slice(0,index).trim();try{result[key]=decodeURIComponent(part.slice(index+1).trim());}catch{}}
  return result;
}
function tokenDigest(token){return crypto.createHash('sha256').update(token).digest('hex');}
function sessionCookie(token,maxAge){
  const secure=process.env.COOKIE_SECURE==='1'||process.env.NODE_ENV==='production';
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
}
function requestOrigin(req){
  if(process.env.PUBLIC_ORIGIN)return process.env.PUBLIC_ORIGIN;
  const protocol=req.socket.encrypted?'https':'http';
  return `${protocol}://${req.headers.host||''}`;
}
function originAllowed(req){
  const origin=req.headers.origin;
  return !origin||origin===requestOrigin(req);
}
async function bodyJson(req,maxBytes=16384){
  let body='';
  for await(const chunk of req){body+=chunk;if(body.length>maxBytes)throw Object.assign(new Error('Příliš velký požadavek.'),{status:413});}
  try{return JSON.parse(body||'{}');}catch{throw Object.assign(new Error('Neplatný JSON požadavek.'),{status:400});}
}
function clientIp(req){return req.socket.remoteAddress||'unknown';}
function limited(key){
  const now=Date.now();
  if(attempts.size>=5000)for(const [candidate,entry] of attempts){if(entry.until<=now)attempts.delete(candidate);}
  if(attempts.size>=10000&&!attempts.has(key))return true;
  const entry=attempts.get(key);
  if(!entry||entry.until<=now){attempts.set(key,{count:1,until:now+15*60*1000});return false;}
  entry.count+=1;return entry.count>8;
}
function clearAttempts(key){attempts.delete(key);}
async function verifyPassword(password,stored){
  const [scheme,saltText,keyText]=String(stored||'').split('$');
  if(scheme!=='scrypt'||!saltText||!keyText)return false;
  if(!/^[a-f\d]{32}$/i.test(saltText)||!/^[a-f\d]{128}$/i.test(keyText))return false;
  const expected=Buffer.from(keyText,'hex');
  const actual=await scrypt(password,Buffer.from(saltText,'hex'),expected.length,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
async function sessionUser(req){
  const token=parseCookies(req.headers.cookie)[cookieName];
  if(!token||token.length<40)return null;
  const {rows}=await dbQuery(`
    SELECT u.id,u.email,u.full_name,u.role,u.is_active,s.token_hash
    FROM app_sessions s JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>(CAST(strftime('%s','now') AS INTEGER)*1000) AND u.is_active=1
  `,[tokenDigest(token)]);
  return rows[0]||null;
}
function safeUser(user){return {id:user.id,email:user.email,full_name:user.full_name,role:user.role};}
const userRoles=new Set(['project_manager','foreman','technician','office','employee']);
function adminUserView(user){return {id:user.id,email:user.email,full_name:user.full_name,role:user.role,is_active:user.is_active};}
async function requireAdmin(req,res){
  const user=await sessionUser(req);
  if(!user){json(res,401,{error:'Přihlášení vypršelo. Přihlaste se znovu.'});return null;}
  if(user.role!=='admin'){json(res,403,{error:'Tato akce je dostupná pouze správci.'});return null;}
  return user;
}
function dateTimestamp(value){
  const text=String(value||'');
  const parsed=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text)?`${text}T12:00:00Z`:text);
  return Number.isFinite(parsed)?parsed:Date.now();
}
function pragueClock(){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
function safeText(value,fallback=''){return value===null||value===undefined?fallback:String(value);}
function safeNumber(value,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback;}
function writeBusinessTables(state,actorId){
  const deleteTables=['activity_log','invoices','attendance','supplier_receipt_items','supplier_receipts','delivery_items','delivery_notes','stock_movements','project_assignments','access_requests','projects','materials','clients'];
  for(const table of deleteTables)database.prepare(`DELETE FROM ${table}`).run();

  const users=database.prepare('SELECT id,full_name,email FROM app_users').all();
  const userByName=new Map(users.map(user=>[user.full_name.trim().toLocaleLowerCase('cs'),user.id]));
  const clients=new Map();
  for(const item of state.projects){
    const name=safeText(item.client,'Neznámý zákazník').trim()||'Neznámý zákazník';
    const key=name.toLocaleLowerCase('cs');
    if(!clients.has(key))clients.set(key,{id:`client-${crypto.createHash('sha256').update(key).digest('hex').slice(0,24)}`,name});
  }
  const insertClient=database.prepare('INSERT INTO clients(id,name) VALUES(?,?)');
  for(const client of clients.values())insertClient.run(client.id,client.name);
  const clientIdByName=new Map([...clients].map(([key,client])=>[key,client.id]));

  const validProjectStatuses=new Set(['Probíhá','Čeká na zahájení','Dokončeno','Pozastaveno']);
  const insertProject=database.prepare(`INSERT INTO projects(id,name,client_id,client_name,address,manager_id,manager_name,status,due_on)
    VALUES(?,?,?,?,?,?,?,?,?)`);
  for(const item of state.projects){
    const client=safeText(item.client,'Neznámý zákazník').trim()||'Neznámý zákazník';
    const manager=safeText(item.manager);
    const status=validProjectStatuses.has(item.status)?item.status:'Čeká na zahájení';
    insertProject.run(safeText(item.id),safeText(item.name),clientIdByName.get(client.toLocaleLowerCase('cs'))||null,client,
      safeText(item.address),userByName.get(manager.trim().toLocaleLowerCase('cs'))||null,manager,status,item.due||null);
  }
  const validUserIds=new Set(users.map(user=>user.id));
  const insertAssignment=database.prepare('INSERT OR IGNORE INTO project_assignments(project_id,user_id,assigned_by) VALUES(?,?,?)');
  for(const item of state.projects){
    for(const userId of Array.isArray(item.assignedUsers)?new Set(item.assignedUsers):[])
      if(validUserIds.has(userId))insertAssignment.run(safeText(item.id),userId,actorId);
  }
  const insertMaterial=database.prepare(`INSERT INTO materials(id,name,category,unit,stock,minimum_stock,unit_price,location)
    VALUES(?,?,?,?,?,?,?,?)`);
  for(const item of state.materials){
    insertMaterial.run(safeText(item.id),safeText(item.name),safeText(item.category,'Ostatní'),safeText(item.unit,'ks'),
      Math.max(0,safeNumber(item.stock)),Math.max(0,safeNumber(item.min)),Math.max(0,safeNumber(item.price)),safeText(item.location));
  }

  const insertDelivery=database.prepare(`INSERT INTO delivery_notes(id,project_id,delivery_date,issued_by,received_by,note,status)
    VALUES(?,?,?,?,?,?,?)`);
  const insertDeliveryItem=database.prepare(`INSERT INTO delivery_items(id,delivery_note_id,material_id,quantity,unit_price)
    VALUES(?,?,?,?,?)`);
  const insertMovement=database.prepare(`INSERT INTO stock_movements(id,material_id,project_id,movement_type,direction,quantity,note,created_by,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`);
  const materialById=new Map(state.materials.map(item=>[item.id,item]));
  const projectIds=new Set(state.projects.map(item=>item.id));
  const deliveriesById=new Map();
  for(const delivery of state.deliveries){
    const projectId=safeText(delivery.projectId);
    insertDelivery.run(safeText(delivery.id),projectId,safeText(delivery.date,new Date().toISOString().slice(0,10)),actorId,
      safeText(delivery.person),safeText(delivery.note),'Vydáno');
    deliveriesById.set(delivery.id,delivery);
    const itemTotals=new Map();
    for(const line of Array.isArray(delivery.items)?delivery.items:[]){
      const materialId=safeText(line.materialId);
      itemTotals.set(materialId,(itemTotals.get(materialId)||0)+safeNumber(line.qty));
    }
    for(const [materialId,quantity] of itemTotals){
      const material=materialById.get(materialId);
      insertDeliveryItem.run(`${delivery.id}:${materialId}`,safeText(delivery.id),materialId,quantity,Math.max(0,safeNumber(material?.price)));
      insertMovement.run(`delivery:${delivery.id}:${materialId}`,materialId,projectId,'delivery','out',quantity,
        safeText(delivery.note),actorId,dateTimestamp(delivery.date));
    }
  }
  for(const movement of Array.isArray(state.movements)?state.movements:[]){
    const direction=movement.direction==='out'?'out':'in';
    insertMovement.run(safeText(movement.id,crypto.randomUUID()),safeText(movement.materialId),movement.projectId||null,
      direction==='in'?'receipt':'adjustment',direction,Math.max(0.000001,safeNumber(movement.qty)),safeText(movement.note),actorId,dateTimestamp(movement.date));
  }

  const insertInvoice=database.prepare(`INSERT INTO invoices(id,delivery_note_id,project_id,issued_on,due_on,status,subtotal,tax_rate,tax_amount,total,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
  for(const invoice of state.invoices){
    const subtotal=Math.max(0,safeNumber(invoice.subtotal,safeNumber(invoice.amount)));
    const taxRate=Math.min(100,Math.max(0,safeNumber(invoice.taxRate)));
    const taxAmount=Math.max(0,safeNumber(invoice.taxAmount,subtotal*taxRate/100));
    const total=Math.max(0,safeNumber(invoice.amount,subtotal+taxAmount));
    insertInvoice.run(safeText(invoice.id),safeText(invoice.deliveryId),safeText(invoice.projectId),safeText(invoice.date,new Date().toISOString().slice(0,10)),
      safeText(invoice.due,invoice.date||new Date().toISOString().slice(0,10)),invoice.status==='Uhrazeno'?'Uhrazeno':'Neuhrazeno',subtotal,taxRate,taxAmount,total,actorId);
  }

  const insertSupplierReceipt=database.prepare(`INSERT INTO supplier_receipts(id,supplier,supplier_document_number,received_on,destination,project_id,status,source,source_email_id,source_email_from,source_email_subject,source_email_date,note,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertSupplierReceiptItem=database.prepare(`INSERT INTO supplier_receipt_items(id,supplier_receipt_id,material_id,material_name,category,unit,quantity,purchase_unit_price)
    VALUES(?,?,?,?,?,?,?,?)`);
  const validMaterialIds=new Set(state.materials.map(item=>item.id));
  for(const receipt of Array.isArray(state.incomingReceipts)?state.incomingReceipts:[]){
    const destination=['warehouse','project'].includes(receipt.destination)?receipt.destination:'pending';
    const status=['Potvrzeno','Ignorováno'].includes(receipt.status)?receipt.status:'Čeká na kontrolu';
    const projectId=destination==='project'&&projectIds.has(receipt.projectId)?receipt.projectId:null;
    insertSupplierReceipt.run(safeText(receipt.id),safeText(receipt.supplier),safeText(receipt.documentNumber),safeText(receipt.date,new Date().toISOString().slice(0,10)),
      destination,projectId,status,receipt.source==='email'?'email':'manual',receipt.source==='email'?(safeText(receipt.sourceKey||receipt.emailMessageId)||null):null,
      safeText(receipt.emailFrom),safeText(receipt.emailSubject),receipt.emailDate||null,safeText(receipt.note),actorId);
    for(const [index,line] of (Array.isArray(receipt.items)?receipt.items:[]).entries()){
      const quantity=safeNumber(line.qty);
      if(quantity<=0)continue;
      const materialId=validMaterialIds.has(line.materialId)?line.materialId:null;
      insertSupplierReceiptItem.run(`${receipt.id}:${index}`,safeText(receipt.id),materialId,safeText(line.name,'Materiál'),safeText(line.category,'Přijaté dodávky'),
        safeText(line.unit,'ks'),quantity,Math.max(0,safeNumber(line.purchasePrice)));
    }
  }

  const insertAttendance=database.prepare(`INSERT INTO attendance(id,user_id,employee_name,project_id,work_date,clock_in,clock_out,note,created_by)
    VALUES(?,?,?,?,?,?,?,?,?)`);
  for(const item of state.attendance){
    const employee=safeText(item.employee);
    insertAttendance.run(safeText(item.id),users.some(user=>user.id===item.userId)?item.userId:(userByName.get(employee.trim().toLocaleLowerCase('cs'))||null),employee,safeText(item.projectId),
      safeText(item.date,new Date().toISOString().slice(0,10)),safeText(item.start,'08:00'),item.end||null,safeText(item.note),actorId);
  }

  const insertRequest=database.prepare(`INSERT INTO access_requests(id,email,full_name,requested_role,status,created_at,reviewed_by,reviewed_at)
    VALUES(?,?,?,?,?,?,?,?)`);
  for(const item of state.requests){
    const email=safeText(item.email).trim().toLocaleLowerCase('cs');
    insertRequest.run(`request-${crypto.createHash('sha256').update(email).digest('hex').slice(0,24)}`,email,safeText(item.name),
      safeText(item.role,'Zaměstnanec'),['Nová','Schváleno','Zamítnuto'].includes(item.status)?item.status:'Nová',dateTimestamp(item.date),
      item.status==='Nová'?null:actorId,item.status==='Nová'?null:dateTimestamp(item.date));
  }

  const insertActivity=database.prepare(`INSERT INTO activity_log(actor_id,project_id,event_type,description,created_at) VALUES(?,?,?,?,?)`);
  for(const item of state.activity){
    const description=safeText(item.text);
    const projectId=description.match(/\bML-\d+\b/)?.[0]||null;
    insertActivity.run(actorId,projectIds.has(projectId)?projectId:null,safeText(item.kind,'Změna'),description,dateTimestamp(item.date));
  }
}
function migrateStoredStateToTables(){
  const saved=database.prepare("SELECT payload,updated_by FROM app_state WHERE state_key='main'").get();
  if(!saved?.payload)return;
  const counts=database.prepare(`SELECT
    (SELECT COUNT(*) FROM clients)+(SELECT COUNT(*) FROM projects)+(SELECT COUNT(*) FROM materials)+
    (SELECT COUNT(*) FROM stock_movements)+(SELECT COUNT(*) FROM delivery_notes)+(SELECT COUNT(*) FROM invoices)+
    (SELECT COUNT(*) FROM attendance)+(SELECT COUNT(*) FROM access_requests)+(SELECT COUNT(*) FROM activity_log) AS total`).get();
  if(Number(counts?.total||0)>0)return;
  let state;try{state=JSON.parse(saved.payload);}catch{return;}
  if(!state||typeof state!=='object'||Array.isArray(state))return;
  const keys=['projects','materials','deliveries','invoices','attendance','requests','activity','movements','incomingReceipts'];
  for(const key of keys)if(!Array.isArray(state[key]))state[key]=[];
  state.invoiceTemplate={company:'ML Work',address:'',ico:'',dic:'',bankAccount:'',dueDays:14,vatRate:0,footer:'Děkujeme za spolupráci.',...(state.invoiceTemplate||{})};
  database.exec('BEGIN IMMEDIATE');
  try{writeBusinessTables(state,saved.updated_by||null);database.exec('COMMIT');}
  catch(error){try{database.exec('ROLLBACK');}catch{};console.error('Převod uložených dat do tabulek se nepodařil:',error.message||String(error));}
}
migrateStoredStateToTables();
async function handleAdminState(req,res){
  const user=await requireAdmin(req,res);if(!user)return;
  if(req.method==='GET'){
    const [stateResult,usersResult]=await Promise.all([
      dbQuery("SELECT payload,revision FROM app_state WHERE state_key='main'"),
      dbQuery('SELECT id,email,full_name,role,is_active FROM app_users ORDER BY created_at,id')
    ]);
    const row=stateResult.rows[0];
    let storedState=null;
    if(row?.payload){try{storedState=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;}catch{return json(res,500,{error:'Data uložená v databázi nejsou platná.'});}}
    return json(res,200,{state:storedState,revision:Number(row?.revision||0),users:usersResult.rows.map(adminUserView)});
  }
  if(req.method!=='PUT')return json(res,405,{error:'Nepodporovaná metoda.'},{Allow:'GET, PUT'});
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  let input;try{input=await bodyJson(req,2_000_000);}catch(error){return json(res,error.status||400,{error:error.message});}
  const revision=Number(input.revision),state=input.state;
  const stateKeys=['projects','materials','deliveries','invoices','attendance','requests','activity','movements','incomingReceipts'];
  if(!Number.isSafeInteger(revision)||revision<0||!state||typeof state!=='object'||Array.isArray(state)||stateKeys.some(key=>!Array.isArray(state[key])))
    return json(res,400,{error:'Data přehledu nemají očekávaný formát.'});
  const payload=Object.fromEntries(stateKeys.map(key=>[key,state[key]]));
  payload.invoiceTemplate={company:'ML Work',address:'',ico:'',dic:'',bankAccount:'',dueDays:14,vatRate:0,footer:'Děkujeme za spolupráci.',...(state.invoiceTemplate&&typeof state.invoiceTemplate==='object'?state.invoiceTemplate:{})};
  database.exec('BEGIN IMMEDIATE');
  let previousState=null;
  try{
    const current=database.prepare("SELECT revision,payload FROM app_state WHERE state_key='main'").get();
    if((current?Number(current.revision):0)!==revision){database.exec('ROLLBACK');return json(res,409,{error:'Data změnil jiný uživatel. Obnovte stránku a zkuste to znovu.'});}
    if(current?.payload){try{previousState=JSON.parse(current.payload);}catch{previousState=null;}}
    writeBusinessTables(payload,user.id);
    const serialized=JSON.stringify(payload);
    let nextRevision;
    if(!current){
      database.prepare("INSERT INTO app_state(state_key,payload,revision,updated_by) VALUES('main',?,1,?)").run(serialized,user.id);
      nextRevision=1;
    }else{
      database.prepare("UPDATE app_state SET payload=?,revision=revision+1,updated_by=?,updated_at=(CAST(strftime('%s','now') AS INTEGER)*1000) WHERE state_key='main'").run(serialized,user.id);
      nextRevision=Number(current.revision)+1;
    }
    database.exec('COMMIT');
    if(previousState)await cleanupDeletedIncomingFiles(previousState,payload);
    return json(res,200,{revision:nextRevision});
  }catch(error){
    try{database.exec('ROLLBACK');}catch{}
    console.error('Zápis provozních dat selhal:',error.message||String(error));
    return json(res,400,{error:'Data se nepodařilo uložit. Zkontrolujte, že zakázky, materiály a doklady na sebe správně navazují.'});
  }
}
async function cleanupDeletedIncomingFiles(previousState,nextState){
  const names=state=>(Array.isArray(state?.incomingReceipts)?state.incomingReceipts:[]).flatMap(receipt=>(receipt.attachments||[]).map(file=>path.basename(String(file.storageName||''))));
  const retained=new Set(names(nextState));
  for(const filename of new Set(names(previousState)))if(!retained.has(filename)&&/^[0-9a-f-]{36}\.(pdf|csv|xlsx|xls|png|jpg|jpeg)$/i.test(filename)){
    try{await fs.promises.rm(path.join(incomingFilesPath,filename),{force:true});}catch{}
  }
}
function mailConfiguration(){
  return {host:process.env.MAIL_IMAP_HOST||'imap.seznam.cz',port:Number(process.env.MAIL_IMAP_PORT||993),user:process.env.MAIL_IMAP_USER||'pmagusin@seznam.cz',password:process.env.MAIL_IMAP_PASSWORD||'',folder:process.env.MAIL_IMAP_FOLDER||'INBOX'};
}
function mailStatusView(){
  const config=mailConfiguration();
  return {configured:Boolean(config.user&&config.password),user:config.user,host:config.host,port:config.port,folder:config.folder,lastSyncAt:mailStatus.lastSyncAt,lastError:mailStatus.lastError,lastImported:mailStatus.lastImported,running:mailStatus.running,pollIntervalMinutes:2};
}
function mailTextKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');}
function isDeliveryMail(parsed){
  const names=(parsed.attachments||[]).map(item=>item.filename||'').join(' ');
  return /(dodaci\s*list|dodavka|delivery\s*note)/i.test(mailTextKey(`${parsed.subject||''} ${parsed.text||''} ${names}`));
}
function incomingFileType(filename){
  const extension=path.extname(filename).toLowerCase();
  const types={'.pdf':'application/pdf','.csv':'text/csv','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xls':'application/vnd.ms-excel','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
  return types[extension]?{extension,mime:types[extension]}:null;
}
function parseDocumentNumber(value){
  const number=String(value||'').replace(/\u00a0/g,' ').trim();
  if(!number)return 0;
  const normalized=number.replace(/\s/g,'').replace(/,(?=\d{1,2}$)/,'.').replace(/\.(?=\d{3}(?:\D|$))/g,'');
  const result=Number(normalized.replace(/[^\d.-]/g,''));
  return Number.isFinite(result)?result:0;
}
function parseDelimitedDocument(text){
  const source=String(text||'').replace(/^\uFEFF/,'');
  const firstLine=source.split(/\r?\n/,1)[0]||'';
  let comma=0,semicolon=0,tab=0,quoted=false;
  for(const char of firstLine){if(char==='"')quoted=!quoted;else if(!quoted&&char===',')comma++;else if(!quoted&&char===';')semicolon++;else if(!quoted&&char==='\t')tab++;}
  const delimiter=tab>comma&&tab>semicolon?'\t':comma>semicolon?',':';';
  const records=[];let row=[],cell='',inQuotes=false;
  for(let index=0;index<source.length;index++){
    const char=source[index];
    if(char==='"'&&inQuotes&&source[index+1]==='"'){cell+='"';index++;}
    else if(char==='"')inQuotes=!inQuotes;
    else if(char===delimiter&&!inQuotes){row.push(cell.trim());cell='';}
    else if((char==='\r'||char==='\n')&&!inQuotes){if(char==='\r'&&source[index+1]==='\n')index++;row.push(cell.trim());cell='';if(row.some(value=>value!==''))records.push(row);row=[];}
    else cell+=char;
  }
  row.push(cell.trim());if(row.some(value=>value!==''))records.push(row);
  if(records.length<2)return {items:[],supplier:'',documentNumber:'',date:'',summary:'Z tabulky se nepodařilo rozpoznat záhlaví a položky. Zadejte je prosím ručně.'};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const headers=records[0].map(normalize);
  const column=(patterns)=>headers.findIndex(header=>patterns.some(pattern=>header.includes(normalize(pattern))));
  let nameIndex=column(['material','polozka','produkt','description','item']);
  if(nameIndex<0)nameIndex=column(['nazev']);
  const qtyIndex=column(['mnozstvi','quantity','qty','pocet']);
  if(nameIndex<0||qtyIndex<0)return {items:[],supplier:'',documentNumber:'',date:'',summary:'Tabulka nemá rozpoznané sloupce pro název a množství. Doplňte položky ručně.'};
  const unitIndex=column(['jednotka','unit','mj']);
  const priceIndex=column(['nakupnicena','jednotkovacena','cena za jednotku','unitprice','price']);
  const supplierIndex=column(['dodavatel','supplier','firma']);
  const numberIndex=column(['cislodokladu','cislofaktury','cisloobjednavky','documentnumber','invoice']);
  const dateIndex=column(['datumdodani','datumvystaveni','datum','date']);
  const items=records.slice(1).map(record=>({
    name:String(record[nameIndex]||'').trim(),
    category:'Přijaté dodávky',
    unit:String(record[unitIndex]||'ks').trim()||'ks',
    qty:parseDocumentNumber(record[qtyIndex]),
    purchasePrice:priceIndex>=0?parseDocumentNumber(record[priceIndex]):0
  })).filter(item=>item.name&&item.qty>0).slice(0,250);
  const dateText=dateIndex>=0?records.slice(1).map(record=>record[dateIndex]).find(Boolean):'';
  const parsedDate=parseDocumentDate(dateText);
  return {items,supplier:supplierIndex>=0?(records.slice(1).map(record=>record[supplierIndex]).find(Boolean)||''):'',documentNumber:numberIndex>=0?(records.slice(1).map(record=>record[numberIndex]).find(Boolean)||''):'',date:parsedDate,summary:items.length?`Předvyplněno ${items.length} položek z tabulky. Před potvrzením zkontrolujte množství a jednotky.`:'Tabulka byla načtena, ale neobsahuje rozpoznatelné položky.'};
}
function parseDocumentDate(value){
  const text=String(value||'').trim();
  let match=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(match)return `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
  match=text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if(match)return `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  return '';
}
function parsePdfMetadata(text){
  const lines=String(text||'').split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean);
  const all=lines.join('\n');
  const dateMatch=all.match(/(?:datum\s*(?:dod[aá]n[ií]|vystaven[ií])?|vystaveno|dod[aá]no|date)\s*[:#-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{1,2}-\d{1,2})/i);
  const numberMatch=all.match(/(?:faktura|dodac[ií]\s+list|doklad)\s*(?:č[ií]slo|č\.?|no\.?|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i);
  const supplierMatch=all.match(/(?:dodavatel|supplier|prod[aá]vaj[ií]c[ií])\s*[:#-]\s*([^\n]{2,100})/i);
  const unitPattern='(?:ks\\.?|kus(?:y|ů)?|m|bm|cm|mm|kg|g|l|bal(?:en[ií])?|m2|m²|m3|m³|hod)';
  const amountPattern='(?:\\d{1,3}(?:[ \\u00a0.]\\d{3})+|\\d+)(?:[,.]\\d+)?';
  const itemPattern=new RegExp(`^(.{2,100}?)\\s+(${amountPattern})\\s*(${unitPattern})(?:\\s+(${amountPattern}))?(?:\\s+(${amountPattern}))?\\s*$`,'i');
  const exclusions=/^(celkem|sou[cč]et|z[aá]klad|dph|da[nň]|faktura|dodac[ií]|dodavatel|datum|v[aá]ha|recykla[cč]n[ií])/i;
  const items=[];
  for(const line of lines){
    const match=line.match(itemPattern);if(!match)continue;
    const name=match[1].replace(/^\s*\d+[.)]?\s*/,'').trim();
    const qty=parseDocumentNumber(match[2]);
    if(!name||exclusions.test(name)||qty<=0)continue;
    items.push({name,category:'Přijaté dodávky',unit:match[3].replace(/\.$/,''),qty,purchasePrice:match[4]?parseDocumentNumber(match[4]):0});
    if(items.length>=250)break;
  }
  const date=parseDocumentDate(dateMatch?.[1]);
  return {supplier:supplierMatch?.[1]?.trim()||'',documentNumber:numberMatch?.[1]||'',date,items,summary:items.length?`Předvyplněno ${items.length} možných položek z PDF. Zkontrolujte je před potvrzením.`:all?'Z PDF se načetl text, ale řádky materiálu se nepodařilo bezpečně určit. Doplňte je prosím ručně.':'PDF neobsahuje strojově čitelný text (může jít o sken). Doplňte položky ručně.'};
}
let pdfjsModulePromise;
async function extractPdfText(buffer){
  pdfjsModulePromise||=import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfjs=await pdfjsModulePromise;
  const loadingTask=pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:true,isEvalSupported:false,verbosity:0});
  let pdf;
  try{
    pdf=await loadingTask.promise;
    const lines=[];
    for(let pageNumber=1;pageNumber<=Math.min(pdf.numPages,20);pageNumber++){
      const page=await pdf.getPage(pageNumber),content=await page.getTextContent();
      const grouped=new Map();
      for(const item of content.items){
        if(typeof item.str!=='string'||!item.str.trim())continue;
        const y=Math.round(Number(item.transform?.[5]||0));
        const row=grouped.get(y)||[];row.push({x:Number(item.transform?.[4]||0),text:item.str});grouped.set(y,row);
      }
      for(const y of [...grouped.keys()].sort((a,b)=>b-a))lines.push(grouped.get(y).sort((a,b)=>a.x-b.x).map(item=>item.text).join(' ').replace(/\s+/g,' ').trim());
      page.cleanup();
    }
    return lines.join('\n').slice(0,12000);
  }finally{try{await (pdf?pdf.destroy():loadingTask.destroy());}catch{}}
}
function persistIncomingReceipt(receipt,activityText){
  database.exec('BEGIN IMMEDIATE');
  try{
    const saved=database.prepare("SELECT payload,revision FROM app_state WHERE state_key='main'").get();
    if(!saved?.payload){database.exec('ROLLBACK');return false;}
    const state=JSON.parse(saved.payload);
    for(const key of ['projects','materials','deliveries','invoices','attendance','requests','activity','movements','incomingReceipts'])if(!Array.isArray(state[key]))state[key]=[];
    if(receipt.sourceKey&&state.incomingReceipts.some(item=>item.sourceKey===receipt.sourceKey)){database.exec('ROLLBACK');return false;}
    receipt.duplicateOf=receiptDuplicateOf(state.incomingReceipts,receipt)||receipt.duplicateOf||'';
    state.incomingReceipts.unshift(receipt);
    state.activity.unshift({date:receipt.date,text:activityText||`Nový dodací list z e-mailu od ${receipt.emailFrom||'neznámého odesílatele'} čeká na kontrolu.`,'kind':'Příjem materiálu'});
    state.activity=state.activity.slice(0,80);
    writeBusinessTables(state,null);
    const revision=Number(saved.revision||0)+1;
    database.prepare("UPDATE app_state SET payload=?,revision=?,updated_by=NULL,updated_at=(CAST(strftime('%s','now') AS INTEGER)*1000) WHERE state_key='main'").run(JSON.stringify(state),revision);
    database.exec('COMMIT');
    return true;
  }catch(error){
    try{database.exec('ROLLBACK');}catch{}
    throw error;
  }
}
function receiptDuplicateOf(receipts,candidate){
  const hashes=new Set([candidate.fileHash,...(candidate.attachments||[]).map(item=>item.sha256)].filter(Boolean));
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const supplier=normalize(candidate.supplier),documentNumber=normalize(candidate.documentNumber);
  if(!hashes.size&&(!supplier||!documentNumber))return '';
  return receipts.find(item=>{
    const existingHashes=[item.fileHash,...(item.attachments||[]).map(file=>file.sha256)].filter(Boolean);
    const hashMatch=[...hashes].some(hash=>existingHashes.includes(hash));
    const sameDocument=Boolean(supplier&&documentNumber&&normalize(item.supplier)===supplier&&normalize(item.documentNumber)===documentNumber);
    return hashMatch||sameDocument;
  })?.id||'';
}
function persistEmailReceipt(receipt){
  return persistIncomingReceipt(receipt,`Nový dodací list z e-mailu od ${receipt.emailFrom||'neznámého odesílatele'} čeká na kontrolu.`);
}
async function syncIncomingMailbox(){
  if(mailSyncPromise)return mailSyncPromise;
  const config=mailConfiguration();
  if(!config.password){mailStatus.lastError='V .env zatím není nastavené heslo pro poštovní aplikaci.';return {imported:0,configured:false};}
  mailSyncPromise=(async()=>{
    const client=new ImapFlow({host:config.host,port:config.port,secure:true,auth:{user:config.user,pass:config.password},logger:false,connectionTimeout:20000,socketTimeout:30000});
    let lock=null,imported=0;
    mailStatus.running=true;mailStatus.lastError='';
    try{
      await client.connect();
      lock=await client.getMailboxLock(config.folder);
      const unseen=await client.search({seen:false},{uid:true});
      if(Array.isArray(unseen))for(const uid of unseen){
        const meta=await client.fetchOne(uid,{envelope:true,size:true,internalDate:true},{uid:true});
        if(!meta||meta.size>25*1024*1024)continue;
        const message=await client.fetchOne(uid,{source:true,envelope:true,size:true,internalDate:true},{uid:true});
        if(!message?.source)continue;
        const parsed=await simpleParser(message.source);
        const hasDocumentAttachment=(parsed.attachments||[]).some(attachment=>incomingFileType(attachment.filename||'')&&attachment.content?.length&&attachment.content.length<=12*1024*1024);
        if(!isDeliveryMail(parsed)&&!hasDocumentAttachment)continue;
        const uidValidity=String(client.mailbox?.uidValidity||'');
        const sourceKey=`${config.folder}:${uidValidity}:${uid}`;
        const attachments=[];
        await fs.promises.mkdir(incomingFilesPath,{recursive:true});
        for(const attachment of parsed.attachments||[]){
          const originalName=path.basename(String(attachment.filename||'priloha'));
          const type=incomingFileType(originalName);
          if(!type||!attachment.content?.length||attachment.content.length>12*1024*1024)continue;
          const id=crypto.randomUUID(),storageName=`${id}${type.extension}`;
          await fs.promises.writeFile(path.join(incomingFilesPath,storageName),attachment.content,{flag:'wx'});
          attachments.push({id,name:originalName,type:type.mime,size:attachment.content.length,storageName,sha256:crypto.createHash('sha256').update(attachment.content).digest('hex')});
        }
        if(!attachments.length&&!parsed.subject&&!parsed.text)continue;
        const sender=parsed.from?.text||message.envelope?.from?.map(item=>item.name?`${item.name} <${item.address}>`:item.address).join(', ')||'';
        const messageDate=parsed.date instanceof Date&&!Number.isNaN(parsed.date.valueOf())?parsed.date:(message.internalDate instanceof Date?message.internalDate:new Date());
        const receipt={id:`RC-${crypto.randomUUID()}`,source:'email',sourceKey,emailMessageId:parsed.messageId||message.envelope?.messageId||'',emailFrom:sender,emailSubject:parsed.subject||'(bez předmětu)',emailDate:messageDate.toISOString(),date:messageDate.toISOString().slice(0,10),supplier:parsed.from?.value?.[0]?.name||'',documentNumber:'',destination:'pending',projectId:'',status:'Čeká na kontrolu',note:'',attachments,items:[]};
        if(persistEmailReceipt(receipt)){
          imported++;
          await client.messageFlagsAdd(uid,['\\Seen'],{uid:true});
        }else{
          for(const attachment of attachments)await fs.promises.rm(path.join(incomingFilesPath,attachment.storageName),{force:true});
        }
      }
      mailStatus.lastSyncAt=new Date().toISOString();mailStatus.lastImported=imported;mailStatus.lastError='';
      return {imported,configured:true};
    }catch(error){
      mailStatus.lastSyncAt=new Date().toISOString();mailStatus.lastImported=imported;mailStatus.lastError=String(error.message||'Připojení k poště selhalo.').slice(0,240);
      console.error('Synchronizace e-mailové schránky selhala:',mailStatus.lastError);
      return {imported,configured:true,error:mailStatus.lastError};
    }finally{
      lock?.release();
      try{await client.logout();}catch{}
      mailStatus.running=false;
    }
  })().finally(()=>{mailSyncPromise=null;});
  return mailSyncPromise;
}
async function handleMailStatus(req,res){
  const user=await requireAdmin(req,res);if(!user)return;
  return json(res,200,mailStatusView());
}
async function handleMailSync(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const user=await requireAdmin(req,res);if(!user)return;
  const result=await syncIncomingMailbox();
  if(!result.configured)return json(res,200,{...mailStatusView(),message:'Doplňte heslo pro poštovní aplikaci do místního souboru .env.'});
  if(result.error)return json(res,502,{...mailStatusView(),error:'Poštu se nepodařilo synchronizovat. Zkontrolujte připojení a heslo pro poštovní aplikaci.'});
  return json(res,200,{...mailStatusView(),imported:result.imported});
}
async function handleIncomingAttachment(req,res,receiptId,attachmentId){
  const user=await requireAdmin(req,res);if(!user)return;
  const saved=database.prepare("SELECT payload FROM app_state WHERE state_key='main'").get();
  let state;try{state=JSON.parse(saved?.payload||'{}');}catch{return json(res,500,{error:'Data uložená v databázi nejsou platná.'});}
  const receipt=(state.incomingReceipts||[]).find(item=>item.id===receiptId);
  const attachment=receipt?.attachments?.find(item=>item.id===attachmentId);
  if(!attachment||!incomingFileType(attachment.name))return json(res,404,{error:'Příloha nebyla nalezena.'});
  const filename=path.basename(attachment.storageName||'');
  if(!/^[0-9a-f-]{36}\.(pdf|csv|xlsx|xls|png|jpg|jpeg)$/i.test(filename))return json(res,404,{error:'Příloha nebyla nalezena.'});
  try{
    const content=await fs.promises.readFile(path.join(incomingFilesPath,filename));
    securityHeaders(res);res.writeHead(200,{'Content-Type':attachment.type||'application/octet-stream','Content-Length':content.length,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(path.basename(attachment.name))}`,'Cache-Control':'private, no-store'});res.end(content);
  }catch{return json(res,404,{error:'Soubor přílohy už není dostupný.'});}
}
async function handleIncomingUpload(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const user=await requireAdmin(req,res);if(!user)return;
  let input;try{input=await bodyJson(req,17_000_000);}catch(error){return json(res,error.status||400,{error:error.message});}
  const originalName=path.basename(String(input.name||'').trim());
  const type=incomingFileType(originalName);
  if(!type||!['.pdf','.csv','.png','.jpg','.jpeg'].includes(type.extension))return json(res,415,{error:'Nahrajte PDF, CSV nebo fotografii ve formátu PNG/JPG.'});
  if(typeof input.data!=='string'||input.data.length>16_800_000||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.data))return json(res,400,{error:'Soubor se nepodařilo načíst.'});
  const content=Buffer.from(input.data,'base64');
  if(!content.length||content.length>12*1024*1024)return json(res,413,{error:'Soubor musí mít nejvýše 12 MB.'});
  if(type.extension==='.pdf'&&!content.subarray(0,1024).includes(Buffer.from('%PDF-')))return json(res,415,{error:'Soubor nemá platnou podobu PDF.'});
  const id=crypto.randomUUID(),storageName=`${id}${type.extension}`;
  await fs.promises.mkdir(incomingFilesPath,{recursive:true});
  try{await fs.promises.writeFile(path.join(incomingFilesPath,storageName),content,{flag:'wx'});}
  catch{return json(res,500,{error:'Soubor se nepodařilo uložit.'});}
  let parsed={items:[],supplier:'',documentNumber:'',date:'',summary:'Soubor byl přiložen. Zkontrolujte údaje a doplňte položky materiálu.'},extractedText='';
  try{
    if(type.extension==='.csv')parsed=parseDelimitedDocument(content.toString('utf8'));
    else if(type.extension==='.pdf'){
      extractedText=await extractPdfText(content);
      parsed={...parsePdfMetadata(extractedText),extractedText};
    }
  }catch(error){
    console.warn('Rozpoznání údajů z příjmového dokladu selhalo:',error.message||String(error));
    parsed.summary='Soubor se uložil, ale údaje se nepodařilo rozpoznat. Zkontrolujte ho a položky doplňte ručně.';
  }
  const receipt={id:`RC-${id}`,source:'upload',sourceKey:`upload:${id}`,fileHash:crypto.createHash('sha256').update(content).digest('hex'),date:parsed.date||pragueClock().date,supplier:parsed.supplier||'',documentNumber:parsed.documentNumber||'',destination:'pending',projectId:'',note:'',status:'Čeká na kontrolu',items:Array.isArray(parsed.items)?parsed.items:[],attachments:[{id,name:originalName,type:type.mime,size:content.length,storageName,sha256:crypto.createHash('sha256').update(content).digest('hex')}],extractionSummary:parsed.summary||'',extractedText:String(parsed.extractedText||'').slice(0,12000)};
  try{
    if(!persistIncomingReceipt(receipt,`Nahraný doklad ${originalName} čeká na kontrolu před příjmem materiálu.`)){
      await fs.promises.rm(path.join(incomingFilesPath,storageName),{force:true});
      return json(res,409,{error:'Doklad se nepodařilo přidat. Obnovte přehled a zkuste to znovu.'});
    }
  }catch(error){
    await fs.promises.rm(path.join(incomingFilesPath,storageName),{force:true});
    console.error('Uložení nahraného příjmového dokladu selhalo:',error.message||String(error));
    return json(res,400,{error:'Doklad se nepodařilo uložit do fronty ke kontrole.'});
  }
  return json(res,201,{receipt:{id:receipt.id,documentNumber:receipt.documentNumber,supplier:receipt.supplier,date:receipt.date,items:receipt.items,extractionSummary:receipt.extractionSummary}});
}
async function handleEmployeeSummary(req,res){
  const user=await sessionUser(req);if(!user)return json(res,401,{error:'Přihlášení vypršelo. Přihlaste se znovu.'});
  const {rows}=await dbQuery("SELECT payload,revision FROM app_state WHERE state_key='main'");
  let state={projects:[],attendance:[]};
  if(rows[0]?.payload){try{state=JSON.parse(rows[0].payload);}catch{return json(res,500,{error:'Uložená data nejsou platná.'});}}
  const projects=(Array.isArray(state.projects)?state.projects:[]).filter(project=>
    (Array.isArray(project.assignedUsers)&&project.assignedUsers.includes(user.id))||
    String(project.manager||'').trim().toLocaleLowerCase('cs')===String(user.full_name||'').trim().toLocaleLowerCase('cs'));
  const projectIds=new Set(projects.map(project=>project.id));
  const attendance=(Array.isArray(state.attendance)?state.attendance:[])
    .filter(item=>item.userId===user.id||(item.userId==null&&item.employee===user.full_name))
    .sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
  return json(res,200,{user:safeUser(user),projects,attendance,activeAttendance:attendance.find(item=>!item.end)||null,revision:Number(rows[0]?.revision||0)});
}
async function handleEmployeeAttendance(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const user=await sessionUser(req);if(!user)return json(res,401,{error:'Přihlášení vypršelo. Přihlaste se znovu.'});
  let input;try{input=await bodyJson(req);}catch(error){return json(res,error.status||400,{error:error.message});}
  const action=String(input.action||'');
  if(!['clock_in','clock_out'].includes(action))return json(res,400,{error:'Vyberte příchod nebo odchod.'});
  database.exec('BEGIN IMMEDIATE');
  try{
    const saved=database.prepare("SELECT payload,revision FROM app_state WHERE state_key='main'").get();
    if(!saved?.payload){database.exec('ROLLBACK');return json(res,409,{error:'Nejdřív musí správce připravit pracovní zakázky.'});}
    const state=JSON.parse(saved.payload);
    for(const key of ['projects','materials','deliveries','invoices','attendance','requests','activity','movements','incomingReceipts'])if(!Array.isArray(state[key]))state[key]=[];
    const attendance=state.attendance;
    let record;
    if(action==='clock_in'){
      const project=state.projects.find(item=>item.id===String(input.projectId||''));
      const assigned=project&&((Array.isArray(project.assignedUsers)&&project.assignedUsers.includes(user.id))||String(project.manager||'').trim().toLocaleLowerCase('cs')===String(user.full_name||'').trim().toLocaleLowerCase('cs'));
      if(!assigned){database.exec('ROLLBACK');return json(res,403,{error:'Tato zakázka vám není přiřazená.'});}
      if(['Dokončeno','Pozastaveno'].includes(project.status)){database.exec('ROLLBACK');return json(res,409,{error:'Na dokončené nebo pozastavené zakázce už nelze zaznamenat příchod.'});}
      const existing=attendance.find(item=>!item.end&&(item.userId===user.id||(item.userId==null&&item.employee===user.full_name)));
      if(existing){database.exec('ROLLBACK');return json(res,409,{error:'Nejdřív zaznamenejte odchod z otevřené směny.'});}
      const now=pragueClock();
      record={id:`AT-${crypto.randomUUID()}`,userId:user.id,date:now.date,employee:user.full_name,projectId:project.id,start:now.time,end:'',note:'',status:'Na pracovišti'};
      attendance.unshift(record);
      state.activity.unshift({date:now.date,text:`${user.full_name} zaznamenal příchod na zakázku ${project.id}.`,'kind':'Docházka'});
    }else{
      record=attendance.find(item=>!item.end&&(item.userId===user.id||(item.userId==null&&item.employee===user.full_name)));
      if(!record){database.exec('ROLLBACK');return json(res,409,{error:'Nemáte otevřenou směnu k ukončení.'});}
      const now=pragueClock();record.end=now.time;record.status='Uzavřeno';
      state.activity.unshift({date:now.date,text:`${user.full_name} zaznamenal odchod ze zakázky ${record.projectId}.`,'kind':'Docházka'});
    }
    state.activity=state.activity.slice(0,80);
    writeBusinessTables(state,user.id);
    const revision=Number(saved.revision)+1;
    database.prepare("UPDATE app_state SET payload=?,revision=?,updated_by=?,updated_at=(CAST(strftime('%s','now') AS INTEGER)*1000) WHERE state_key='main'")
      .run(JSON.stringify(state),revision,user.id);
    database.exec('COMMIT');
    return json(res,200,{record,revision});
  }catch(error){
    try{database.exec('ROLLBACK');}catch{}
    console.error('Zápis docházky selhal:',error.message||String(error));
    return json(res,400,{error:'Docházku se nepodařilo uložit. Obnovte stránku a zkuste to znovu.'});
  }
}
async function handleCreateUser(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const actor=await requireAdmin(req,res);if(!actor)return;
  let input;try{input=await bodyJson(req);}catch(error){return json(res,error.status||400,{error:error.message});}
  const fullName=String(input.full_name||'').trim(),email=String(input.email||'').trim().toLowerCase();
  const password=String(input.password||''),role=String(input.role||'employee');
  if(fullName.length<2||fullName.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!userRoles.has(role)||password.length<8||password.length>1024)
    return json(res,400,{error:'Zkontrolujte jméno, e-mail, roli a heslo dlouhé alespoň 8 znaků.'});
  const salt=crypto.randomBytes(16),derived=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  const passwordHash=`scrypt$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`;
  try{
    const {rows}=await dbQuery(`INSERT INTO app_users(id,email,full_name,role,password_hash,is_active)
      VALUES($1,$2,$3,$4,$5,1) RETURNING id,email,full_name,role,is_active`,[crypto.randomUUID(),email,fullName,role,passwordHash]);
    return json(res,201,{user:adminUserView(rows[0])});
  }catch(error){if(String(error.message).includes('UNIQUE constraint failed'))return json(res,409,{error:'Uživatel s tímto e-mailem už existuje.'});throw error;}
}
async function handleUserActive(req,res,userId){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const actor=await requireAdmin(req,res);if(!actor)return;
  let input;try{input=await bodyJson(req);}catch(error){return json(res,error.status||400,{error:error.message});}
  if(typeof input.is_active!=='boolean')return json(res,400,{error:'Chybí platný stav účtu.'});
  if(userId===actor.id&&!input.is_active)return json(res,400,{error:'Svůj vlastní účet nemůžete pozastavit.'});
  const {rows}=await dbQuery("UPDATE app_users SET is_active=$2,updated_at=(CAST(strftime('%s','now') AS INTEGER)*1000) WHERE id=$1 RETURNING id,email,full_name,role,is_active",[userId,input.is_active]);
  if(!rows.length)return json(res,404,{error:'Uživatel nebyl nalezen.'});
  return json(res,200,{user:adminUserView(rows[0])});
}
async function handleDeleteUser(req,res,userId){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const actor=await requireAdmin(req,res);if(!actor)return;
  if(userId===actor.id)return json(res,400,{error:'Svůj vlastní účet nemůžete odstranit.'});
  const existing=await dbQuery('SELECT id,role FROM app_users WHERE id=$1',[userId]);
  if(!existing.rows.length)return json(res,404,{error:'Uživatel nebyl nalezen.'});
  if(existing.rows[0].role==='admin')return json(res,400,{error:'Účet správce nelze odstranit.'});
  await dbQuery('DELETE FROM app_users WHERE id=$1',[userId]);
  return json(res,200,{ok:true});
}
async function handleUpdateUser(req,res,userId){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const actor=await requireAdmin(req,res);if(!actor)return;
  let input;try{input=await bodyJson(req);}catch(error){return json(res,error.status||400,{error:error.message});}
  const fullName=String(input.full_name||'').trim(),email=String(input.email||'').trim().toLowerCase(),role=String(input.role||'');
  if(fullName.length<2||fullName.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!userRoles.has(role))
    return json(res,400,{error:'Zkontrolujte jméno, e-mail a roli uživatele.'});
  const existing=await dbQuery('SELECT id,role FROM app_users WHERE id=$1',[userId]);
  if(!existing.rows.length)return json(res,404,{error:'Uživatel nebyl nalezen.'});
  if(existing.rows[0].role==='admin')return json(res,400,{error:'Účet správce zde nelze upravit.'});
  try{
    const {rows}=await dbQuery(`UPDATE app_users SET email=$2,full_name=$3,role=$4,updated_at=(CAST(strftime('%s','now') AS INTEGER)*1000)
      WHERE id=$1 RETURNING id,email,full_name,role,is_active`,[userId,email,fullName,role]);
    return json(res,200,{user:adminUserView(rows[0])});
  }catch(error){if(String(error.message).includes('UNIQUE constraint failed'))return json(res,409,{error:'Uživatel s tímto e-mailem už existuje.'});throw error;}
}
async function handleLogin(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  let input;
  try{input=await bodyJson(req);}catch(error){return json(res,error.status||400,{error:error.message});}
  const email=String(input.email||'').trim().toLowerCase();
  const password=String(input.password||'');
  if(!email||!password||email.length>254||password.length>1024)return json(res,400,{error:'Zadejte e-mail a heslo.'});
  const key=`${clientIp(req)}:${email}`;
  if(limited(key))return json(res,429,{error:'Příliš mnoho pokusů. Počkejte 15 minut a zkuste to znovu.'});
  const {rows}=await dbQuery('SELECT id,email,full_name,role,password_hash,is_active FROM app_users WHERE lower(email)=lower($1) LIMIT 1',[email]);
  const user=rows[0];
  const valid=user?await verifyPassword(password,user.password_hash):false;
  if(!valid||!user.is_active){
    await scrypt(password,crypto.randomBytes(16),64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
    return json(res,401,{error:'E-mail nebo heslo nesouhlasí.'});
  }
  clearAttempts(key);
  const rawToken=crypto.randomBytes(32).toString('base64url');
  const expiresAt=Date.now()+sessionHours*60*60*1000;
  await dbQuery("DELETE FROM app_sessions WHERE expires_at<=(CAST(strftime('%s','now') AS INTEGER)*1000)");
  await dbQuery('INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[tokenDigest(rawToken),user.id,expiresAt]);
  json(res,200,{user:safeUser(user)},{'Set-Cookie':sessionCookie(rawToken,sessionHours*60*60)});
}
async function handleSession(req,res){
  const user=await sessionUser(req);
  if(!user)return json(res,200,{authenticated:false});
  json(res,200,{authenticated:true,user:safeUser(user)});
}
async function handleLogout(req,res){
  if(!originAllowed(req))return json(res,403,{error:'Požadavek byl odmítnut.'});
  const token=parseCookies(req.headers.cookie)[cookieName];
  if(token)await dbQuery('DELETE FROM app_sessions WHERE token_hash=$1',[tokenDigest(token)]);
  json(res,200,{ok:true},{'Set-Cookie':sessionCookie('',0)});
}
async function serveFile(res,filename,status=200){
  const file=path.join(root,filename);
  try{
    const content=await fs.promises.readFile(file);
    const extension=path.extname(file);
    securityHeaders(res);res.writeHead(status,{'Content-Type':mime[extension]||'application/octet-stream','Cache-Control':filename.endsWith('.html')||extension==='.js'?'no-store':'private, max-age=300'});res.end(content);
  }catch{securityHeaders(res);res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Stránka nebyla nalezena.');}
}
async function routePage(req,res,filename){
  if(filename==='admin.html'||filename==='zamestnanec.html'){
    let user=null;
    try{user=await sessionUser(req);}catch{return serveFile(res,'login.html');}
    if(!user){res.writeHead(302,{Location:'./login.html', 'Cache-Control':'no-store'});return res.end();}
    const admin=user.role==='admin';
    if(filename==='admin.html'&&!admin){res.writeHead(302,{Location:'./zamestnanec.html','Cache-Control':'no-store'});return res.end();}
    if(filename==='zamestnanec.html'&&admin){res.writeHead(302,{Location:'./admin.html','Cache-Control':'no-store'});return res.end();}
  }
  return serveFile(res,filename);
}
async function handler(req,res){
  try{
    const protocol=req.socket.encrypted?'https':'http';
    const url=new URL(req.url,process.env.PUBLIC_ORIGIN||`${protocol}://${req.headers.host||'localhost'}`);
    const pathname=decodeURIComponent(url.pathname);
    if(pathname==='/api/health'&&req.method==='GET'){
      await dbQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='app_users'");
      return json(res,200,{ok:true,database:'connected',engine:'sqlite'});
    }
    if(pathname==='/api/auth/login'&&req.method==='POST')return await handleLogin(req,res);
    if(pathname==='/api/auth/session'&&req.method==='GET')return await handleSession(req,res);
    if(pathname==='/api/auth/logout'&&req.method==='POST')return await handleLogout(req,res);
    if(pathname==='/api/admin/state'&&(req.method==='GET'||req.method==='PUT'))return await handleAdminState(req,res);
    if(pathname==='/api/admin/mail/status'&&req.method==='GET')return await handleMailStatus(req,res);
    if(pathname==='/api/admin/mail/sync'&&req.method==='POST')return await handleMailSync(req,res);
    if(pathname==='/api/admin/incoming/upload'&&req.method==='POST')return await handleIncomingUpload(req,res);
    const incomingAttachmentMatch=pathname.match(/^\/api\/admin\/incoming\/([A-Za-z0-9-]+)\/attachments\/([A-Za-z0-9-]+)$/);
    if(incomingAttachmentMatch&&req.method==='GET')return await handleIncomingAttachment(req,res,incomingAttachmentMatch[1],incomingAttachmentMatch[2]);
    if(pathname==='/api/employee/summary'&&req.method==='GET')return await handleEmployeeSummary(req,res);
    if(pathname==='/api/employee/attendance'&&req.method==='POST')return await handleEmployeeAttendance(req,res);
    if(pathname==='/api/admin/users'&&req.method==='POST')return await handleCreateUser(req,res);
    const activeUserMatch=pathname.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/active$/i);
    if(activeUserMatch&&req.method==='PATCH')return await handleUserActive(req,res,activeUserMatch[1]);
    const deleteUserMatch=pathname.match(/^\/api\/admin\/users\/([0-9a-f-]{36})$/i);
    if(deleteUserMatch&&req.method==='DELETE')return await handleDeleteUser(req,res,deleteUserMatch[1]);
    if(deleteUserMatch&&req.method==='PATCH')return await handleUpdateUser(req,res,deleteUserMatch[1]);
    if(pathname==='/'){
      res.writeHead(302,{Location:'./login.html','Cache-Control':'no-store'});return res.end();
    }
    const filename=pathname.replace(/^\//,'');
    if(!filename||filename.includes('..')||!publicFiles.has(filename)){
      securityHeaders(res);res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Stránka nebyla nalezena.');
    }
    return await routePage(req,res,filename);
  }catch(error){
    console.error('Požadavek selhal:',error.message||error.code||String(error));
    return json(res,500,{error:'Služba je dočasně nedostupná. Zkuste to prosím později.'});
  }
}

const requestHandler=(req,res)=>{handler(req,res);};
const httpsPfxPath=process.env.HTTPS_PFX_PATH?path.resolve(root,process.env.HTTPS_PFX_PATH):'';
if(httpsPfxPath&&!process.env.HTTPS_PFX_PASSPHRASE)throw new Error('HTTPS_PFX_PASSPHRASE chybí v .env.');
const server=httpsPfxPath
  ?https.createServer({pfx:fs.readFileSync(httpsPfxPath),passphrase:process.env.HTTPS_PFX_PASSPHRASE},requestHandler)
  :http.createServer(requestHandler);
let mailPollTimer=null,firstMailPollTimer=null;
server.listen(port,()=>{
  const protocol=server instanceof https.Server?'https':'http';
  console.log(`ML Work běží na ${process.env.PUBLIC_ORIGIN||`${protocol}://localhost:${port}`}`);
  console.log(`SQLite databáze: ${require('./database/connection').databasePath}`);
  if(mailConfiguration().password){
    firstMailPollTimer=setTimeout(()=>syncIncomingMailbox(),8000);firstMailPollTimer.unref();
    mailPollTimer=setInterval(()=>syncIncomingMailbox(),120000);mailPollTimer.unref();
    console.log(`Automatická kontrola schránky ${mailConfiguration().user} je připravena.`);
  }
});
server.on('close',()=>{clearInterval(mailPollTimer);clearTimeout(firstMailPollTimer);closeDatabase();});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
