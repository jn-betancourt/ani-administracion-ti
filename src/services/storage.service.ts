import path from 'path';
import multer from 'multer';
import { sharedStorageAdapter, SharedVolumeType } from './abstraction/sharedStorage.adapter';

export class StorageService {
  public uploadMiddleware: multer.Multer;
  public volumeUploadMiddleware: multer.Multer;

  constructor() {
    // Middleware para expedientes de proyectos (NFS por defecto)
    const nfsStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = sharedStorageAdapter.getActiveDir('nfs');
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.pdf';
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
      }
    });

    this.uploadMiddleware = multer({
      storage: nfsStorage,
      limits: {
        fileSize: 25 * 1024 * 1024 // 25 MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMime = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMime.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
          cb(null, true);
        } else {
          cb(new Error('Formato no soportado. Únicamente se admiten archivos PDF y documentos oficiales.'));
        }
      }
    });

    // Middleware para subir archivos a cualquiera de los dos volúmenes montados ('nfs' o 'samba')
    const dynamicVolumeStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const rawVol = (req.params?.volumen || 'nfs').toLowerCase();
        const target: SharedVolumeType = rawVol === 'samba' ? 'samba' : 'nfs';
        const dir = sharedStorageAdapter.getActiveDir(target);
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${cleanName}${ext}`);
      }
    });

    this.volumeUploadMiddleware = multer({
      storage: dynamicVolumeStorage,
      limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB
      }
    });
  }

  public getFilePath(fileName: string, target: SharedVolumeType = 'nfs'): string {
    const resolved = sharedStorageAdapter.resolveFilePathForDownload(target, fileName);
    if (resolved) return resolved;
    return path.join(sharedStorageAdapter.getActiveDir(target), fileName);
  }

  public fileExists(fileName: string, target: SharedVolumeType = 'nfs'): boolean {
    const resolved = sharedStorageAdapter.resolveFilePathForDownload(target, fileName);
    return resolved !== null;
  }

  public deleteFile(fileName: string, target: SharedVolumeType = 'nfs'): boolean {
    return sharedStorageAdapter.deleteFile(target, fileName);
  }
}

export const storageService = new StorageService();
