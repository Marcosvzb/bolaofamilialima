import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { HistoricoPremio, Jogo } from '../types';
import { Trophy, Users, Calendar, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarMoeda } from '../utils/pix';
import BandeiraPais from '../components/BandeiraPais';
import fotoFamilia from '../assets/familia/familia-lima.png';

const Historico: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoPremio[]>([]);
  const [jogosCache, setJogosCache] = useState<Record<string, Jogo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'historicoPremios'), orderBy('dataProcessamento', 'desc'));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          valorAcumuladoAnterior: data.valorAcumuladoAnterior ?? 0,
          arrecadacaoPartida: data.arrecadacaoPartida ?? data.valorArrecadado ?? 0,
          valorTotalPote: data.valorTotalPote ?? data.valorArrecadado ?? 0,
          valorPagoPorVencedor: data.valorPagoPorVencedor ?? 0,
          valorAcumuladoAposJogo: data.valorAcumuladoAposJogo ?? 0
        } as HistoricoPremio;
      });
      
      setHistorico(docs);
      
      for (const h of docs) {
        if (h.jogoId && !jogosCache[h.jogoId]) {
          const jogoDoc = await getDoc(doc(db, 'jogos', h.jogoId));
          if (jogoDoc.exists()) {
            setJogosCache(prev => ({ ...prev, [h.jogoId]: { id: jogoDoc.id, ...jogoDoc.data() } as Jogo }));
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-black text-[10px] uppercase tracking-widest">Consultando Arquivos da Copa...</div>;

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="mb-10 px-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight mb-2">Histórico Oficial</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vencedores e Prêmios Pagos</p>
      </div>

      {historico.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
          <Calendar className="mx-auto text-slate-100 mb-4" size={48} />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nenhum resultado ainda</p>
        </div>
      ) : (
        <div className="space-y-12">
          {historico.map((h) => {
            const jogo = jogosCache[h.jogoId];
            const temVencedores = h.vencedores && h.vencedores.length > 0;

            return (
              <div key={h.id} className="bg-white rounded-[32px] shadow-premium border border-slate-50 overflow-hidden group">
                
                {/* BANNER FESTIVO CASO HAJA VENCEDORES */}
                {temVencedores && (
                   <div className="relative h-24 overflow-hidden">
                      <img src={fotoFamilia} className="absolute inset-0 w-full h-full object-cover scale-150 grayscale-[0.5] opacity-20" alt="Festa" />
                      <div className="absolute inset-0 bg-gradient-to-r from-brasil-green/80 to-brasil-blue/80 flex items-center justify-center gap-3">
                         <PartyPopper className="text-brasil-yellow animate-bounce" size={24} />
                         <span className="text-white font-black italic uppercase tracking-tighter text-lg">Família Lima em Festa!</span>
                         <PartyPopper className="text-brasil-yellow animate-bounce" size={24} />
                      </div>
                   </div>
                )}

                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-brasil-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {h.dataProcessamento ? format(h.dataProcessamento.toDate(), "dd 'de' MMMM", { locale: ptBR }) : '---'}
                    </span>
                  </div>
                  <div className="bg-brasil-green text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">FINALIZADO</div>
                </div>
                
                <div className="p-8">
                  <div className="flex justify-between items-center mb-10">
                    <div className="text-center flex-1 flex flex-col items-center">
                      <BandeiraPais nomePais={jogo?.timeCasa || h.timeCasa} tamanho={48} />
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tighter mt-2">{jogo?.timeCasa || h.timeCasa || '???'}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                       <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 text-2xl font-black text-brasil-blue italic shadow-inner">
                         {h.placarCasa} x {h.placarVisitante}
                       </div>
                    </div>
                    <div className="text-center flex-1 flex flex-col items-center">
                      <BandeiraPais nomePais={jogo?.timeVisitante || h.timeVisitante} tamanho={48} />
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tighter mt-2">{jogo?.timeVisitante || h.timeVisitante || '???'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <span>Acumulado Anterior</span>
                           <span className="font-bold text-slate-500">{formatarMoeda(h.valorAcumuladoAnterior)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <span>Arrecadação da Partida</span>
                           <span className="font-bold text-slate-500">{formatarMoeda(h.arrecadacaoPartida)}</span>
                        </div>
                        <div className="h-[1px] w-full bg-slate-200/50"></div>
                        <div className={`flex justify-between items-center ${temVencedores ? 'text-emerald-600' : 'text-amber-600'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest">Pote Total</span>
                           <span className="text-xl font-black italic">{formatarMoeda(h.valorTotalPote)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-[28px] p-6 border border-slate-100 shadow-inner relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-5">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {temVencedores ? `Ganhadores (${h.vencedores?.length ?? 0})` : 'Resultado'}
                        </span>
                      </div>
                      
                      {temVencedores ? (
                        <div className="grid grid-cols-1 gap-3 relative z-10">
                          {h.vencedores?.map((v, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50">
                              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{v}</span>
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                 <Trophy size={12} className="text-brasil-yellow" />
                                 <span className="text-sm font-black italic">+{formatarMoeda(h.valorPagoPorVencedor)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 relative z-10">
                           <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200 mb-2">
                              <p className="text-xs text-amber-700 font-black uppercase tracking-widest italic leading-relaxed">
                                 Ninguém acertou o placar exato.
                              </p>
                           </div>
                           <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">
                              O prêmio de {formatarMoeda(h.valorTotalPote)} foi acumulado!
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Historico;
