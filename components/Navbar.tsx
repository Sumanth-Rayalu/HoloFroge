import React from 'react';
import { AppMode } from '../types';
import { Box, Image, Palette, Home, Settings, Webcam } from 'lucide-react';

interface NavbarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, setMode }) => {
  const navItems: { mode: AppMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'THREE_D', label: '3D Studio', icon: <Box size={18} /> },
    { mode: 'UPLOAD', label: 'Upload & Design', icon: <Image size={18} /> },
    { mode: 'PAINT', label: 'Free Paint', icon: <Palette size={18} /> },
  ];

  return (
    <nav className="h-16 border-b border-cyan-900/50 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setMode('LANDING')}>
        <div className="w-8 h-8 bg-cyan-500 rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            <div className="w-4 h-4 bg-black -rotate-45" />
        </div>
        <h1 className="text-xl font-bold tracking-widest holo-font bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          HOLOFORGE
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-sm border transition-all duration-300 font-medium
              ${currentMode === item.mode 
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 text-cyan-600">
        <div className="hidden md:flex items-center gap-1 text-xs font-mono border border-cyan-900/50 px-2 py-1 rounded bg-black/40">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
           SYSTEM ONLINE
        </div>
        <Webcam size={20} className="hover:text-cyan-400 cursor-pointer" />
        <Settings size={20} className="hover:text-cyan-400 cursor-pointer" />
      </div>
    </nav>
  );
};

export default Navbar;