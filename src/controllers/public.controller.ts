import { Request, Response } from 'express';
import { db } from '../data/db';
import { storageService } from '../services/storage.service';

export class PublicController {
  // === SERVICIO PÚBLICO 1: PROYECTOS Y DOCUMENTOS PÚBLICOS ===

  public static getProyectos(req: Request, res: Response) {
    const { modo, estado, departamento, search, page, limit } = req.query;

    const result = db.getProyectos({
      modo: modo as string,
      estado: estado as string,
      departamento: departamento as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    res.json({
      success: true,
      servicio: "Catálogo Público de Concesiones de Infraestructura ANI",
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      },
      data: result.data.map(p => ({
        ...p,
        totalDocumentosPublicos: db.getDocumentosByProyecto(p.id, true).length,
        enlaceDetalle: `/api/v1/public/proyectos/${p.id}`,
        enlaceDocumentos: `/api/v1/public/proyectos/${p.id}/documentos`
      }))
    });
  }

  public static getProyectoById(req: Request, res: Response) {
    const { id } = req.params;
    const proyecto = db.getProyectoById(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado',
        mensaje: `No existe ningún proyecto registrado con el identificador [${id}].`
      });
    }

    const documentos = db.getDocumentosByProyecto(proyecto.id, true).map(d => ({
      ...d,
      enlaceDescarga: `/api/v1/public/documentos/${d.id}/download`
    }));

    res.json({
      success: true,
      data: {
        ...proyecto,
        documentosPublicos: documentos
      }
    });
  }

  public static getProyectoDocumentos(req: Request, res: Response) {
    const { id } = req.params;
    const proyecto = db.getProyectoById(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado',
        mensaje: `No existe ningún proyecto registrado con el identificador [${id}].`
      });
    }

    const docs = db.getDocumentosByProyecto(proyecto.id, true).map(d => ({
      ...d,
      enlaceDescarga: `/api/v1/public/documentos/${d.id}/download`
    }));

    res.json({
      success: true,
      proyecto: {
        id: proyecto.id,
        codigo: proyecto.codigo,
        nombre: proyecto.nombre
      },
      total: docs.length,
      data: docs
    });
  }

  public static downloadDocumento(req: Request, res: Response) {
    const { id } = req.params;
    const documento = db.getDocumentoById(id);

    if (!documento) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado',
        mensaje: `No existe el documento con ID [${id}].`
      });
    }

    if (!documento.esPublico) {
      return res.status(403).json({
        success: false,
        error: 'Acceso Restringido',
        mensaje: 'Este documento es de carácter confidencial o de uso interno. Requiere autenticación administrativa.'
      });
    }

    const filePath = storageService.getFilePath(documento.nombreArchivo);

    if (!storageService.fileExists(documento.nombreArchivo)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no disponible en el almacenamiento NFS',
        mensaje: 'El archivo físico no se encuentra en el repositorio.'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${documento.nombreArchivo}"`);
    res.sendFile(filePath);
  }

  // === SERVICIO PÚBLICO 2: VENTANILLA ÚNICA DE PQRSF ===

  public static createPqrsf(req: Request, res: Response) {
    const {
      tipo,
      nombreSolicitante,
      tipoDocumento,
      numeroDocumento,
      correoElectronico,
      telefono,
      asunto,
      descripcion,
      proyectoRelacionadoId
    } = req.body;

    if (!tipo || !nombreSolicitante || !correoElectronico || !asunto || !descripcion) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos incompletos',
        mensaje: 'Debe ingresar tipo, nombreSolicitante, correoElectronico, asunto y descripcion.'
      });
    }

    const tiposValidos = ['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION'];
    if (!tiposValidos.includes(tipo.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de PQRSF inválido',
        mensaje: `Los tipos válidos son: ${tiposValidos.join(', ')}`
      });
    }

    const newPqrsf = db.createPqrsf({
      tipo: tipo.toUpperCase(),
      nombreSolicitante,
      tipoDocumento: tipoDocumento || 'CC',
      numeroDocumento: numeroDocumento || '0',
      correoElectronico,
      telefono: telefono || '',
      asunto,
      descripcion,
      proyectoRelacionadoId
    });

    res.status(201).json({
      success: true,
      mensaje: 'Su solicitud ha sido radicada exitosamente ante la Agencia Nacional de Infraestructura (ANI).',
      data: {
        radicado: newPqrsf.radicado,
        tipo: newPqrsf.tipo,
        solicitante: newPqrsf.nombreSolicitante,
        fechaRadicacion: newPqrsf.fechaRadicacion,
        fechaLimiteRespuesta: newPqrsf.fechaLimiteRespuesta,
        dependenciaAsignada: newPqrsf.dependenciaAsignada,
        estado: newPqrsf.estado,
        enlaceConsulta: `/api/v1/public/pqrsf/${newPqrsf.radicado}`
      }
    });
  }

  public static getPqrsfByRadicado(req: Request, res: Response) {
    const { radicado } = req.params;
    const item = db.getPqrsfByRadicado(radicado.toUpperCase().trim());

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Radicado no encontrado',
        mensaje: `No se encontró ningún trámite con el número de radicado [${radicado}].`
      });
    }

    res.json({
      success: true,
      data: {
        radicado: item.radicado,
        tipo: item.tipo,
        asunto: item.asunto,
        estado: item.estado,
        dependenciaAsignada: item.dependenciaAsignada,
        fechaRadicacion: item.fechaRadicacion,
        fechaLimiteRespuesta: item.fechaLimiteRespuesta,
        respuestaOficial: item.respuestaOficial || null,
        fechaRespuesta: item.fechaRespuesta || null
      }
    });
  }
}
