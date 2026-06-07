import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { obterCodigoISO } from '../utils/mapaPaises';

interface BandeiraPaisProps {
  nomePais: string;
  tamanho?: number;
}

/**
 * Componente ÚNICO e PADRONIZADO para exibição de bandeiras.
 * Todas as telas devem consumir este componente.
 */
const BandeiraPais: React.FC<BandeiraPaisProps> = ({ nomePais, tamanho = 64 }) => {
  const codigoISO = obterCodigoISO(nomePais);
  
  // @ts-ignore - Acesso dinâmico à biblioteca de flags
  const FlagComponent = codigoISO ? Flags[codigoISO] : null;

  return (
    <div 
      className="flex items-center justify-center rounded-full bg-white shadow-sm overflow-hidden border border-slate-100 shrink-0"
      style={{ width: tamanho, height: tamanho }}
      title={nomePais}
    >
      {FlagComponent ? (
        <FlagComponent 
          className="w-full h-full object-cover scale-125"
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-slate-50 w-full h-full text-2xl"
          style={{ fontSize: tamanho * 0.5 }}
        >
          🏳️
        </div>
      )}
    </div>
  );
};

export default BandeiraPais;
