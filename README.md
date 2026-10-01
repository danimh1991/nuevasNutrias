# Nuevas nutrias

Aplicación privada para registrar el crecimiento infantil: peso, estatura y perímetro craneal, con perfiles independientes y curvas percentilares OMS de 0 a 5 años.

## Entornos

- Local: raíz `/`, D1 local de Wrangler y acceso directo de desarrollo.
- OpenAI Sites: raíz `/`, D1 administrada por Sites y acceso privado de Sites.
- Cloudflare Workers: `/nuevasnutrias`, D1 `nuevas-nutrias-db` y código de acceso guardado como secretos del Worker.

## Desarrollo local

```bash
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mature_rhino.sql
npm run dev
```

La aplicación local queda en `http://127.0.0.1:5173/`. Los datos locales no se mezclan con producción.

## Cloudflare

La configuración está en `wrangler.cloudflare.jsonc`. El despliegue genera una compilación con `basePath=/nuevasnutrias`, aplica las migraciones D1 pendientes y publica el Worker y su ruta:

```bash
npm run deploy:cloudflare
```

Los secretos necesarios se configuran una vez por cuenta y nunca se guardan en Git:

```bash
npx wrangler secret put APP_ACCESS_CODE --config wrangler.cloudflare.jsonc
npx wrangler secret put APP_SESSION_TOKEN --config wrangler.cloudflare.jsonc
```

`APP_ACCESS_CODE` es el código que introduce la familia. `APP_SESSION_TOKEN` debe ser una cadena aleatoria larga.

## OpenAI Sites

`.openai/hosting.json` conserva el proyecto de Sites y declara la base D1 lógica `DB`. El flujo de publicación de Sites utiliza la compilación normal:

```bash
npm run build
```

No uses `build:cloudflare` para empaquetar Sites, porque esa variante añade el prefijo `/nuevasnutrias`.

## Datos de crecimiento

Las tablas de `app/growth-data.ts` proceden de los estándares oficiales de crecimiento infantil de la OMS para peso, longitud/estatura y perímetro craneal. La aplicación es una herramienta de registro y no sustituye la valoración pediátrica.
