import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Crop, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

type ImageCropModalProps = {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
  aspectRatio?: number;
  outputWidth?: number;
  outputHeight?: number;
};

export default function ImageCropModal({ open, file, onClose, onCropComplete, aspectRatio = 1, outputWidth = 256, outputHeight = 256 }: ImageCropModalProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (file && open) {
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    } else {
      setImgSrc(null);
    }
  }, [file, open]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const produceBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) { reject(new Error('Crop failed')); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Crop failed')); return; }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const container = containerRef.current;
      const containerW = container?.clientWidth || 300;
      const containerH = container?.clientHeight || 300;

      const scale = Math.min(containerW / img.naturalWidth, containerH / img.naturalHeight) * zoom;
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const cx = containerW / 2 + offset.x;
      const cy = containerH / 2 + offset.y;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, outputWidth, outputHeight);
      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const cropScale = outputWidth / containerW;
      ctx.scale(cropScale, cropScale);
      ctx.drawImage(img, cx - containerW / 2 - drawW / 2, cy - containerH / 2 - drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Crop failed'));
      }, 'image/png');
    });
  }, [zoom, rotation, offset, outputWidth, outputHeight]);

  const handleConfirm = async () => {
    try {
      const blob = await produceBlob();
      onCropComplete(blob);
      onClose();
    } catch {
      onClose();
    }
  };

  if (!open || !imgSrc) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-dark-200 border border-dark-50 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Crop className="w-5 h-5 text-info-500" /> Adjust Image</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-accent-500 hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative mx-auto bg-dark-400 rounded-xl overflow-hidden cursor-move touch-none"
          style={{ width: 300, height: 300 / aspectRatio }}
        >
          <div className="absolute inset-0 pointer-events-none border-2 border-info-500/50 rounded-xl" />
          <img
            ref={imgRef}
            src={imgSrc}
            alt="To crop"
            draggable={false}
            className="absolute select-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom})`,
              maxWidth: 'none',
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-50 transition-colors" aria-label="Zoom out"><ZoomOut className="w-5 h-5" /></button>
          <button onClick={() => setRotation(r => r - 90)} className="p-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-50 transition-colors" aria-label="Rotate left"><RotateCw className="w-5 h-5 scale-x-[-1]" /></button>
          <button onClick={() => setRotation(r => r + 90)} className="p-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-50 transition-colors" aria-label="Rotate right"><RotateCw className="w-5 h-5" /></button>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-50 transition-colors" aria-label="Zoom in"><ZoomIn className="w-5 h-5" /></button>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">Zoom: {zoom.toFixed(1)}x</label>
          <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full accent-info-500" />
        </div>

        <button onClick={handleConfirm} className="btn-success w-full mt-4 flex items-center justify-center gap-2">
          <Check className="w-5 h-5" /> Apply
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
