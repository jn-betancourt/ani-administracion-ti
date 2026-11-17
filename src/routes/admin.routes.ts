import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { storageService } from '../services/storage.service';

const router = Router();

// --- AUTENTICACIÓN ---
router.post('/auth/login', AdminController.login);
router.get('/auth/me', authenticateJWT, AdminController.getMe);

// --- GESTIÓN DOCUMENTAL (NFS / ONEDRIVE SIMULADO) ---
router.get(
  '/documentos', 
  authenticateJWT, 
  requireRole(['ADMIN_TI', 'GESTOR_DOCUMENTAL']), 
  AdminController.getAllDocumentos
);

router.post(
  '/documentos/upload', 
  authenticateJWT, 
  requireRole(['ADMIN_TI', 'GESTOR_DOCUMENTAL']), 
  storageService.uploadMiddleware.single('archivo'), 
  AdminController.uploadDocumento
);

router.delete(
  '/documentos/:id', 
  authenticateJWT, 
  requireRole(['ADMIN_TI']), 
  AdminController.deleteDocumento
);

// --- GESTIÓN DE PQRSF INTERNA ---
router.get(
  '/pqrsf', 
  authenticateJWT, 
  requireRole(['ADMIN_TI', 'ATENCION_CIUDADANO', 'GESTOR_DOCUMENTAL']), 
  AdminController.getAllPqrsf
);

router.patch(
  '/pqrsf/:radicado/responder', 
  authenticateJWT, 
  requireRole(['ADMIN_TI', 'ATENCION_CIUDADANO']), 
  AdminController.responderPqrsf
);

// --- TELEMETRÍA Y ESTADO DE SERVICIOS LINUX ---
router.get(
  '/telemetria/servicios', 
  authenticateJWT, 
  requireRole(['ADMIN_TI']), 
  AdminController.getTelemetriaServicios
);

// --- GESTIÓN DE USUARIOS ---
router.get(
  '/usuarios',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.getUsuarios
);

router.post(
  '/usuarios',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.createUsuario
);

router.delete(
  '/usuarios/:id',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.deleteUsuario
);

// --- CONSOLIDACIÓN SERVICIOS LINUX (MULTIPASS 10.88.199.195) ---
router.get(
  '/servicios-linux/en-vivo',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.getServiciosLinuxEnVivo
);

router.post(
  '/servicios-linux/:id/probar',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.probarServicioLinux
);

router.get(
  '/servicios-linux/ntp/hora-oficial',
  authenticateJWT,
  requireRole(['ADMIN_TI', 'ATENCION_CIUDADANO', 'GESTOR_DOCUMENTAL']),
  AdminController.getHoraOficialNtp
);

router.get(
  '/servicios-linux/archivos-montados',
  authenticateJWT,
  requireRole(['ADMIN_TI', 'GESTOR_DOCUMENTAL']),
  AdminController.getArchivosMontados
);

router.get(
  '/servicios-linux',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.getServiciosLinux
);

router.patch(
  '/servicios-linux/:id',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.updateServicioLinux
);

router.put(
  '/servicios-linux/:id',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.updateServicioLinux
);

// --- CLIENTES LAN (MULTIPASS PLACEHOLDERS) ---
router.get(
  '/clientes-lan',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.getClientesLAN
);

router.post(
  '/clientes-lan',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.createClienteLAN
);

router.delete(
  '/clientes-lan/:id',
  authenticateJWT,
  requireRole(['ADMIN_TI']),
  AdminController.deleteClienteLAN
);

export default router;
