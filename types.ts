export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum ObstacleType {
  GROUND_BOT = 'GROUND_BOT',   // Jump over
  FLYING_DRONE = 'FLYING_DRONE', // Duck or Jump high? Just dodge vertically usually implies lanes, but we'll do 2D side scroll.
  TALL_BLOCK = 'TALL_BLOCK'
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: ObstacleType;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameScore {
  distance: number;
  coins: number;
}
