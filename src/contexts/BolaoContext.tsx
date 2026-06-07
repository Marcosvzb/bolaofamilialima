import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface BolaoContextType {
  poteAcumulado: number;
  setPoteAcumulado: (valor: number) => void;
}

const BolaoContext = createContext<BolaoContextType | undefined>(undefined);

export const BolaoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [poteAcumulado, setPoteAcumulado] = useState(0);

  return (
    <BolaoContext.Provider value={{ poteAcumulado, setPoteAcumulado }}>
      {children}
    </BolaoContext.Provider>
  );
};

export const useBolao = () => {
  const context = useContext(BolaoContext);
  if (!context) {
    throw new Error('useBolao deve ser usado dentro de um BolaoProvider');
  }
  return context;
};
