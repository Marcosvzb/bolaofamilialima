import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Settings, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-app-fundo flex flex-col w-full">
      {/* 
        REMOÇÃO DO CABEÇALHO GLOBAL:
        - Ganho de aproximadamente 140px de espaço vertical.
        - O conteúdo agora começa imediatamente no topo com um padding discreto.
      */}

      {/* Main Content - 100% da largura, com padding superior reduzido para 24px */}
      <main className="flex-1 w-full px-5 pt-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </main>

      {/* Bottom Navigation Estilo App Nativo (Mantida Fixa) */}
      <nav className="fixed bottom-6 left-5 right-5 h-20 bg-white/90 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl flex justify-around items-center px-4 z-50">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive ? 'text-brasil-green scale-110' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <Home size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Arena</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/minhas-apostas" className={({ isActive }) => `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive ? 'text-brasil-green scale-110' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <Search size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Palpites</span>
            </>
          )}
        </NavLink>

        <NavLink to="/historico" className={({ isActive }) => `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive ? 'text-brasil-green scale-110' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <History size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Placar</span>
            </>
          )}
        </NavLink>

        <NavLink to="/admin" className={({ isActive }) => `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive ? 'text-brasil-green scale-110' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <Settings size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Gestão</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
