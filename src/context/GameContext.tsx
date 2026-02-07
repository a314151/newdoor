import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameState, GridCell, Player, Enemy, ThemeConfig, GameAssets } from '../../types';

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  theme: ThemeConfig | null;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig | null>>;
  assets: GameAssets | null;
  setAssets: React.Dispatch<React.SetStateAction<GameAssets | null>>;
  grid: GridCell[];
  setGrid: React.Dispatch<React.SetStateAction<GridCell[]>>;
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  currentEnemy: Enemy | null;
  setCurrentEnemy: React.Dispatch<React.SetStateAction<Enemy | null>>;
  currentStoryId: string | null;
  setCurrentStoryId: React.Dispatch<React.SetStateAction<string | null>>;
  loadingMsg: string;
  setLoadingMsg: React.Dispatch<React.SetStateAction<string>>;
  eventLog: string[];
  logEvent: (msg: string) => void;
  isRefreshing: boolean;
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  storyOptions: string[];
  setStoryOptions: React.Dispatch<React.SetStateAction<string[]>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [player, setPlayer] = useState<Player>({ 
    hp: 20, maxHp: 20, mp: 10, maxMp: 10, 
    atk: 0, hasKey: false, x: 0, y: 0, name: '冒险者', heroId: 'default_adventurer'
  });
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('正在编织命运...');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storyOptions, setStoryOptions] = useState<string[]>([]);

  const logEvent = (msg: string) => setEventLog(prev => [...prev, msg]);

  const value = {
    gameState,
    setGameState,
    theme,
    setTheme,
    assets,
    setAssets,
    grid,
    setGrid,
    player,
    setPlayer,
    currentEnemy,
    setCurrentEnemy,
    currentStoryId,
    setCurrentStoryId,
    loadingMsg,
    setLoadingMsg,
    eventLog,
    logEvent,
    isRefreshing,
    setIsRefreshing,
    storyOptions,
    setStoryOptions
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};