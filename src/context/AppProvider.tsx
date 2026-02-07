import React, { ReactNode } from 'react';
import { GameProvider } from './GameContext';
import { UserProvider } from './UserContext';
import { UIProvider } from './UIContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <GameProvider>
        <UIProvider>
          {children}
        </UIProvider>
      </GameProvider>
    </UserProvider>
  );
};