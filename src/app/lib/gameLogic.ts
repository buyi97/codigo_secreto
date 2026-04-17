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
  useTimer: boolean;
  language: "es" | "en";
  customWords: string[]; // <-- AGREGAMOS ESTO
}

export const DEFAULT_CONFIG: GameConfig = {
  timerDuration: 120,
  useTimer: true,
  language: "es",
  customWords: [], // <-- AGREGAMOS ESTO
};

export interface GameState {
  roomId: string;
  cards: Card[];
  players: Player[];
  turn: Team;
  status: "lobby" | "playing" | "finished";
  winner?: Team | null;
  config: GameConfig;
  currentClue: { word: string; count: number } | null;
  guessesMade: number;
  timer: number;
  isFirstTurn: boolean;
  isUltimatum: boolean;
  history: { red: number; blue: number }; // <-- HISTORIAL DE LA SALA
}

// Modificamos generateBoard para aceptar customWords
export function generateBoard(wordList: string[], customWords: string[] = []): Card[] {
  // Usar palabras custom si hay suficientes, sino fallback a la lista por defecto
  const pool = customWords.length >= 25 ? customWords : wordList;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 25);
  
  const teams: (Team | "neutral" | "assassin")[] = [
    ...Array(9).fill("red"),
    ...Array(8).fill("blue"),
    ...Array(7).fill("neutral"),
    "assassin",
  ];
  teams.sort(() => Math.random() - 0.5);

  return shuffled.map((word, i) => ({
    id: i.toString(),
    word: word.toUpperCase(),
    team: teams[i],
    isRevealed: false,
  }));
}