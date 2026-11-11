# ANI Web Server & Backend API — Consolidación de Servicios TI

Proyecto desarrollado para la asignatura de **Administración de Infraestructura de TI** (Universidad del Quindío, 2026-2). Simula el contrato de administración y consolidación de servicios para la **Agencia Nacional de Infraestructura (ANI)** de Colombia, desplegable en la plataforma PaaS **Dokploy** con proxy inverso **Traefik** e integración con servicios de servidor Linux LAN.

---

## 1. Arquitectura y Superficie de Exposición

Siguiendo el principio de menor privilegio y reducción de superficie de ataque, la arquitectura expone:

1. **Servidor Web Estático (Portal Institucional):** Accesible públicamente en `/` sirviendo la página web oficial de la ANI (concesiones, noticias, canales de atención).
2. **Servicio Público 1 (Catálogo de Proyectos y Documentos):**
   - `GET /api/v1/public/proyectos` (Filtros: modo, estado, departamento, búsqueda, paginación).
   - `GET /api/v1/public/proyectos/:id` (Ficha técnica y anexos).
   - `GET /api/v1/public/proyectos/:id/documentos` (Listado de documentos públicos).
   - `GET /api/v1/public/documentos/:id/download` (Descarga directa de resoluciones y pliegos PDF).
3. **Servicio Público 2 (Ventanilla Única PQRSF):**
   - `POST /api/v1/public/pqrsf` (Radicación ciudadana con generación de radicado único, e.g. `ANI-2026-PQRSF-001050`).
   - `GET /api/v1/public/pqrsf/:radicado` (Consulta de estado del trámite en tiempo real).
4. **Servicios Privados / Administrativos (JWT + RBAC):**
   - Panel de control bajo `/api/v1/admin/*` para carga de documentos oficiales hacia el almacenamiento NFS, respuesta oficial a PQRSF y telemetría de servicios Linux (NTP, NFS, NIS, Samba, CUPS).

---

## 2. Pila Tecnológica
- **Runtime:** Node.js v20/v22 LTS
- **Lenguaje:** TypeScript / Express.js
- **Seguridad:** Helmet, CORS, JWT Bearer Tokens, Bcrypt
- **Manejo de Archivos:** Multer con persistencia en volumen desacoplado NFS (`./storage/nfs_docs`)
- **Contenedores:** Dockerfile multi-stage (`node:20-alpine`) y Docker Compose
- **Orquestación y Enrutamiento:** Dokploy PaaS / Docker Swarm con Traefik Reverse Proxy

---

## 3. Instrucciones de Ejecución

### Modo Desarrollo Local
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo con recarga automática
npm run dev

# Acceder en el navegador:
# http://localhost:3000/
```

### Compilación y Producción
```bash
# Compilar TypeScript a JavaScript
npm run build

# Iniciar servidor en producción
npm start
```

### Ejecución con Docker Compose
```bash
docker compose up -d --build

# Ver logs en vivo
docker compose logs -f
```

---

## 4. Pruebas y Verificación de Endpoints (cURL)

### 1. Healthcheck
```bash
curl -s http://localhost:3000/health | jq
```

### 2. Catálogo de Proyectos (Servicio Público 1)
```bash
# Listar todos los proyectos
curl -s http://localhost:3000/api/v1/public/proyectos | jq

# Filtrar por modo férreo
curl -s "http://localhost:3000/api/v1/public/proyectos?modo=FERREO" | jq

# Descargar documento PDF público
curl -O -J http://localhost:3000/api/v1/public/documentos/doc-001-res-bog-gir/download
```

### 3. Ventanilla PQRSF (Servicio Público 2)
```bash
# Radicar nueva petición ciudadana
curl -X POST http://localhost:3000/api/v1/public/pqrsf \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PETICION",
    "nombreSolicitante": "Veeduría Ciudadana Quindío",
    "correoElectronico": "veeduria@quindio.gov.co",
    "asunto": "Consulta de avance túneles autopista",
    "descripcion": "Solicitamos el cronograma de apertura vehicular."
  }' | jq

# Consultar radicado
curl -s http://localhost:3000/api/v1/public/pqrsf/ANI-2026-PQRSF-001048 | jq
```

### 4. Acceso Administrativo y Telemetría TI
```bash
# Login funcionario TI
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ani.gov.co","password":"adminANI2026!"}' | jq -r '.data.token')

# Consultar estado de servicios Linux (NTP, NFS, NIS, Samba, CUPS)
curl -s http://localhost:3000/api/v1/admin/telemetria/servicios \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 5. Credenciales Administrativas Preconfiguradas
- **Email:** `admin@ani.gov.co`
- **Contraseña:** `adminANI2026!`
- **Rol:** `ADMIN_TI`
