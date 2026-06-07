import { Timestamp } from 'firebase/firestore';

export type StatusJogo = 'aberto' | 'em_andamento' | 'encerrado';
export type StatusPagamento = 'pendente' | 'confirmado' | 'cancelado';

export interface Palpite {
  placarCasa: number;
  placarVisitante: number;
}

export interface Jogo {
  id: string;
  timeCasa: string;
  timeVisitante: string;
  dataHora: Timestamp;
  minutosTolerancia: number;
  valorAposta: number;
  premioAcumulado: number;
  status: StatusJogo;
  placarCasa?: number;
  placarVisitante?: number;
}

export interface Aposta {
  id: string;
  jogoId: string;
  codigoAposta: string;
  nomeParticipante: string;
  palpites: Palpite[];
  quantidadePalpites: number;
  valorUnitario: number;
  valorTotal: number;
  codigoPagamento: string;
  txid?: string; // Identificador PIX para conferência
  statusPagamento: StatusPagamento;
  dataCriacao: Timestamp;
}

export interface Configuracoes {
  valorPadraoAposta: number;
  premioAcumuladoAtual: number;
}

export interface HistoricoPremio {
  id: string;
  jogoId: string;
  timeCasa: string;
  timeVisitante: string;
  placarCasa: number;
  placarVisitante: number;
  valorAcumuladoAnterior: number; // Saldo que veio de jogos passados
  arrecadacaoPartida: number;      // Quanto este jogo arrecadou
  valorTotalPote: number;          // Soma do anterior + partida
  vencedores: string[];
  valorPagoPorVencedor: number;
  dataProcessamento: Timestamp;
  foiAcumulado: boolean;           // true se ninguém ganhou
  valorAcumuladoAposJogo: number;  // Novo saldo global
}

export interface DadosPix {
  chavePix: string;
  valor: number;
  identificador: string;
}
