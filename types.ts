
export interface GameSettings {
  musicVolume: number;
  soundVolume: number;
}

export interface GameState {
  custardsCollected: number;
  maxCustards: number;
  isGameOver: boolean;
  isGameWon: boolean;
  isStarted: boolean;
  horrorMessage: string;
  isFrightened: boolean;
  isJumpscare: boolean;
}

export type Position = [number, number, number];

export interface CustardData {
  id: string;
  position: Position;
  collected: boolean;
}
