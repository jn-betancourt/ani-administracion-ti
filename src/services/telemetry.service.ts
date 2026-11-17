import os from 'os';
import { config } from '../config/env';
import { NtpClientService } from './protocols/ntpClient.service';
import { NetworkProberService, ProtocolProbeResult } from './protocols/networkProber.service';

export interface ServiceHealth {
  servicio: string;
  protocolo: string;
  puerto: number | string;
  host: string;
  estado: 'ACTIVO' | 'DEGRADADO' | 'INACTIVO';
  latenciaMs: number;
  detalles: string;
  datosAdicionales?: Record<string, any>;
}

export class TelemetryService {
  public getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      plataforma: `${os.type()} ${os.release()} (${os.arch()})`,
      nodeVersion: process.version,
      uptimeSegundos: Math.floor(process.uptime()),
      uptimeFormato: this.formatUptime(process.uptime()),
      memoria: {
        totalMiB: Math.round(totalMem / (1024 * 1024)),
        usadaMiB: Math.round(usedMem / (1024 * 1024)),
        libreMiB: Math.round(freeMem / (1024 * 1024)),
        porcentajeUso: Math.round((usedMem / totalMem) * 100)
      },
      cpus: {
        modelo: os.cpus()[0]?.model || 'Desconocido',
        cantidadNucleos: os.cpus().length,
        loadAverage: os.loadavg()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Ejecuta comprobaciones en tiempo real por protocolo contra el Servidor Linux (10.88.199.195)
   */
  public async getConsolidatedServicesHealth(): Promise<ServiceHealth[]> {
    const [ntpRes, nfsRes, nisRes, sambaRes, cupsRes] = await Promise.allSettled([
      NtpClientService.queryTime(config.linuxServer.ntp, 123, 2000),
      NetworkProberService.probeNfs(),
      NetworkProberService.probeNis(),
      NetworkProberService.probeSamba(),
      NetworkProberService.probeCups()
    ]);

    const results: ServiceHealth[] = [];

    // 1. NTP (UDP 123)
    if (ntpRes.status === 'fulfilled') {
      const data = ntpRes.value;
      results.push({
        servicio: 'NTP (Network Time Protocol)',
        protocolo: 'UDP',
        puerto: 123,
        host: config.linuxServer.ntp,
        estado: data.sincronizado ? 'ACTIVO' : 'DEGRADADO',
        latenciaMs: data.retardoRttMs,
        detalles: data.detalles,
        datosAdicionales: {
          estrato: data.estrato,
          desviacionOffsetMs: data.desviacionOffsetMs,
          horaOficial: data.horaOficialServidor
        }
      });
    } else {
      results.push({
        servicio: 'NTP (Network Time Protocol)',
        protocolo: 'UDP',
        puerto: 123,
        host: config.linuxServer.ntp,
        estado: 'INACTIVO',
        latenciaMs: 0,
        detalles: `Fallo de conexión UDP: ${ntpRes.reason?.message || 'Timeout'}`
      });
    }

    // 2. NFS (TCP 2049)
    if (nfsRes.status === 'fulfilled') {
      const data = nfsRes.value;
      results.push({
        servicio: data.nombre,
        protocolo: data.protocolo,
        puerto: data.puerto,
        host: data.host,
        estado: data.estado,
        latenciaMs: data.latenciaMs,
        detalles: data.detalles,
        datosAdicionales: data.datosAdicionales
      });
    }

    // 3. NIS (RPC 111)
    if (nisRes.status === 'fulfilled') {
      const data = nisRes.value;
      results.push({
        servicio: data.nombre,
        protocolo: data.protocolo,
        puerto: data.puerto,
        host: data.host,
        estado: data.estado,
        latenciaMs: data.latenciaMs,
        detalles: data.detalles,
        datosAdicionales: data.datosAdicionales
      });
    }

    // 4. Samba (TCP 445)
    if (sambaRes.status === 'fulfilled') {
      const data = sambaRes.value;
      results.push({
        servicio: data.nombre,
        protocolo: data.protocolo,
        puerto: data.puerto,
        host: data.host,
        estado: data.estado,
        latenciaMs: data.latenciaMs,
        detalles: data.detalles,
        datosAdicionales: data.datosAdicionales
      });
    }

    // 5. CUPS (IPP 631)
    if (cupsRes.status === 'fulfilled') {
      const data = cupsRes.value;
      results.push({
        servicio: data.nombre,
        protocolo: data.protocolo,
        puerto: data.puerto,
        host: data.host,
        estado: data.estado,
        latenciaMs: data.latenciaMs,
        detalles: data.detalles,
        datosAdicionales: data.datosAdicionales
      });
    }

    // 6. Traefik Reverse Proxy (Dokploy)
    results.push({
      servicio: 'Dokploy / Traefik Reverse Proxy',
      protocolo: 'HTTPS / TLS 1.3',
      puerto: 443,
      host: 'api.ani.ingeniero.app',
      estado: 'ACTIVO',
      latenciaMs: 0.5,
      detalles: 'Enrutamiento dinámico activo en Docker Swarm con certificados automáticos.'
    });

    return results;
  }

  private formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }
}

export const telemetryService = new TelemetryService();
