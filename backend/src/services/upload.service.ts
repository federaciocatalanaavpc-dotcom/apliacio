import multer from 'multer';
import path from 'path';
import fs from 'fs';

function crearStorage(subcarpeta: string) {
  const desti = path.join(__dirname, '..', 'uploads', subcarpeta);
  fs.mkdirSync(desti, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, desti),
    filename: (_req, file, cb) => {
      const nomUnic = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, nomUnic);
    },
  });
}

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

export const pujadaDocumentsAgrupacio = multer({ storage: crearStorage('documents'), limits });
