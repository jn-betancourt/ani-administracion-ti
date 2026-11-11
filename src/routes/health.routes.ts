import { Router, Request, Response } from 'express';
import { telemetryService } from '../services/telemetry.service';
import { config } from '../config/env';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const metrics = telemetryService.getSystemMetrics();

  res.status(200).json({
    estado: 'saludable',
    servicio: 'Backend API y Servidor Web ANI',
    entorno: config.nodeEnv,
    puerto: config.port,
    telemetria: metrics,
    plataforma: 'Dokploy PaaS / Docker Swarm / Traefik'
  });
});

export default router;
