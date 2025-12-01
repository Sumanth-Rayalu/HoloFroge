
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { MOCK_TEMPLATES, Template3D, PaintSettings, TransformMode, ViewMode } from '../types';
import { 
  RotateCcw, Save, Trash2, Palette, Eraser, MousePointer2, 
  Pause, Play, Move, RefreshCw, Scaling, BoxSelect, Sun, Grid3x3 
} from 'lucide-react';

interface ThreeDEditorProps {
  settings: PaintSettings;
  setSettings: React.Dispatch<React.SetStateAction<PaintSettings>>;
}

// A simple editable mesh component
const EditableMesh: React.FC<{ 
  type: string; 
  color: string; 
  rotationSpeed: number;
  viewMode: ViewMode;
  isSelected: boolean;
}> = ({ type, color, rotationSpeed, viewMode, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current && rotationSpeed > 0) {
        meshRef.current.rotation.y += delta * rotationSpeed; 
    }
  });

  const geometry = (() => {
    switch (type) {
      case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[1, 1, 2, 32]} />;
      case 'torus': return <torusGeometry args={[1, 0.4, 16, 100]} />;
      case 'cone': return <coneGeometry args={[1, 2, 32]} />;
      case 'icosahedron': return <icosahedronGeometry args={[1, 0]} />;
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
        wireframe={viewMode === 'WIREFRAME'}
      />
      {isSelected && (
         <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.6, 1.6, 1.6)]} />
            <lineBasicMaterial color="#06b6d4" />
         </lineSegments>
      )}
    </mesh>
  );
};

