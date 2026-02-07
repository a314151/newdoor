import React from 'react';
import { AppProvider } from './src/context/AppProvider';
import AppContent from './src/components/AppContent';

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;