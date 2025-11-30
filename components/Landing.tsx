import React from 'react';
import { Play } from 'lucide-react';
import { AppMode } from '../types';

const Landing: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      
      <div className="relative z-10 text-center space-y-8 p-6">
        <div className="inline-block animate-bounce-slow">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-fuchsia-600 rounded-lg mx-auto rotate-45 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.6)]">
                <div className="w-20 h-20 bg-black -rotate-45 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">HF</span>
                </div>
            </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter holo-font text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          HOLOFORGE
        </h1>
        <p className="text-cyan-200/60 text-xl tracking-[0.3em] font-light uppercase">
          Spatial Design Studio
        </p>

        <button 
          onClick={onStart}
          className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-sm transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
        >
          <div className="absolute inset-0 w-full h-full bg-cyan-600/20 group-hover:bg-cyan-500/30 transition-all"></div>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>
          
          <span className="relative z-10 flex items-center gap-3 text-cyan-100 font-bold tracking-widest text-lg group-hover:text-white">
            INITIALIZE SYSTEM <Play size={18} fill="currentColor" />
          </span>
        </button>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-600 font-mono">
        System v4.2.0 • Hand Tracking Module: ACTIVE
      </div>
    </div>
  );
};

export default Landing;