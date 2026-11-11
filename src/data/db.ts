import bcrypt from 'bcryptjs';
import { 
  ProyectoANI, 
  DocumentoANI, 
  PQRSF, 
  UsuarioTI, 
  SEED_PROYECTOS, 
  SEED_DOCUMENTOS, 
  SEED_PQRSF 
} from './seedProjects';

class InMemoryDatabase {
  private proyectos: Map<string, ProyectoANI> = new Map();
  private documentos: Map<string, DocumentoANI> = new Map();
  private pqrsf: Map<string, PQRSF> = new Map();
  private usuarios: Map<string, UsuarioTI> = new Map();
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

    const now = new Date();
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
    existing.fechaRespuesta = new Date().toISOString();

    this.pqrsf.set(radicado, existing);
    return existing;
  }

  // --- MÉTODOS DE USUARIOS ---
  public findUserByEmail(email: string): UsuarioTI | undefined {
    return this.usuarios.get(email.toLowerCase());
  }

  public findUserById(id: string): UsuarioTI | undefined {
    return Array.from(this.usuarios.values()).find(u => u.id === id);
  }
}

export const db = new InMemoryDatabase();
