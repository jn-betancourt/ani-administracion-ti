import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { config } from '../config/env';
import { AuthRequest } from '../middlewares/auth';
import { storageService } from '../services/storage.service';
import { telemetryService } from '../services/telemetry.service';
import { DocumentoANI } from '../data/seedProjects';

export class AdminController {
  public static login(req: AuthRequest, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Credenciales incompletas',
        mensaje: 'Debe ingresar email y password.'
      });
    }

    const user = db.findUserByEmail(email);
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Email o contraseña incorrectos.'
      });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Email o contraseña incorrectos.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol
      },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      mensaje: 'Autenticación exitosa',
      data: {
        token,
        usuario: {
          id: user.id,
          nombreCompleto: user.nombreCompleto,
          email: user.email,
          rol: user.rol,
          cargo: user.cargo
        }
      }
    });
  }

  public static getMe(req: AuthRequest, res: Response) {
    res.json({
      success: true,
      data: req.user
    });
  }

  // --- GESTIÓN DOCUMENTAL (REPOSITORIO ONEDRIVE / NFS) ---

  public static getAllDocumentos(req: AuthRequest, res: Response) {
    const { proyectoId, soloPublicos } = req.query;

    let docs: DocumentoANI[];
    if (proyectoId) {
      docs = db.getDocumentosByProyecto(proyectoId as string, soloPublicos === 'true');
    } else {
      docs = db.getAllDocumentos(soloPublicos === 'true');
    }

    res.json({
      success: true,
      total: docs.length,
      data: docs.map(d => ({
        ...d,
        enlaceDescarga: d.esPublico 
          ? `/api/v1/public/documentos/${d.id}/download` 
          : `/api/v1/admin/documentos/${d.id}/download`
      }))
    });
  }

  public static uploadDocumento(req: AuthRequest, res: Response) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Archivo requerido',
        mensaje: 'Debe adjuntar un archivo en el campo "archivo".'
      });
    }

    const { proyectoId, titulo, tipoDocumental, codigoDocumento, esPublico, resumen } = req.body;

    if (!proyectoId || !titulo || !tipoDocumental) {
      // Eliminar archivo subido si faltan metadatos
      storageService.deleteFile(req.file.filename);
      return res.status(400).json({
        success: false,
        error: 'Metadatos incompletos',
        mensaje: 'Debe ingresar proyectoId, titulo y tipoDocumental.'
      });
    }

    const nuevoDocumento: DocumentoANI = {
      id: `doc-${uuidv4().substring(0, 8)}`,
      proyectoId,
      codigoDocumento: codigoDocumento || `ANI-DOC-${Date.now().toString().slice(-4)}`,
      titulo,
      tipoDocumental: tipoDocumental.toUpperCase(),
      nombreArchivo: req.file.filename,
      pesoBytes: req.file.size,
      esPublico: esPublico === 'true' || esPublico === true,
      fechaPublicacion: new Date().toISOString().split('T')[0],
      resumen: resumen || 'Documento cargado desde el Panel de Administración de TI.'
    };

    db.addDocumento(nuevoDocumento);

    res.status(201).json({
      success: true,
      mensaje: 'Documento cargado exitosamente al repositorio NFS de la ANI.',
      data: nuevoDocumento
    });
  }

  public static deleteDocumento(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const doc = db.getDocumentoById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
    }

    storageService.deleteFile(doc.nombreArchivo);
    db.deleteDocumento(id);

    res.json({
      success: true,
      mensaje: `Documento [${doc.titulo}] eliminado del almacenamiento NFS y base de datos.`
    });
  }

  // --- GESTIÓN DE PQRSF INTERNA ---

  public static getAllPqrsf(req: AuthRequest, res: Response) {
    const { estado } = req.query;
    const items = db.getAllPqrsf(estado as string);

    res.json({
      success: true,
      total: items.length,
      data: items
    });
  }

  public static responderPqrsf(req: AuthRequest, res: Response) {
    const { radicado } = req.params;
    const { respuestaOficial } = req.body;

    if (!respuestaOficial || respuestaOficial.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Respuesta requerida',
        mensaje: 'Debe ingresar el texto de respuestaOficial.'
      });
    }

    const updated = db.responderPqrsf(radicado.toUpperCase(), respuestaOficial);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Radicado no encontrado'
      });
    }

    res.json({
      success: true,
      mensaje: `PQRSF ${updated.radicado} ha sido respondida oficialmente y archivada.`,
      data: updated
    });
  }

  // --- TELEMETRÍA Y SERVICIOS LINUX ---

  public static getTelemetriaServicios(req: AuthRequest, res: Response) {
    const system = telemetryService.getSystemMetrics();
    const services = telemetryService.getConsolidatedServicesHealth();

    res.json({
      success: true,
      servidorDokploy: system,
      serviciosLinuxConsolidados: services
    });
  }

  // --- GESTIÓN DE USUARIOS ---

  public static getUsuarios(req: AuthRequest, res: Response) {
    const usuarios = db.getUsuarios();
    res.json({
      success: true,
      total: usuarios.length,
      data: usuarios
    });
  }

  public static createUsuario(req: AuthRequest, res: Response) {
    const { email, nombreCompleto, password, rol, cargo } = req.body;

    if (!email || !nombreCompleto || !password || !rol) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos incompletos',
        mensaje: 'Debe ingresar email, nombreCompleto, password y rol.'
      });
    }

    if (db.findUserByEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Usuario ya existente',
        mensaje: `El correo [${email}] ya se encuentra registrado.`
      });
    }

    const nuevo = db.createUsuario({
      email,
      nombreCompleto,
      password,
      rol,
      cargo: cargo || 'Funcionario ANI'
    });

    res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado exitosamente',
      data: nuevo
    });
  }

  public static deleteUsuario(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const ok = db.deleteUsuario(id);
    if (!ok) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar',
        mensaje: 'El usuario no existe o se encuentra protegido (SuperAdmin).'
      });
    }

    res.json({
      success: true,
      mensaje: 'Usuario eliminado exitosamente'
    });
  }

  // --- CONSOLIDACIÓN SERVICIOS LINUX (MULTIPASS PLACEHOLDERS) ---

  public static getServiciosLinux(req: AuthRequest, res: Response) {
    const servicios = db.getServiciosLinux();
    res.json({
      success: true,
      mensaje: 'Configuración de enlaces e IPs placeholder para Servidor Linux (Multipass)',
      data: servicios
    });
  }

  public static updateServicioLinux(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { ipPlaceholder, puerto, estado, detalles, rutaRecurso } = req.body;

    const updated = db.updateServicioLinux(id, {
      ...(ipPlaceholder && { ipPlaceholder }),
      ...(puerto && { puerto: parseInt(puerto, 10) }),
      ...(estado && { estado }),
      ...(detalles && { detalles }),
      ...(rutaRecurso && { rutaRecurso })
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      mensaje: `Servicio [${updated.nombre}] actualizado con IP placeholder [${updated.ipPlaceholder}]`,
      data: updated
    });
  }

  // --- CLIENTES LAN (MULTIPASS PLACEHOLDERS) ---

  public static getClientesLAN(req: AuthRequest, res: Response) {
    const clientes = db.getClientesLAN();
    res.json({
      success: true,
      total: clientes.length,
      data: clientes
    });
  }

  public static createClienteLAN(req: AuthRequest, res: Response) {
    const { nombre, departamentoOcupante, tipoSO, servicioUtilizado, ipPlaceholder } = req.body;

    if (!nombre || !departamentoOcupante || !tipoSO || !servicioUtilizado) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos incompletos',
        mensaje: 'Debe ingresar nombre, departamentoOcupante, tipoSO y servicioUtilizado.'
      });
    }

    const nuevo = db.createClienteLAN({
      nombre,
      departamentoOcupante,
      tipoSO,
      servicioUtilizado,
      ipPlaceholder: ipPlaceholder || '10.88.199.PLACEHOLDER_IP',
      estado: 'PENDIENTE_MULTIPASS'
    });

    res.status(201).json({
      success: true,
      mensaje: 'Cliente LAN registrado',
      data: nuevo
    });
  }

  public static deleteClienteLAN(req: AuthRequest, res: Response) {
    const { id } = req.params;
    db.deleteClienteLAN(id);
    res.json({
      success: true,
      mensaje: 'Cliente eliminado'
    });
  }
}
