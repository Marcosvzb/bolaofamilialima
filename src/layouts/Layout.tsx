import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Settings, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-app-fundo flex flex-col w-full">
      {/* Header Estilo Fintech (Nubank/Mercado Pago) */}
      <header className="bg-brasil-green text-white px-6 pt-14 pb-8 rounded-b-[40px] shadow-lg sticky top-0 z-50 overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-1">FAMÍLIA LIMA</p>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">BOLÃO COPA 2026</h1>
        </div>
        
        {/* Decorativo de fundo */}
        <div className="absolute -right-4 -bottom-6 opacity-10 rotate-12">
          <Settings size={120} strokeWidth={4} />
        </div>
      </header>

      {/* Main Content - 100% da largura, com padding lateral consistente */}
      <main className="flex-1 w-full px-5 py-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </main>

      {/* Bottom Navigation Estilo App Nativo (Sofascore) */}
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
