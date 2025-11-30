import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MOCK_TEMPLATES, Template3D, PaintSettings } from '../types';
import { Hexagon, RotateCcw, Save, Trash2, Palette, Eraser, MousePointer2, Pause, Play } from 'lucide-react';

interface ThreeDEditorProps {
  settings: PaintSettings;
  setSettings: React.Dispatch<React.SetStateAction<PaintSettings>>;
}

// A simple editable mesh component
const EditableMesh: React.FC<{ type: string; color: string; rotationSpeed: number }> = ({ type, color, rotationSpeed }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
        // Subtle idle rotation
        meshRef.current.rotation.y += delta * rotationSpeed; 
    }
  });

  const geometry = (() => {
    switch (type) {
      case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[1, 1, 2, 32]} />;
      case 'torus': return <torusGeometry args={[1, 0.4, 16, 100]} />;
      case 'cube': 
      default: return <boxGeometry args={[1.5, 1.5, 1.5]} />;
    }
  })();

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial 
        color={color} 
        metalness={0.6} 
        roughness={0.2} 
      />
    </mesh>
  );
};

const ThreeDEditor: React.FC<ThreeDEditorProps> = ({ settings, setSettings }) => {
  const [activeTemplate, setActiveTemplate] = useState<Template3D>(MOCK_TEMPLATES[0]);
  const [objectColor, setObjectColor] = useState('#06b6d4');
  const [autoRotate, setAutoRotate] = useState(0.2);

  // Tools configuration
  const tools = [
    { id: 'BRUSH', icon: <Palette size={20} />, label: 'Brush' },
    { id: 'PICKER', icon: <MousePointer2 size={20} />, label: 'Picker' },
    { id: 'ERASER', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Templates Bar */}
      <div className="h-28 bg-black/60 border-b border-cyan-900/30 flex items-center px-4 gap-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
        {MOCK_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setActiveTemplate(tpl)}
            className={`flex flex-col items-center gap-2 p-2 rounded border transition-all ${activeTemplate.id === tpl.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-800 hover:border-cyan-700'}`}
          >
            <img src={tpl.thumbnail} alt={tpl.name} className="w-12 h-12 rounded bg-gray-900 object-cover" />
            <span className="text-xs text-cyan-100 font-medium">{tpl.name}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 relative">
        {/* Left Toolbar */}
        <div className="w-16 bg-black/80 border-r border-cyan-900/30 flex flex-col items-center py-6 gap-6 z-10">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setSettings(prev => ({ ...prev, tool: t.id as any }))}
              title={t.label}
              className={`p-3 rounded-lg transition-all ${settings.tool === t.id ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}
            >
              {t.icon}
            </button>
          ))}
          <div className="w-full h-px bg-gray-800 my-2" />
          <input 
            type="color" 
            value={objectColor}
            onChange={(e) => {
                setObjectColor(e.target.value);
                setSettings(prev => ({...prev, color: e.target.value}));
            }}
            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
          />
        </div>

        {/* Main 3D Canvas */}
        <div className="flex-1 bg-gradient-to-b from-gray-900 to-black relative">
          <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <Environment preset="city" />
            
            <Stage intensity={0.6} environment="city">
               <EditableMesh 
                 type={activeTemplate.type} 
                 color={objectColor} 
                 rotationSpeed={autoRotate}
               />
            </Stage>
            
            <Grid renderOrder={-1} position={[0, -1, 0]} infiniteGrid cellSize={0.5} sectionSize={3} fadeDistance={25} sectionColor="#06b6d4" cellColor="#1e293b" />
            <OrbitControls makeDefault />
          </Canvas>

          {/* Canvas HUD */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="bg-black/50 hover:bg-cyan-900/50 text-cyan-400 p-2 rounded border border-cyan-900/50 backdrop-blur-sm transition-colors" title="Reset View">
              <RotateCcw size={18} />
            </button>
            <button 
                className={`bg-black/50 p-2 rounded border border-cyan-900/50 backdrop-blur-sm transition-colors ${autoRotate > 0 ? 'text-cyan-400' : 'text-gray-500'}`} 
                onClick={() => setAutoRotate(prev => prev === 0 ? 0.2 : 0)}
                title={autoRotate > 0 ? "Stop Rotation" : "Start Rotation"}
            >
              {autoRotate > 0 ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-black/80 border-l border-cyan-900/30 p-4 flex flex-col gap-6 z-10">
          <div>
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-3">Object Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Roughness</label>
                <input type="range" min="0" max="1" step="0.1" className="w-full accent-cyan-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Metalness</label>
                <input type="range" min="0" max="1" step="0.1" className="w-full accent-cyan-500" />
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
             <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all">
                <Save size={16} /> Save Design
             </button>
             <button className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-900/20 text-red-400 font-bold rounded flex items-center justify-center gap-2 transition-all">
                <Trash2 size={16} /> Reset
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDEditor;