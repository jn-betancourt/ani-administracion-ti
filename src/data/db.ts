import bcrypt from 'bcryptjs';
import { ntpTimeAdapter } from '../services/abstraction/ntpTime.adapter';
import { 
  ProyectoANI, 
  DocumentoANI, 
  PQRSF, 
  UsuarioTI, 
  ServicioLinuxConfig,
  ClienteLAN,
  SEED_PROYECTOS, 
  SEED_DOCUMENTOS, 
  SEED_PQRSF,
  SEED_SERVICIOS_LINUX,
  SEED_CLIENTES_LAN
} from './seedProjects';

class InMemoryDatabase {
  private proyectos: Map<string, ProyectoANI> = new Map();
  private documentos: Map<string, DocumentoANI> = new Map();
  private pqrsf: Map<string, PQRSF> = new Map();
  private usuarios: Map<string, UsuarioTI> = new Map();
  private serviciosLinux: Map<string, ServicioLinuxConfig> = new Map();
  private clientesLAN: Map<string, ClienteLAN> = new Map();
  private pqrsfCounter: number = 1049;

  constructor() {
    this.seed();
  }

  private seed() {
    // Proyectos
    SEED_PROYECTOS.forEach(p => this.proyectos.set(p.id, { ...p }));

    // Documentos
    SEED_DOCUMENTOS.forEach(d => this.documentos.set(d.id, { ...d }));

    // PQRSF
    SEED_PQRSF.forEach(item => this.pqrsf.set(item.radicado, { ...item }));

    // Servicios Linux (con IPs placeholder)
    SEED_SERVICIOS_LINUX.forEach(s => this.serviciosLinux.set(s.id, { ...s }));

    // Clientes LAN (con IPs placeholder)
    SEED_CLIENTES_LAN.forEach(c => this.clientesLAN.set(c.id, { ...c }));

    // Usuario Administrador por defecto
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('adminANI2026!', salt);

    const adminUser: UsuarioTI = {
      id: 'usr-admin-001',
      email: 'admin@ani.gov.co',
      nombreCompleto: 'Ing. Administrador de Infraestructura TI',
      passwordHash: passwordHash,
      rol: 'ADMIN_TI',
      cargo: 'Coordinador de Infraestructura y Servidores',
      activo: true
    };
    this.usuarios.set(adminUser.email, adminUser);

    const gestorUser: UsuarioTI = {
      id: 'usr-gestor-002',
      email: 'documentacion@ani.gov.co',
      nombreCompleto: 'Especialista en Gestión Documental ANI',
      passwordHash: bcrypt.hashSync('gestorANI2026!', salt),
      rol: 'GESTOR_DOCUMENTAL',
      cargo: 'Analista de Archivo y Transparencia',
      activo: true
    };
    this.usuarios.set(gestorUser.email, gestorUser);

    const atencionUser: UsuarioTI = {
      id: 'usr-atencion-003',
      email: 'atencion@ani.gov.co',
      nombreCompleto: 'Oficial de Radicación y PQRSF',
      passwordHash: bcrypt.hashSync('atencionANI2026!', salt),
      rol: 'ATENCION_CIUDADANO',
      cargo: 'Líder de Ventanilla Única de Correspondencia',
      activo: true
    };
    this.usuarios.set(atencionUser.email, atencionUser);
  }

