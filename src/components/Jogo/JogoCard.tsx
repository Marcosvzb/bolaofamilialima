import React from 'react';
import { Link } from 'react-router-dom';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Jogo } from '../../types';
import { Trophy, Clock, ChevronRight, Target } from 'lucide-react';
import BandeiraPais from '../BandeiraPais';
import { estaAceitandoPalpites } from '../../utils/regrasNegocio';
import { formatarMoeda } from '../../utils/pix';

interface JogoCardProps {
  jogo: Jogo;
}

const JogoCard: React.FC<JogoCardProps> = ({ jogo }) => {
  const dataFormatada = formatDate(jogo.dataHora.toDate(), "dd MMM • HH:mm", { locale: ptBR });
  const isEncerrado = jogo.status === 'encerrado';
  const abertoParaPalpites = estaAceitandoPalpites(jogo);

  return (
    <Link 
      to={isEncerrado ? '/historico' : `/jogo/${jogo.id}`} 
      className="block bg-white rounded-[28px] p-6 mb-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all duration-200 group"
      aria-label={isEncerrado ? "Ver resultados deste jogo" : "Apostar neste jogo"}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
          <Clock size={12} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dataFormatada}</span>
        </div>

        {/* Selo Dinâmico de Status */}
        <div className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.1em] border ${
          isEncerrado ? 'bg-slate-100 text-slate-400 border-slate-200' :
          abertoParaPalpites ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {isEncerrado ? 'Finalizado' : abertoParaPalpites ? '🟢 Aberto' : '🔴 Encerrado'}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex flex-col items-center flex-1">
          <BandeiraPais nomePais={jogo.timeCasa} tamanho={64} />
          <span className="text-xs font-black text-slate-800 text-center uppercase tracking-tighter line-clamp-1 mt-2">{jogo.timeCasa}</span>
        </div>
        
        <div className="flex flex-col items-center px-4">
          {isEncerrado ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-brasil-blue">{jogo.placarCasa}</span>
              <span className="text-slate-300 font-bold italic text-sm">X</span>
              <span className="text-3xl font-black text-brasil-blue">{jogo.placarVisitante}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-300 tracking-[0.4em] mb-1">VS</span>
              <div className="h-1 w-8 bg-brasil-yellow rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center flex-1">
          <BandeiraPais nomePais={jogo.timeVisitante} tamanho={64} />
          <span className="text-xs font-black text-slate-800 text-center uppercase tracking-tighter line-clamp-1 mt-2">{jogo.timeVisitante}</span>
        </div>
      </div>
      
      <div className="border-t border-slate-50 pt-5 flex justify-between items-center gap-4">
        {!isEncerrado ? (
          <>
            <div className="flex flex-col flex-1">
               <div className="flex items-center gap-1 mb-1">
                  <Trophy size={10} className="text-brasil-yellow" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pote em Disputa</span>
               </div>
               <span className="text-lg font-black text-emerald-600 italic tracking-tight leading-none mb-2">
                 {formatarMoeda(jogo.premioAcumulado)}
               </span>
               <div className="flex items-center gap-1.5 opacity-60">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Custo:</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase">{formatarMoeda(jogo.valorAposta)} / palpite</span>
               </div>
            </div>

            {/* NOVO CTA TEXTUAL EXPLÍCITO */}
            <div 
              className={`flex items-center justify-center gap-2 px-6 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                abertoParaPalpites 
                  ? 'bg-brasil-green text-white shadow-lg shadow-emerald-500/20 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Target size={16} />
              <span className="hidden xs:inline">{abertoParaPalpites ? 'Apostar Agora' : 'Encerrado'}</span>
              <span className="xs:hidden">{abertoParaPalpites ? 'Apostar' : 'Fim'}</span>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em]">
            VER GANHADORES <ChevronRight size={14} />
          </div>
        )}
      </div>
    </Link>
  );
};

export default JogoCard;
