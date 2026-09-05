import multer from 'multer';

// Els fitxers es reben en memòria (com a Buffer) i es desen directament a la
// base de dades (columna Bytes), no al disc del servidor: al pla gratuït de
// Render el disc és efímer i es perd en cada redeploy.
const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

export const pujadaDocumentsAgrupacio = multer({ storage: multer.memoryStorage(), limits });
