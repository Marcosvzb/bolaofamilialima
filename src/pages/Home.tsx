import React, { useState, useEffect } from 'react';
import { useJogos } from '../hooks/useJogos';
import JogoCard from '../components/Jogo/JogoCard';
import { Target, TrendingUp, Heart } from 'lucide-react';
import { formatarMoeda } from '../utils/pix';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import fotoFamilia from '../assets/familia/familia-lima.png';
import { TEMA_LIMA } from '../styles/temaFamiliaLima';

const Home: React.FC = () => {
  const { jogos, loading: loadingJogos } = useJogos();
  const [premioGlobal, setPremioGlobal] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configuracoes', 'geral'), (snap) => {
      if (snap.exists()) {
        setPremioGlobal(snap.data().premioAcumuladoAtual || 0);
      }
      setLoadingConfig(false);
    });
    return () => unsub();
  }, []);

  const jogosAbertos = (jogos || []).filter(j => j.status !== 'encerrado');
  const jogosEncerrados = (jogos || []).filter(j => j.status === 'encerrado').slice(0, 3);
  const arrecadacaoAtiva = jogosAbertos.reduce((acc, j) => acc + (j.premioAcumulado || 0), 0);
  const premioTotalEmDisputa = premioGlobal + arrecadacaoAtiva;

  if (loadingJogos || loadingConfig) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-4 border-brasil-green/10 border-t-brasil-green animate-spin"></div>
        <p className="mt-6 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Carregando Arena...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* NOVO HERO CARD PERSONALIZADO FAMÍLIA LIMA */}
      <div 
        className="relative bg-brasil-green rounded-[40px] overflow-hidden shadow-2xl border-4 border-white"
        style={{ height: '240px' }}
      >
        {/* Foto da Família ocupando área estratégica */}
        <img 
          src={fotoFamilia} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Família Lima"
        />
        
        {/* Overlay de Gradiente Verde Suave para Legibilidade */}
        <div 
          className="absolute inset-0"
          style={{ background: TEMA_LIMA.gradientes.hero }}
        />

        {/* Conteúdo do Hero */}
        <div className="relative z-10 h-full p-8 flex flex-col justify-end text-white">
           <div className="mb-auto flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brasil-yellow mb-1">Bem-vindo ao</p>
                 <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">Bolão da Família Lima</h2>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                 <span className="text-[8px] font-black uppercase tracking-widest">Copa 2026</span>
              </div>
           </div>

           <div>
              <div className="flex items-center gap-2 mb-1 opacity-80">
                 <TrendingUp size={12} className="text-brasil-yellow" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Prêmio em Disputa</span>
              </div>
              <p className="text-4xl font-black italic tracking-tighter">{formatarMoeda(premioTotalEmDisputa)}</p>
           </div>
        </div>
      </div>

      {/* Seção Principal: Arena de Apostas */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-8 w-1.5 bg-brasil-yellow rounded-full shadow-sm shadow-yellow-400/50"></div>
          <h3 className="text-slate-800 text-lg font-black uppercase tracking-tight italic">Partidas da Seleção</h3>
        </div>
        
        {jogosAbertos.length === 0 ? (
          <div className="bg-white rounded-[40px] p-16 text-center border-2 border-dashed border-slate-100">
            <Target className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Nenhuma convocação ativa</p>
          </div>
        ) : (
          <div>
            {jogosAbertos.map((jogo) => (
              <JogoCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        )}
      </section>

      {/* Seção de Resultados */}
      {jogosEncerrados.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6 px-2 opacity-60">
            <div className="h-8 w-1.5 bg-slate-300 rounded-full"></div>
            <h3 className="text-slate-500 text-lg font-black uppercase tracking-tight italic">Últimos Resultados</h3>
          </div>
          <div className="space-y-2 grayscale-[0.8] opacity-60">
            {jogosEncerrados.map((jogo) => (
              <JogoCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        </section>
      )}

      {/* SEÇÃO NOSSA FAMÍLIA (FINAL DA HOME) */}
      <section className="pb-10 pt-4">
         <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-50 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-brasil-yellow rounded-b-full"></div>
            
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-emerald-50 shadow-md">
               <img src={fotoFamilia} className="w-full h-full object-cover scale-150" alt="Nossa Família" />
            </div>

            <h3 className="text-xl font-black italic text-brasil-blue uppercase tracking-tight mb-3">Nossa Família</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight leading-relaxed px-4">
              "Um bolão criado para reunir a Família Lima durante a Copa do Mundo. Vamos torcer juntos pelo Brasil!"
            </p>
            
            <div className="mt-8 flex justify-center text-brasil-green opacity-20">
               <Heart size={48} fill="currentColor" />
            </div>
         </div>
      </section>

    </div>
  );
};

export default Home;
