import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, doc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo, Aposta, HistoricoPremio } from '../types';
import { 
  ArrowLeft, DollarSign, Trophy, Target, Award, TrendingUp, BarChart2, LogIn, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatarMoeda } from '../utils/pix';

interface ParticipanteStats {
  nome: string;
  palpites: number;
  investido: number;
  vitorias: number;
  recebido: number;
  saldo: number;
}

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const [acessoLiberado, setAcessoLiberado] = useState(() => {
    return sessionStorage.getItem('admin_acesso_liberado') === 'true';
  });
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [historico, setHistorico] = useState<HistoricoPremio[]>([]);
  const [premioAcumuladoAtual, setPremioAcumuladoAtual] = useState(0);
  const [loading, setLoading] = useState(true);

  const SENHA_MESTRA = import.meta.env.VITE_SENHA_ADMIN || 'lima2026';

  // 1. Carregar Dados do Firestore
  useEffect(() => {
    if (!acessoLiberado) return;

    const unsubJogos = onSnapshot(collection(db, 'jogos'), (snap) => {
      setJogos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Jogo)));
    });

    const unsubApostas = onSnapshot(collection(db, 'apostas'), (snap) => {
      setApostas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Aposta)));
    });

    const unsubHistorico = onSnapshot(collection(db, 'historicoPremios'), (snap) => {
      setHistorico(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoricoPremio)));
    });

    const unsubConfig = onSnapshot(doc(db, 'configuracoes', 'geral'), (snap) => {
      if (snap.exists()) {
        setPremioAcumuladoAtual(snap.data().premioAcumuladoAtual || 0);
      }
    });

    // Aguardar um tempo mínimo para carregar os dados
    const timer = setTimeout(() => setLoading(false), 800);

    return () => {
      unsubJogos();
      unsubApostas();
      unsubHistorico();
      unsubConfig();
      clearTimeout(timer);
    };
  }, [acessoLiberado]);

  if (!acessoLiberado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-sm border border-slate-50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brasil-blue"></div>
          <div className="bg-slate-50 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Settings className="text-brasil-blue" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 italic uppercase tracking-tight">Relatórios Lima</h2>
          <p className="text-slate-400 text-[10px] font-black mb-10 uppercase tracking-[0.3em]">Acesso Administrativo</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (senhaDigitada === SENHA_MESTRA) {
              sessionStorage.setItem('admin_acesso_liberado', 'true');
              setAcessoLiberado(true);
            } else {
              alert("Senha incorreta!");
            }
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-4 border-brasil-green/10 border-t-brasil-green animate-spin"></div>
        <p className="mt-6 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Gerando Relatório...</p>
      </div>
    );
  }

  // --- CÁLCULOS DOS RELATÓRIOS ---

  // 1. Apostas confirmadas
  const apostasConfirmadas = apostas.filter(a => a.statusPagamento === 'confirmado');

  // Total Arrecadado
  const totalArrecadado = apostasConfirmadas.reduce((acc, a) => acc + (a.valorTotal || 0), 0);

  // Total de jogos realizados (status === 'encerrado')
  const totalJogosRealizados = jogos.filter(j => j.status === 'encerrado').length;

  // Total de palpites confirmados
  const totalPalpitesConfirmados = apostasConfirmadas.reduce((acc, a) => acc + (a.palpites ? a.palpites.length : 0), 0);

  // Valor total distribuído em prêmios
  const valorTotalDistribuidoPremios = historico
    .filter(h => h.vencedores && h.vencedores.length > 0)
    .reduce((acc, h) => acc + (h.valorTotalPote || 0), 0);

  // Valor atualmente acumulado no pote (veio de configuracoes/geral)
  const valorAcumuladoNoPote = premioAcumuladoAtual;

  // 2. Ranking de Ganhadores e Estatísticas por Participante
  const ganhosPorParticipante: Record<string, number> = {};
  const vitoriasPorParticipante: Record<string, number> = {};

  historico.forEach(h => {
    if (h.vencedores && h.vencedores.length > 0) {
      h.vencedores.forEach(vencedor => {
        // Normalização leve para agrupamento consistente
        const nomeChave = vencedor.trim();
        ganhosPorParticipante[nomeChave] = (ganhosPorParticipante[nomeChave] || 0) + (h.valorPagoPorVencedor || 0);
        vitoriasPorParticipante[nomeChave] = (vitoriasPorParticipante[nomeChave] || 0) + 1;
      });
    }
  });

  // Ranking de Ganhadores (do maior para o menor por valor recebido)
  const rankingGanhadores = Object.entries(ganhosPorParticipante)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Mapear participantes das apostas confirmadas para obter Investido e Palpites
  const statsParticipantesMap: Record<string, { palpites: number; investido: number }> = {};
  
  apostasConfirmadas.forEach(aposta => {
    const nome = aposta.nomeParticipante.trim();
    if (!statsParticipantesMap[nome]) {
      statsParticipantesMap[nome] = { palpites: 0, investido: 0 };
    }
    statsParticipantesMap[nome].palpites += aposta.palpites ? aposta.palpites.length : 0;
    statsParticipantesMap[nome].investido += aposta.valorTotal || 0;
  });

  // Unificar todos os participantes que colocaram apostas ou que ganharam prêmios
  const todosOsNomes = Array.from(new Set([
    ...Object.keys(statsParticipantesMap),
    ...Object.keys(ganhosPorParticipante)
  ]));

  const estatisticasParticipantes: ParticipanteStats[] = todosOsNomes.map(nome => {
    const statsApostas = statsParticipantesMap[nome] || { palpites: 0, investido: 0 };
    const recebido = ganhosPorParticipante[nome] || 0;
    const vitorias = vitoriasPorParticipante[nome] || 0;
    const investido = statsApostas.investido;
    const saldo = recebido - investido;

    return {
      nome,
      palpites: statsApostas.palpites,
      investido,
      vitorias,
      recebido,
      saldo
    };
  }).sort((a, b) => b.saldo - a.saldo); // Ordenar por maior saldo/lucro por padrão

  // Maior Acertador
  let maiorAcertadorNome = 'Ninguém';
  let maiorAcertadorVitorias = 0;
  
  const vitoriasEntries = Object.entries(vitoriasPorParticipante);
  if (vitoriasEntries.length > 0) {
    const sortedVitorias = [...vitoriasEntries].sort((a, b) => b[1] - a[1]);
    const maxVits = sortedVitorias[0][1];
    if (maxVits > 0) {
      // Filtrar todos que têm o número máximo de vitórias para tratar empates
      const empatados = sortedVitorias.filter(x => x[1] === maxVits).map(x => x[0]);
      maiorAcertadorNome = empatados.join(', ');
      maiorAcertadorVitorias = maxVits;
    }
  }

  // Jogo com maior premiação (pot do histórico ou premioAcumulado ativo)
  let jogoMaiorPremiacaoNome = 'Nenhum';
  let jogoMaiorPremiacaoValor = 0;

  // Mapear potes de todos os jogos
  const potesPorJogo: Record<string, { nome: string; pote: number }> = {};

  // Potes dos jogos finalizados (do histórico de prêmios)
  historico.forEach(h => {
    const titulo = `${h.timeCasa} x ${h.timeVisitante}`;
    potesPorJogo[h.jogoId] = { nome: titulo, pote: h.valorTotalPote || 0 };
  });

  // Potes dos jogos em aberto (baseado no premioAcumulado ativo)
  jogos.forEach(j => {
    if (j.status !== 'encerrado') {
      const titulo = `${j.timeCasa} x ${j.timeVisitante}`;
      // Se já tem valor registrado no histórico do jogoId, mantemos o do histórico, senão o acumulado ativo
      if (!potesPorJogo[j.id]) {
        potesPorJogo[j.id] = { nome: titulo, pote: j.premioAcumulado || 0 };
      }
    }
  });

  const potesEntries = Object.values(potesPorJogo);
  if (potesEntries.length > 0) {
    const sortedPotes = potesEntries.sort((a, b) => b.pote - a.pote);
    if (sortedPotes[0].pote > 0) {
      jogoMaiorPremiacaoNome = sortedPotes[0].nome;
      jogoMaiorPremiacaoValor = sortedPotes[0].pote;
    }
  }

  // Médias por jogo
  const totalJogosCadastrados = jogos.length;
  
  // Média de participantes por jogo
  // Contamos quantos participantes únicos fizeram apostas confirmadas para cada jogo
  let totalParticipantesPorJogoAcumulado = 0;
  jogos.forEach(jogo => {
    const participantesUnicosJogo = new Set(
      apostasConfirmadas
        .filter(a => a.jogoId === jogo.id)
        .map(a => a.nomeParticipante.trim())
    );
    totalParticipantesPorJogoAcumulado += participantesUnicosJogo.size;
  });

  const mediaParticipantesPorJogo = totalJogosCadastrados > 0 
    ? (totalParticipantesPorJogoAcumulado / totalJogosCadastrados).toFixed(1) 
    : '0';

  const mediaPalpitesPorJogo = totalJogosCadastrados > 0 
    ? (totalPalpitesConfirmados / totalJogosCadastrados).toFixed(1) 
    : '0';

  const mediaArrecadadoPorJogo = totalJogosCadastrados > 0 
    ? totalArrecadado / totalJogosCadastrados 
    : 0;

  return (
    <div className="pb-20 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <button 
          onClick={() => navigate('/admin')} 
          className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all hover:bg-slate-50"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Relatórios de Estatísticas</h2>
        <div className="w-11"></div>
      </header>

      {/* 1. ESTATÍSTICAS GERAIS (INFORMAÇÕES) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 bg-brasil-green rounded-full"></div>
          <h3 className="text-slate-800 text-base font-black uppercase tracking-tight italic">Informações Gerais</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
          {/* Total Arrecadado */}
          <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
            <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-emerald-100">
              <DollarSign className="text-emerald-600" size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Arrecadado</p>
            <p className="text-lg font-black text-slate-800 italic leading-tight">{formatarMoeda(totalArrecadado)}</p>
          </div>

          {/* Jogos Realizados */}
          <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
            <div className="bg-brasil-yellow/10 w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-brasil-yellow/20">
              <Trophy className="text-amber-500" size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Jogos Realizados</p>
            <p className="text-lg font-black text-slate-800 italic leading-tight">{totalJogosRealizados} partidas</p>
          </div>

          {/* Palpites Confirmados */}
          <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
            <div className="bg-brasil-blue/5 w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-brasil-blue/10">
              <Target className="text-brasil-blue" size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Palpites Confirmados</p>
            <p className="text-lg font-black text-slate-800 italic leading-tight">{totalPalpitesConfirmados} palpites</p>
          </div>

          {/* Prêmios Distribuídos */}
          <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
            <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-indigo-100">
              <Award className="text-indigo-600" size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Prêmios Distribuídos</p>
            <p className="text-lg font-black text-slate-800 italic leading-tight">{formatarMoeda(valorTotalDistribuidoPremios)}</p>
          </div>

          {/* Atualmente Acumulado */}
          <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 col-span-2 md:col-span-1">
            <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-orange-100">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Acumulado no Pote</p>
            <p className="text-lg font-black text-slate-800 italic leading-tight">{formatarMoeda(valorAcumuladoNoPote)}</p>
          </div>
        </div>
      </section>

      {/* 2. MAIOR ACERTADOR E MAIOR PREMIAÇÃO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 px-2">
        {/* Maior Acertador */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">🏆 Maior Acertador</p>
            <p className="text-base font-black text-slate-800 uppercase tracking-tight">{maiorAcertadorNome}</p>
            <p className="text-xs font-bold text-slate-500">{maiorAcertadorVitorias} vitórias</p>
          </div>
        </div>

        {/* Jogo de Maior Premiação */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="bg-brasil-blue/5 text-brasil-blue w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-brasil-blue/10">
            <BarChart2 size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">⚽ Maior Premiação</p>
            <p className="text-base font-black text-slate-800 uppercase tracking-tight">{jogoMaiorPremiacaoNome}</p>
            <p className="text-xs font-bold text-slate-500">Pote: {formatarMoeda(jogoMaiorPremiacaoValor)}</p>
          </div>
        </div>
      </section>

      {/* 3. RANKING DE GANHADORES */}
      <section className="space-y-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-brasil-yellow rounded-full"></div>
          <h3 className="text-slate-800 text-base font-black uppercase tracking-tight italic">Ranking de Ganhadores</h3>
        </div>
        
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
          {rankingGanhadores.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6 font-bold uppercase tracking-wider">Nenhum ganhador registrado no histórico</p>
          ) : (
            <div className="space-y-4">
              {rankingGanhadores.map((ganhador, idx) => {
                let medalha = '';
                if (idx === 0) medalha = '🥇 ';
                else if (idx === 1) medalha = '🥈 ';
                else if (idx === 2) medalha = '🥉 ';

                return (
                  <div key={ganhador.nome} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                      {medalha}{ganhador.nome}
                    </span>
                    <span className="text-sm font-black text-emerald-600 italic">
                      {formatarMoeda(ganhador.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. MÉDIAS POR JOGO */}
      <section className="space-y-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-brasil-blue rounded-full"></div>
          <h3 className="text-slate-800 text-base font-black uppercase tracking-tight italic">Médias por Jogo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Participantes / Jogo</span>
            <span className="text-lg font-black text-brasil-blue italic">{mediaParticipantesPorJogo}</span>
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Palpites / Jogo</span>
            <span className="text-lg font-black text-brasil-blue italic">{mediaPalpitesPorJogo}</span>
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Arrecadado / Jogo</span>
            <span className="text-lg font-black text-emerald-600 italic">{formatarMoeda(mediaArrecadadoPorJogo)}</span>
          </div>
        </div>
      </section>

      {/* 5. ESTATÍSTICAS POR PARTICIPANTE */}
      <section className="space-y-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-slate-300 rounded-full"></div>
          <h3 className="text-slate-800 text-base font-black uppercase tracking-tight italic">Estatísticas por Participante</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estatisticasParticipantes.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 col-span-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nenhum participante ativo</p>
            </div>
          ) : (
            estatisticasParticipantes.map(p => {
              const eLucro = p.saldo >= 0;
              return (
                <div key={p.nome} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${eLucro ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">{p.nome}</h4>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                      eLucro ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      Saldo: {eLucro ? '+' : ''}{formatarMoeda(p.saldo)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-[20px] p-4 border border-slate-100/50">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Palpites Confirmados</p>
                      <p className="text-sm font-black text-slate-700">{p.palpites}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Total Investido</p>
                      <p className="text-sm font-black text-slate-700">{formatarMoeda(p.investido)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Quantidade de Vitórias</p>
                      <p className="text-sm font-black text-slate-700">{p.vitorias} vitórias</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Valor em Prêmios</p>
                      <p className="text-sm font-black text-emerald-600 italic">{formatarMoeda(p.recebido)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default Relatorios;
