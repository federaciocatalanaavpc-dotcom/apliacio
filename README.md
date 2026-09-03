# AVPC Federació - Gestió d'Agrupacions

Aplicació de gestió per a la Federació Catalana d'Agrupacions de Voluntaris de
Protecció Civil (AVPC): membres, vehicles, material, estatuts, llibre d'actes,
formació i avisos de cada agrupació federada.

## Estructura
- `backend/` — API REST amb Node.js + Express + TypeScript + Prisma + PostgreSQL
- `frontend/` — App web (PWA) amb React + TypeScript + Vite

## Model de rols
- **Federació**: veu i gestiona totes les agrupacions, usuaris, membres, vehicles, material, documents, formació i avisos.
- **Agrupació**: gestiona només les dades de la seva pròpia agrupació (un usuari per agrupació, típicament el/la president/a o secretari/ària). Pot veure el material de la resta d'agrupacions en només lectura, per saber què hi ha disponible a prop en cas d'emergència.

## Posar en marxa el backend
```
cd backend
npm install
cp .env.example .env   # edita DATABASE_URL, JWT_SECRET i el PORT si cal
npx prisma migrate dev --name init
npm run dev
```
El servidor arrenca al port indicat a `.env` (per defecte `4000`).

## Posar en marxa el frontend
```
cd frontend
npm install
npm run dev
```
La web arrenca a `http://localhost:5173` (o el port configurat a `vite.config.ts`).
Si el backend no corre al port per defecte, crea `frontend/.env` amb:
```
VITE_API_URL=http://localhost:<port>/api
```

## Configurar les notificacions push (un sol cop)
1. A la carpeta `backend/`, executa: `npx web-push generate-vapid-keys`
2. Copia la clau pública i la privada resultants a `.env`, a `VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY`
3. Reinicia el backend
4. A la web, cada usuari ha d'entrar a "Avisos" i prémer "Activar notificacions" (un cop per dispositiu/navegador)

**Important**: no canviïs aquestes claus un cop els usuaris ja s'hagin subscrit, o hauran de tornar a activar les notificacions.

## Pujada de documents
Els fitxers (estatuts, actes, documentació de membres) es guarden al disc del
servidor (`backend/src/uploads/`). En desplegar a Render cal un *persistent
disk* muntat a aquesta carpeta perquè els fitxers no es perdin en cada deploy
(ja configurat a `render.yaml`).

## Nota important sobre el primer usuari
Com que crear usuaris requereix ja estar loguejat com a federació, cal crear
el primer usuari manualment via `POST /api/auth/registre` (amb una eina com
Postman/curl, o directament a la base de dades) abans de poder-hi entrar per
primer cop. Aquest primer usuari es crea sempre amb rol `FEDERACIO`.
