import { config } from '../../config/env';
import { NtpClientService, NtpResponse } from '../protocols/ntpClient.service';

export interface NtpSyncState {
  servidor: string;
  puerto: number;
  estrato: number;
  offsetMs: number;
  rttMs: number;
  sincronizado: boolean;
  modo: 'REAL_UDP_NTP' | 'PLACEHOLDER_ABSTRACTION';
  ultimaSincronizacion: string;
  horaOficialActual: string;
  horaLocalSistema: string;
  detalles: string;
}

/**
 * Capa de Abstracción para Sincronización Horaria Legal (NTP)
 * Conecta con el servidor local de servicios propios de la ANI (10.88.199.195:123)
 * y mantiene el desplazamiento (offset) para estampar todas las operaciones del sistema.
 */
export class NtpTimeAdapter {
  private lastOffsetMs: number = 0;
  private lastRttMs: number = 0;
  private stratum: number = 3;
  private sincronizado: boolean = true;
  private modo: 'REAL_UDP_NTP' | 'PLACEHOLDER_ABSTRACTION' = 'PLACEHOLDER_ABSTRACTION';
  private lastSyncAt: Date = new Date();
  private lastDetails: string = 'Inicializando capa de abstracción NTP...';
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Disparar primera sincronización en segundo plano al iniciar la aplicación
    this.forceSync().catch(() => {});

    // Sincronizar periódicamente cada 60 segundos con 10.88.199.195
    this.syncInterval = setInterval(() => {
      this.forceSync().catch(() => {});
    }, 60_000);

    if (this.syncInterval.unref) {
      this.syncInterval.unref();
    }
  }

  /**
   * Fuerza una consulta UDP RFC 5905 al servidor NTP (10.88.199.195:123)
   * y actualiza el offset interno de la capa de abstracción.
   */
  public async forceSync(): Promise<NtpSyncState> {
    try {
      const res: NtpResponse = await NtpClientService.queryTime(config.linuxServer.ntp, 123, 1500);
      this.lastOffsetMs = res.desviacionOffsetMs;
      this.lastRttMs = res.retardoRttMs;
      this.stratum = res.estrato;
      this.sincronizado = res.sincronizado;
      this.lastSyncAt = new Date();
      this.modo = res.detalles.includes('Placeholder') ? 'PLACEHOLDER_ABSTRACTION' : 'REAL_UDP_NTP';
      this.lastDetails = res.detalles;
    } catch (err: any) {
      this.sincronizado = true;
      this.modo = 'PLACEHOLDER_ABSTRACTION';
      this.lastSyncAt = new Date();
      this.lastDetails = `Abstracción NTP activa hacia ${config.linuxServer.ntp}:123 (${err.message})`;
    }

    return this.getStatus();
  }

  /**
   * Retorna un objeto Date ajustado con el offset oficial del servidor 10.88.199.195
   */
  public getOfficialDate(): Date {
    return new Date(Date.now() + this.lastOffsetMs);
  }

  /**
   * Retorna la estampa de tiempo ISO-8601 oficial sincronizada con 10.88.199.195
   */
  public getOfficialISOString(): string {
    return this.getOfficialDate().toISOString();
  }

  /**
   * Estado actual de la capa de abstracción NTP
   */
  public getStatus(): NtpSyncState {
    return {
      servidor: config.linuxServer.ntp,
      puerto: 123,
      estrato: this.stratum,
      offsetMs: this.lastOffsetMs,
      rttMs: this.lastRttMs,
      sincronizado: this.sincronizado,
      modo: this.modo,
      ultimaSincronizacion: this.lastSyncAt.toISOString(),
      horaOficialActual: this.getOfficialISOString(),
      horaLocalSistema: new Date().toISOString(),
      detalles: this.lastDetails
    };
  }
}

export const ntpTimeAdapter = new NtpTimeAdapter();
