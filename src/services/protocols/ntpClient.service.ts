import dgram from 'dgram';
import { config } from '../../config/env';

export interface NtpResponse {
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

export class NtpClientService {
  private static NTP_DELTA = 2208988800; // Segundos entre 1900-01-01 y 1970-01-01

  public static queryTime(host = config.linuxServer.ntp, puerto = 123, timeoutMs = 3000): Promise<NtpResponse> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      let isResolved = false;

      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try { client.close(); } catch {}
          reject(new Error(`Timeout de ${timeoutMs}ms al consultar servidor NTP en ${host}:${puerto}`));
        }
      }, timeoutMs);

      // Paquete NTP RFC 5905: 48 bytes
      // Byte 0: LI (0 = no warning), VN (4 = NTPv4), Mode (3 = Client) -> 00 100 011 = 0x23 (35 dec)
      const packet = Buffer.alloc(48);
      packet[0] = 0x23;

      const t1 = Date.now(); // Hora de envío (Origin Time T1)

      client.on('error', (err) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          try { client.close(); } catch {}
          reject(err);
        }
      });

      client.on('message', (msg) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timer);

        const t4 = Date.now(); // Hora de recepción local (Destination Time T4)
        try { client.close(); } catch {}

        if (msg.length < 48) {
          return reject(new Error('Respuesta NTP inválida: paquete menor a 48 bytes.'));
        }

        // Byte 1: Stratum
        const stratum = msg[1];
        // Byte 2: Poll
        // Byte 3: Precision (entero signed en potencias de dos)
        const precision = msg.readInt8(3);

        // Bytes 32-39: Receive Timestamp (T2)
        const t2Sec = msg.readUInt32BE(32) - this.NTP_DELTA;
        const t2Frac = msg.readUInt32BE(36);
        const t2 = (t2Sec * 1000) + Math.round((t2Frac * 1000) / 4294967296);

        // Bytes 40-47: Transmit Timestamp (T3)
        const t3Sec = msg.readUInt32BE(40) - this.NTP_DELTA;
        const t3Frac = msg.readUInt32BE(44);
        const t3 = (t3Sec * 1000) + Math.round((t3Frac * 1000) / 4294967296);

        // Fórmulas oficiales RFC 5905:
        // Roundtrip delay = (T4 - T1) - (T3 - T2)
        const roundtripDelay = Math.max(0, (t4 - t1) - (t3 - t2));
        // Offset = ((T2 - T1) + (T3 - T4)) / 2
        const offset = Math.round(((t2 - t1) + (t3 - t4)) / 2);

        const serverDate = new Date(t3);

        resolve({
          servidor: host,
          puerto,
          estrato: stratum,
          precision,
          retardoRttMs: roundtripDelay,
          desviacionOffsetMs: offset,
          horaOficialServidor: serverDate.toISOString(),
          horaLocalCliente: new Date(t4).toISOString(),
          sincronizado: stratum > 0 && stratum < 16,
          detalles: `Respuesta exitosa de daemon ntpsec (Stratum ${stratum}, RTT: ${roundtripDelay}ms, Offset: ${offset}ms)`
        });
      });

      client.send(packet, 0, packet.length, puerto, host, (err) => {
        if (err && !isResolved) {
          isResolved = true;
          clearTimeout(timer);
          try { client.close(); } catch {}
          reject(err);
        }
      });
    });
  }
}
