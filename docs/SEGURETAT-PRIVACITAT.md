# Seguretat i privacitat — implantació i operació

Aquest document descriu controls tècnics i tasques pendents. No és una certificació de compliment legal ni una garantia de seguretat absoluta.

## Canvis implementats

- Les fitxes de voluntaris ja no demanen, accepten ni retornen DNI/NIE, domicili, codi postal, província/localitat personal, data de naixement, gènere, altres correus ni altres associacions. Les seus de les AVPC i els llocs de servei es mantenen. El mapa no demana la ubicació del dispositiu.
- Les columnes històriques segueixen a PostgreSQL. El seu esborrat definitiu està pendent d'autorització específica. Amagar camps no elimina els valors antics ni les còpies anteriors.
- Invitacions privades d'un sol ús amb caducitat de 24 hores. L'administrador comparteix l'enllaç individualment; l'aplicació no envia missatges automàtics en aquest flux.
- Contrasenya individual de mínim 12 caràcters, màxim 72 bytes UTF-8; emmagatzemada amb bcrypt. L'administrador no pot consultar contrasenyes.
- Segon factor obligatori per a Federació, associacions i administradors AVPC, amb autenticador TOTP i vuit codis de recuperació d'un sol ús. No necessita SMS de pagament.
- Sessions de vuit hores amb versió revocable i comprovació de compte, rol i associació en cada petició. Baixa, canvi de rol, recuperació i sortida invaliden sessions. Sortir també elimina les subscripcions push del compte.
- Tokens en sessionStorage; retirada de tokens antics de localStorage. La informació privada de l'API no es guarda a la cache offline, i s'eliminen les caches antigues api-cache. Sense connexió, es bloquegen les pantalles privades. sessionStorage segueix sent accessible al JavaScript de l'aplicació: no equival a immunitat davant XSS.
- Documents privats limitats a la seva AVPC i Federació. El voluntari només rep la seva assistència, no la llista d'altres persones. Les notificacions de pantalla bloquejada mostren un avís genèric.
- Límit d'intents d'accés i bloqueig temporal, CORS restringit, capçaleres de seguretat, CSP al web, límit i comprovació de tipus de fitxers. La comprovació de fitxers no és un antivirus.
- Baixa/reactivació de fitxes, exportació de les dades operatives i registre d'edicions/exportacions/eliminacions. El registre no inclou noms en el detall de noves accions sobre voluntaris. Els detalls històrics s'oculten a l'API però no s'han purgat.

## Primer accés després de publicar

Totes les sessions anteriors caduquen. Cada compte existent inicia sessió amb la contrasenya actual i crea una contrasenya pròpia abans d'accedir a dades. Un administrador configura després un autenticador i guarda els codis de recuperació fora de l'app. Els comptes nous entren amb una invitació.

Aquest canvi no converteix retroactivament una contrasenya compartida en una prova d'identitat: abans de comunicar el canvi, cada AVPC ha de comprovar qui controla el seu compte i qui pot rebre invitacions. Un atacant que ja conegui una contrasenya antiga podria intentar configurar el compte primer. Per comptes dubtosos, desactivar-los i verificar personalment el titular abans de reactivar i generar una invitació.

Si es perd l'autenticador, usar un codi de recuperació. Una invitació per canviar contrasenya NO desactiva el segon factor. Si també es perden tots els codis, cal un procediment d'identificació del titular i recuperació supervisada; no hi ha una porta d'accés universal.

## Configuració de producció

- Node 22.12 o posterior, preferiblement última revisió mantinguda de la versió 22.
- JWT_SECRET aleatori d'almenys 32 caràcters. No reutilitzar els exemples. La mateixa clau protegeix els secrets MFA mitjançant AES-256-GCM: no canviar-la sense un pla per migrar els secrets xifrats o tornar a configurar MFA.
- DATABASE_URL i DIRECT_URL privades, connexió TLS al proveïdor. FRONTEND_URL ha de ser l'origen públic exacte, sense barra final. VITE_API_URL és públic i no pot contenir secrets.
- Revisar a Render les capçaleres de render.yaml. Si el servei no està vinculat a aquest Blueprint, la configuració no s'aplica automàticament. La CSP inclosa a index.html sí que viatja amb la compilació.
- Revocar i substituir credencials de proveïdors que s'hagin compartit en missatges o dispositius no controlats, amb canvi coordinat a Render per evitar interrupcions. No guardar secrets en el repositori.

