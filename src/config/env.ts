import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const configuredStoragePath = process.env.STORAGE_PATH || '/mnt/ani';
const resolvedStoragePath = fs.existsSync(configuredStoragePath)
  ? configuredStoragePath
  : path.resolve('./storage/nfs_docs');

const configuredSambaPath = process.env.SAMBA_MOUNT_PATH || '/mnt/samba';
const resolvedSambaPath = fs.existsSync(configuredSambaPath)
  ? configuredSambaPath
  : path.resolve('./storage/samba_docs');

export const config = {
  port: parseInt(process.env.PORT || '3030', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ani_seguridad_infraestructura_secret_2026_jwt',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  storagePath: resolvedStoragePath,
  sambaMountPath: resolvedSambaPath,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  linuxServer: {
    ip: process.env.LINUX_SERVER_IP || '10.88.199.195',
    ntp: process.env.NTP_SERVER || '10.88.199.195',
    nfs: process.env.NFS_SERVER || '10.88.199.195:/ani',
    samba: process.env.SAMBA_SERVER || '//10.88.199.195/compartido',
    nisDomain: process.env.NIS_DOMAIN || 'labnis',
    nisServer: process.env.NIS_SERVER || '10.88.199.195',
    cups: process.env.CUPS_SERVER || 'ipp://10.88.199.195:631/printers/ani_sede_principal'
  }
};
