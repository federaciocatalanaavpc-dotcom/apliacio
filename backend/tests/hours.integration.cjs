const assert=require('node:assert/strict'),crypto=require('node:crypto');
const url=new URL(process.env.TEST_DATABASE_URL||'');if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Local test database required');
process.env.DATABASE_URL=url.toString();process.env.DIRECT_URL=url.toString();process.env.NODE_ENV='test';process.env.JWT_SECRET=crypto.randomBytes(40).toString('hex');
const {prisma}=require('../dist/prisma');const {tokenPer}=require('../dist/services/seguretat.service');const app=require('../dist/index').default;
let server;
(async()=>{
 const tag=crypto.randomBytes(6).toString('hex');const a=await prisma.agrupacio.create({data:{nom:'Hours fixture '+tag}}),b=await prisma.agrupacio.create({data:{nom:'Other hours fixture '+tag}});
 async function user(rol,agrupacioId){return prisma.usuari.create({data:{nom:'Fictici',usuari:rol+crypto.randomBytes(6).toString('hex'),rol,agrupacioId,contrasenya:'unused-hash',passwordMustChange:false}});}
 const admin=await user('ADMIN_AVPC',a.id),assoc=await user('AGRUPACIO',a.id),fed=await user('FEDERACIO',null),vu=await user('VOLUNTARI',a.id),other=await user('VOLUNTARI',b.id);
 const v=await prisma.voluntari.create({data:{agrupacioId:a.id,usuariId:vu.id,nom:'Clock',cognoms:'Fixture'}}),foreign=await prisma.voluntari.create({data:{agrupacioId:b.id,usuariId:other.id,nom:'Foreign',cognoms:'Fixture'}});
 await prisma.voluntari.create({data:{agrupacioId:a.id,usuariId:admin.id,nom:'Admin',cognoms:'Fixture'}});
 server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port+'/api/';
 async function call(path,method,body,account=admin){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+tokenPer(account,'access'),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
 async function service(extra={}){return prisma.servei.create({data:{agrupacioId:a.id,creatPerId:admin.id,titol:'Fitxatge fictici',dataInici:new Date('2026-01-01T22:00:00Z'),dataFi:new Date('2026-01-02T02:30:00Z'),...extra}});}
 let s=await service(),path='serveis/'+s.id;
 assert.equal((await call(path+'/fitxar-sortida','POST',{},vu)).status,409);
 assert.equal((await call(path+'/fitxar-entrada','POST',{horaEntrada:'2026-01-01'},vu)).status,400);
 assert.equal((await call(path+'/fitxar-entrada','POST',{},other)).status,403);
 const entries=await Promise.all([call(path+'/fitxar-entrada','POST',{},vu),call(path+'/fitxar-entrada','POST',{},vu)]);
 entries.forEach(r=>assert.equal(r.status,200));assert.equal(entries[0].data.horaEntrada,entries[1].data.horaEntrada);assert.equal(entries[0].data.horesRealitzades,null);
 assert.equal((await call(path+'/cancelar','POST',{},vu)).status,409);
 const id=entries[0].data.id;await prisma.assistenciaServei.update({where:{id},data:{horaEntrada:new Date(Date.now()-5400000)}});
 await prisma.servei.update({where:{id:s.id},data:{arxivat:true}});
 assert.ok((await call('serveis','GET',undefined,vu)).data.some(x=>x.id===s.id),'Open clock survives archive');
 const exits=await Promise.all([call(path+'/fitxar-sortida','POST',{},vu),call(path+'/fitxar-sortida','POST',{},vu)]);
 assert.equal(exits[0].status,200);assert.equal(exits[0].data.horaSortida,exits[1].data.horaSortida);assert.equal(exits[0].data.horesRealitzades,1.5);
 assert.equal((await call(path+'/assistencies/'+v.id,'PATCH',{validarHorariServei:true})).status,409);
 s=await service();path='serveis/'+s.id;const ap=path+'/assistencies/'+v.id;
 assert.equal((await call(ap,'PATCH',{validarHorariServei:true},vu)).status,403);
 assert.equal((await call(path+'/assistencies/'+foreign.id,'PATCH',{validarHorariServei:true})).status,403);
 assert.equal((await call(ap,'PATCH',{horesRealitzades:999})).status,400);
 const valid=await call(ap,'PATCH',{validarHorariServei:true});assert.equal(valid.status,200);assert.equal(valid.data.horesRealitzades,4.5);assert.equal(valid.data.confirmat,true);
 assert.equal((await call(ap,'PATCH',{validarHorariServei:true})).status,409);
 assert.equal((await call(ap,'PATCH',{horaEntrada:'2026-01-02T23:00:00+01:00',horaSortida:'2026-01-03T02:15:00+01:00'},assoc)).data.horesRealitzades,3.25);
 assert.equal((await call(ap,'PATCH',{horaEntrada:'2026-01-03T02:15:00Z',horaSortida:'2026-01-03T01:15:00Z'})).status,400);
 assert.equal((await call(ap,'PATCH',{horaEntrada:'invalid',horaSortida:null})).status,400);
 assert.equal((await call(ap,'PATCH',{horaEntrada:'2099-01-01T00:00:00Z',horaSortida:null})).status,400);
 assert.equal((await call(ap,'PATCH',{horaEntrada:'2026-03-29T01:30:00+01:00',horaSortida:'2026-03-29T03:30:00+02:00'},fed)).data.horesRealitzades,1,'DST elapsed time');
 const future=await service({dataInici:new Date('2099-01-01T00:00:00Z'),dataFi:new Date('2099-01-01T03:00:00Z')});assert.equal((await call('serveis/'+future.id+'/assistencies/'+v.id,'PATCH',{validarHorariServei:true})).status,400);
 const stats=await call('serveis/estadistiques/dades','GET');assert.equal(stats.data.find(x=>x.id===s.id).assistencies[0].horesRealitzades,1);
 assert.ok(await prisma.registreAuditoria.count({where:{entitat:'AssistenciaServei',agrupacioId:a.id}})>=5);
 assert.equal((await call('serveis','POST',{titol:'Invalid interval',dataInici:'2026-01-02T00:00:00Z',dataFi:'2026-01-01T00:00:00Z'})).status,400);
 console.log('PASS: clock in/out concurrency, server time, archive, scope, admin validation, corrections, overnight/DST, stats and audit');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(server)await new Promise(r=>server.close(r));await prisma.$disconnect();});

