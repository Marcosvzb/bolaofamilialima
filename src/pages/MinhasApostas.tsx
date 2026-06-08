import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo, Aposta } from '../types';
import { 
  Users, CheckCircle2, Clock, 
  ChevronRight, ArrowLeft, QrCode, Copy, X, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarMoeda } from '../utils/pix';
import BandeiraPais from '../components/BandeiraPais';
import { QRCodeSVG } from 'qrcode.react';

const MinhasApostas: React.FC = () => {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [contagemApostas, setContagemApostas] = useState<Record<string, { total: number, confirmados: number, pendentes: number, arrecadado: number }>>({});
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
  const [apostasDoJogo, setApostasDoJogo] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [apostaVerPix, setApostaVerPix] = useState<Aposta | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const qJogos = query(collection(db, 'jogos'), orderBy('dataHora', 'desc'));
    const unsubJogos = onSnapshot(qJogos, (snap) => {
      setJogos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Jogo)));
      setLoading(false);
    });

    const qApostas = collection(db, 'apostas');
    const unsubApostas = onSnapshot(qApostas, (snap) => {
      const counts: Record<string, { total: number, confirmados: number, pendentes: number, arrecadado: number }> = {};
      
      snap.docs.forEach(doc => {
        const a = doc.data() as Aposta;
        if (!counts[a.jogoId]) {
          counts[a.jogoId] = { total: 0, confirmados: 0, pendentes: 0, arrecadado: 0 };
        }
        
        counts[a.jogoId].total += a.quantidadePalpites || 1;
        if (a.statusPagamento === 'confirmado') {
          counts[a.jogoId].confirmados += a.quantidadePalpites || 1;
          counts[a.jogoId].arrecadado += a.valorTotal || 0;
        } else if (a.statusPagamento === 'pendente') {
          counts[a.jogoId].pendentes += a.quantidadePalpites || 1;
        }
      });
      
      setContagemApostas(counts);
    });

    return () => { unsubJogos(); unsubApostas(); };
  }, []);

  useEffect(() => {
    if (!jogoSelecionado) {
      setApostasDoJogo([]);
      return;
    }

    const q = query(
      collection(db, 'apostas'), 
      where('jogoId', '==', jogoSelecionado.id),
      orderBy('dataCriacao', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setApostasDoJogo(snap.docs.map(d => ({ id: d.id, ...d.data() } as Aposta)));
    });

    return () => unsub();
  }, [jogoSelecionado]);

  const handleCopiarPix = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Carregando...</div>;

  if (jogoSelecionado) {
    const stats = contagemApostas[jogoSelecionado.id] || { total: 0, confirmados: 0, pendentes: 0, arrecadado: 0 };
    
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
           <button onClick={() => setJogoSelecionado(null)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <ArrowLeft size={20} className="text-slate-400" />
           </button>
           <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Transparência</h2>
        </header>

        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 relative overflow-hidden">
           <div className="flex items-center justify-around gap-4 mb-8">
              <div className="flex flex-col items-center">
                 <BandeiraPais nomePais={jogoSelecionado.timeCasa} tamanho={64} />
                 <span className="text-[10px] font-black text-slate-400 uppercase mt-2">{jogoSelecionado.timeCasa}</span>
              </div>
              <span className="text-2xl font-black text-slate-200 italic">X</span>
              <div className="flex flex-col items-center">
                 <BandeiraPais nomePais={jogoSelecionado.timeVisitante} tamanho={64} />
                 <span className="text-[10px] font-black text-slate-400 uppercase mt-2">{jogoSelecionado.timeVisitante}</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Palpites</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-brasil-blue italic">{stats.total}</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">Totais</span>
                 </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-[24px] border border-emerald-100">
                 <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Arrecadado</p>
                 <span className="text-xl font-black text-emerald-600 italic">{formatarMoeda(stats.arrecadado)}</span>
              </div>
           </div>

           <div className="flex gap-4 mt-4 px-2">
              <div className="flex items-center gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase">{stats.confirmados} Confirmados</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase">{stats.pendentes} Pendentes</span>
              </div>
           </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-3 px-2">
             <div className="h-5 w-1 bg-brasil-green rounded-full"></div>
             Lista de Participantes
          </h3>

          {apostasDoJogo.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100">
               <Users className="mx-auto text-slate-100 mb-4" size={40} />
               <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nenhum palpite ainda</p>
            </div>
          ) : (
            apostasDoJogo.map((aposta) => (
              <div key={aposta.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none mb-1">{aposta.nomeParticipante}</h4>
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">ID: {aposta.codigoAposta}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border flex items-center gap-1 ${
                        aposta.statusPagamento === 'confirmado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {aposta.statusPagamento === 'confirmado' ? <><CheckCircle2 size={10} /> Confirmado</> : <><Clock size={10} /> Aguardando PIX</>}
                      </div>
                      
                      {aposta.statusPagamento === 'pendente' && (
                        <button 
                          onClick={() => setApostaVerPix(aposta)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brasil-blue text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                        >
                          <QrCode size={12} />
                          Ver PIX
                        </button>
                      )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                    {aposta.palpites.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-2 flex items-center justify-center gap-2 border border-slate-100/50">
                         <span className="text-sm font-black text-brasil-blue italic">{p.placarCasa}x{p.placarVisitante}</span>
                      </div>
                    ))}
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Modal PIX */}
        {apostaVerPix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Pagamento PIX</h3>
                <button onClick={() => setApostaVerPix(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-6">
                  <QRCodeSVG value={apostaVerPix.codigoPagamento} size={200} />
                </div>

                <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Código PIX (Copia e Cola)</p>
                  <p className="text-[10px] text-slate-600 font-mono break-all line-clamp-3 text-left bg-white p-2 rounded-lg border border-slate-100">
                    {apostaVerPix.codigoPagamento}
                  </p>
                </div>

                <button
                  onClick={() => handleCopiarPix(apostaVerPix.codigoPagamento)}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase transition-all active:scale-[0.98] ${
                    copiado ? 'bg-emerald-500 text-white' : 'bg-brasil-green text-white shadow-lg shadow-emerald-200'
                  }`}
                >
                  {copiado ? (
                    <>
                      <Check size={18} strokeWidth={3} />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={18} strokeWidth={3} />
                      Copiar Código PIX
                    </>
                  )}
                </button>
                
                <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Valor Total: <span className="text-slate-700">{formatarMoeda(apostaVerPix.valorTotal)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="mb-10 px-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight mb-2">Todos os Palpites</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Transparência total no bolão</p>
      </div>

      <div className="space-y-5">
        {jogos.map((jogo) => {
          const stats = contagemApostas[jogo.id] || { total: 0, confirmados: 0, pendentes: 0, arrecadado: 0 };
          return (
            <button 
              key={jogo.id} 
              onClick={() => setJogoSelecionado(jogo)}
              className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 text-left active:scale-[0.98] transition-transform group"
            >
              <div className="flex justify-between items-center mb-5">
                 <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                       <BandeiraPais nomePais={jogo.timeCasa} tamanho={32} />
                       <BandeiraPais nomePais={jogo.timeVisitante} tamanho={32} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-slate-800 uppercase tracking-tighter">{jogo.timeCasa} x {jogo.timeVisitante}</h4>
                       <p className="text-[8px] font-black text-slate-300 uppercase">{format(jogo.dataHora.toDate(), "dd 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                 </div>
                 <ChevronRight size={20} className="text-slate-200 group-hover:text-brasil-green transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 uppercase mb-1">Palpites</span>
                    <span className="text-base font-black text-slate-700 italic leading-none">{stats.total}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-emerald-400 uppercase mb-1">Confirmados</span>
                    <span className="text-base font-black text-emerald-600 italic leading-none">{stats.confirmados}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-amber-400 uppercase mb-1">Pendentes</span>
                    <span className="text-base font-black text-amber-600 italic leading-none">{stats.pendentes}</span>
                 </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MinhasApostas;
