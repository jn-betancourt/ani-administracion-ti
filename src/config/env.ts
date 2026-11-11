import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ani_seguridad_infraestructura_secret_2026_jwt',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  storagePath: path.resolve(process.env.STORAGE_PATH || './storage/nfs_docs'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  linuxServer: {
    ntp: process.env.NTP_SERVER || '10.88.199.10',
    nfs: process.env.NFS_SERVER || '10.88.199.10:/srv/nfs/ani_docs',
    samba: process.env.SAMBA_SERVER || '//10.88.199.10/ani_docs',
    nisDomain: process.env.NIS_DOMAIN || 'ani.lan',
    cups: process.env.CUPS_SERVER || 'ipp://10.88.199.10:631/printers/ani_sede_principal'
  }
};
