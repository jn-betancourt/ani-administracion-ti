import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares de seguridad y observabilidad
// Se desactivan HSTS (Strict-Transport-Security) y COOP/CORP para permitir acceso HTTP directo
// por IP (10.88.199.214), localhost y túneles inversos sin que el navegador fuerce HTTPS.
app.use(helmet({
  contentSecurityPolicy: false,
  strictTransportSecurity: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false
}));
app.use(cors({
  origin: config.corsOrigin
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servidor Web Estático: Portal Institucional ANI
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Servidor SPA de Administración (React / Vite) integrado en el mismo dominio (/admin)
const adminSpaDir = path.join(__dirname, '../admin_spa/dist');
if (fs.existsSync(adminSpaDir)) {
  app.use('/admin', express.static(adminSpaDir, { redirect: false }));
  app.use('/assets', express.static(path.join(adminSpaDir, 'assets')));
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(adminSpaDir, 'index.html'));
  });
}

// Healthcheck y Monitoreo (Dokploy / Traefik)
app.use('/health', healthRoutes);

// Enrutamiento de la Backend API (v1)
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

// Endpoint de Información y Contrato de la API
app.get('/api/v1/info', (req, res) => {
  res.json({
    entidad: 'Agencia Nacional de Infraestructura - ANI',
    proyecto: 'Consolidación de Servicios TI',
    serviciosExpuestosPublicos: [
      {
        nombre: '1. Catálogo de Proyectos e Información Documental',
        descripcion: 'Consulta pública de proyectos y descarga de pliegos y resoluciones PDF',
        rutas: [
          'GET /api/v1/public/proyectos',
          'GET /api/v1/public/proyectos/:id',
          'GET /api/v1/public/proyectos/:id/documentos',
          'GET /api/v1/public/documentos/:id/download'
        ]
      },
      {
        nombre: '2. Ventanilla Única de Radicación y Seguimiento PQRSF',
        descripcion: 'Radicación de peticiones ciudadanas y seguimiento con radicado único',
        rutas: [
          'POST /api/v1/public/pqrsf',
          'GET /api/v1/public/pqrsf/:radicado'
        ]
      }
    ],
    servidorEstatico: 'Portal Web Institucional servido en /',
    serviciosPrivados: 'Rutas administrativas protegidas bajo /api/v1/admin/*',
    documentacionSwagger: '/api/v1/openapi.json',
    version: '1.0.0'
  });
});

// Manejadores de errores y 404
app.use(notFoundHandler);
app.use(errorHandler);

// Inicialización del Servidor
const server = app.listen(config.port, () => {
  console.log(`==================================================================`);
  console.log(`  🏛️  AGENCIA NACIONAL DE INFRAESTRUCTURA (ANI) - SERVIDOR WEB API `);
  console.log(`==================================================================`);
  console.log(`  🚀 Servidor activo en puerto: ${config.port}`);
  console.log(`  🌐 Portal Web Estático:       http://localhost:${config.port}/`);
  console.log(`  🛡️  Panel SPA Administración:  http://localhost:${config.port}/admin`);
  console.log(`  📋 Servicio 1 (Proyectos):   http://localhost:${config.port}/api/v1/public/proyectos`);
  console.log(`  📬 Servicio 2 (PQRSF):       http://localhost:${config.port}/api/v1/public/pqrsf`);
  console.log(`  🩺 Health Check:             http://localhost:${config.port}/health`);
  console.log(`  📁 Repositorio NFS:          ${config.storagePath}`);
  console.log(`==================================================================`);
});

export default server;
