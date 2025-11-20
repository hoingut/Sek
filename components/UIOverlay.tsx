import React, { useEffect, useState } from 'react';
import { GameState, GameScore } from '../types';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { generateFlavorText, generateGameOverMessage } from '../services/geminiService';

interface UIOverlayProps {
  gameState: GameState;
  score: GameScore;
  zoneName: string;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, score, zoneName, onStart, onRestart }) => {
  const [flavorText, setFlavorText] = useState("Initializing Smart Bangladesh...");
  const [gameOverQuote, setGameOverQuote] = useState("");

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      generateFlavorText(zoneName).then(setFlavorText);
    }
  }, [zoneName, gameState]);

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      generateGameOverMessage(Math.floor(score.distance)).then(setGameOverQuote);
    }
  }, [gameState, score.distance]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* HUD */}
      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="flex justify-between items-start">
          <div className="bg-slate-900/80 border-l-4 border-brand-teal p-4 rounded-r-xl backdrop-blur shadow-lg">
            <div className="text-brand-teal text-[10px] font-bold uppercase tracking-widest">Progress</div>
            <div className="text-white text-3xl font-black italic">{Math.floor(score.distance)}<span className="text-sm not-italic text-gray-400 ml-1">m</span></div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="bg-slate-900/80 border-r-4 border-brand-gold p-4 rounded-l-xl backdrop-blur shadow-lg">
              <div className="text-brand-gold text-[10px] font-bold uppercase tracking-widest text-right">Innovation Fund</div>
              <div className="text-white text-3xl font-black flex items-center gap-2 justify-end">
                 <span className="text-brand-gold">৳</span> {score.coins}
              </div>
            </div>
            <div className="bg-brand-purple/90 px-4 py-1 rounded-full text-white text-xs font-bold uppercase shadow-lg tracking-wider">
               {zoneName}
            </div>
          </div>
        </div>
      )}

      {/* Flavor Text */}
      {gameState === GameState.PLAYING && (
         <div className="absolute bottom-32 left-0 w-full text-center px-4">
           <div className="inline-block bg-black/50 backdrop-blur px-6 py-2 rounded-full border border-white/10">
             <p className="text-brand-teal font-bold text-lg uppercase tracking-wide animate-pulse">
               {flavorText}
             </p>
           </div>
         </div>
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center pointer-events-auto z-50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10 text-center p-6">
             <div className="inline-block mb-4 px-4 py-1 bg-brand-teal/20 text-brand-teal rounded-full text-xs font-bold tracking-[0.2em] uppercase border border-brand-teal/30">
               Official Game Concept
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-teal via-white to-brand-red drop-shadow-2xl mb-4 italic transform -skew-x-6">
               SHEIKH HASINA<br/><span className="text-brand-gold">RUN</span>
             </h1>
             <p className="text-slate-400 text-lg mb-10 font-light tracking-wider">Build the Future. Dodge the Past.</p>
             
             <button 
               onClick={onStart}
               className="group relative px-10 py-5 bg-gradient-to-r from-brand-teal to-brand-purple rounded-xl text-white font-bold text-xl shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               <span className="relative flex items-center gap-3">
                 <PlayIcon className="w-6 h-6" /> START MISSION
               </span>
             </button>
          </div>
          
          <div className="absolute bottom-8 text-slate-600 text-xs flex gap-4 uppercase tracking-widest">
             <span>Tap to Jump</span>
             <span>•</span>
             <span>Collect Chips</span>
             <span>•</span>
             <span>Avoid Bots</span>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center pointer-events-auto z-50 backdrop-blur-md">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-4 border-brand-red relative">
            <div className="w-16 h-16 bg-brand-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-red">
               <span className="text-3xl font-black">!</span>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 uppercase italic">System Halted</h2>
            <p className="text-slate-400 text-sm mb-6">Obstacle Encountered: Anti-Progress Bot</p>
            
            <div className="flex justify-center gap-4 mb-8">
               <div className="text-center">
                 <div className="text-xs text-slate-500 uppercase font-bold">Distance</div>
                 <div className="text-2xl font-black text-white">{Math.floor(score.distance)}m</div>
               </div>
               <div className="w-px bg-slate-700"></div>
               <div className="text-center">
                 <div className="text-xs text-slate-500 uppercase font-bold">Funds</div>
                 <div className="text-2xl font-black text-brand-gold">৳{score.coins}</div>
               </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg mb-8 border border-slate-700">
               <p className="text-brand-teal text-sm italic font-medium">"{gameOverQuote}"</p>
            </div>

            <button 
              onClick={onRestart}
              className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/30"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Restart Vision
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;