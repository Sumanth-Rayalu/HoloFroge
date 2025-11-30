import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import HandCursor from './components/HandCursor';
import ThreeDEditor from './components/ThreeDEditor';
import UploadEditor from './components/UploadEditor';
import PaintCanvas from './components/PaintCanvas';
import { handTracking } from './services/handTrackingService';
import { AppMode, CursorState, PaintSettings } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>('LANDING');
  const [cursor, setCursor] = useState<CursorState>({ x: 0, y: 0, isDown: false, gesture: 'OPEN' });
  const [paintSettings, setPaintSettings] = useState<PaintSettings>({
    color: '#06b6d4',
    brushSize: 5,
    tool: 'BRUSH'
  });

  useEffect(() => {
    // Initialize Hand Tracking Service (Mocked or WebSocket)
    handTracking.connect((data) => {
      setCursor(data);
    });

    return () => {
      handTracking.disconnect();
    };
  }, []);

  const renderContent = () => {
    switch (mode) {
      case 'THREE_D':
        return <ThreeDEditor settings={paintSettings} setSettings={setPaintSettings} />;
      case 'UPLOAD':
        return <UploadEditor settings={paintSettings} />;
      case 'PAINT':
        return <PaintCanvas settings={paintSettings} cursor={cursor} />;
      default:
        return null;
    }
  };

  if (mode === 'LANDING') {
    return (
      <>
        <HandCursor cursor={cursor} />
        <Landing onStart={() => setMode('THREE_D')} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-cyan-500/30">
      <Navbar currentMode={mode} setMode={setMode} />
      
      <main className="relative z-0">
        {renderContent()}
      </main>

      {/* Overlay Cursor - Always on top */}
      <HandCursor cursor={cursor} />
    </div>
  );
}

export default App;