const ThreeDEditor: React.FC<ThreeDEditorProps> = ({ settings, setSettings }) => {
  const [activeTemplate, setActiveTemplate] = useState<Template3D>(MOCK_TEMPLATES[0]);
  const [objectColor, setObjectColor] = useState('#06b6d4');
  const [autoRotate, setAutoRotate] = useState(0);
  
  // New Blender-like features
  const [transformMode, setTransformMode] = useState<TransformMode | null>(null); // null = select/view
  const [viewMode, setViewMode] = useState<ViewMode>('SOLID');
  const [showGrid, setShowGrid] = useState(true);
  const [envIntensity, setEnvIntensity] = useState(1);

  // Tools configuration
  const tools = [
    { id: 'SELECT', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'BRUSH', icon: <Palette size={20} />, label: 'Brush' },
    { id: 'ERASER', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Utility Bar (Like Blender Header) */}
      <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-cyan-500">OBJECT MODE</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button 
                onClick={() => setTransformMode('translate')} 
                className={`flex items-center gap-1 hover:text-cyan-400 ${transformMode === 'translate' ? 'text-cyan-400' : 'text-gray-400'}`}
            >
                <Move size={14} /> Move
            </button>
            <button 
                onClick={() => setTransformMode('rotate')} 
                className={`flex items-center gap-1 hover:text-cyan-400 ${transformMode === 'rotate' ? 'text-cyan-400' : 'text-gray-400'}`}
            >
                <RefreshCw size={14} /> Rotate
            </button>
            <button 
                onClick={() => setTransformMode('scale')} 
                className={`flex items-center gap-1 hover:text-cyan-400 ${transformMode === 'scale' ? 'text-cyan-400' : 'text-gray-400'}`}
            >
                <Scaling size={14} /> Scale
            </button>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setViewMode(prev => prev === 'SOLID' ? 'WIREFRAME' : 'SOLID')} 
                className={`p-1 rounded ${viewMode === 'WIREFRAME' ? 'bg-cyan-900 text-cyan-400' : 'text-gray-400'}`}
                title="Toggle Wireframe"
            >
                <BoxSelect size={16} />
            </button>
            <button 
                onClick={() => setShowGrid(!showGrid)} 
                className={`p-1 rounded ${showGrid ? 'bg-cyan-900 text-cyan-400' : 'text-gray-400'}`}
                title="Toggle Grid"
            >
                <Grid3x3 size={16} />
            </button>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Left Toolbar */}
        <div className="w-14 bg-black/80 border-r border-cyan-900/30 flex flex-col items-center py-4 gap-4 z-10">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                  if (t.id === 'SELECT') setTransformMode(null);
                  setSettings(prev => ({ ...prev, tool: t.id as any }))
              }}
              title={t.label}
              className={`p-2 rounded-lg transition-all ${settings.tool === t.id ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}
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
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
        </div>

        {/* Main 3D Canvas */}
        <div className="flex-1 bg-gradient-to-b from-gray-900 to-black relative">
          <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <Environment preset="city" environmentIntensity={envIntensity} />
            
            <Stage intensity={0.5} environment="city" adjustCamera={false}>
               <EditableMesh 
                 type={activeTemplate.type} 
                 color={objectColor} 
                 rotationSpeed={autoRotate}
                 viewMode={viewMode}
                 isSelected={true}
               />
            </Stage>
            
            {/* Conditional Transform Gizmo */}
            {transformMode && (
                <TransformControls mode={transformMode}>
                    <mesh position={[0,0,0]} visible={false}><boxGeometry /></mesh> 
                    {/* Note: In a real app, TransformControls would attach to the object ref. 
                        Here we simplified by just showing the gizmo center for visual feedback */}
                </TransformControls>
            )}
            
            {showGrid && <Grid renderOrder={-1} position={[0, -1, 0]} infiniteGrid cellSize={0.5} sectionSize={3} fadeDistance={25} sectionColor="#06b6d4" cellColor="#1e293b" />}
            <OrbitControls makeDefault />
          </Canvas>

          {/* Quick Actions Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="bg-black/50 hover:bg-cyan-900/50 text-cyan-400 p-2 rounded border border-cyan-900/50 backdrop-blur-sm transition-colors" title="Reset View">
              <RotateCcw size={18} />
            </button>
            <button 
                className={`bg-black/50 p-2 rounded border border-cyan-900/50 backdrop-blur-sm transition-colors ${autoRotate > 0 ? 'text-cyan-400' : 'text-gray-500'}`} 
                onClick={() => setAutoRotate(prev => prev === 0 ? 0.5 : 0)}
                title={autoRotate > 0 ? "Stop Animation" : "Play Animation"}
            >
              {autoRotate > 0 ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
          
          {/* Templates Strip (Bottom) */}
           <div className="absolute bottom-4 left-4 right-4 h-20 bg-black/60 border border-gray-800 rounded-lg flex items-center px-4 gap-4 overflow-x-auto whitespace-nowrap scrollbar-thin backdrop-blur-md">
            {MOCK_TEMPLATES.map((tpl) => (
            <button
                key={tpl.id}
                onClick={() => setActiveTemplate(tpl)}
                className={`flex flex-col items-center gap-1 p-1 rounded border transition-all min-w-[60px] ${activeTemplate.id === tpl.id ? 'border-cyan-500 bg-cyan-900/40' : 'border-gray-800 hover:border-cyan-700'}`}
            >
                <img src={tpl.thumbnail} alt={tpl.name} className="w-8 h-8 rounded bg-gray-900 object-cover" />
                <span className="text-[10px] text-cyan-100 font-medium truncate w-full text-center">{tpl.name}</span>
            </button>
            ))}
        </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 bg-black/90 border-l border-cyan-900/30 flex flex-col z-10">
            <div className="p-3 bg-gray-900 border-b border-gray-800 text-xs font-bold text-gray-300 uppercase tracking-widest">
                Properties
            </div>
            
            <div className="p-4 flex flex-col gap-6 overflow-y-auto">
                {/* Scene Settings */}
                <div className="space-y-3">
                    <h3 className="text-cyan-500 text-xs font-bold uppercase flex items-center gap-2">
                        <Sun size={12} /> Scene
                    </h3>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Env Brightness</label>
                        <input 
                            type="range" min="0" max="3" step="0.1" 
                            value={envIntensity} 
                            onChange={(e) => setEnvIntensity(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none" 
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-800" />

                {/* Material Settings */}
                <div className="space-y-3">
                    <h3 className="text-cyan-500 text-xs font-bold uppercase">Material</h3>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Roughness</label>
                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Metalness</label>
                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none" />
                    </div>
                    <div className="flex items-center justify-between">
                         <label className="text-xs text-gray-400">Wireframe</label>
                         <input 
                            type="checkbox" 
                            checked={viewMode === 'WIREFRAME'} 
                            onChange={() => setViewMode(prev => prev === 'SOLID' ? 'WIREFRAME' : 'SOLID')}
                            className="accent-cyan-500" 
                         />
                    </div>
                </div>
                
                <div className="mt-auto space-y-3 pt-6">
                    <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all text-sm">
                        <Save size={14} /> Save Project
                    </button>
                    <button className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-900/20 text-red-400 font-bold rounded flex items-center justify-center gap-2 transition-all text-sm">
                        <Trash2 size={14} /> Clear Scene
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDEditor;
