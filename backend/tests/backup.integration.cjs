const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');const {PrismaClient}=require('@prisma/client');
const u=new URL(process.env.TEST_DATABASE_URL||'');if(!['127.0.0.1','localhost'].includes(u.hostname)||!u.pathname.endsWith('_test'))throw Error('Solo se admiten datos de prueba locales');
const bin=process.env.PG_BIN||'C:/Program Files/PostgreSQL/18/bin';
const pgEnv={...process.env,PGPASSWORD:decodeURIComponent(u.password)};
const target='avpc_'+crypto.randomBytes(6).toString('hex')+'_restore_test';
const db=spawnSync(path.join(bin,'createdb'),['-h',u.hostname,'-p',u.port,'-U',u.username,target],{windowsHide:true,env:pgEnv});if(db.status!==0)throw Error('No se ha podido crear el destino de prueba');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'avpc-backup-test-'));
process.env.BACKUP_DATABASE_URL=u.toString();const restoredUrl=new URL(u);restoredUrl.pathname='/'+target;
process.env.BACKUP_RESTORE_DATABASE_URL=restoredUrl.toString();process.env.BACKUP_KEY=crypto.randomBytes(32).toString('hex');process.env.BACKUP_PATH=path.join(dir,'fixture.avpc');
process.env.PG_DUMP=path.join(bin,'pg_dump');process.env.PG_RESTORE=path.join(bin,'pg_restore');process.env.PSQL=path.join(bin,'psql');
const {backup,restore}=require('../scripts/backup.cjs');
const original=new PrismaClient({datasources:{db:{url:u.toString()}}}),copy=new PrismaClient({datasources:{db:{url:restoredUrl.toString()}}});
(async()=>{
 await backup();const bytes=fs.readFileSync(process.env.BACKUP_PATH);assert.ok(!bytes.includes(Buffer.from('%PDF-1.4')));
 await restore();
 for(const model of ['usuari','voluntari','servei','assistenciaServei','document','agrupacio'])assert.equal(await copy[model].count(),await original[model].count(),model);
 const docs=await original.document.findMany({orderBy:{id:'asc'}}),restored=await copy.document.findMany({orderBy:{id:'asc'}});
 assert.deepEqual(restored,docs,'PDF i metadades idèntics');
 await assert.rejects(restore(),'es prohibeix sobreescriure el destí');
 bytes[25]^=1;fs.writeFileSync(process.env.BACKUP_PATH,bytes);await assert.rejects(restore(),'una còpia manipulada no es pot restaurar');
 console.log('OK: còpia xifrada, restauració amb recomptes i documents idèntics, rebuig de sobreescriptura i manipulació.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 await original.$disconnect();await copy.$disconnect();fs.rmSync(process.env.BACKUP_PATH,{force:true});fs.rmdirSync(dir);
 const r=spawnSync(path.join(bin,'dropdb'),['-h',u.hostname,'-p',u.port,'-U',u.username,target],{windowsHide:true,env:pgEnv});if(r.status!==0){console.error('No se pudo retirar la base temporal de restauración');process.exitCode=1;}
});
