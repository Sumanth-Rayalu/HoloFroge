import React from 'react';
import { CursorState } from '../types';
import { Scan, Move } from 'lucide-react';

interface HandCursorProps {
  cursor: CursorState;
}

const HandCursor: React.FC<HandCursorProps> = ({ cursor }) => {
  const style: React.CSSProperties = {
    left: `${cursor.x}px`,
    top: `${cursor.y}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none', 
    zIndex: 9999,
  };

  const isPinching = cursor.isDown;
  const isScrolling = cursor.gesture === 'SCROLL';

  // Determine color based on state
  let mainColor = 'border-cyan-400 bg-cyan-500/20';
  let dotColor = 'bg-cyan-300';
  let ringColor = 'border-cyan-500';

  if (isScrolling) {
    mainColor = 'border-yellow-400 bg-yellow-500/20';
    dotColor = 'bg-yellow-300';
    ringColor = 'border-yellow-500';
  } else if (isPinching) {
    mainColor = 'border-fuchsia-400 bg-fuchsia-500/20';
    dotColor = 'bg-fuchsia-300';
    ringColor = 'border-fuchsia-500';
  }

  return (
    <div className="fixed" style={style}>
      <div className={`relative transition-all duration-150 ease-out ${isPinching ? 'scale-90' : 'scale-100'}`}>
        
        {/* Scroll Indicator Arrows */}
        {isScrolling && (
            <div className="absolute inset-0 -m-8 animate-pulse text-yellow-400 opacity-80 flex items-center justify-center">
                <Move size={64} strokeWidth={1} />
            </div>
        )}

        {/* Outer Ring */}
        <div className={`absolute -inset-6 border-2 rounded-full opacity-60 animate-spin-slow ${ringColor}`} style={{ animationDuration: '3s' }} />
        
        {/* Loading Ring (simulates the 2s wait) */}
        {isPinching && !isScrolling && (
            <svg className="absolute -inset-6 w-[3.25rem] h-[3.25rem] -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle 
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    stroke="#e879f9" 
                    strokeWidth="4" 
                    strokeDasharray="301.59" 
                    strokeDashoffset="0"
                    className="animate-[dash_2s_linear_forwards]"
                />
            </svg>
        )}

        {/* Inner Reticle */}
        <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${mainColor}`}>
          <div className={`w-1 h-1 rounded-full transition-colors ${dotColor}`} />
        </div>

        {/* HUD Elements */}
        <div className="absolute top-0 left-10 w-32 pointer-events-none">
            <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono tracking-widest opacity-80 bg-black/50 px-1 rounded w-fit">
                <Scan size={10} />
                <span>{cursor.x.toFixed(0)}:{cursor.y.toFixed(0)}</span>
            </div>
            <div className={`text-[10px] font-bold mt-0.5 tracking-wider uppercase flex items-center gap-2 ${isScrolling ? 'text-yellow-400' : isPinching ? 'text-fuchsia-400' : 'text-cyan-500'}`}>
                {cursor.gesture}
                {isPinching && !isScrolling && <span className="text-[8px] animate-pulse">HOLD...</span>}
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes dash {
            from { stroke-dashoffset: 301.59; }
            to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default HandCursor;