import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo, Palpite } from '../types';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Send, CheckCircle, Info, Copy, Plus, Trash2, Calculator } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatarMoeda, gerarPayloadPix, obterSiglaPais } from '../utils/pix';
import BandeiraPais from '../components/BandeiraPais';
import { CONFIG_PAGAMENTO, formatarCPF } from '../config/pagamento';
import { estaAceitandoPalpites, obterHorarioLimite } from '../utils/regrasNegocio';

const DetalhesJogo: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  const [nome, setNome] = useState('');
  const [palpites, setPalpites] = useState<Partial<Palpite>[]>([{ placarCasa: undefined, placarVisitante: undefined }]);
  
  const [apostaSucesso, setApostaSucesso] = useState<{ 
    codigoAposta: string; 
    valorTotal: number;
    palpites: Palpite[];
    pixCopiaECola: string;
    txid: string;
  } | null>(null);

  useEffect(() => {
    const fetchJogo = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'jogos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJogo({ id: docSnap.id, ...docSnap.data() } as Jogo);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJogo();
  }, [id]);

  const adicionarPalpite = () => {
    setPalpites([...palpites, { placarCasa: undefined, placarVisitante: undefined }]);
  };

  const removerPalpite = (index: number) => {
    if (palpites.length > 1) {
      setPalpites(palpites.filter((_, i) => i !== index));
    }
  };

  const atualizarPalpite = (index: number, campo: keyof Palpite, valor: string) => {
    const novosPalpites = [...palpites];
    const numValor = valor === '' ? undefined : Math.max(0, parseInt(valor));
    novosPalpites[index] = { ...novosPalpites[index], [campo]: numValor };
    setPalpites(novosPalpites);
  };

  const handleEnviarAposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jogo || !id) return;

    if (!estaAceitandoPalpites(jogo)) {
      alert("Apostas encerradas para esta partida.");
      return;
    }

    if (nome.trim().length < 3) {
      alert("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    const palpitesValidos: Palpite[] = [];
    const chavesPalpites = new Set<string>();

    for (const p of palpites) {
      if (p.placarCasa === undefined || p.placarVisitante === undefined) {
        alert("Preencha todos os campos dos seus palpites.");
        return;
      }
      const chave = `${p.placarCasa}x${p.placarVisitante}`;
      if (chavesPalpites.has(chave)) {
        alert(`Você já cadastrou o palpite ${chave} para este jogo.`);
        return;
      }
      chavesPalpites.add(chave);
      palpitesValidos.push({ placarCasa: p.placarCasa, placarVisitante: p.placarVisitante });
    }

    setEnviando(true);

    try {
      const valorTotal = palpitesValidos.length * jogo.valorAposta;

      const apostaFinal = await runTransaction(db, async (transaction) => {
        const contadorRef = doc(db, 'configuracoes', 'contadores');
        const contadorDoc = await transaction.get(contadorRef);
        
        let novoNumero = 1;
        if (contadorDoc.exists()) {
          novoNumero = (contadorDoc.data().totalApostas || 0) + 1;
          transaction.update(contadorRef, { totalApostas: novoNumero });
        } else {
          transaction.set(contadorRef, { totalApostas: 1 });
        }

        const sufixo = novoNumero.toString().padStart(6, '0');
        const codigoAposta = `BOLAO-${sufixo}`;
        const nomeLimpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 10);
        const txid = `${nomeLimpo}${obterSiglaPais(jogo.timeCasa)}${obterSiglaPais(jogo.timeVisitante)}`.toUpperCase();

        const payloadPix = gerarPayloadPix(CONFIG_PAGAMENTO.chavePix, valorTotal, `BOLAO${sufixo}`, txid);

        const novaApostaRef = doc(collection(db, 'apostas'));
        transaction.set(novaApostaRef, {
          jogoId: id,
          codigoAposta,
          nomeParticipante: nome,
          palpites: palpitesValidos,
          quantidadePalpites: palpitesValidos.length,
          valorUnitario: jogo.valorAposta,
          valorTotal,
          codigoPagamento: payloadPix,
          txid: txid,
          statusPagamento: 'pendente',
          dataCriacao: Timestamp.now()
        });

        return { codigoAposta, valorTotal, payloadPix, txid };
      });

      setApostaSucesso({ 
        codigoAposta: apostaFinal.codigoAposta, 
        valorTotal: apostaFinal.valorTotal,
        palpites: palpitesValidos,
        pixCopiaECola: apostaFinal.payloadPix,
        txid: apostaFinal.txid
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar aposta.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Carregando...</div>;
  if (!jogo) return <div className="text-center p-10 font-black uppercase text-rose-500">Jogo não encontrado.</div>;

  // TELA DE SUCESSO ULTRA OTIMIZADA (SEM ROLAGEM)
  if (apostaSucesso) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-10">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brasil-green"></div>
          
          {/* Mensagem Compacta */}
          <div className="flex items-center justify-center gap-2 mb-4">
             <CheckCircle className="text-emerald-500" size={18} strokeWidth={3} />
             <h2 className="text-sm font-black text-brasil-blue uppercase italic">Aposta Registrada!</h2>
          </div>
          
          {/* Identificadores Rápidos */}
          <div className="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-2 mb-4 border border-slate-100">
             <div className="text-left">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Código</p>
                <p className="text-xs font-black text-brasil-blue font-mono">{apostaSucesso.codigoAposta}</p>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">TXID</p>
                <p className="text-xs font-black text-slate-500">{apostaSucesso.txid}</p>
             </div>
          </div>

          {/* Resumo Horizontal */}
          <div className="grid grid-cols-3 gap-2 mb-6">
             <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                <p className="text-[7px] font-black text-emerald-600 uppercase mb-0.5">Valor</p>
                <p className="text-xs font-black text-emerald-700">{formatarMoeda(apostaSucesso.valorTotal)}</p>
             </div>
             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Palpites</p>
                <p className="text-xs font-black text-slate-700">{apostaSucesso.palpites.length}x</p>
             </div>
             <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                <p className="text-[7px] font-black text-amber-600 uppercase mb-0.5">Status</p>
                <p className="text-[8px] font-black text-amber-700 uppercase leading-none mt-1">Aguardando PIX</p>
             </div>
          </div>

          {/* QR Code Reduzido */}
          <div className="mb-6 flex flex-col items-center">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 mb-4">
              <QRCodeSVG value={apostaSucesso.pixCopiaECola} size={160} />
            </div>
            
            {/* PIX Copia e Cola Compacto */}
            <div className="w-full bg-slate-900 rounded-2xl p-4 text-left relative overflow-hidden">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[7px] font-black text-brasil-yellow uppercase tracking-[0.2em]">Pix Copia e Cola</span>
                  <span className="text-[7px] font-bold text-white/40 uppercase">{formatarCPF(CONFIG_PAGAMENTO.chavePix)}</span>
               </div>
               <div className="flex items-center gap-3">
                  <p className="flex-1 text-[9px] font-mono text-white/80 truncate">{apostaSucesso.pixCopiaECola}</p>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(apostaSucesso.pixCopiaECola); alert("Código PIX Copiado!"); }}
                    className="bg-brasil-yellow text-brasil-blue p-2 rounded-lg active:scale-90 transition-transform"
                  >
                    <Copy size={14} strokeWidth={3} />
                  </button>
               </div>
            </div>
          </div>

          {/* Aviso Informativo */}
          <div className="flex items-start gap-2 text-left bg-blue-50 p-3 rounded-xl border border-blue-100">
             <Info className="text-blue-500 shrink-0 mt-0.5" size={14} />
             <p className="text-[9px] text-blue-700 font-bold leading-normal uppercase tracking-tight">
                Seu palpite será confirmado automaticamente pelo administrador após a identificação do pagamento.
             </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')} 
          className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] shadow-lg active:scale-95 transition-all"
        >
          Voltar para Arena
        </button>
      </div>
    );
  }

  const abertoParaApostas = estaAceitandoPalpites(jogo);

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-90 transition-all">
          <ArrowLeft size={18} className="text-slate-400" />
        </button>
        <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
            {formatDate(jogo.dataHora.toDate(), "dd MMM • HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-50 mb-6 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 flex-1">
           <BandeiraPais nomePais={jogo.timeCasa} tamanho={40} />
           <span className="font-black text-slate-800 uppercase tracking-tighter text-xs italic">{jogo.timeCasa}</span>
        </div>
        <div className="flex flex-col items-center px-4">
           <span className="text-[8px] font-black text-slate-200 tracking-widest mb-0.5 uppercase italic">VS</span>
           <div className="h-0.5 w-4 bg-brasil-yellow rounded-full"></div>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end text-right">
           <span className="font-black text-slate-800 uppercase tracking-tighter text-xs italic">{jogo.timeVisitante}</span>
           <BandeiraPais nomePais={jogo.timeVisitante} tamanho={40} />
        </div>
      </div>

      <form onSubmit={handleEnviarAposta} className="space-y-6">
        <div className="px-1">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Seu Nome Oficial</label>
          <input 
            type="text" 
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={enviando || !abertoParaApostas}
            className="h-14 bg-white border-slate-200 rounded-2xl font-black text-base shadow-sm focus:ring-4 ring-brasil-green/5 transition-all placeholder:font-normal placeholder:text-slate-200"
            placeholder="Como quer ser chamado?"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
              <div className="h-4 w-1 bg-brasil-green rounded-full"></div>
              Combinações de Placar
            </h3>
          </div>

          <div className="space-y-2">
            {palpites.map((p, index) => (
              <div key={index} className="bg-white rounded-[24px] p-4 pl-5 shadow-sm border border-slate-100 flex items-center gap-4 animate-in slide-in-from-left duration-300">
                <span className="text-[10px] font-black text-slate-300 italic">#{index + 1}</span>
                <div className="flex-1 flex items-center justify-center gap-3">
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{jogo.timeCasa.substring(0, 3)}</span>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={p.placarCasa ?? ''}
                        onChange={(e) => atualizarPalpite(index, 'placarCasa', e.target.value)}
                        disabled={enviando || !abertoParaApostas}
                        className="w-14 h-12 text-center text-xl font-black text-brasil-blue bg-slate-50 border-none rounded-xl focus:ring-4 ring-brasil-yellow/20"
                      />
                   </div>
                   <span className="mt-4 font-black text-slate-200 text-xs italic">X</span>
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{jogo.timeVisitante.substring(0, 3)}</span>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={p.placarVisitante ?? ''}
                        onChange={(e) => atualizarPalpite(index, 'placarVisitante', e.target.value)}
                        disabled={enviando || !abertoParaApostas}
                        className="w-14 h-12 text-center text-xl font-black text-brasil-blue bg-slate-50 border-none rounded-xl focus:ring-4 ring-brasil-yellow/20"
                      />
                   </div>
                </div>
                
                {palpites.length > 1 && abertoParaApostas && (
                  <button 
                    type="button" 
                    onClick={() => removerPalpite(index)} 
                    className="mt-4 p-2 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-100 transition-colors"
                    title="Remover combinação"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {(palpites.length === 1 || !abertoParaApostas) && <div className="w-10"></div>}
              </div>
            ))}
          </div>

          {abertoParaApostas && (
            <div className="px-1 py-1">
              <button 
                type="button" 
                onClick={adicionarPalpite}
                className="flex items-center gap-2 text-[10px] font-black text-brasil-green uppercase tracking-[0.2em] active:scale-95 transition-all py-2 hover:opacity-80"
              >
                <Plus size={14} strokeWidth={4} />
                + Adicionar mais um palpite
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[32px] p-5 text-white shadow-2xl relative overflow-hidden flex items-center justify-between border-b-4 border-slate-800">
           <div className="relative z-10 flex flex-col">
              <span className="text-[8px] font-black text-brasil-yellow uppercase tracking-widest mb-1">Cálculo da Participação</span>
              <div className="flex items-center gap-3">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black">{palpites.length}x</span>
                    <span className="text-[7px] font-bold opacity-40 uppercase">Palpites</span>
                 </div>
                 <div className="w-[1px] h-6 bg-white/10"></div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black">{formatarMoeda(jogo.valorAposta)}</span>
                    <span className="text-[7px] font-bold opacity-40 uppercase">Por Palpite</span>
                 </div>
              </div>
           </div>
           
           <div className="relative z-10 text-right">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total a Pagar</span>
              <p className="text-2xl font-black italic tracking-tighter text-emerald-400 leading-none">
                {formatarMoeda(palpites.length * jogo.valorAposta)}
              </p>
           </div>
           
           <Calculator className="absolute -right-2 -bottom-2 opacity-[0.03]" size={80} />
        </div>

        <div className="mt-8">
           {!abertoParaApostas ? (
             <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm text-center">
                <p className="text-rose-600 font-black text-[10px] uppercase tracking-widest leading-relaxed italic">
                   🚫 Prazo encerrado às {obterHorarioLimite(jogo)}.
                </p>
             </div>
           ) : (
             <button 
              type="submit"
              disabled={enviando}
              className={`w-full h-16 bg-brasil-green text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs border-b-4 border-emerald-800 ${enviando ? 'opacity-50' : ''}`}
            >
              {enviando ? (
                <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><Send size={18} strokeWidth={3} /> Gerar PIX da Convocação</>
              )}
            </button>
           )}
        </div>
      </form>
    </div>
  );
};

export default DetalhesJogo;
