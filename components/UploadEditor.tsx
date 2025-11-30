import React, { useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Upload, X, Box, Settings, RotateCcw, Pause, Play, Save, Trash2, Palette, MousePointer2, Eraser, FileBox } from 'lucide-react';
import { PaintSettings } from '../types';

interface UploadEditorProps {
    settings: PaintSettings;
}

// Component to handle loading and material updates for the uploaded GLB
const Model = ({ url, color, roughness, metalness, rotationSpeed }: { url: string; color: string; roughness: number; metalness: number; rotationSpeed: number }) => {
  const { scene } = useGLTF(url);
  const clone = React.useMemo(() => scene.clone(), [scene]);
  const groupRef = React.useRef<THREE.Group>(null);

  // Apply materials
  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Check if material exists, otherwise create one
        if (!mesh.material) {
            mesh.material = new THREE.MeshStandardMaterial({ color: color });
        }
        
        // Handle array of materials or single material
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        
        materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.color.set(color);
                mat.roughness = roughness;
                mat.metalness = metalness;
                mat.needsUpdate = true;
            }
        });
      }
    });
  }, [clone, color, roughness, metalness]);

  // Handle rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
        <primitive object={clone} />
    </group>
  );
};

const UploadEditor: React.FC<UploadEditorProps> = ({ settings }) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Editor State
  const [objectColor, setObjectColor] = useState('#06b6d4');
  const [roughness, setRoughness] = useState(0.4);
  const [metalness, setMetalness] = useState(0.6);
  const [autoRotate, setAutoRotate] = useState(0.2);
  const [currentTool, setCurrentTool] = useState<'BRUSH' | 'PICKER' | 'ERASER'>('BRUSH');

  // Cleanup blob url on unmount
  useEffect(() => {
    return () => {
        if (modelUrl) URL.revokeObjectURL(modelUrl);
    };
  }, [modelUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
  };

  const loadSampleModel = () => {
    // Load a sample GLTF/GLB (Using a placeholder box for now if external URL fails, 
    // but in a real app this would be a local asset or reliable CDN link)
    // Here we will use a reliable public model or just simulate the load with a fallback if useGLTF handles it.
    // For this demo, we can just use a generic 'box' placeholder if no URL is provided, 
    // but the Model component expects a URL.
    // Let's use a public Duck or Box model.
    setModelUrl('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb');
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
          processFile(file);
      }
  };

  const handleClear = () => {
      if (modelUrl) URL.revokeObjectURL(modelUrl);
      setModelUrl(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-900 overflow-hidden">
      {!modelUrl ? (
        <div 
            className={`flex-1 flex items-center justify-center p-8 transition-colors ${isDragOver ? 'bg-cyan-900/20' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
          <div className="max-w-md w-full border-2 border-dashed border-cyan-800 rounded-xl bg-black/40 p-12 text-center hover:border-cyan-500 hover:bg-cyan-900/10 transition-all group flex flex-col items-center">
            <div className="w-20 h-20 bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Box size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 holo-font">Upload 3D Object</h2>
            <p className="text-gray-400 mb-8">Select a .glb or .gltf file to import into the HoloForge Studio.</p>
            
            <div className="flex flex-col gap-4 w-full px-8">
                <label className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2">
                  <Upload size={18} /> Select Model
                  <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <div className="h-px bg-gray-700 flex-1"></div>
                    <span>OR</span>
                    <div className="h-px bg-gray-700 flex-1"></div>
                </div>

                <button 
                    onClick={loadSampleModel}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded border border-gray-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                   <FileBox size={18} /> Load Demo Model
                </button>
            </div>
            
            <p className="mt-6 text-xs text-gray-600 max-w-[200px]">
                Note: File dialogs may be restricted by browser security when using hand gestures. Use "Load Demo Model" to test controls.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 relative h-full">
            {/* Left Toolbar - Similar to 3D Studio */}
            <div className="w-16 bg-black/80 border-r border-cyan-900/30 flex flex-col items-center py-6 gap-6 z-10">
                <button
                    onClick={() => setCurrentTool('BRUSH')}
                    className={`p-3 rounded-lg transition-all ${currentTool === 'BRUSH' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Brush"
                >
                    <Palette size={20} />
                </button>
                <button
                    onClick={() => setCurrentTool('PICKER')}
                    className={`p-3 rounded-lg transition-all ${currentTool === 'PICKER' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Picker"
                >
                    <MousePointer2 size={20} />
                </button>
                <button
                    onClick={() => setCurrentTool('ERASER')}
                    className={`p-3 rounded-lg transition-all ${currentTool === 'ERASER' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Eraser"
                >
                    <Eraser size={20} />
                </button>
                
                <div className="w-full h-px bg-gray-800 my-2" />
                
                <input 
                    type="color" 
                    value={objectColor}
                    onChange={(e) => setObjectColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
            </div>

            {/* Main 3D Canvas */}
            <div className="flex-1 bg-gradient-to-b from-gray-900 to-black relative">
                <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <Environment preset="studio" />
                    
                    <Suspense fallback={null}>
                        <Stage intensity={0.6} environment="studio">
                            <Model 
                                url={modelUrl} 
                                color={objectColor} 
                                roughness={roughness} 
                                metalness={metalness}
                                rotationSpeed={autoRotate}
                            />
                        </Stage>
                    </Suspense>
                    
                    <Grid renderOrder={-1} position={[0, -1, 0]} infiniteGrid cellSize={0.5} sectionSize={3} fadeDistance={25} sectionColor="#06b6d4" cellColor="#1e293b" />
                    <OrbitControls makeDefault />
                </Canvas>

                {/* Loading / Suspense Indicator (Visual Only as Suspense fallback is null above for smooth mounting) */}
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-600/50 pointer-events-none">
                    RENDERING ENGINE: ONLINE
                </div>

                {/* Top Right Controls */}
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
                
                {/* Close Button */}
                <button 
                    onClick={handleClear}
                    className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-full border border-red-900/50 backdrop-blur-sm transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                    <X size={14} /> Close Model
                </button>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-64 bg-black/80 border-l border-cyan-900/30 p-4 flex flex-col gap-6 z-10">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-4 font-bold uppercase text-xs tracking-wider">
                        <Settings size={14} /> Material Config
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Roughness</span>
                                <span>{Math.round(roughness * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={roughness}
                                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Metalness</span>
                                <span>{Math.round(metalness * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={metalness}
                                onChange={(e) => setMetalness(parseFloat(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all">
                        <Save size={16} /> Export GLB
                    </button>
                    <button 
                        onClick={() => {
                            setObjectColor('#ffffff');
                            setRoughness(0.5);
                            setMetalness(0.5);
                        }}
                        className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-900/20 text-red-400 font-bold rounded flex items-center justify-center gap-2 transition-all"
                    >
                        <Trash2 size={16} /> Reset Material
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UploadEditor;