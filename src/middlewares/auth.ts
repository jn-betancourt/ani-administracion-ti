import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db } from '../data/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
    nombreCompleto: string;
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado',
      mensaje: 'Cabecera Authorization con formato Bearer <token> requerida.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      rol: string;
    };

    const user = db.findUserById(decoded.id);
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo o inexistente',
        mensaje: 'La sesión no es válida.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
      mensaje: 'Por favor inicie sesión nuevamente.'
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.rol) && req.user.rol !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        mensaje: `Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}
