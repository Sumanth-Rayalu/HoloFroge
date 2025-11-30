export type AppMode = 'LANDING' | 'THREE_D' | 'UPLOAD' | 'PAINT';

export type ToolType = 'BRUSH' | 'ERASER' | 'FILL' | 'PICKER' | 'STICKER';

export interface CursorState {
  x: number;
  y: number;
  isDown: boolean; // Pinch or click
  gesture: 'OPEN' | 'PINCH' | 'FIST' | 'POINT' | 'SCROLL';
}

export interface Template3D {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'torus';
  thumbnail: string;
}

export interface PaintSettings {
  color: string;
  brushSize: number;
  tool: ToolType;
}

export const MOCK_TEMPLATES: Template3D[] = [
  { id: '1', name: 'Cyber Box', type: 'cube', thumbnail: 'https://picsum.photos/id/1/100/100' },
  { id: '2', name: 'Sphere Core', type: 'sphere', thumbnail: 'https://picsum.photos/id/2/100/100' },
  { id: '3', name: 'Flask v2', type: 'cylinder', thumbnail: 'https://picsum.photos/id/3/100/100' },
  { id: '4', name: 'Torus Ring', type: 'torus', thumbnail: 'https://picsum.photos/id/4/100/100' },
];