// Proves de les rutes reals amb una base de dades simulada: no toquen dades reals.
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'test-only-admin-avpc';
const jwt = require('jsonwebtoken');
const express = require('express');
const { prisma } = require('../dist/prisma');
const user = { id:'admin', rol:'ADMIN_AVPC', agrupacioId:'a', actiu:true };
let current = {...user}, created, updated, queries = [];
prisma.usuari.findUnique = async () => current;
prisma.usuari.create = async ({data}) => { created=data; return {id:'new-user',...data}; };
prisma.usuari.update = async ({data}) => { updated=data; return data; };
prisma.voluntari.findMany = async q => { queries.push(q); return []; };
prisma.voluntari.findUnique = async ({where}) => ({id:where.id, agrupacioId:where.id==='other'?'b':'a', usuariId:'new-user', nom:'Test', cognoms:'Voluntari', consentimentDades:true});
prisma.voluntari.create = async ({data}) => ({id:'new-volunteer',...data});
prisma.voluntari.update = async ({data}) => { assert.equal(data.dni, undefined); return {id:'own',agrupacioId:'a',nom:'Test',cognoms:'Voluntari',...data}; };
prisma.$transaction = async fn => fn(prisma);
prisma.registreAuditoria.create = async () => ({});
prisma.material.findMany = async q => { queries.push(q); return []; };
prisma.servei.findMany = async q => { queries.push(q); return []; };
prisma.servei.findUnique = async () => ({id:'other',agrupacioId:'b'});
prisma.proveidor.findMany = async q => { queries.push(q); return []; };
prisma.vehicle.findMany = async q => { queries.push(q); return []; };
prisma.articleEquipament.findMany = async q => { queries.push(q); return []; };
prisma.assignacioEquipament.groupBy = async () => [];
const app=express(); app.use(express.json());
for (const [url,file] of Object.entries({voluntaris:'voluntaris',material:'material',serveis:'serveis',proveidors:'proveidors',vehicles:'vehicles',equipament:'equipament',documents:'documents',usuaris:'usuaris',agrupacions:'agrupacions',auditoria:'auditoria'})) app.use('/api/'+url,require('../dist/routes/'+file+'.routes').default);
const server=app.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 const token=jwt.sign({...user,rol:'FEDERACIO'},process.env.JWT_SECRET); // JWT antic/manipulat: preval la BD.
 async function request(path,method='GET',body) {
   return fetch(base+'/api/'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 }
 try {
  for(const route of ['voluntaris','material','serveis','vehicles','equipament/articles']) {
   queries=[]; assert.equal((await request(route+'?agrupacioId=b')).status,200,route);
   assert.equal(queries[0].where.agrupacioId,'a',route+' ha de filtrar per AVPC pròpia');
  }
  queries=[]; assert.equal((await request('proveidors')).status,200);
  assert.equal(queries[0].where,undefined,'directori compartit de proveïdors');
  queries=[]; assert.equal((await request('proveidors?nomesMeus=true&agrupacioId=b')).status,200);
  assert.equal(queries[0].where.agrupacioId,'a');
  prisma.proveidor.findUnique = async () => ({id:'other',agrupacioId:'b'});
  assert.equal((await request('proveidors/other','PATCH',{nom:'test'})).status,403);
  for(const route of ['documents','usuaris','agrupacions']) assert.equal((await request(route)).status,403,route);
  assert.equal((await request('serveis/other')).status,403);
  assert.equal((await request('voluntaris/other','PATCH',{rolAcces:'ADMIN_AVPC'})).status,403);
  assert.equal((await request('voluntaris/own','PATCH',{rolAcces:'FEDERACIO'})).status,400);
  for(const role of ['ADMIN_AVPC','VOLUNTARI']) {
   assert.equal((await request('voluntaris','POST',{nom:'Test',cognoms:'Persona',consentimentDades:true,emailAcces:'test@example.invalid',contrasenyaAcces:'test-only-123',rolAcces:role,agrupacioId:'b'})).status,201);
   assert.equal(created.rol,role); assert.equal(created.agrupacioId,'a');
   assert.equal((await request('voluntaris/own','PATCH',{rolAcces:role})).status,200);
   assert.equal(updated.rol,role);
  }
  assert.equal((await request('voluntaris','POST',{nom:'Test',cognoms:'Persona',consentimentDades:true,rolAcces:'FEDERACIO'})).status,400);
  current={...user,rol:'VOLUNTARI'};
  assert.equal((await request('voluntaris')).status,403,'retirada de permisos amb el mateix token');
  assert.equal((await request('voluntaris/own','PATCH',{rolAcces:'ADMIN_AVPC'})).status,403,'no autoescalada');
  current={...user,actiu:false}; assert.equal((await request('voluntaris')).status,401);
  current={...user,agrupacioId:null}; assert.equal((await request('voluntaris')).status,403);
  console.log('OK: rols, alta i edició, AVPC pròpia, bloqueig Federació, retirada de permisos i comptes inactius.');
 } catch(e) { console.error(e); process.exitCode=1; }
 finally { server.closeAllConnections(); server.close(); await prisma.$disconnect(); }
});
