import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { Jogo, Aposta } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { obterEmojiBandeira } from '../utils/mapaPaises';

interface ExportarApostasModalProps {
  jogo: Jogo;
  apostas: Aposta[];
  onClose: () => void;
}

const ExportarApostasModal: React.FC<ExportarApostasModalProps> = ({ jogo, apostas, onClose }) => {
  const [copiado, setCopiado] = useState(false);

  // Filtrar apenas apostas confirmadas para este jogo
  const apostasConfirmadas = apostas.filter(a => a.jogoId === jogo.id && a.statusPagamento === 'confirmado');

  const gerarTexto = () => {
    const bandeiraCasa = obterEmojiBandeira(jogo.timeCasa);
    const bandeiraVisitante = obterEmojiBandeira(jogo.timeVisitante);
    const dataFormatada = format(jogo.dataHora.toDate(), "dd/MM/yyyy", { locale: ptBR });
    const horarioFormatado = format(jogo.dataHora.toDate(), "HH:mm", { locale: ptBR });

    let texto = `🏆 BOLÃO FAMÍLIA LIMA\n\n`;
    texto += `${jogo.timeCasa} ${bandeiraCasa} x ${bandeiraVisitante} ${jogo.timeVisitante}\n\n`;
    texto += `Data: ${dataFormatada}\n`;
    texto += `Horário: ${horarioFormatado}\n\n`;
    texto += `Apostas confirmadas:\n\n`;

    let totalPalpites = 0;

    apostasConfirmadas.forEach(aposta => {
      aposta.palpites.forEach(palpite => {
        texto += `${aposta.nomeParticipante}\n`;
        texto += `${palpite.placarCasa} x ${palpite.placarVisitante}\n\n`;
        totalPalpites++;
      });
    });

    texto += `Total de palpites:\n${totalPalpites}\n\n`;
    texto += `Boa sorte a todos! 🍀`;

    return texto;
  };

  const handleCopiar = () => {
    const texto = gerarTexto();
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black italic text-brasil-blue uppercase tracking-tight">Exportar Apostas</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resumo para WhatsApp</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 p-3 rounded-2xl text-slate-400 active:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-inner">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
              {gerarTexto()}
            </pre>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-white sticky bottom-0 z-10">
          <button
            onClick={handleCopiar}
            className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl text-sm transition-all flex items-center justify-center gap-3 ${
              copiado 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-brasil-blue text-white shadow-brasil-blue/20 active:scale-[0.98]'
            }`}
          >
            {copiado ? (
              <>
                <Check size={20} strokeWidth={3} /> Copiado!
              </>
            ) : (
              <>
                <Copy size={20} strokeWidth={3} /> Copiar para WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportarApostasModal;
