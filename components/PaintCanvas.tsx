import React, { useRef, useEffect, useState } from 'react';
import { PaintSettings, CursorState } from '../types';
import { Undo, Redo, Eraser, Trash, Download } from 'lucide-react';

interface PaintCanvasProps {
  settings: PaintSettings;
  cursor: CursorState;
}

const PaintCanvas: React.FC<PaintCanvasProps> = ({ settings, cursor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas on mount
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        
        // Fill white background initially
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drawing Logic driven by Cursor State
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Convert screen coordinates to canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const x = cursor.x - rect.left;
    const y = cursor.y - rect.top;

    // "Pinch" gesture acts as mouse down
    if (cursor.isDown) {
      if (!isDrawing) {
        setIsDrawing(true);
        lastPos.current = { x, y };
      } else {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = settings.tool === 'ERASER' ? '#ffffff' : settings.color;
        ctx.lineWidth = settings.brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
        lastPos.current = { x, y };
      }
    } else {
      setIsDrawing(false);
      lastPos.current = null;
    }
  }, [cursor, isDrawing, settings]);

  const clearCanvas = () => {
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-200 relative">
      <div ref={containerRef} className="flex-1 m-4 shadow-2xl cursor-none bg-white overflow-hidden rounded-lg">
        <canvas ref={canvasRef} />
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-gray-700">
        <div className="flex gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full text-gray-300" title="Undo"><Undo size={20} /></button>
            <button className="p-2 hover:bg-white/10 rounded-full text-gray-300" title="Redo"><Redo size={20} /></button>
        </div>
        <div className="w-px h-6 bg-gray-600"></div>
        <div className="flex gap-4 items-center">
            <input 
                type="color" 
                value={settings.color} 
                onChange={() => {}} // Controlled by parent usually, but nice to visualize
                className="w-8 h-8 rounded-full border-2 border-white cursor-none"
            />
            <div className="flex flex-col w-24">
                <span className="text-[10px] uppercase text-gray-400 font-bold">Brush Size</span>
                <input type="range" min="1" max="50" value={settings.brushSize} className="h-1 accent-cyan-500" readOnly />
            </div>
        </div>
        <div className="w-px h-6 bg-gray-600"></div>
        <div className="flex gap-2">
            <button onClick={clearCanvas} className="p-2 hover:bg-red-900/50 text-red-400 rounded-full" title="Clear"><Trash size={20} /></button>
            <button className="p-2 hover:bg-cyan-900/50 text-cyan-400 rounded-full" title="Save"><Download size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default PaintCanvas;