// Converteix un <svg> (p.ex. un gràfic de recharts) a una imatge PNG en
// base64, perquè es pugui incrustar dins un PDF amb jsPDF. Evita dependre
// d'una llibreria addicional (com html2canvas) per a aquest únic ús.
export function svgAPng(svg: SVGSVGElement): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const rect = svg.getBoundingClientRect();
    const width = Math.round(rect.width) || 600;
    const height = Math.round(rect.height) || 300;
    const clon = svg.cloneNode(true) as SVGSVGElement;
    clon.setAttribute('width', String(width));
    clon.setAttribute('height', String(height));
    clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // Fons blanc: sense això, el PDF mostraria transparència com a negre.
    clon.insertAdjacentHTML('afterbegin', `<rect width="100%" height="100%" fill="#ffffff"/>`);

    const svgText = new XMLSerializer().serializeToString(clon);
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const escala = 2; // més resolució per al PDF
      canvas.width = width * escala;
      canvas.height = height * escala;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No s\'ha pogut crear el canvas'));
      ctx.scale(escala, escala);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width, height });
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
