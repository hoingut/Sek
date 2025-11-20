import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, GameScore } from './types';
import { ZONES } from './constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<GameScore>({ distance: 0, coins: 0 });
  const [currentZone, setCurrentZone] = useState(ZONES[0].name);

  const handleStart = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore({ distance: 0, coins: 0 });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore({ distance: 0, coins: 0 });
  }, []);

  const handleGameOver = useCallback((finalScore: GameScore) => {
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
  }, []);

  const handleScoreUpdate = useCallback((newScore: GameScore) => {
    setScore(prev => ({ ...newScore }));
  }, []);

  const handleZoneChange = useCallback((zoneName: string) => {
    setCurrentZone(zoneName);
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      <GameCanvas 
        gameState={gameState}
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
        onZoneChange={handleZoneChange}
      />
      <UIOverlay 
        gameState={gameState}
        score={score}
        zoneName={currentZone}
        onStart={handleStart}
        onRestart={handleRestart}
      />
      
      {/* Global CSS Audio/Visual effects layer (Scanlines) */}
      <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
    </div>
  );
}

export default App;
