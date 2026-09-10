// Backup cifrado. Las credenciales solo se leen del entorno y no se imprimen.
// Restauración: únicamente bases nuevas, con nombre terminado en _restore_test.
const fs=require('node:fs'), path=require('node:path'), os=require('node:os'), crypto=require('node:crypto');
const {spawn}=require('node:child_process');const {pipeline}=require('node:stream/promises');
const MAGIC=Buffer.from('AVPCBK01');
function config(){
 const key=Buffer.from(process.env.BACKUP_KEY||'','hex');if(key.length!==32)throw Error('BACKUP_KEY debe contener 64 dígitos hexadecimales');
 const output=process.env.BACKUP_PATH;if(!output||!path.isAbsolute(output))throw Error('BACKUP_PATH debe ser absoluto');
 return {key,output};
}
function pgEnv(raw){
 const u=new URL(raw);if(!['postgres:','postgresql:'].includes(u.protocol))throw Error('URL PostgreSQL no válida');
 return {...process.env,PGHOST:u.hostname,PGPORT:u.port||'5432',PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:decodeURIComponent(u.pathname.slice(1)),PGSSLMODE:u.searchParams.get('sslmode')||(['127.0.0.1','localhost'].includes(u.hostname)?'disable':'require')};
}
function pg(binary,args,env){
 const child=spawn(binary,args,{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stderr.resume();
 const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('La herramienta PostgreSQL terminó con error '+code)));});
 return {child,done};
}
async function backup(){
 const {key,output}=config();if(fs.existsSync(output))throw Error('No se sobrescribe una copia existente');
 const part=output+'.partial-'+crypto.randomBytes(6).toString('hex'),iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(MAGIC);
 const out=fs.createWriteStream(part,{flags:'wx',mode:0o600});out.write(Buffer.concat([MAGIC,iv]));
 const dump=pg(process.env.PG_DUMP||'pg_dump',['--format=custom','--no-owner','--no-privileges'],pgEnv(process.env.BACKUP_DATABASE_URL));
 try{await Promise.all([pipeline(dump.child.stdout,cipher,out),dump.done]);fs.appendFileSync(part,cipher.getAuthTag());fs.renameSync(part,output);console.log('Copia cifrada creada.');}
 catch(e){dump.child.kill();fs.rmSync(part,{force:true});throw e;}
}
async function restore(){
 const {key,output}=config();const env=pgEnv(process.env.BACKUP_RESTORE_DATABASE_URL);
 if(!env.PGDATABASE.endsWith('_restore_test'))throw Error('La restauración solo permite bases aisladas terminadas en _restore_test');
 const stat=fs.statSync(output);if(stat.size<36)throw Error('Copia no válida');
 const fd=fs.openSync(output,'r'),head=Buffer.alloc(20),tag=Buffer.alloc(16);fs.readSync(fd,head,0,20,0);fs.readSync(fd,tag,0,16,stat.size-16);fs.closeSync(fd);
 if(!head.subarray(0,8).equals(MAGIC))throw Error('Formato de copia incorrecto');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'avpc-restore-')),file=path.join(temp,'dump');
 try{
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,head.subarray(8));decipher.setAAD(MAGIC);decipher.setAuthTag(tag);
  // No se restaura nada hasta verificar la integridad completa del cifrado.
  await pipeline(fs.createReadStream(output,{start:20,end:stat.size-17}),decipher,fs.createWriteStream(file,{flags:'wx',mode:0o600}));
  const check=pg(process.env.PSQL||'psql',['-X','-tAc',"SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"],env);
  let result='';check.child.stdout.on('data',b=>result+=b);await check.done;
  if(result.trim()!=='0')throw Error('La base de destino debe estar vacía');
  const r=pg(process.env.PG_RESTORE||'pg_restore',['--exit-on-error','--single-transaction','--no-owner','--no-privileges','--dbname',env.PGDATABASE,file],env);r.child.stdout.resume();await r.done;
  console.log('Restauración verificada en destino aislado.');
 } finally {fs.rmSync(file,{force:true});fs.rmdirSync(temp);}
}
if(require.main===module)(process.argv[2]==='restore-test'?restore():backup()).catch(()=>{console.error('No se ha completado la copia/restauración. Revisa configuración, clave y conexión. No se muestran credenciales.');process.exitCode=1;});
module.exports={backup,restore};
