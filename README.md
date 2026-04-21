# FitBalance base

Estructura inicial para trabajar con:

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Prisma 7 + SQLite (local) + LibSQL/Turso (opcional produccion)
- NextAuth (Google + Email/Password con verificacion)
- UI base con shadcn + Tailwind

## Requisitos

- Node.js 20+
- npm 10+

## Primer arranque

1. Instalar dependencias (ya ejecutado en esta preparacion):

```bash
npm install
```

2. Generar cliente Prisma:

```bash
npm run prisma:generate
```

3. Crear estructura de base local (SQLite):

```bash
npm run prisma:push
```

4. Levantar desarrollo:

```bash
npm run dev
```

## Variables de entorno

Archivo de ejemplo en .env.example.

En local:

```env
TURSO_DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_GENERATIVE_AI_API_KEY=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="FitBalance <no-reply@fitbalance.local>"
```

Configuracion requerida en Google Cloud (OAuth 2.0 Client ID):

- Authorized JavaScript origins:
	- `http://localhost:3000`
- Authorized redirect URIs:
	- `http://localhost:3000/api/auth/callback/google`

Si usas otro puerto local, debes registrar tambien ese puerto en Google (por ejemplo `http://localhost:3001/api/auth/callback/google`) o volver a levantar el proyecto en `3000`.

En produccion con Turso/libsql puedes usar:

```env
TURSO_DATABASE_URL="libsql://tu-db.turso.io"
TURSO_AUTH_TOKEN="tu_token"
AUTH_SECRET="tu_secret"
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

## Flujo de autenticacion

- Login: /users/login (Google + Email/Password)
- Callback auth: /api/auth/[...nextauth]
- Verificacion email: /users/verify-email?token=...
- Onboarding: /users/onboarding
- Modulo protegido: /users

## Onboarding implementado

1. Metricas base: fecha nacimiento, sexo, altura, peso, objetivo, actividad, velocidad.
2. Preferencias de comidas: seleccion por categorias + dias de dieta.
3. Cierre y calculo IA inicial: kcal, macros, agua y ETA de objetivo.

Pais fijo para esta version: Bolivia.

## Estructura inicial de usuarios

- Pagina lista: /users
- Pagina detalle: /users/[id]
- API auth: /api/auth/[...nextauth]
- API dieta IA (POST): /api/users/diet

## Estructura enterprise (resumen)

- UI login (login-02 adaptado): src/components/users/login/forms/login-form.tsx
- UI logout: src/components/users/login/forms/logout-form.tsx
- UI onboarding: src/components/users/onboarding/(atoms|molecules|organisms|templates)
- Logica login/guards: src/actions/server/users/auth
- Logica onboarding/calculo IA: src/actions/server/users/onboarding
- Auth config: src/actions/server/users/auth/config.ts
- Prisma client: src/actions/server/users/prisma.ts

## Scripts utiles

- npm run dev
- npm run build
- npm run lint
- npm run prisma:generate
- npm run prisma:push
- npm run prisma:migrate
- npm run prisma:studio
