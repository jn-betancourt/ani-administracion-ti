export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: 'SUPER_ADMIN' | 'ADMIN_TI' | 'GESTOR_DOCUMENTAL' | 'ATENCION_CIUDADANO';
  cargo: string;
  activo: boolean;
}

export interface Documento {
  id: string;
  proyectoId: string;
  codigoDocumento: string;
  titulo: string;
  tipoDocumental: 'PLIEGO' | 'RESOLUCION' | 'CONTRATO' | 'INFORME_TECNICO' | 'ACTA_INICIO';
  nombreArchivo: string;
  pesoBytes: number;
  esPublico: boolean;
  fechaPublicacion: string;
  resumen: string;
  enlaceDescarga?: string;
}

export interface PQRSF {
  radicado: string;
  tipo: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'FELICITACION';
  nombreSolicitante: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correoElectronico: string;
  telefono: string;
  asunto: string;
  descripcion: string;
  proyectoRelacionadoId?: string;
  estado: 'RADICADO' | 'EN_TRAMITE' | 'RESPONDIDO' | 'ARCHIVADO';
  dependenciaAsignada: string;
  fechaRadicacion: string;
  fechaLimiteRespuesta: string;
  respuestaOficial?: string;
  fechaRespuesta?: string;
}

export interface ServicioLinuxConfig {
  id: string;
  nombre: string;
  tipoServicio: string;
  protocolo: string;
  puerto: number;
  ipPlaceholder: string;
  rutaRecurso?: string;
  justificacion: string;
  estado: 'CONFIGURABLE_MULTIPASS' | 'CONECTADO' | 'PENDIENTE';
  detalles: string;
}

export interface ClienteLAN {
  id: string;
  nombre: string;
  departamentoOcupante: string;
  tipoSO: 'LINUX' | 'WINDOWS' | 'MACOS';
  servicioUtilizado: 'NFS' | 'SAMBA' | 'NIS' | 'CUPS';
  ipPlaceholder: string;
  estado: 'PENDIENTE_MULTIPASS' | 'ASIGNADO';
}

export interface SystemMetrics {
  plataforma: string;
  nodeVersion: string;
  uptimeSegundos: number;
  uptimeFormato: string;
  memoria: {
    totalMiB: number;
    usadaMiB: number;
    libreMiB: number;
    porcentajeUso: number;
  };
  cpus: {
    modelo: string;
    cantidadNucleos: number;
    loadAverage: number[];
  };
  timestamp: string;
}

export interface LiveServiceHealth {
  servicio: string;
  protocolo: string;
  puerto: number | string;
  host: string;
  estado: 'ACTIVO' | 'DEGRADADO' | 'INACTIVO';
  latenciaMs: number;
  detalles: string;
  datosAdicionales?: Record<string, any>;
}

export interface NtpOfficialTimeData {
  servidor: string;
  puerto: number;
  estrato: number;
  precision: number;
  retardoRttMs: number;
  desviacionOffsetMs: number;
  horaOficialServidor: string;
  horaLocalCliente: string;
  sincronizado: boolean;
  detalles: string;
}

export interface MountedStorageData {
  nfs: {
    existe: boolean;
    ruta: string;
    total?: number;
    archivos: Array<{ nombre: string; esDirectorio: boolean; rutaCompleta: string }>;
  };
  samba: {
    existe: boolean;
    ruta: string;
    total?: number;
    archivos: Array<{ nombre: string; esDirectorio: boolean; rutaCompleta: string }>;
  };
  servidorLinuxIp: string;
}
