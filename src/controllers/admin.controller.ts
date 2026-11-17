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
import { NtpClientService } from '../services/protocols/ntpClient.service';
import { NetworkProberService } from '../services/protocols/networkProber.service';
import { sharedStorageAdapter, SharedVolumeType } from '../services/abstraction/sharedStorage.adapter';
import { ntpTimeAdapter } from '../services/abstraction/ntpTime.adapter';

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
      fechaPublicacion: ntpTimeAdapter.getOfficialISOString().split('T')[0],
      resumen: resumen || 'Documento cargado desde el Panel de Administración de TI.'
    };

    db.addDocumento(nuevoDocumento);

    res.status(201).json({
      success: true,
      mensaje: 'Documento cargado exitosamente al repositorio NFS de la ANI con estampa horaria NTP.',
      data: nuevoDocumento
    });
  }

  public static downloadAdminDocumento(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const documento = db.getDocumentoById(id);

    if (!documento) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
    }

    const filePath = storageService.getFilePath(documento.nombreArchivo, 'nfs');
    if (!storageService.fileExists(documento.nombreArchivo, 'nfs')) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no disponible en el almacenamiento NFS'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${documento.nombreArchivo}"`);
    res.sendFile(filePath);
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

  public static async getTelemetriaServicios(req: AuthRequest, res: Response) {
    const system = telemetryService.getSystemMetrics();
    const services = await telemetryService.getConsolidatedServicesHealth();

    res.json({
      success: true,
      servidorDokploy: system,
      serviciosLinuxConsolidados: services
    });
  }

  public static async getServiciosLinuxEnVivo(req: AuthRequest, res: Response) {
    try {
      const services = await telemetryService.getConsolidatedServicesHealth();
      res.json({
        success: true,
        servidorLinuxIp: config.linuxServer.ip,
        data: services
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Error al consultar servicios en vivo',
        mensaje: err.message
      });
    }
  }

  public static async probarServicioLinux(req: AuthRequest, res: Response) {
    const { id } = req.params;

    try {
      let resultado: any;

      switch (id.toLowerCase()) {
        case 'ntp':
          resultado = await NtpClientService.queryTime(config.linuxServer.ntp, 123);
          break;
        case 'nfs':
          resultado = await NetworkProberService.probeNfs();
          break;
        case 'nis':
          resultado = await NetworkProberService.probeNis();
          break;
        case 'samba':
          resultado = await NetworkProberService.probeSamba();
          break;
        case 'cups':
          resultado = await NetworkProberService.probeCups();
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Servicio no reconocido',
            mensaje: `El id [${id}] no es válido. Opciones: ntp, nfs, nis, samba, cups.`
          });
      }

      res.json({
        success: true,
        servicioId: id,
        data: resultado
      });
    } catch (err: any) {
      res.status(502).json({
        success: false,
        servicioId: id,
        error: 'Fallo al ejecutar protocolo de prueba',
        mensaje: err.message
      });
    }
  }

  public static async getHoraOficialNtp(req: AuthRequest, res: Response) {
    try {
      const ntpState = await ntpTimeAdapter.forceSync();
      res.json({
        success: true,
        data: {
          servidor: ntpState.servidor,
          puerto: ntpState.puerto,
          estrato: ntpState.estrato,
          precision: -18,
          retardoRttMs: ntpState.rttMs,
          desviacionOffsetMs: ntpState.offsetMs,
          horaOficialServidor: ntpState.horaOficialActual,
          horaLocalCliente: ntpState.horaLocalSistema,
          sincronizado: ntpState.sincronizado,
          modo: ntpState.modo,
          detalles: ntpState.detalles
        }
      });
    } catch (err: any) {
      res.status(504).json({
        success: false,
        error: 'Servidor NTP no disponible',
        mensaje: err.message
      });
    }
  }

  public static getArchivosMontados(req: AuthRequest, res: Response) {
    const storageData = sharedStorageAdapter.getAllMountedStorageStatus();
    res.json({
      success: true,
      data: storageData
    });
  }

  public static async probarEscrituraVolumen(req: AuthRequest, res: Response) {
    const rawVol = (req.params.volumen || 'nfs').toLowerCase();
    const target: SharedVolumeType = rawVol === 'samba' ? 'samba' : 'nfs';

    try {
      const resultado = await sharedStorageAdapter.verifyReadWriteTest(target);
      res.json({
        success: true,
        mensaje: resultado.detalles,
        data: resultado
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Error en prueba de lectura/escritura',
        mensaje: err.message
      });
    }
  }

  public static subirArchivoVolumen(req: AuthRequest, res: Response) {
    const rawVol = (req.params.volumen || 'nfs').toLowerCase();
    const target: SharedVolumeType = rawVol === 'samba' ? 'samba' : 'nfs';

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Archivo requerido',
        mensaje: 'Debe adjuntar un archivo en el campo "archivo".'
      });
    }

    const volStatus = sharedStorageAdapter.getVolumeStatus(target);

    res.status(201).json({
      success: true,
      mensaje: `Archivo [${req.file.filename}] almacenado en volumen ${target.toUpperCase()} (${volStatus.rutaMonturaObjetivo}) sincronizado con NTP (${ntpTimeAdapter.getOfficialISOString()}).`,
      data: {
        nombre: req.file.filename,
        volumen: target,
        rutaMontura: `${volStatus.rutaMonturaObjetivo}/${req.file.filename}`,
        pesoBytes: req.file.size,
        fechaSincronizadaNtp: ntpTimeAdapter.getOfficialISOString()
      }
    });
  }

  public static descargarArchivoVolumen(req: AuthRequest, res: Response) {
    const rawVol = (req.params.volumen || 'nfs').toLowerCase();
    const target: SharedVolumeType = rawVol === 'samba' ? 'samba' : 'nfs';
    const { nombre } = req.params;

    const fullPath = sharedStorageAdapter.resolveFilePathForDownload(target, nombre);
    if (!fullPath) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado en el volumen montado'
      });
    }

    res.download(fullPath, nombre);
  }

  public static eliminarArchivoVolumen(req: AuthRequest, res: Response) {
    const rawVol = (req.params.volumen || 'nfs').toLowerCase();
    const target: SharedVolumeType = rawVol === 'samba' ? 'samba' : 'nfs';
    const { nombre } = req.params;

    const ok = sharedStorageAdapter.deleteFile(target, nombre);
    if (!ok) {
      return res.status(404).json({
        success: false,
        error: 'No se pudo eliminar el archivo o no existe'
      });
    }

    res.json({
      success: true,
      mensaje: `Archivo [${nombre}] eliminado del volumen ${target.toUpperCase()}.`
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
