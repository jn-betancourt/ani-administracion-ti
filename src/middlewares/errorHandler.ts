import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR HANDLER]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    mensaje: message,
    timestamp: new Date().toISOString()
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    mensaje: `La ruta solicitada [${req.method} ${req.originalUrl}] no existe en este servidor.`,
    rutasDisponibles: {
      portalPublico: '/',
      servicioPublico1: '/api/v1/public/proyectos',
      servicioPublico2: '/api/v1/public/pqrsf',
      health: '/health'
    }
  });
}
