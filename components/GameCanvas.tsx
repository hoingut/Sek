
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, GameObject, ObstacleType, Particle } from '../types';
import { GAME_SPEED_START, GRAVITY, JUMP_FORCE, GROUND_HEIGHT, SPAWN_RATE_MAX, PLAYER_HEIGHT, ZONES } from '../constants';
import { playJumpSound, playCoinSound, playCrashSound } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: { distance: number, coins: number }) => void;
  onScoreUpdate: (score: { distance: number, coins: number }) => void;
  onZoneChange: (zoneName: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onScoreUpdate, onZoneChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Mutable game state
  const frameCountRef = useRef(0);
  const scoreRef = useRef({ distance: 0, coins: 0 });
  const speedRef = useRef(GAME_SPEED_START);
  const playerRef = useRef({
    x: 120,
    y: 0,
    dy: 0,
    isJumping: false,
    groundY: 0,
    runCycle: 0
  });
  const obstaclesRef = useRef<GameObject[]>([]);
  const coinsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const heartParticlesRef = useRef<Particle[]>([]); // Dedicated hearts for Modi
  const activeZoneIndexRef = useRef(0);

  // --- DRAWING HELPERS ---

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  const drawChaser = (ctx: CanvasRenderingContext2D, x: number, y: number, runCycle: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Simple bobbing
    const bob = Math.sin(runCycle + 2) * 3;
    ctx.translate(0, bob);

    // Colors
    const skinColor = '#E0AC69';
    const hairColor = '#FFFFFF'; // White hair/beard
    const vestColor = '#FF9933'; // Saffron
    const kurtaColor = '#FFFFFF'; 

    // Body (Kurta)
    ctx.fillStyle = kurtaColor;
    ctx.beginPath();
    ctx.ellipse(20, 45, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vest (Jacket)
    ctx.fillStyle = vestColor;
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.lineTo(30, 30);
    ctx.lineTo(30, 55);
    ctx.lineTo(10, 55);
    ctx.fill();

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(20, 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Beard (White)
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(20, 20, 12, 0, Math.PI, false); // Bottom half of face
    ctx.lineTo(32, 15);
    ctx.lineTo(8, 15);
    ctx.fill();

    // Hair
    ctx.beginPath();
    ctx.arc(20, 12, 13, Math.PI, 0);
    ctx.fill();

    // Glasses
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, 14); ctx.lineTo(25, 14);
    ctx.stroke();
    ctx.strokeRect(14, 11, 5, 4);
    ctx.strokeRect(21, 11, 5, 4);

    // Arms (Swinging) - Reaching out as a "Premik"
    ctx.strokeStyle = kurtaColor;
    ctx.lineWidth = 4;
    const armSwing = Math.cos(runCycle + 2) * 5; // Less swing, more reaching
    // Reaching forward
    ctx.beginPath(); ctx.moveTo(20, 32); ctx.lineTo(35, 40 + armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 32); ctx.lineTo(35, 40 - armSwing); ctx.stroke();

    // Legs
    ctx.strokeStyle = '#FFF'; // White pants
    ctx.lineWidth = 4;
    const legSwing = Math.sin(runCycle + 2) * 15;
    ctx.beginPath(); ctx.moveTo(15, 60); ctx.lineTo(15 - legSwing, 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 60); ctx.lineTo(25 + legSwing, 80); ctx.stroke();

    ctx.restore();
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, x: number, y: number, isJumping: boolean, runCycle: number, isDead: boolean) => {
    ctx.save();
    ctx.translate(x, y);

    // Bobbing animation
    const bob = isJumping ? 0 : Math.sin(runCycle) * 3;
    if (!isDead) ctx.translate(0, bob);

    // Colors
    const sareeColor = '#00A86B'; // Joy Bangla Green
    const sareeRed = '#F42A41';   // Flag Red
    const skinColor = '#F5D0A9';  // Cartoon skin tone
    
    // 1. Saree Drape (Body)
    ctx.fillStyle = sareeColor;
    // Main body shape
    ctx.beginPath();
    ctx.moveTo(10, 25); 
    ctx.lineTo(35, 25);
    ctx.lineTo(38, 60); 
    ctx.lineTo(8, 60);
    ctx.fill();

    // Red Border Detail
    ctx.strokeStyle = sareeRed;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 25);
    ctx.lineTo(10, 55);
    ctx.stroke();

    // Saree Sash (Pallu) flying behind
    ctx.fillStyle = sareeRed;
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.quadraticCurveTo(-15, 30 + bob, -30, 20 + bob*2);
    ctx.lineTo(-30, 40 + bob*2);
    ctx.quadraticCurveTo(-15, 50 + bob, 15, 45);
    ctx.fill();

    // 2. Head (Larger for cartoon style)
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(22, 12, 16, 0, Math.PI * 2); // Big head
    ctx.fill();

    // 3. Hair (Simple Bun)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(22, 10, 17, Math.PI * 0.9, Math.PI * 2.1); // Top hair
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, 12, 8, 0, Math.PI * 2); // Bun back
    ctx.fill();

    // 4. Face
    if (isDead) {
      // Funny Dead Face
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      
      // Left Eye (X)
      ctx.beginPath(); 
      ctx.moveTo(16, 10); ctx.lineTo(22, 16);
      ctx.moveTo(22, 10); ctx.lineTo(16, 16);
      ctx.stroke();

      // Right Eye (X)
      ctx.beginPath(); 
      ctx.moveTo(26, 10); ctx.lineTo(32, 16);
      ctx.moveTo(32, 10); ctx.lineTo(26, 16);
      ctx.stroke();

      // Mouth (Tongue out)
      ctx.beginPath();
      ctx.arc(24, 22, 4, 0, Math.PI, false);
      ctx.stroke();
      ctx.fillStyle = '#FF69B4'; // Pink tongue
      ctx.beginPath();
      ctx.ellipse(24, 25, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal Cartoon Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(18, 12, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(28, 12, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(20, 12, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(30, 12, 2, 0, Math.PI*2); ctx.fill();

      // Smile
      ctx.beginPath(); 
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1.5;
      ctx.arc(24, 18, 4, 0.2, Math.PI - 0.2); 
      ctx.stroke();

      // Glasses (Subtle)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(32, 12); ctx.stroke();
      ctx.strokeRect(14, 8, 8, 8);
      ctx.strokeRect(24, 8, 8, 8);
    }

    // 5. Arms
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    if (isDead) {
        // Flailing arms
        ctx.beginPath(); ctx.moveTo(22, 30); ctx.lineTo(10, 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(22, 30); ctx.lineTo(45, 15); ctx.stroke();
    } else if (isJumping) {
       ctx.beginPath(); ctx.moveTo(22, 30); ctx.lineTo(40, 15); ctx.stroke(); // Hurray pose
    } else {
       const armSwing = Math.cos(runCycle) * 12;
       ctx.beginPath(); ctx.moveTo(22, 30); ctx.lineTo(32 + armSwing, 45); ctx.stroke();
    }

    // 6. Legs
    ctx.strokeStyle = sareeColor;
    if (isDead) {
      // Legs spread
      ctx.beginPath(); ctx.moveTo(18, 55); ctx.lineTo(10, 75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 55); ctx.lineTo(40, 75); ctx.stroke();
    } else if (isJumping) {
      ctx.beginPath(); ctx.moveTo(18, 55); ctx.lineTo(12, 70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 55); ctx.lineTo(38, 65); ctx.stroke();
    } else {
      const legSwing = Math.sin(runCycle) * 18;
      ctx.beginPath(); ctx.moveTo(18, 55); ctx.lineTo(18 - legSwing, 80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 55); ctx.lineTo(28 + legSwing, 80); ctx.stroke();
    }

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, zoneIdx: number, scroll: number) => {
    // Sky - Solid Cartoon Colors
    const skyColors = ['#87CEEB', '#FFD700', '#E6E6FA', '#98FB98']; // Day, Sunset, Tech, Green
    const groundColors = ['#a3a3a3', '#d4d4d4', '#2d2d2d', '#5a5a5a'];
    
    ctx.fillStyle = skyColors[zoneIdx] || '#87CEEB';
    ctx.fillRect(0, 0, width, height);

    // Sun / Moon
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(width - 100, 100, 60, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Background City/Landscape (Parallax 0.3x) - Simplified Shapes
    const bgOffset = (scroll * 0.3) % 600;
    ctx.fillStyle = zoneIdx === 3 ? '#228B22' : '#4B0082'; // Forest green or Indigo city
    if (zoneIdx === 1) ctx.fillStyle = '#4682B4'; // Steel Blue for bridge water

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = -600; x < width + 600; x += 100) {
        const drawX = x - bgOffset;
        // Simple skyline
        if (zoneIdx === 0) { // Dhaka City
             ctx.fillRect(drawX, height - GROUND_HEIGHT - 150, 60, 150);
             ctx.fillStyle = '#FFD700'; // Windows
             if (Math.abs(x) % 200 === 0) ctx.fillRect(drawX + 10, height - GROUND_HEIGHT - 130, 10, 10);
             ctx.fillStyle = '#4B0082';
        } else if (zoneIdx === 1) { // Bridge Cables
             ctx.beginPath();
             ctx.moveTo(drawX, height - GROUND_HEIGHT);
             ctx.lineTo(drawX + 50, height - GROUND_HEIGHT - 200);
             ctx.lineTo(drawX + 100, height - GROUND_HEIGHT);
             ctx.fill();
        } else { // Village/Nature
             ctx.beginPath();
             ctx.arc(drawX, height - GROUND_HEIGHT, 80, Math.PI, 0);
             ctx.fill();
        }
    }
    
    // Road
    ctx.fillStyle = groundColors[zoneIdx] || '#555';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);

    // Road Striping (Cartoon style)
    ctx.fillStyle = '#FFF';
    const roadOffset = (scroll * 1.5) % 120;
    for (let i = -120; i < width; i += 120) {
       ctx.fillRect(i - roadOffset, height - GROUND_HEIGHT + 40, 80, 15);
    }
    
    // Bottom Border
    ctx.fillStyle = ZONES[zoneIdx].color;
    ctx.fillRect(0, height - 10, width, 10);
  };

  // --- LOGIC ---

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color
      });
    }
  };

  const spawnHearts = (x: number, y: number) => {
     if (Math.random() > 0.2) return;
     heartParticlesRef.current.push({
       x, y,
       vx: (Math.random() - 0.5) * 2,
       vy: -2 - Math.random() * 2,
       life: 1.0,
       color: '#FF69B4'
     });
  };

  const resetGame = useCallback(() => {
    scoreRef.current = { distance: 0, coins: 0 };
    speedRef.current = GAME_SPEED_START;
    obstaclesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    heartParticlesRef.current = [];
    activeZoneIndexRef.current = 0;
    playerRef.current.y = playerRef.current.groundY - PLAYER_HEIGHT;
    playerRef.current.dy = 0;
    playerRef.current.isJumping = false;
    frameCountRef.current = 0;
  }, []);

  const handleJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!playerRef.current.isJumping) {
      playJumpSound(); // Sound Effect
      playerRef.current.dy = JUMP_FORCE;
      playerRef.current.isJumping = true;
      spawnParticles(playerRef.current.x + 20, playerRef.current.y + 70, '#fff', 8);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') handleJump();
    };
    const handleTouch = () => handleJump();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [handleJump]);

  // Resize Handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      playerRef.current.groundY = canvas.height - GROUND_HEIGHT;
      if (!playerRef.current.isJumping) playerRef.current.y = playerRef.current.groundY - PLAYER_HEIGHT;
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Game State Listener - Fixes Restart Bug
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      resetGame();
    }
  }, [gameState, resetGame]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear logic
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // We draw even if paused/game over so the screen isn't empty
    const p = playerRef.current;
    const isGameOver = gameState === GameState.GAME_OVER;
    const scroll = frameCountRef.current * speedRef.current;

    // Draw Background
    drawBackground(ctx, canvas.width, canvas.height, activeZoneIndexRef.current, scroll);

    // Draw Chaser (Modi) behind player
    drawChaser(ctx, p.x - 80, p.groundY - PLAYER_HEIGHT, p.runCycle);

    // Draw Character (Funny if Game Over)
    drawCharacter(ctx, p.x, p.y, p.isJumping, p.runCycle, isGameOver);

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.type === ObstacleType.FLYING_DRONE) {
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(obs.x + 25, obs.y + 25, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(obs.x + 25, obs.y + 25, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#CCC';
        ctx.fillRect(obs.x + 5, obs.y, 40, 4);
      } else {
        ctx.fillStyle = '#2c3e50';
        drawRoundedRect(ctx, obs.x, obs.y, 50, 50, 8);
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.moveTo(obs.x + 10, obs.y + 15); ctx.lineTo(obs.x+25, obs.y+25); ctx.lineTo(obs.x+10, obs.y+25); ctx.fill();
        ctx.beginPath(); ctx.moveTo(obs.x + 40, obs.y + 15); ctx.lineTo(obs.x+25, obs.y+25); ctx.lineTo(obs.x+40, obs.y+25); ctx.fill();
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(obs.x+15, obs.y+35, 20, 5);
      }
    });

    // Draw Coins
    coinsRef.current.forEach(coin => {
      if (!coin.active) return;
      const bounce = Math.sin(frameCountRef.current * 0.15) * 8;
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(coin.x + 20, coin.y + 20 + bounce, 18, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B45309'; ctx.font = 'bold 24px Arial'; ctx.fillText('৳', coin.x + 12, coin.y + 28 + bounce);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(coin.x + 15, coin.y + 15 + bounce, 5, 0, Math.PI*2); ctx.fill();
    });

    // Draw Particles
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Heart Particles (Modi Premik)
    heartParticlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      // Draw Heart shape
      const s = 10 * pt.life;
      ctx.translate(pt.x, pt.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s/2, -s/2, -s, 0, 0, s);
      ctx.bezierCurveTo(s, 0, s/2, -s/2, 0, 0);
      ctx.fill();
      ctx.translate(-pt.x, -pt.y);
    });
    ctx.globalAlpha = 1.0;

    if (gameState !== GameState.PLAYING) return;

    // --- GAME PLAYING LOGIC ---

    frameCountRef.current++;
    
    // Logic: Speed & Score
    if (frameCountRef.current % 300 === 0) speedRef.current += 0.5;
    scoreRef.current.distance += speedRef.current / 10;
    
    // Logic: Zones
    const currentZoneIndex = Math.floor(scoreRef.current.distance / 500) % ZONES.length;
    if (currentZoneIndex !== activeZoneIndexRef.current) {
      activeZoneIndexRef.current = currentZoneIndex;
      onZoneChange(ZONES[currentZoneIndex].name);
    }

    // Logic: Player Physics
    p.dy += GRAVITY;
    p.y += p.dy;
    p.runCycle += 0.25;
    if (p.y + PLAYER_HEIGHT > p.groundY) {
      p.y = p.groundY - PLAYER_HEIGHT;
      p.dy = 0;
      p.isJumping = false;
    }

    // Logic: Modi Hearts
    spawnHearts(p.x - 60, p.groundY - 60);

    // Logic: Spawning
    const currentSpawnRate = Math.max(30, SPAWN_RATE_MAX - (speedRef.current * 3));
    if (frameCountRef.current % Math.floor(currentSpawnRate) === 0) {
       if (Math.random() > 0.35) {
          const type = Math.random() > 0.6 ? ObstacleType.FLYING_DRONE : ObstacleType.GROUND_BOT;
          obstaclesRef.current.push({
            x: canvas.width,
            y: type === ObstacleType.FLYING_DRONE ? p.groundY - 130 : p.groundY - 60,
            width: 50,
            height: 50,
            type,
            active: true
          });
       } else {
         coinsRef.current.push({
           x: canvas.width,
           y: p.groundY - 120 + (Math.random() * 60),
           width: 40,
           height: 40,
           active: true
         });
       }
    }

    // Logic: Movement
    obstaclesRef.current.forEach(o => o.x -= speedRef.current);
    coinsRef.current.forEach(c => c.x -= speedRef.current);
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x > -100);
    coinsRef.current = coinsRef.current.filter(c => c.x > -100);

    // Logic: Collision
    const hitbox = { x: p.x + 15, y: p.y + 15, w: 15, h: 40 };
    
    for (const obs of obstaclesRef.current) {
      if (hitbox.x < obs.x + obs.width && hitbox.x + hitbox.w > obs.x &&
          hitbox.y < obs.y + obs.height && hitbox.y + hitbox.h > obs.y) {
        playCrashSound();
        onGameOver(scoreRef.current);
        return;
      }
    }
    coinsRef.current.forEach(coin => {
       if (coin.active && hitbox.x < coin.x + coin.width && hitbox.x + hitbox.w > coin.x &&
           hitbox.y < coin.y + coin.height && hitbox.y + hitbox.h > coin.y) {
         coin.active = false;
         scoreRef.current.coins += 1;
         playCoinSound();
         spawnParticles(coin.x + 20, coin.y + 20, '#FFD700', 10);
       }
    });

    // Logic: Particles
    particlesRef.current.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);
    heartParticlesRef.current.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.02; });
    heartParticlesRef.current = heartParticlesRef.current.filter(pt => pt.life > 0);

    if (frameCountRef.current % 10 === 0) onScoreUpdate(scoreRef.current);
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onGameOver, onScoreUpdate, onZoneChange]);

  // Loop Control
  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, update]);

  return <canvas ref={canvasRef} className="block w-full h-full absolute top-0 left-0 z-0" />;
};

export default GameCanvas;
