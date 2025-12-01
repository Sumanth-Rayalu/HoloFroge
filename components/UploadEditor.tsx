
import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment, useGLTF, useAnimations, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
    Upload, X, Box, Settings, RotateCcw, Pause, Play, Save, Trash2, 
    Palette, MousePointer2, Eraser, FileBox, Bone, Layers, Lightbulb, Move,
    RefreshCw, Scaling, Activity
} from 'lucide-react';
import { PaintSettings, TransformMode } from '../types';

interface UploadEditorProps {
    settings: PaintSettings;
}

// --- Rigged Model Component ---
// Handles Animations, Skeleton Helper, and Material Updates
const RiggedModel = ({ 
    url, 
    color, 
    roughness, 
    metalness, 
    showSkeleton,
    currentAnimation,
    setAnimationsList,
    isPlaying
}: { 
    url: string; 
    color: string; 
    roughness: number; 
    metalness: number; 
    showSkeleton: boolean;
    currentAnimation: string | null;
    setAnimationsList: (names: string[]) => void;
    isPlaying: boolean;
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);
  const { scene: threeScene } = useThree();
  const [skeletonHelper, setSkeletonHelper] = useState<THREE.SkeletonHelper | null>(null);

  // Update animation list in parent
  useEffect(() => {
    if (names.length > 0) {
        setAnimationsList(names);
    }
  }, [names, setAnimationsList]);

  // Handle Animation Playback
  useEffect(() => {
    // Stop all first
    Object.values(actions).forEach((action: any) => action?.fadeOut(0.5));
    
    if (currentAnimation && actions[currentAnimation]) {
        const action = actions[currentAnimation];
        if (action) {
            action.reset().fadeIn(0.5).play();
            action.paused = !isPlaying;
        }
    } else if (names.length > 0) {
        // Default to first animation (usually Idle)
        actions[names[0]]?.reset().fadeIn(0.5).play();
    }
  }, [currentAnimation, actions, names, isPlaying]);

  // Handle Skeleton Visualization
  useEffect(() => {
    if (group.current && showSkeleton) {
        const helper = new THREE.SkeletonHelper(group.current);
        threeScene.add(helper);
        setSkeletonHelper(helper);
    } else if (skeletonHelper) {
        threeScene.remove(skeletonHelper);
        setSkeletonHelper(null);
    }
    return () => {
        if (skeletonHelper) threeScene.remove(skeletonHelper);
    }
  }, [showSkeleton, threeScene]);

  // Apply materials
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (!mesh.material) {
            mesh.material = new THREE.MeshStandardMaterial({ color: color });
        }
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.color.set(color);
                mat.roughness = roughness;
                mat.metalness = metalness;
                mat.needsUpdate = true;
            }
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, color, roughness, metalness]);

  return <primitive ref={group} object={scene} />;
};

