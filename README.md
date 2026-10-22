# SGO · Maestranza Mena

Sistema de Gestión de Operaciones. **Estado actual: mockup.** Datos de ejemplo en `src/lib/mock.ts`. El CRUD (OTR, materiales, tareas, evidencia) funciona solo en pantalla: vive en memoria (`src/lib/store.ts`) y se reinicia al recargar. Sin backend ni autenticación real.

Stack: Next.js (App Router) · React · Mantine UI · PostgreSQL 16 (infra lista, aún sin uso).

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint         # typecheck
```

Responsivo (escritorio, tablet, móvil), modo claro/oscuro y manifest PWA.

> En WSL sobre `/mnt/c`, `next dev` no detecta cambios sin polling: `WATCHPACK_POLLING=true npm run dev`.

> Si `npm run build` falla con un error de Turbopack («Cannot allocate memory»; ocurre en WSL sobre `/mnt/c`), usar `npx next build --webpack`. El `Dockerfile` ya lo hace.

## Módulos y roles (mockup)

Quince pantallas, todas con CRUD en pantalla (memoria, se reinicia al recargar) y datos de ejemplo en `src/lib/mock.ts`.

| Operación | Calidad | Comercial | Abastecimiento | Equipo | Administración |
|---|---|---|---|---|---|
| Inicio · Seguimiento · Tablero · Gantt · Capacidad · Máquinas | Evidencia · No conformidades (+ certificados y dossier ISO en cada OTR) | Cotizador · Clientes | Inventario · Compras · Calculadora de acero | Tareas · Reportes | Configuración |

- **Configuración** (`/configuracion`, solo roles con permiso de administración): General (empresa, IVA, tarifa, seguridad), Usuarios (invitar, suspender, cambiar rol), Roles y permisos (matriz editable de acciones y pantallas, roles propios), Planta (capacidad, stock mínimo, semáforos), Notificaciones y Auditoría. Los parámetros se usan en Capacidad, Inventario, Compras, Cotizador y la campana.
- **Roles** (`src/lib/roles.ts`): Gerencia, Comercial, Producción, Bodega y Adquisiciones, Calidad, más los que crees. El selector «Rol» de la barra superior permite ver la app como cada uno. En producción esto debe salir del login (Google + rol asignado) y validarse en el servidor.
- **Flujo comercial a planta:** Cotizador → (aprobada) OTR con cubicación inicial → Compras si faltan materiales → Capacidad para no sobrecargar un área.
- **Piso:** hoja de ruta con QR (`/avance/[token]`), funciona sin señal con cola de cambios (`public/sw.js`, `src/lib/offline.ts`).
- **Cliente:** enlace de solo lectura `/estado/[token]`.
- **Atajos:** `Ctrl K` busca, `?` lista los atajos, `g` + letra navega, `n` crea una OTR.
- **Carga:** cada cambio de pantalla muestra una barra superior y un velo con la marca (`src/components/RouteLoader.tsx`).

> Verificación: `npx tsc --noEmit` y `npx next build --webpack`. En WSL sobre `/mnt/c`, `next dev` necesita `WATCHPACK_POLLING=true`.

## Infraestructura (VPS)

```
Internet ─443→ Caddy (TLS automático) ─→ web :3000 (Next standalone) ─→ db :5432 (Postgres, red interna)
```

Todo corre con Docker Compose en un único VPS. Postgres **no** publica puertos al host.

### Requisitos del VPS
- Ubuntu 22.04/24.04, 2 vCPU / 2 GB RAM mínimo (4 GB recomendado para compilar en el servidor).
- Dominio con registro A hacia la IP del VPS (ej. `sgo.maestranzamena.com`).

### 1. Preparar servidor
```bash
adduser deploy && usermod -aG sudo deploy
# SSH solo por llave; deshabilitar password en /etc/ssh/sshd_config
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
curl -fsSL https://get.docker.com | sh && usermod -aG docker deploy
apt install -y caddy
```

### 2. Desplegar
```bash
sudo mkdir -p /opt/sgo && sudo chown deploy: /opt/sgo
git clone <repo> /opt/sgo && cd /opt/sgo
cp .env.example .env        # editar: contraseña de Postgres, secretos
docker compose up -d --build
```

### 3. TLS y dominio
```bash
sudo cp infra/Caddyfile /etc/caddy/Caddyfile   # ajustar dominio
sudo systemctl reload caddy
```

### 4. Respaldos
```bash
sudo crontab -e   # 0 3 * * * POSTGRES_USER=sgo POSTGRES_DB=sgo /opt/sgo/infra/backup.sh
```
Restaurar: `gunzip -c sgo-AAAA-MM-DD.sql.gz | docker compose exec -T db psql -U sgo sgo`

### Actualizar
```bash
cd /opt/sgo && git pull && docker compose up -d --build
```

## Pendiente para pasar de mockup a sistema
- Autenticación: Google OAuth restringido a `@maestranzamena.com` (Auth.js) y roles (Adquisiciones, Bodega, Comercial, Gerencia…).
- Esquema Postgres + ORM (OTR, lotes, ítems de cubicación, movimientos de stock, HH, tareas) y migraciones.
- Reemplazar `src/lib/mock.ts` por consultas/Server Actions.
- Logo oficial: reemplazar `public/logo.svg` (hoy es un placeholder).
