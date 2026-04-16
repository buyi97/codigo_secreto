export type Team = "red" | "blue" | "neutral" | "assassin";
export type PlayerTeam = "red" | "blue" | "spectator";
export type Role = "spymaster" | "operative";

export interface Card {
  id: number;
  word: string;
  team: Team;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: PlayerTeam;
  role: Role;
  isHost: boolean;
}

export interface Clue {
  word: string;
  count: number;
  team: "red" | "blue";
}

export interface GameConfig {
  timerDuration: number;
  firstTurnMode: "timed" | "unlimited";
  firstTurnDuration: number;
  limitGuesses: boolean;
  maxPlayers: number;
}

export interface GameState {
  roomId: string;
  status: "lobby" | "playing" | "ended";
  cards: Card[];
  players: Player[];
  turn: "red" | "blue";
  currentClue: Clue | null;
  clues: Clue[];
  timer: number;
  isUltimatum: boolean;
  guessesMade: number;
  totalRed?: number;
  totalBlue?: number;
  winner: "red" | "blue" | null;
  config: GameConfig;
  history: {
    red: number;
    blue: number;
  };
}
