/** Descarga un contenido generado en el navegador (sin servidor). */
export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera la URL después de que el navegador inicie la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(fileName: string, text: string, mime: string): void {
  downloadBlob(fileName, new Blob([text], { type: `${mime};charset=utf-8` }));
}

/** Convierte un SVG en una imagen PNG dibujándolo sobre un lienzo (con escala para mayor nitidez). */
export function svgToPngBlob(svg: string, width: number, height: number, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('El navegador no permite dibujar en un lienzo.');
        context.scale(scale, scale);
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen PNG.'))), 'image/png');
      } catch (err) {
        reject(err instanceof Error ? err : new Error('No se pudo generar la imagen PNG.'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo convertir el dibujo a PNG.'));
    };
    image.src = url;
  });
}
