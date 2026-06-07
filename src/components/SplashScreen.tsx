import React, { useEffect, useState } from 'react';
import fotoFamilia from '../assets/familia/familia-lima.png';
import { TEMA_LIMA } from '../styles/temaFamiliaLima';

const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-brasil-blue overflow-hidden animate-out fade-out duration-700 delay-1000">
      {/* Imagem de Fundo com Blur */}
      <img 
        src={fotoFamilia} 
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-40" 
        alt="Família Lima"
      />
      
      {/* Overlay com Gradiente */}
      <div 
        className="absolute inset-0" 
        style={{ background: TEMA_LIMA.gradientes.overlay }}
      />

      {/* Conteúdo Central */}
      <div className="relative z-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mx-auto border-4 border-brasil-yellow">
           <span className="text-5xl font-black text-brasil-green italic tracking-tighter">FL</span>
        </div>
        
        <div className="space-y-2 px-6">
           <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
             Bolão Família Lima
           </h1>
           <p className="text-brasil-yellow font-black text-[10px] uppercase tracking-[0.4em]">
             Copa do Mundo 2026
           </p>
        </div>

        <div className="pt-10 flex justify-center">
           <div className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-brasil-yellow w-full animate-progress origin-left"></div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