## Còpies de seguretat

Hi ha una eina de còpia xifrada a backend/scripts/backup.cjs i una prova de restauració amb dades fictícies. Això NO activa còpies periòdiques de producció. Cal decidir i configurar un destí privat, clau separada, periodicitat, retenció, permisos i alertes de fallada.

Variables de l'eina, només a l'entorn d'execució segur:

- BACKUP_DATABASE_URL: connexió d'origen, preferiblement directa.
- BACKUP_KEY: 32 bytes aleatoris expressats com 64 caràcters hexadecimals. Custòdia separada de la còpia.
- BACKUP_PATH: fitxer absolut nou. L'eina rebutja sobreescriure'l.
- PG_DUMP, PG_RESTORE i PSQL: binaris PostgreSQL compatibles amb la versió del servidor.
- BACKUP_RESTORE_DATABASE_URL: base buida aïllada amb nom acabat en _restore_test. Mai producció.

Executar `node scripts/backup.cjs backup` per generar la còpia; `node scripts/backup.cjs restore-test` per comprovar una restauració aïllada. Confirmar abans les opcions admeses al fitxer. La restauració comprova autenticitat del xifrat abans de restaurar i rebutja destins no buits. Provar periòdicament recomptes, documents i relacions; una còpia sense prova de restauració no és suficient.

La prova automatitzada cobreix recomptes, bytes dels documents, rebuig de sobreescriptura i xifrat manipulat. S'ha executat només amb dades fictícies en una base local temporal. No hi ha còpies de dades reals al PC per aquesta tasca.

## Decisions pendents de la Federació i assessorament

1. Identificar qui és responsable de cada tractament i el paper de cada AVPC, amb els acords corresponents. No assumir que una casella és consentiment vàlid per a qualsevol finalitat.
2. Definir finalitats, base jurídica, informació als voluntaris, contacte per exercir drets i terminis de resposta. El text del formulari només confirma que s'ha facilitat informació; no substitueix l'avís complet.
3. Aprovar terminis de conservació i el borrat dels camps històrics, incloses còpies, exportacions i documents que puguin contenir dades sobrants. Una exportació de l'app no cobreix per si sola tota la documentació ni camps històrics encara pendents de purga.
4. Revisar contractes amb proveïdors, regions reals d'allotjament i garanties de transferència quan correspongui. No s'ha canviat la regió de Neon ni Render.
5. Registrar activitats de tractament, avaluar riscos i establir un procediment d'incidents, recuperació i notificacions quan pertoqui.
6. Revisar usuaris amb permisos elevats, ús de comptes compartits, custòdia de claus i formació de responsables. Valorar una revisió independent de seguretat.

Fonts oficials consultades: [AEPD: protecció per defecte](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-por-defecto), [AEPD: bases legitimadores](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0214-cuales-son-las-bases-de-legitimacion-para-el-tratamiento-de-datos), [RGPD al BOE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807).

## Verificació executada abans de publicar

- Compilació TypeScript del servidor i compilació de la PWA.
- PostgreSQL real amb dades fictícies: permisos entre AVPC, documents, assistència pròpia, invitacions, MFA i recuperació, revocació de sessions i camps rebutjats.
- Edge aïllat, pantalla de 390 × 844: inici de sessió amb canvi de contrasenya i MFA, formulari mínim, bloqueig offline, eliminació de cache antiga i revocació en sortir.
- Còpia xifrada i restauració fictícia: recomptes i documents idèntics; rebuig de destí ocupat i xifrat manipulat.

Aquestes comprovacions no equivalen a una auditoria independent ni cobreixen la configuració real de tots els proveïdors.
