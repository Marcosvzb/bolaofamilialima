import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, query, orderBy, onSnapshot, doc, 
  deleteDoc, Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo, Aposta } from '../types';
import { 
  Plus, Trash2, Clock, 
  DollarSign, Users, Settings,
  LogIn, X, Trophy, ArrowRight
} from 'lucide-react';
import { formatarMoeda } from '../utils/pix';
import { calcularResultadoBolao } from '../utils/regrasNegocio';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BandeiraPais from '../components/BandeiraPais';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [acessoLiberado, setAcessoLiberado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoJogo, setNovoJogo] = useState({
    timeCasa: 'Brasil',
    timeVisitante: '',
    dataHora: '',
    valorAposta: 10,
    minutosTolerancia: 10,
    status: 'aberto' as Jogo['status']
  });

  const SENHA_MESTRA = import.meta.env.VITE_SENHA_ADMIN || 'lima2026';

  useEffect(() => {
    if (!acessoLiberado) return;
    const unsubJogos = onSnapshot(query(collection(db, 'jogos'), orderBy('dataHora', 'desc')), (snap) => {
      setJogos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Jogo)));
      setLoading(false);
    });
    const unsubApostas = onSnapshot(collection(db, 'apostas'), (snap) => {
      setApostas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Aposta)));
    });
    return () => { unsubJogos(); unsubApostas(); };
  }, [acessoLiberado]);

  const handleCriarJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'jogos'), {
        ...novoJogo,
        dataHora: Timestamp.fromDate(new Date(novoJogo.dataHora)),
        premioAcumulado: 0, // Inicia zerado, saldo acumulado global é somado no encerramento
        status: 'aberto'
      });

      setNovoJogo({ timeCasa: 'Brasil', timeVisitante: '', dataHora: '', valorAposta: 10, minutosTolerancia: 10, status: 'aberto' });
      setIsModalOpen(false);
      alert("Convocação realizada!");
    } catch (error) {
      alert("Erro ao criar jogo.");
    }
  };

  const arrecadacaoTotal = apostas.filter(a => a.statusPagamento === 'confirmado').reduce((acc, a) => acc + a.valorTotal, 0);
  const apostasPendentes = apostas.filter(a => a.statusPagamento === 'pendente');
  
  if (!acessoLiberado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-sm border border-slate-50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brasil-blue"></div>
          <div className="bg-slate-50 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Settings className="text-brasil-blue" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 italic uppercase tracking-tight">Gestão Lima</h2>
          <p className="text-slate-400 text-[10px] font-black mb-10 uppercase tracking-[0.3em]">Acesso Administrativo</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (senhaDigitada === SENHA_MESTRA) setAcessoLiberado(true);
            else alert("Senha incorreta!");
          }} className="space-y-4">
            <input 
              type="password" 
              placeholder="Senha Mestra"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              className="text-center font-black tracking-[0.5em]"
            />
            <button 
              type="submit"
              className="w-full bg-brasil-blue text-white h-14 rounded-2xl shadow-xl shadow-brasil-blue/20 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
            >
              <LogIn size={18} /> Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && acessoLiberado) {
    return <div className="p-10 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Carregando...</div>;
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      {/* Dashboard Financeiro */}
      <section className="grid grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
          <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
            <DollarSign className="text-emerald-600" size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Arrecadação</p>
          <p className="text-xl font-black text-brasil-blue italic">{formatarMoeda(arrecadacaoTotal)}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
          <div className="bg-brasil-blue/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-brasil-blue/10">
            <Users className="text-brasil-blue" size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Apostas</p>
          <p className="text-xl font-black text-brasil-blue italic">{apostas.length}</p>
        </div>
      </section>

      {/* Gestão de Jogos */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-lg font-black text-slate-800 italic uppercase flex items-center gap-3">
             <div className="h-8 w-1.5 bg-brasil-green rounded-full shadow-sm shadow-emerald-400/50"></div>
             Tabela da Copa
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brasil-green text-white h-12 w-12 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-90 transition-all border-b-4 border-emerald-700"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Modal Drawer - NOVO JOGO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center animate-in fade-in duration-300">
             <div className="bg-white w-full rounded-t-[40px] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-w-2xl border-t border-white/20 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black italic text-brasil-blue uppercase tracking-tight">Novo Confronto</h3>
                   <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 active:bg-slate-200 transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleCriarJogo} className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">País Adversário</label>
                      <input type="text" placeholder="Ex: Argentina" required value={novoJogo.timeVisitante} onChange={e => setNovoJogo({...novoJogo, timeVisitante: e.target.value})} className="h-14 text-lg font-bold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Data e Horário</label>
                      <input type="datetime-local" required value={novoJogo.dataHora} onChange={e => setNovoJogo({...novoJogo, dataHora: e.target.value})} className="h-14 font-bold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Valor da Participação (R$)</label>
                      <input type="number" min="1" step="1" required value={novoJogo.valorAposta} onChange={e => setNovoJogo({...novoJogo, valorAposta: parseInt(e.target.value) || 0})} className="h-14 text-lg font-black text-emerald-600" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Tolerância para Apostas (minutos após início)</label>
                      <input type="number" min="0" step="1" required value={novoJogo.minutosTolerancia} onChange={e => setNovoJogo({...novoJogo, minutosTolerancia: parseInt(e.target.value) || 0})} className="h-14 text-lg font-black" />
                   </div>
                   <button type="submit" className="w-full bg-brasil-green text-white h-16 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 text-sm border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all">Convocar Partida</button>
                </form>
             </div>
          </div>
        )}

        <div className="space-y-5">
          {jogos.map(jogo => (
            <div key={jogo.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <BandeiraPais nomePais={jogo.timeCasa} tamanho={48} />
                   <span className="font-black text-slate-300 italic text-xs">VS</span>
                   <BandeiraPais nomePais={jogo.timeVisitante} tamanho={48} />
                   <div className="ml-1">
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tighter leading-tight">{jogo.timeVisitante}</h4>
                      <p className="text-[9px] text-slate-400 font-extra uppercase tracking-widest">{format(jogo.dataHora.toDate(), "dd/MM/yy • HH:mm", { locale: ptBR })}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">R$ {jogo.valorAposta.toFixed(2)}</span>
                        <span className="bg-slate-50 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">+{jogo.minutosTolerancia} min</span>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={async () => { if(window.confirm("Excluir convocação?")) await deleteDoc(doc(db, 'jogos', jogo.id)); }} 
                  className="text-slate-200 hover:text-rose-500 p-2 transition-colors active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {jogo.status === 'aberto' ? (
                <div className="bg-slate-50 rounded-[28px] p-5 flex flex-col gap-5 border border-slate-100">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado Final</span>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Trophy size={14} className="text-brasil-yellow" />
                        <span className="text-xs font-black italic">{formatarMoeda(jogo.premioAcumulado)}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                         <input type="number" placeholder="BRA" id={`c-${jogo.id}`} className="bg-white border-none h-14 text-center text-2xl font-black rounded-2xl shadow-sm focus:ring-4 ring-brasil-yellow/20" />
                         <input type="number" placeholder="ADV" id={`v-${jogo.id}`} className="bg-white border-none h-14 text-center text-2xl font-black rounded-2xl shadow-sm focus:ring-4 ring-brasil-yellow/20" />
                      </div>
                      <button 
                        onClick={() => {
                          const c = (document.getElementById(`c-${jogo.id}`) as HTMLInputElement).value;
                          const v = (document.getElementById(`v-${jogo.id}`) as HTMLInputElement).value;
                          if(c && v) calcularResultadoBolao(jogo, parseInt(c), parseInt(v));
                          else alert("Informe o placar!");
                        }}
                        className="bg-slate-800 text-white h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:translate-y-0.5 transition-all"
                      >
                        Encerrar
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 py-4 bg-emerald-50 rounded-[24px] border border-emerald-100">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Confronto Processado</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Seção Pendências - Estilo OneFootball */}
      <section className="bg-brasil-blue rounded-[40px] p-10 text-white shadow-2xl shadow-brasil-blue/30 relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
               <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                 <Clock className="text-brasil-yellow" size={28} />
               </div>
               <div>
                 <h3 className="text-xl font-black italic uppercase tracking-tight">Pix em Análise</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Validação de Apostas</p>
               </div>
            </div>
            
            <div className="flex items-end justify-between">
               <div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-5xl font-black italic">{apostasPendentes.length}</p>
                    <span className="text-xs font-black opacity-40 uppercase tracking-widest">pendentes</span>
                  </div>
               </div>
               <button 
                onClick={() => navigate('/admin/pagamentos')} 
                className="bg-white text-brasil-blue h-14 px-8 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
               >
                 Revisar <ArrowRight size={18} strokeWidth={3} />
               </button>
            </div>
         </div>
         
         <div className="absolute -right-10 -top-10 opacity-[0.07] rotate-45 text-white pointer-events-none">
            <DollarSign size={240} />
         </div>
      </section>
    </div>
  );
};

export default Admin;
