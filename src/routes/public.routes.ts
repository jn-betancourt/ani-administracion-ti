import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();

// ============================================================================
// SERVICIO PÚBLICO 1: Catálogo de Proyectos y Documentos Oficiales
// ============================================================================
router.get('/proyectos', PublicController.getProyectos);
router.get('/proyectos/:id', PublicController.getProyectoById);
router.get('/proyectos/:id/documentos', PublicController.getProyectoDocumentos);
router.get('/documentos/:id/download', PublicController.downloadDocumento);

// ============================================================================
// SERVICIO PÚBLICO 2: Ventanilla Única de Radicación y Seguimiento de PQRSF
// ============================================================================
router.post('/pqrsf', PublicController.createPqrsf);
router.get('/pqrsf/:radicado', PublicController.getPqrsfByRadicado);

export default router;
