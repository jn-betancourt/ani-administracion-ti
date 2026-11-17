import { 
  Usuario, 
  Documento, 
  PQRSF, 
  ServicioLinuxConfig, 
  ClienteLAN,
  LiveServiceHealth,
  NtpOfficialTimeData,
  MountedStorageData
} from '../types';

const API_BASE = '/api/v1';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('ani_admin_jwt');
  }

  public static setToken(token: string) {
    localStorage.setItem('ani_admin_jwt', token);
  }

  public static removeToken() {
    localStorage.removeItem('ani_admin_jwt');
    localStorage.removeItem('ani_admin_user');
  }

  public static getStoredUser(): Usuario | null {
    const raw = localStorage.getItem('ani_admin_user');
    return raw ? JSON.parse(raw) : null;
  }

  public static setStoredUser(user: Usuario) {
    localStorage.setItem('ani_admin_user', JSON.stringify(user));
  }

  private static getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- AUTENTICACIÓN ---
  public static async login(email: string, password: string):Promise<{ token: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.mensaje || 'Error al autenticar');
    }
    this.setToken(data.data.token);
    this.setStoredUser(data.data.usuario);
    return data.data;
  }

  public static async getMe(): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/admin/auth/me`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  // --- GESTIÓN DOCUMENTAL (NFS / ONEDRIVE SIMULADO) ---
  public static async getDocumentos(): Promise<Documento[]> {
    const res = await fetch(`${API_BASE}/admin/documentos`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async uploadDocumento(formData: FormData): Promise<Documento> {
    const res = await fetch(`${API_BASE}/admin/documentos/upload`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje || 'Error al cargar documento');
    return data.data;
  }

  public static async deleteDocumento(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/documentos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
  }

  // --- PQRSF ---
  public static async getPqrsf(estado?: string): Promise<PQRSF[]> {
    const url = estado ? `${API_BASE}/admin/pqrsf?estado=${estado}` : `${API_BASE}/admin/pqrsf`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async responderPqrsf(radicado: string, respuestaOficial: string): Promise<PQRSF> {
    const res = await fetch(`${API_BASE}/admin/pqrsf/${radicado}/responder`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ respuestaOficial })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  // --- USUARIOS ---
  public static async getUsuarios(): Promise<Usuario[]> {
    const res = await fetch(`${API_BASE}/admin/usuarios`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async createUsuario(payload: { email: string; nombreCompleto: string; password: string; rol: string; cargo: string }): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/admin/usuarios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async deleteUsuario(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/usuarios/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
  }

  // --- SERVICIOS LINUX (MULTIPASS PLACEHOLDERS) ---
  public static async getServiciosLinux(): Promise<ServicioLinuxConfig[]> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async updateServicioLinux(id: string, payload: Partial<ServicioLinuxConfig>): Promise<ServicioLinuxConfig> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  // --- CLIENTES LAN (MULTIPASS PLACEHOLDERS) ---
  public static async getClientesLAN(): Promise<ClienteLAN[]> {
    const res = await fetch(`${API_BASE}/admin/clientes-lan`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async createClienteLAN(payload: Omit<ClienteLAN, 'id' | 'estado'>): Promise<ClienteLAN> {
    const res = await fetch(`${API_BASE}/admin/clientes-lan`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async deleteClienteLAN(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/clientes-lan/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
  }

  // --- TELEMETRÍA Y HEALTH ---
  public static async getHealth() {
    const res = await fetch('/health');
    return await res.json();
  }

  public static async getTelemetriaServicios() {
    const res = await fetch(`${API_BASE}/admin/telemetria/servicios`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  // --- SERVICIOS LINUX EN VIVO (10.88.199.195) ---
  public static async getServiciosLinuxEnVivo(): Promise<LiveServiceHealth[]> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/en-vivo`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async probarServicioLinux(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/${id}/probar`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async getHoraOficialNtp(): Promise<NtpOfficialTimeData> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/ntp/hora-oficial`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async getArchivosMontados(): Promise<MountedStorageData> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/archivos-montados`, {
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    return data.data;
  }

  public static async probarEscrituraVolumen(volumen: 'nfs' | 'samba'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/archivos-montados/${volumen}/prueba-escritura`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje || 'Error en prueba de lectura/escritura');
    return data.data;
  }

  public static async subirArchivoVolumen(volumen: 'nfs' | 'samba', file: File): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', file);

    const res = await fetch(`${API_BASE}/admin/servicios-linux/archivos-montados/${volumen}/subir`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje || 'Error al subir archivo al volumen');
    return data.data;
  }

  public static async eliminarArchivoVolumen(volumen: 'nfs' | 'samba', nombre: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/archivos-montados/${volumen}/${encodeURIComponent(nombre)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje || 'Error al eliminar archivo');
  }

  public static async descargarArchivoVolumen(volumen: 'nfs' | 'samba', nombre: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/servicios-linux/archivos-montados/${volumen}/descargar/${encodeURIComponent(nombre)}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error('No se pudo descargar el archivo desde el volumen');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}