  // --- MÉTODOS DE PROYECTOS ---
  public getProyectos(filters?: {
    modo?: string;
    estado?: string;
    departamento?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.proyectos.values());

    if (filters?.modo) {
      const modoUpper = filters.modo.toUpperCase();
      list = list.filter(p => p.modo === modoUpper);
    }

    if (filters?.estado) {
      const estadoUpper = filters.estado.toUpperCase();
      list = list.filter(p => p.estado === estadoUpper);
    }

    if (filters?.departamento) {
      const deptLower = filters.departamento.toLowerCase();
      list = list.filter(p => p.departamento.toLowerCase().includes(deptLower));
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => 
        p.nombre.toLowerCase().includes(q) || 
        p.codigo.toLowerCase().includes(q) ||
        p.concesionario.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, Math.min(100, filters?.limit || 10));
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages,
      data: paginated
    };
  }

  public getProyectoById(id: string): ProyectoANI | undefined {
    return this.proyectos.get(id);
  }

  // --- MÉTODOS DE DOCUMENTOS ---
  public getDocumentosByProyecto(proyectoId: string, soloPublicos: boolean = true): DocumentoANI[] {
    const all = Array.from(this.documentos.values()).filter(d => d.proyectoId === proyectoId);
    if (soloPublicos) {
      return all.filter(d => d.esPublico);
    }
    return all;
  }

  public getDocumentoById(id: string): DocumentoANI | undefined {
    return this.documentos.get(id);
  }

  public getAllDocumentos(soloPublicos: boolean = false): DocumentoANI[] {
    const all = Array.from(this.documentos.values());
    if (soloPublicos) {
      return all.filter(d => d.esPublico);
    }
    return all;
  }

  public addDocumento(doc: DocumentoANI): DocumentoANI {
    this.documentos.set(doc.id, doc);
    return doc;
  }

  public deleteDocumento(id: string): boolean {
    return this.documentos.delete(id);
  }

  // --- MÉTODOS DE PQRSF ---
  public getPqrsfByRadicado(radicado: string): PQRSF | undefined {
    return this.pqrsf.get(radicado);
  }

  public getAllPqrsf(estado?: string): PQRSF[] {
    let list = Array.from(this.pqrsf.values());
    if (estado) {
      list = list.filter(item => item.estado === estado.toUpperCase());
    }
    return list.sort((a, b) => new Date(b.fechaRadicacion).getTime() - new Date(a.fechaRadicacion).getTime());
  }

  public createPqrsf(data: Omit<PQRSF, 'radicado' | 'estado' | 'dependenciaAsignada' | 'fechaRadicacion' | 'fechaLimiteRespuesta'>): PQRSF {
    this.pqrsfCounter += 1;
    const radicado = `ANI-2026-PQRSF-00${this.pqrsfCounter}`;

    // Hora oficial sincronizada vía NTP con el servidor local de la ANI (10.88.199.195)
    const now = ntpTimeAdapter.getOfficialDate();
    // 15 días hábiles aproximadamente 21 días calendario
    const limitDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    let dependencia = 'Oficina de Servicio al Ciudadano y Correspondencia';
    if (data.proyectoRelacionadoId) {
      const proj = this.proyectos.get(data.proyectoRelacionadoId);
      if (proj?.modo === 'CARRETERO') dependencia = 'Gerencia Carretera y Concesiones Viales';
      else if (proj?.modo === 'FERREO') dependencia = 'Gerencia Férrea y Proyectos Multimodales';
      else if (proj?.modo === 'PORTUARIO') dependencia = 'Gerencia Portuaria y Vías Navegables';
      else if (proj?.modo === 'AEROPORTUARIO') dependencia = 'Gerencia Aeroportuaria';
    }

    const newPqrsf: PQRSF = {
      ...data,
      radicado,
      estado: 'RADICADO',
      dependenciaAsignada: dependencia,
      fechaRadicacion: now.toISOString(),
      fechaLimiteRespuesta: limitDate.toISOString()
    };

    this.pqrsf.set(radicado, newPqrsf);
    return newPqrsf;
  }

  public responderPqrsf(radicado: string, respuesta: string): PQRSF | null {
    const existing = this.pqrsf.get(radicado);
    if (!existing) return null;

    existing.estado = 'RESPONDIDO';
    existing.respuestaOficial = respuesta;
    existing.fechaRespuesta = ntpTimeAdapter.getOfficialISOString();

    this.pqrsf.set(radicado, existing);
    return existing;
  }

  // --- MÉTODOS DE USUARIOS ---
  public getUsuarios(): Omit<UsuarioTI, 'passwordHash'>[] {
    return Array.from(this.usuarios.values()).map(u => ({
      id: u.id,
      email: u.email,
      nombreCompleto: u.nombreCompleto,
      rol: u.rol,
      cargo: u.cargo,
      activo: u.activo
    }));
  }

  public findUserByEmail(email: string): UsuarioTI | undefined {
    return this.usuarios.get(email.toLowerCase());
  }

  public findUserById(id: string): UsuarioTI | undefined {
    return Array.from(this.usuarios.values()).find(u => u.id === id);
  }

  public createUsuario(data: { email: string; nombreCompleto: string; password: string; rol: UsuarioTI['rol']; cargo: string }): Omit<UsuarioTI, 'passwordHash'> {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const id = `usr-${Date.now().toString().slice(-5)}`;

    const user: UsuarioTI = {
      id,
      email: data.email.toLowerCase(),
      nombreCompleto: data.nombreCompleto,
      passwordHash,
      rol: data.rol,
      cargo: data.cargo,
      activo: true
    };

    this.usuarios.set(user.email, user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public deleteUsuario(id: string): boolean {
    const user = this.findUserById(id);
    if (!user || user.email === 'admin@ani.gov.co') return false; // Proteger superadmin
    return this.usuarios.delete(user.email);
  }

  // --- MÉTODOS DE SERVICIOS LINUX (MULTIPASS PLACEHOLDERS) ---
  public getServiciosLinux(): ServicioLinuxConfig[] {
    return Array.from(this.serviciosLinux.values());
  }

  public updateServicioLinux(id: string, update: Partial<ServicioLinuxConfig>): ServicioLinuxConfig | null {
    const current = this.serviciosLinux.get(id);
    if (!current) return null;

    const updated = { ...current, ...update };
    this.serviciosLinux.set(id, updated);
    return updated;
  }

  // --- MÉTODOS DE CLIENTES LAN (MULTIPASS PLACEHOLDERS) ---
  public getClientesLAN(): ClienteLAN[] {
    return Array.from(this.clientesLAN.values());
  }

  public createClienteLAN(data: Omit<ClienteLAN, 'id'>): ClienteLAN {
    const id = `cli-${Date.now().toString().slice(-4)}`;
    const nuevo: ClienteLAN = { ...data, id };
    this.clientesLAN.set(id, nuevo);
    return nuevo;
  }

  public deleteClienteLAN(id: string): boolean {
    return this.clientesLAN.delete(id);
  }
}

export const db = new InMemoryDatabase();
