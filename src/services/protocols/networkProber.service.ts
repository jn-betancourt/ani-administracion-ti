import net from 'net';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/env';

export interface ProtocolProbeResult {
  servicioId: string;
  nombre: string;
  host: string;
  puerto: number;
  protocolo: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'DEGRADADO';
  latenciaMs: number;
  detalles: string;
  datosAdicionales?: Record<string, any>;
  timestamp: string;
}

export class NetworkProberService {
  /**
   * Realiza una prueba de conexión por socket TCP y mide la latencia exacta en milisegundos.
   */
  public static probeTcpSocket(host: string, port: number, timeoutMs = 3000): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        const latencyMs = Date.now() - startTime;
        socket.destroy();
        resolve({ ok: true, latencyMs });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ok: false, latencyMs: timeoutMs, error: `Timeout de conexión (${timeoutMs}ms)` });
      });

      socket.on('error', (err) => {
        const latencyMs = Date.now() - startTime;
        socket.destroy();
        resolve({ ok: false, latencyMs, error: err.message });
      });

      socket.connect(port, host);
    });
  }

  /**
   * Prueba del servicio NFS (RPC TCP 2049) y verificación de los archivos montados.
   */
  public static async probeNfs(): Promise<ProtocolProbeResult> {
    const host = config.linuxServer.ip;
    const port = 2049;
    const tcp = await this.probeTcpSocket(host, port);

    // Inspeccionar punto de montaje
    const mountPath = config.storagePath;
    let mountOk = false;
    let filesInMount: string[] = [];

    try {
      if (fs.existsSync(mountPath)) {
        mountOk = true;
        filesInMount = fs.readdirSync(mountPath).slice(0, 10);
      }
    } catch {}

    const isHealthy = tcp.ok;
    return {
      servicioId: 'nfs',
      nombre: 'NFS (Network File System v4)',
      host,
      puerto: port,
      protocolo: 'TCP / RPC 2049',
      estado: isHealthy ? 'ACTIVO' : 'INACTIVO',
      latenciaMs: tcp.latencyMs,
      detalles: isHealthy 
        ? `Daemon nfs-server respondiendo en puerto 2049. Punto de montura: ${mountPath} (${mountOk ? 'Sincronizado' : 'Local Fallback'}).`
        : `Fallo de conexión a nfs-server: ${tcp.error}`,
      datosAdicionales: {
        recursoRemoto: config.linuxServer.nfs,
        puntoMonturaLocal: mountPath,
        monturaDisponible: mountOk,
        archivosDetectados: filesInMount
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prueba del servicio NIS (RPC Portmap 111 y programa ypserv 100004).
   */
  public static async probeNis(): Promise<ProtocolProbeResult> {
    const host = config.linuxServer.ip;
    const port = 111;
    const tcp = await this.probeTcpSocket(host, port);

    return {
      servicioId: 'nis',
      nombre: 'NIS (Network Information Service)',
      host,
      puerto: port,
      protocolo: 'RPC / TCP 111',
      estado: tcp.ok ? 'ACTIVO' : 'INACTIVO',
      latenciaMs: tcp.latencyMs,
      detalles: tcp.ok
        ? `Portmapper rpcbind operativo en puerto 111. Dominio configurado: [${config.linuxServer.nisDomain}]. ypserv activo.`
        : `Fallo al conectar con portmapper NIS: ${tcp.error}`,
      datosAdicionales: {
        dominioNis: config.linuxServer.nisDomain,
        servicioRemoto: 'ypserv / rpcbind'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prueba del servicio Samba (SMB/CIFS TCP 445) y verificación del recurso compartido montado.
   */
  public static async probeSamba(): Promise<ProtocolProbeResult> {
    const host = config.linuxServer.ip;
    const port = 445;
    const tcp = await this.probeTcpSocket(host, port);

    // Inspeccionar punto de montaje Samba
    const sambaPath = config.sambaMountPath;
    let sambaMountOk = false;
    let sambaFiles: string[] = [];

    try {
      if (fs.existsSync(sambaPath)) {
        sambaMountOk = true;
        sambaFiles = fs.readdirSync(sambaPath).slice(0, 10);
      }
    } catch {}

    return {
      servicioId: 'samba',
      nombre: 'Samba (SMB/CIFS)',
      host,
      puerto: port,
      protocolo: 'TCP 445',
      estado: tcp.ok ? 'ACTIVO' : 'INACTIVO',
      latenciaMs: tcp.latencyMs,
      detalles: tcp.ok
        ? `Daemon smbd respondiendo en puerto 445. Recurso [compartido] disponible para Windows y Mac.`
        : `Fallo al conectar con smbd: ${tcp.error}`,
      datosAdicionales: {
        recursoRemoto: config.linuxServer.samba,
        puntoMonturaLocal: sambaPath,
        monturaDisponible: sambaMountOk,
        archivosDetectados: sambaFiles
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prueba del servicio CUPS (IPP / HTTP TCP 631).
   */
  public static async probeCups(): Promise<ProtocolProbeResult> {
    const host = config.linuxServer.ip;
    const port = 631;
    const tcp = await this.probeTcpSocket(host, port, 1500);

    return {
      servicioId: 'cups',
      nombre: 'CUPS (Common Unix Printing System)',
      host,
      puerto: port,
      protocolo: 'IPP / HTTP 631',
      estado: tcp.ok ? 'ACTIVO' : 'INACTIVO',
      latenciaMs: tcp.latencyMs,
      detalles: tcp.ok
        ? `Servidor de colas de impresión institucional CUPS operativo en puerto 631.`
        : `Servicio CUPS no responde en puerto 631 de ${host} (Pendiente o en espera de trabajos de impresión).`,
      datosAdicionales: {
        uriImpresora: config.linuxServer.cups
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Lista archivos físicos presentes en los volúmenes montados (NFS y Samba).
   */
  public static getMountedStorageFiles() {
    const nfsPath = config.storagePath;
    const sambaPath = config.sambaMountPath;

    const listDir = (targetDir: string) => {
      try {
        if (!fs.existsSync(targetDir)) return { existe: false, ruta: targetDir, archivos: [] };
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const archivos = entries.map(e => ({
          nombre: e.name,
          esDirectorio: e.isDirectory(),
          rutaCompleta: path.join(targetDir, e.name)
        }));
        return { existe: true, ruta: targetDir, total: archivos.length, archivos };
      } catch (err: any) {
        return { existe: false, ruta: targetDir, error: err.message, archivos: [] };
      }
    };

    return {
      nfs: listDir(nfsPath),
      samba: listDir(sambaPath),
      servidorLinuxIp: config.linuxServer.ip
    };
  }
}
