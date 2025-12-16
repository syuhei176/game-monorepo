export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  offset: number;
  state?: "left" | "right" | "stop";
}

export interface BallState {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  elem: any;
  deleted: boolean;
  hp: number;
}

export type GamePhase = "start" | "main" | "gameover" | "gameclear";
