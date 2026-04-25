# MentaCut ✂️

> Acortador de URLs rápido, gratuito y sin registro — similar a [ClipShort](https://www.clipshort.co/es).

![MentaCut screenshot](https://github.com/user-attachments/assets/2b0e7728-9fb3-4d2f-bb34-bdbcce8e080f)

## Características

- ⚡ **Instantáneo** — acorta cualquier URL en menos de un segundo
- 🔒 **Sin registro** — sin cuentas, sin formularios complicados
- 📊 **Estadísticas** — contador de clics en tiempo real por enlace
- 📱 **Código QR** — generado automáticamente para cada enlace corto
- 🔁 **Deduplicación** — la misma URL siempre produce el mismo código corto

## Tecnología

| Capa | Tecnología |
|------|-----------|
| Servidor | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| Base de datos | [SQLite](https://www.sqlite.org/) vía [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Códigos únicos | [nanoid](https://github.com/ai/nanoid) (7 caracteres alfanuméricos) |
| Frontend | HTML5 / CSS3 / Vanilla JS (sin dependencias externas) |
| QR | Librería QR pura en JS incluida (`public/qr.js`) |

## Instalación y uso

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor (puerto 3000 por defecto)
npm start
```

Abre `http://localhost:3000` en tu navegador.

### Variables de entorno opcionales

| Variable | Por defecto | Descripción |
|----------|------------|-------------|
| `PORT` | `3000` | Puerto del servidor HTTP |
| `BASE_URL` | `http://localhost:PORT` | URL base para los enlaces cortos generados |
| `DB_PATH` | `./mentacut.db` | Ruta del fichero SQLite (`:memory:` para pruebas) |

### Ejemplo con dominio propio

```bash
BASE_URL=https://menta.cut PORT=80 npm start
```

## API

### `POST /api/shorten`

Acorta una URL.

**Body:** `{ "url": "https://..." }`

**Respuesta 201:**
```json
{
  "short_url": "http://localhost:3000/fuYTazx",
  "code": "fuYTazx",
  "original": "https://...",
  "clicks": 0
}
```

### `GET /:code`

Redirige (301) a la URL original e incrementa el contador de clics.

### `GET /api/stats/:code`

Devuelve las estadísticas de un enlace.

### `GET /api/stats`

Devuelve las estadísticas globales (`total_urls`, `total_clicks`).

## Tests

```bash
npm test
```

Ejecuta 10 tests de integración contra una base de datos en memoria.

## Licencia

MIT
