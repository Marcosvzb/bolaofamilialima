import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, doc, 
  increment, writeBatch, getDoc, where 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Aposta, Jogo } from '../types';
import { 
  Check, X, Hash, ArrowLeft, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatarMoeda } from '../utils/pix';

const PagamentosAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [jogosCache, setJogosCache] = useState<Record<string, Jogo>>({});
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'confirmado' | 'cancelado'>('todos');
  const [loading, setLoading] = useState(true);
  const [jogosAtivos, setJogosAtivos] = useState<Jogo[]>([]);
  const [loadingJogos, setLoadingJogos] = useState(true);

  // 1. Buscar apenas os jogos que ainda estão ativos (status !== 'encerrado')
  useEffect(() => {
    const qJogos = query(
      collection(db, 'jogos'),
      where('status', '!=', 'encerrado')
    );
    const unsubscribe = onSnapshot(qJogos, (snapshot) => {
      const activeGames = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Jogo[];
      
      setJogosAtivos(activeGames);
      
      // Atualizar cache com os jogos ativos
      setJogosCache(prev => {
        const next = { ...prev };
        activeGames.forEach(jogo => {
          next[jogo.id] = jogo;
        });
        return next;
      });
      
      setLoadingJogos(false);
    }, (error) => {
      console.error("Erro ao buscar jogos ativos:", error);
      setLoadingJogos(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Buscar apenas apostas dos jogos ativos
  useEffect(() => {
    if (loadingJogos) return;

    if (jogosAtivos.length === 0) {
      setApostas([]);
      setLoading(false);
      return;
    }

    const gameIds = jogosAtivos.map(j => j.id).slice(0, 30);

    const q = query(
      collection(db, 'apostas'),
      where('jogoId', 'in', gameIds)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apostasData = snapshot.docs?.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aposta[] ?? [];

      // Ordenar por data de criação de forma decrescente no lado do cliente
      apostasData.sort((a, b) => {
        const tA = a.dataCriacao?.toDate().getTime() ?? 0;
        const tB = b.dataCriacao?.toDate().getTime() ?? 0;
        return tB - tA;
      });

      setApostas(apostasData);

      // Garantir que temos os jogos no cache
      for (const aposta of apostasData) {
        if (aposta?.jogoId && !jogosCache[aposta.jogoId]) {
          try {
            const jogoDoc = await getDoc(doc(db, 'jogos', aposta.jogoId));
            if (jogoDoc.exists()) {
              setJogosCache(prev => ({ ...prev, [aposta.jogoId]: { id: jogoDoc.id, ...jogoDoc.data() } as Jogo }));
            }
          } catch (e) {
            console.error(`Erro ao buscar jogo ${aposta.jogoId}`);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar apostas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jogosAtivos, loadingJogos]);

  const confirmarPagamento = async (aposta: Aposta) => {
    if (!aposta || aposta.statusPagamento === 'confirmado') return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'apostas', aposta.id), { statusPagamento: 'confirmado' });
      batch.update(doc(db, 'jogos', aposta.jogoId), { premioAcumulado: increment(aposta.valorTotal ?? 0) });
      await batch.commit();
      alert(`Aposta ${aposta.codigoAposta} confirmada!`);
    } catch (error) { alert("Erro na confirmação."); }
  };

  const cancelarPagamento = async (aposta: Aposta) => {
    if (!aposta) return;
    if (window.confirm("Cancelar este pagamento?")) {
      try {
        const batch = writeBatch(db);
        if (aposta.statusPagamento === 'confirmado') {
          batch.update(doc(db, 'jogos', aposta.jogoId), { premioAcumulado: increment(-(aposta.valorTotal ?? 0)) });
        }
        batch.update(doc(db, 'apostas', aposta.id), { statusPagamento: 'cancelado' });
        await batch.commit();
      } catch (error) { alert("Erro ao cancelar."); }
    }
  };

  // Filtro seguro com optional chaining
  const apostasFiltradas = (apostas ?? []).filter(a => filtroStatus === 'todos' || a?.statusPagamento === filtroStatus);

  if (loading) return <div className="p-10 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Carregando...</div>;

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <header className="mb-10 flex items-center justify-between px-2">
        <button onClick={() => navigate('/admin')} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Gestão de Apostas</h2>
        <div className="w-11"></div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar px-2">
        {(['todos', 'pendente', 'confirmado', 'cancelado'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              filtroStatus === status 
                ? 'bg-brasil-blue text-white shadow-lg shadow-brasil-blue/20 border-brasil-blue' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-5 px-2">
        {apostasFiltradas.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
            <Filter className="mx-auto text-slate-100 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nada por aqui</p>
          </div>
        ) : (
          apostasFiltradas.map((aposta) => {
            const jogo = jogosCache[aposta?.jogoId];
            return (
              <div key={aposta?.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  aposta?.statusPagamento === 'confirmado' ? 'bg-emerald-500' : 
                  aposta?.statusPagamento === 'pendente' ? 'bg-amber-400' : 'bg-rose-500'
                }`} />

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">
                      <Hash size={10} strokeWidth={3} /> {aposta?.codigoAposta}
                    </div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">{aposta?.nomeParticipante}</h4>
                  </div>
                  <div className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                    aposta?.statusPagamento === 'confirmado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    aposta?.statusPagamento === 'pendente' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {aposta?.statusPagamento}
                  </div>
                </div>

                {/* Exibição TXID para conferência */}
                <div className="mb-4 flex items-center gap-2">
                   <span className="text-[8px] font-black text-slate-300 uppercase">TXID:</span>
                   <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {/* @ts-ignore -txid adicionado dinamicamente */}
                      {aposta?.txid || 'N/A'}
                   </span>
                </div>

                <div className="bg-slate-50 rounded-[24px] p-4 mb-6 border border-slate-100/50">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[8px] text-slate-300 font-black uppercase">Palpites ({(aposta?.palpites ?? []).length})</span>
                      <span className="text-[8px] text-slate-300 font-black uppercase">vs {jogo?.timeVisitante || '...'}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      {(aposta?.palpites ?? []).map((p, i) => (
                        <div key={i} className="bg-white p-2 rounded-xl text-center text-sm font-black text-brasil-blue border border-slate-100 shadow-sm italic">
                          {p?.placarCasa} x {p?.placarVisitante}
                        </div>
                      ))}
                   </div>
                   <div className="h-[1px] w-full bg-slate-200/50 my-4"></div>
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
                      <span className="text-xl font-black text-emerald-600 italic">{formatarMoeda(aposta?.valorTotal ?? 0)}</span>
                   </div>
                </div>

                <div className="flex gap-3">
                  {aposta?.statusPagamento !== 'confirmado' && (
                    <button 
                      onClick={() => confirmarPagamento(aposta)}
                      className="flex-1 bg-emerald-600 text-white font-black h-14 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Check size={16} strokeWidth={3} /> Validar
                    </button>
                  )}
                  {aposta?.statusPagamento !== 'cancelado' && (
                    <button 
                      onClick={() => cancelarPagamento(aposta)}
                      className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                        aposta?.statusPagamento === 'confirmado' 
                          ? 'w-14 border-rose-100 text-rose-300' 
                          : 'flex-1 bg-white text-slate-400 border-slate-100'
                      }`}
                    >
                      <X size={16} strokeWidth={3} /> {aposta?.statusPagamento === 'confirmado' ? '' : 'Recusar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PagamentosAdmin;
