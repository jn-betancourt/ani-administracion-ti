import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { config } from '../config/env';

export class StorageService {
  private baseDir: string;
  public uploadMiddleware: multer.Multer;

  constructor() {
    this.baseDir = config.storagePath;
    this.initDirectory();
    this.createSampleFilesIfMissing();

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        this.initDirectory();
        cb(null, this.baseDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.pdf';
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
      }
    });

    this.uploadMiddleware = multer({
      storage,
      limits: {
        fileSize: 25 * 1024 * 1024 // 25 MB
      },
      fileFilter: (req, file, cb) => {
        // Aceptar PDFs y documentos ofimáticos
        const allowedMime = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMime.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
          cb(null, true);
        } else {
          cb(new Error('Formato no soportado. Únicamente se admiten archivos PDF y documentos oficiales.'));
        }
      }
    });
  }

  private initDirectory() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[STORAGE WARNING] No se pudo acceder a ${this.baseDir}, usando fallback ./storage/nfs_docs`);
      this.baseDir = path.resolve('./storage/nfs_docs');
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    }
  }

  public getFilePath(fileName: string): string {
    return path.join(this.baseDir, fileName);
  }

  public fileExists(fileName: string): boolean {
    const filePath = this.getFilePath(fileName);
    return fs.existsSync(filePath);
  }

  public deleteFile(fileName: string): boolean {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * Genera PDFs mínimos y válidos para que las descargas de los documentos semilla funcionen inmediatamente.
   */
  private createSampleFilesIfMissing() {
    this.initDirectory();

    const sampleFiles = [
      'ANI-RES-2026-0412-Tercer-Carril-Bogota-Girardot.pdf',
      'ANI-PLI-2015-0018-Pliegos-Autopista-Mar-2.pdf',
      'ANI-INF-2026-0105-Operacion-Ferrea-Dorada-Chiriguana.pdf',
      'ANI-INT-2026-9901-Auditoria-Financiera-Puerto-Antioquia.pdf'
    ];

    for (const fileName of sampleFiles) {
      const targetPath = path.join(this.baseDir, fileName);
      if (!fs.existsSync(targetPath)) {
        // PDF mínimo válido (encabezado %PDF-1.4, objeto catálogo, páginas y xref)
        const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 174 >>
stream
BT
/F1 18 Tf
50 720 Td
(AGENCIA NACIONAL DE INFRAESTRUCTURA - ANI) Tj
/F1 12 Tf
0 -30 Td
(Documento Oficial Consolidado - Administracion de TI 2026) Tj
0 -20 Td
(${fileName}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000472 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
553
%%EOF`;
        fs.writeFileSync(targetPath, minimalPdf);
      }
    }
  }
}

export const storageService = new StorageService();