const UploadEditor: React.FC<UploadEditorProps> = ({ settings }) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Editor Tabs
  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'ANIMATION' | 'SCENE'>('PROPERTIES');
  
  // Object Properties
  const [objectColor, setObjectColor] = useState('#06b6d4');
  const [roughness, setRoughness] = useState(0.4);
  const [metalness, setMetalness] = useState(0.6);
  
  // Scene/Transform State
  const [transformMode, setTransformMode] = useState<TransformMode>('rotate');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  // Animation State
  const [animationsList, setAnimationsList] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    return () => { if (modelUrl) URL.revokeObjectURL(modelUrl); };
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
      setAnimationsList([]); // Reset animations
  };

  const loadSampleModel = () => {
    // Using a Rigged Robot model to demonstrate Skeleton + Animation features
    setModelUrl('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb');
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
      setAnimationsList([]);
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
            <p className="text-gray-400 mb-8">Select a .glb or .gltf file (Rigged models supported).</p>
            
            <div className="flex flex-col gap-4 w-full px-8">
                <label className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2">
                  <Upload size={18} /> Select Model
                  <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <button 
                    onClick={loadSampleModel}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded border border-gray-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                   <FileBox size={18} /> Load Rigged Robot (Demo)
                </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 relative h-full">
            {/* Left Toolbar - Transform Tools */}
            <div className="w-16 bg-black/80 border-r border-cyan-900/30 flex flex-col items-center py-6 gap-6 z-10">
                <button
                    onClick={() => setTransformMode('translate')}
                    className={`p-3 rounded-lg transition-all ${transformMode === 'translate' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Move"
                >
                    <Move size={20} />
                </button>
                <button
                    onClick={() => setTransformMode('rotate')}
                    className={`p-3 rounded-lg transition-all ${transformMode === 'rotate' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Rotate"
                >
                    <RefreshCw size={20} />
                </button>
                <button
                    onClick={() => setTransformMode('scale')}
                    className={`p-3 rounded-lg transition-all ${transformMode === 'scale' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Scale"
                >
                    <Scaling size={20} />
                </button>
                
                <div className="w-full h-px bg-gray-800 my-2" />
                
                <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={`p-3 rounded-lg transition-all ${showSkeleton ? 'bg-fuchsia-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    title="Toggle Skeleton"
                >
                    <Bone size={20} />
                </button>
            </div>

            {/* Main 3D Canvas */}
            <div className="flex-1 bg-gradient-to-b from-gray-900 to-black relative">
                {/* Header Info */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-black/40 backdrop-blur border-b border-white/10 flex items-center px-4 z-10 justify-between">
                    <span className="text-xs font-mono text-cyan-500">
                        MODE: {transformMode.toUpperCase()} | SKELETON: {showSkeleton ? 'ON' : 'OFF'}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                        ANIMATIONS DETECTED: {animationsList.length}
                    </span>
                </div>

                <Canvas shadows camera={{ position: [0, 2, 8], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <Environment preset="studio" />
                    
                    <Suspense fallback={null}>
                        <TransformControls mode={transformMode}>
                            <group>
                                <RiggedModel 
                                    url={modelUrl} 
                                    color={objectColor} 
                                    roughness={roughness} 
                                    metalness={metalness}
                                    showSkeleton={showSkeleton}
                                    currentAnimation={currentAnimation}
                                    setAnimationsList={setAnimationsList}
                                    isPlaying={isPlaying}
                                />
                            </group>
                        </TransformControls>
                    </Suspense>
                    
                    {showGrid && <Grid renderOrder={-1} position={[0, 0, 0]} infiniteGrid cellSize={0.5} sectionSize={3} fadeDistance={25} sectionColor="#06b6d4" cellColor="#1e293b" />}
                    <OrbitControls makeDefault />
                </Canvas>
                
                {/* Close Button */}
                <button 
                    onClick={handleClear}
                    className="absolute top-14 left-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-1.5 rounded-full border border-red-900/50 backdrop-blur-sm transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                    <X size={14} /> Close Project
                </button>
            </div>

            {/* Right Sidebar - Complex Blender-like Tabs */}
            <div className="w-80 bg-black/90 border-l border-cyan-900/30 flex flex-col z-10">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-800">
                    <button 
                        onClick={() => setActiveTab('PROPERTIES')}
                        className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'PROPERTIES' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Properties
                    </button>
                    <button 
                        onClick={() => setActiveTab('ANIMATION')}
                        className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'ANIMATION' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Animation
                    </button>
                    <button 
                        onClick={() => setActiveTab('SCENE')}
                        className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'SCENE' ? 'text-green-400 border-b-2 border-green-400 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Scene
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                    
                    {/* PROPERTIES TAB */}
                    {activeTab === 'PROPERTIES' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2 font-bold uppercase text-xs tracking-wider">
                                <Settings size={14} /> Material Config
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Base Color</label>
                                <input 
                                    type="color" 
                                    value={objectColor}
                                    onChange={(e) => setObjectColor(e.target.value)}
                                    className="w-full h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Roughness</span>
                                    <span>{Math.round(roughness * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={roughness} onChange={(e) => setRoughness(parseFloat(e.target.value))} className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none" />
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Metalness</span>
                                    <span>{Math.round(metalness * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={metalness} onChange={(e) => setMetalness(parseFloat(e.target.value))} className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none" />
                            </div>
                        </div>
                    )}

                    {/* ANIMATION TAB */}
                    {activeTab === 'ANIMATION' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-fuchsia-400 mb-2 font-bold uppercase text-xs tracking-wider">
                                <Activity size={14} /> Rig Actions
                            </div>

                            {animationsList.length === 0 ? (
                                <div className="text-center p-6 border border-dashed border-gray-700 rounded-lg">
                                    <p className="text-gray-500 text-xs">No animations found in model.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        {animationsList.map((animName) => (
                                            <button
                                                key={animName}
                                                onClick={() => {
                                                    setCurrentAnimation(animName);
                                                    setIsPlaying(true);
                                                }}
                                                className={`p-2 text-xs rounded border text-left truncate transition-all ${currentAnimation === animName ? 'bg-fuchsia-900/40 border-fuchsia-500 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                                            >
                                                {animName}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
                                        <span className="text-xs text-gray-400 font-mono">
                                            {currentAnimation || "Idle"}
                                        </span>
                                        <button 
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="p-1 text-white hover:text-fuchsia-400"
                                        >
                                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SCENE TAB */}
                    {activeTab === 'SCENE' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-400 mb-2 font-bold uppercase text-xs tracking-wider">
                                <Layers size={14} /> Environment
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-400">Show Grid</label>
                                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-green-500" />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-400">Show Skeleton</label>
                                <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} className="accent-green-500" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 space-y-3">
                    <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all text-sm">
                        <Save size={14} /> Export GLB
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UploadEditor;
