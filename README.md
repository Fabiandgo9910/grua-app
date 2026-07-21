# Gestión de Grúas

App web (Next.js + Tailwind + Supabase), instalable como PWA en móvil, tablet y escritorio, desplegada en Vercel. Datos en tiempo real + **notificaciones push reales** (funcionan aunque cierres la app), avisando cada día que falten 7 días o menos para la ITV.

## 1. Crear la base de datos (Supabase — gratis)
1. Ve a https://supabase.com → "New project".
2. **SQL Editor** → pega `supabase/schema.sql` → Run.
3. **SQL Editor** → pega también `supabase/schema_push.sql` → Run (tabla de suscripciones push).
4. En **Project Settings → API** copia `Project URL` y `anon public key`.

## 2. Configurar el proyecto localmente
```bash
npm install
cp .env.local.example .env.local
# pega tu URL y anon key de Supabase en .env.local
# (las claves VAPID ya vienen puestas, listas para usar)
npm run dev
```
Abre http://localhost:3000

Nota: en local (http, no https) el navegador puede bloquear el registro del
service worker o el push. Para probarlo de verdad, hazlo desde la URL ya
desplegada en Vercel (https siempre funciona).

## 3. Iconos de la PWA
Añade en `public/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## 4. Desplegar en Vercel
1. Sube el proyecto a un repo de GitHub.
2. En https://vercel.com → "Add New Project" → importa el repo.
3. En **Environment Variables** añade las 5 variables de tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `CRON_SECRET`
4. Deploy. Vercel detecta automáticamente `vercel.json` y programa el cron
   diario (revisa las ITV todos los días a las 8:00 UTC — cámbialo si quieres
   otra hora, es hora UTC, no hora de España).

## 5. Instalar en los dispositivos
- **Android (Chrome):** abrir la URL → menú (⋮) → "Añadir a pantalla de inicio".
- **iPhone (Safari, iOS 16.4+):** abrir la URL → compartir → "Añadir a pantalla de inicio".
  Importante: en iPhone el push **solo** funciona si la app está instalada así,
  no sirve desde Safari sin instalar.
- **PC (Chrome/Edge):** icono de instalar en la barra de direcciones.

## 6. Activar las notificaciones
Al entrar en la app verás un aviso azul "Activar" — tócalo y acepta el
permiso del navegador. Eso registra el dispositivo en `push_subscriptions`.
Repite esto en cada dispositivo/móvil desde el que quieras recibir el aviso.

## Cómo funciona el aviso automático
Cada día, Vercel ejecuta solo (sin que nadie abra la app) el endpoint
`/api/check-itv`. Ese endpoint:
1. Mira todas las grúas y su próxima ITV.
2. Si alguna tiene 7 días o menos (y no ha pasado ya), manda un push a
   **todos** los dispositivos activados — con sonido y notificación del
   sistema, aunque el móvil esté bloqueado y la app cerrada.
3. Como se ejecuta una vez al día, el aviso se repite automáticamente
   los 7 días hasta que pasa la ITV.
4. Si algún dispositivo se desinstaló la app, su suscripción caducada se
   borra sola de la base de datos.

Puedes probarlo a mano en cualquier momento visitando en el navegador
(estando ya desplegado en Vercel):
`https://tu-app.vercel.app/api/check-itv` — pero si pusiste `CRON_SECRET`,
esa llamada manual dará "No autorizado" (401), porque solo Vercel Cron
conoce ese secreto. Para probar a mano, quita temporalmente `CRON_SECRET`
o pruébalo antes de configurarlo.

## Siguientes pasos opcionales
- **Login de usuarios:** Supabase Auth + ajustar las políticas RLS de
  "acceso total" a "solo autenticados".
- **Subir fotos/facturas del taller:** Supabase Storage + campo
  `adjunto_url` en `historial_taller`.
- **Avisar por grúa a personas distintas:** añadir una tabla de relación
  entre `push_subscriptions` y responsables por grúa, en vez de avisar
  siempre a todos los dispositivos.
