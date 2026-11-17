export interface DocumentoANI {
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
}

export interface ProyectoANI {
  id: string;
  codigo: string;
  nombre: string;
  modo: 'CARRETERO' | 'FERREO' | 'PORTUARIO' | 'AEROPORTUARIO';
  subtipo: string;
  departamento: string;
  municipios: string[];
  concesionario: string;
  estado: 'ESTRUCTURACION' | 'LICITACION' | 'CONSTRUCCION' | 'OPERACION';
  inversionCopMillones: number;
  longitudKm?: number;
  avancePorcentaje: number;
  fechaInicio: string;
  fechaEstimadaFin: string;
  descripcion: string;
}

export interface PQRSF {
  radicado: string;
  tipo: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'FELICITACION';
  nombreSolicitante: string;
  tipoDocumento: 'CC' | 'NIT' | 'CE' | 'PASAPORTE';
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

export interface UsuarioTI {
  id: string;
  email: string;
  nombreCompleto: string;
  passwordHash: string;
  rol: 'SUPER_ADMIN' | 'ADMIN_TI' | 'GESTOR_DOCUMENTAL' | 'ATENCION_CIUDADANO';
  cargo: string;
  activo: boolean;
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

export const SEED_SERVICIOS_LINUX: ServicioLinuxConfig[] = [
  {
    id: "nfs",
    nombre: "NFS (Network File System v4)",
    tipoServicio: "Almacenamiento Compartido / Repositorio Documental",
    protocolo: "TCP / RPC",
    puerto: 2049,
    ipPlaceholder: "10.88.199.195",
    rutaRecurso: "/srv/nfs/ani -> /mnt/ani",
    justificacion: "Proveer repositorio documental centralizado (emulación OneDrive) para la Backend API y estaciones de trabajo de funcionarios de la ANI.",
    estado: "CONECTADO",
    detalles: "Montado activamente en /mnt/ani en el host web desde 10.88.199.195:/ani."
  },
  {
    id: "ntp",
    nombre: "NTP (Network Time Protocol)",
    tipoServicio: "Sincronización Horaria Legal",
    protocolo: "UDP",
    puerto: 123,
    ipPlaceholder: "10.88.199.195",
    rutaRecurso: "10.88.199.195:123/UDP",
    justificacion: "Garantizar estricta validez jurídica en marcas de tiempo de radicados PQRSF, actas de licitación y auditoría de accesos.",
    estado: "CONECTADO",
    detalles: "Servicio ntpsec activo en sv-ani (Stratum 3, consultable vía dgram UDP)."
  },
  {
    id: "nis",
    nombre: "NIS (Network Information Service)",
    tipoServicio: "Autenticación y Directorio LAN",
    protocolo: "RPC / TCP",
    puerto: 111,
    ipPlaceholder: "10.88.199.195",
    rutaRecurso: "Dominio: labnis (10.88.199.195:111)",
    justificacion: "Centralizar los mapas de usuarios, contraseñas y grupos de los administradores y personal técnico en la intranet.",
    estado: "CONECTADO",
    detalles: "ypserv y rpcbind registrados en sv-ani bajo el dominio labnis."
  },
  {
    id: "samba",
    nombre: "Samba (SMB/CIFS)",
    tipoServicio: "Compartición de Archivos Multiplataforma",
    protocolo: "TCP",
    puerto: 445,
    ipPlaceholder: "10.88.199.195",
    rutaRecurso: "//10.88.199.195/compartido -> /mnt/samba",
    justificacion: "Facilitar el intercambio y edición de minutas contractuales a funcionarios que operan estaciones con Microsoft Windows y macOS.",
    estado: "CONECTADO",
    detalles: "Montado con credenciales de usuario ubuntu en /mnt/samba."
  },
  {
    id: "cups",
    nombre: "CUPS (Common Unix Printing System)",
    tipoServicio: "Servidor de Impresión Centralizada",
    protocolo: "IPP / HTTP",
    puerto: 631,
    ipPlaceholder: "10.88.199.195",
    rutaRecurso: "ipp://10.88.199.195:631/printers/ani_sede_principal",
    justificacion: "Gestionar de manera unificada las colas de impresión de radicados físicos, planos de concesión y resoluciones oficiales.",
    estado: "CONFIGURABLE_MULTIPASS",
    detalles: "Diagnóstico de socket disponible hacia puerto 631 de sv-ani."
  }
];

export const SEED_CLIENTES_LAN: ClienteLAN[] = [
  {
    id: "cli-000",
    nombre: "Servidor Web Host (server Multipass / /mnt/ani & /mnt/samba)",
    departamentoOcupante: "Infraestructura TI / Servidor Web & API",
    tipoSO: "LINUX",
    servicioUtilizado: "NFS",
    ipPlaceholder: "10.88.199.214",
    estado: "ASIGNADO"
  },
  {
    id: "cli-001",
    nombre: "Estación Ingeniero Vial 1 (Ubuntu Linux)",
    departamentoOcupante: "Gerencia Carretera y Concesiones",
    tipoSO: "LINUX",
    servicioUtilizado: "NFS",
    ipPlaceholder: "10.88.199.PLACEHOLDER_CLIENT_1",
    estado: "PENDIENTE_MULTIPASS"
  },
  {
    id: "cli-002",
    nombre: "Puesto Jurídico Concesiones (Windows 11)",
    departamentoOcupante: "Oficina Asesora Jurídica",
    tipoSO: "WINDOWS",
    servicioUtilizado: "SAMBA",
    ipPlaceholder: "10.88.199.PLACEHOLDER_CLIENT_2",
    estado: "PENDIENTE_MULTIPASS"
  },
  {
    id: "cli-003",
    nombre: "Terminal Técnico Férreo (Debian Linux)",
    departamentoOcupante: "Gerencia Férrea y Proyectos Especiales",
    tipoSO: "LINUX",
    servicioUtilizado: "NIS",
    ipPlaceholder: "10.88.199.PLACEHOLDER_CLIENT_3",
    estado: "PENDIENTE_MULTIPASS"
  },
  {
    id: "cli-004",
    nombre: "Ventanilla Radicación Física (Windows 11)",
    departamentoOcupante: "Atención al Ciudadano y Correspondencia",
    tipoSO: "WINDOWS",
    servicioUtilizado: "CUPS",
    ipPlaceholder: "10.88.199.PLACEHOLDER_CLIENT_4",
    estado: "PENDIENTE_MULTIPASS"
  }
];

export const SEED_PROYECTOS: ProyectoANI[] = [
  {
    id: "prj-001-bog-girardot",
    codigo: "ANI-4G-012",
    nombre: "Tercer Carril Bogotá - Girardot",
    modo: "CARRETERO",
    subtipo: "Iniciativa Pública 4G",
    departamento: "Cundinamarca",
    municipios: ["Bogotá D.C.", "Soacha", "Sibaté", "Silvania", "Fusagasugá", "Melgar", "Girardot"],
    concesionario: "Vía 40 Express S.A.S.",
    estado: "CONSTRUCCION",
    inversionCopMillones: 2450000,
    longitudKm: 145.0,
    avancePorcentaje: 82.4,
    fechaInicio: "2016-12-05",
    fechaEstimadaFin: "2027-06-30",
    descripcion: "Ampliación a tercer carril de la autopista Bogotá - Girardot para optimizar la conectividad entre el centro del país y el puerto de Buenaventura."
  },
  {
    id: "prj-002-mar-2",
    codigo: "ANI-4G-005",
    nombre: "Autopista al Mar 2 (Cañasgordas - El Tigre)",
    modo: "CARRETERO",
    subtipo: "Autopistas de la Prosperidad 4G",
    departamento: "Antioquia",
    municipios: ["Cañasgordas", "Uramita", "Dabeiba", "Mutatá", "Chigorodó"],
    concesionario: "Autopistas Urabá S.A.S.",
    estado: "CONSTRUCCION",
    inversionCopMillones: 1890000,
    longitudKm: 254.0,
    avancePorcentaje: 96.1,
    fechaInicio: "2015-11-20",
    fechaEstimadaFin: "2026-12-31",
    descripcion: "Corredor estratégico que conecta a Medellín y los valles interandinos con el Urabá antioqueño y los futuros puertos del Caribe."
  },
  {
    id: "prj-003-tren-dorada-chiriguana",
    codigo: "ANI-FER-001",
    nombre: "Corredor Férreo La Dorada - Chiriguaná",
    modo: "FERREO",
    subtipo: "Reactivación Red Férrea Nacional",
    departamento: "Caldas, Antioquia, Santander, Cesar",
    municipios: ["La Dorada", "Puerto Salgar", "Barrancabermeja", "Gamarra", "Chiriguaná"],
    concesionario: "Consorcio Férreo Central",
    estado: "OPERACION",
    inversionCopMillones: 710000,
    longitudKm: 522.0,
    avancePorcentaje: 100.0,
    fechaInicio: "2020-03-01",
    fechaEstimadaFin: "2030-12-31",
    descripcion: "Línea férrea troncal para transporte multimodal de carga pesada, carbón, graneles y contenedores conectando el interior con el Caribe."
  },
  {
    id: "prj-004-puerto-antioquia",
    codigo: "ANI-POR-008",
    nombre: "Puerto Bahía Colombia de Urabá (Puerto Antioquia)",
    modo: "PORTUARIO",
    subtipo: "Concesión Portuaria Multipropósito",
    departamento: "Antioquia",
    municipios: ["Turbo"],
    concesionario: "Sociedad Puerto Bahía Colombia de Urabá - Puerto Antioquia",
    estado: "CONSTRUCCION",
    inversionCopMillones: 3100000,
    avancePorcentaje: 74.3,
    fechaInicio: "2022-04-18",
    fechaEstimadaFin: "2027-03-31",
    descripcion: "Terminal portuario de aguas profundas en el Golfo de Urabá para el comercio exterior de contenedores, graneles y carga rodante (Ro-Ro)."
  },
  {
    id: "prj-005-eldorado-fase-2",
    codigo: "ANI-AER-002",
    nombre: "Ampliación Terminal Internacional El Dorado",
    modo: "AEROPORTUARIO",
    subtipo: "Concesión Aeroportuaria",
    departamento: "Bogotá D.C.",
    municipios: ["Bogotá D.C."],
    concesionario: "OPAIN S.A.",
    estado: "OPERACION",
    inversionCopMillones: 1540000,
    avancePorcentaje: 100.0,
    fechaInicio: "2018-01-15",
    fechaEstimadaFin: "2028-12-31",
    descripcion: "Operación, modernización de pistas y ampliación de posiciones de contacto del principal aeropuerto de carga y pasajeros de Colombia."
  }
];

export const SEED_DOCUMENTOS: DocumentoANI[] = [
  {
    id: "doc-001-res-bog-gir",
    proyectoId: "prj-001-bog-girardot",
    codigoDocumento: "ANI-RES-2026-0412",
    titulo: "Resolución de Ajuste de Cronograma y Obras Complementarias Tercer Carril",
    tipoDocumental: "RESOLUCION",
    nombreArchivo: "ANI-RES-2026-0412-Tercer-Carril-Bogota-Girardot.pdf",
    pesoBytes: 1542120,
    esPublico: true,
    fechaPublicacion: "2026-02-14",
    resumen: "Resolución oficial por la cual se autoriza la reprogramación de hitos constructivos en la variante de Fusagasugá."
  },
  {
    id: "doc-002-pliego-mar-2",
    proyectoId: "prj-002-mar-2",
    codigoDocumento: "ANI-PLI-2015-0018",
    titulo: "Pliego de Condiciones Definitivo - Concesión Autopista al Mar 2",
    tipoDocumental: "PLIEGO",
    nombreArchivo: "ANI-PLI-2015-0018-Pliegos-Autopista-Mar-2.pdf",
    pesoBytes: 3840290,
    esPublico: true,
    fechaPublicacion: "2015-09-10",
    resumen: "Pliego de condiciones técnico, jurídico y financiero para la adjudicación de la obra vial Cañasgordas - El Tigre."
  },
  {
    id: "doc-003-informe-ferreo",
    proyectoId: "prj-003-tren-dorada-chiriguana",
    codigoDocumento: "ANI-INF-2026-0105",
    titulo: "Informe Semestral de Transporte de Carga y Mantenimiento Férreo",
    tipoDocumental: "INFORME_TECNICO",
    nombreArchivo: "ANI-INF-2026-0105-Operacion-Ferrea-Dorada-Chiriguana.pdf",
    pesoBytes: 2189000,
    esPublico: true,
    fechaPublicacion: "2026-07-30",
    resumen: "Balance operativo de toneladas transportadas e indicadores de mantenimiento preventivo de traviesas y rieles."
  },
  {
    id: "doc-004-auditoria-interna",
    proyectoId: "prj-004-puerto-antioquia",
    codigoDocumento: "ANI-INT-2026-9901",
    titulo: "Auditoría Reservada de Estructura Financiera y Garantías Contractuales",
    tipoDocumental: "INFORME_TECNICO",
    nombreArchivo: "ANI-INT-2026-9901-Auditoria-Financiera-Puerto-Antioquia.pdf",
    pesoBytes: 4510000,
    esPublico: false, // Documento interno/reservado
    fechaPublicacion: "2026-09-01",
    resumen: "Documento de uso confidencial para el comité fiduciario y de riesgos de la ANI."
  }
];

export const SEED_PQRSF: PQRSF[] = [
  {
    radicado: "ANI-2026-PQRSF-001001",
    tipo: "PETICION",
    nombreSolicitante: "Asociación de Camioneros del Valle",
    tipoDocumento: "NIT",
    numeroDocumento: "900481230-1",
    correoElectronico: "contacto@camionerosvalle.org",
    telefono: "3158901234",
    asunto: "Estado de las básculas de pesaje en el tramo Melgar - Fusagasugá",
    descripcion: "Solicitud de calibración técnica de los sistemas de pesaje dinámico del concesionario Vía 40 Express.",
    proyectoRelacionadoId: "prj-001-bog-girardot",
    estado: "RESPONDIDO",
    dependenciaAsignada: "Gerencia Carretera y Operaciones",
    fechaRadicacion: "2026-10-15T09:12:00Z",
    fechaLimiteRespuesta: "2026-11-06T23:59:59Z",
    respuestaOficial: "Se remitieron las actas de calibración certificadas por la Superintendencia de Transporte número ST-2026-88.",
    fechaRespuesta: "2026-10-28T16:40:00Z"
  },
  {
    radicado: "ANI-2026-PQRSF-001048",
    tipo: "PETICION",
    nombreSolicitante: "Carlos Restrepo",
    tipoDocumento: "CC",
    numeroDocumento: "1094852331",
    correoElectronico: "carlos.restrepo@correo.com",
    telefono: "3104567890",
    asunto: "Consulta sobre trazado del Tren del Pacífico e integración multimodal",
    descripcion: "Solicito información oficial sobre el cronograma de reactivación férrea en la zona del Eje Cafetero.",
    proyectoRelacionadoId: "prj-003-tren-dorada-chiriguana",
    estado: "EN_TRAMITE",
    dependenciaAsignada: "Gerencia Férrea y Proyectos Especiales",
    fechaRadicacion: "2026-11-05T14:20:00Z",
    fechaLimiteRespuesta: "2026-11-27T23:59:59Z"
  }
];
