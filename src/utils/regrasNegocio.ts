import { 
  doc, collection, query, where, getDocs, 
  writeBatch, Timestamp, getDoc, orderBy, updateDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo, Aposta } from '../types';

/**
 * Verifica se um jogo ainda aceita palpites baseado no horário.
 */
export const estaAceitandoPalpites = (jogo: Jogo) => {
  if (jogo.status === 'encerrado') return false;
  const agora = new Date();
  const dataJogo = jogo.dataHora.toDate();
  const dataLimite = new Date(dataJogo.getTime() + (jogo.minutosTolerancia || 10) * 60000);
  return agora < dataLimite;
};

export const obterHorarioLimite = (jogo: Jogo) => {
  const dataJogo = jogo.dataHora.toDate();
  const dataLimite = new Date(dataJogo.getTime() + (jogo.minutosTolerancia || 10) * 60000);
  return dataLimite.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Lógica Central de Encerramento (CORRIGIDA)
 */
export const calcularResultadoBolao = async (
  jogo: Jogo, 
  placarCasa: number, 
  placarVisitante: number
) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Buscar saldo global acumulado anterior
    const configRef = doc(db, 'configuracoes', 'geral');
    const configDoc = await getDoc(configRef);
    const valorAcumuladoAnterior = configDoc.exists() ? (configDoc.data().premioAcumuladoAtual || 0) : 0;

    // 2. Buscar apostas CONFIRMADAS para calcular arrecadação real (IMUNE A BUGS DE CONTADOR)
    const q = query(
      collection(db, 'apostas'), 
      where('jogoId', '==', jogo.id), 
      where('statusPagamento', '==', 'confirmado')
    );
    const snapshot = await getDocs(q);
    const apostas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Aposta));

    // Arrecadação baseada no valor total pago por cada aposta confirmada
    const arrecadacaoPartida = apostas.reduce((acc, a) => acc + (a.valorTotal || 0), 0);

    // 3. Pote Total = Acumulado de Jogos Anteriores + Arrecadação Deste Jogo
    const valorTotalPote = valorAcumuladoAnterior + arrecadacaoPartida;

    // 4. Identificar vencedores (quem acertou o placar exato)
    const vencedoresFinal: string[] = [];
    apostas.forEach(aposta => {
      (aposta.palpites || []).forEach(palpite => {
        if (palpite.placarCasa === placarCasa && palpite.placarVisitante === placarVisitante) {
          vencedoresFinal.push(aposta.nomeParticipante);
        }
      });
    });

    let valorPagoPorVencedor = 0;
    let novoAcumuladoGlobal = 0;

    if (vencedoresFinal.length > 0) {
      // RATEIO: Pote distribuído, acumulado global vira 0
      valorPagoPorVencedor = valorTotalPote / vencedoresFinal.length;
      novoAcumuladoGlobal = 0;
    } else {
      // ACÚMULO: Ninguém ganhou, Pote Total vira o novo acumulado global
      novoAcumuladoGlobal = valorTotalPote;
    }

    // 5. Atualizar Saldo Global
    batch.set(configRef, { 
      premioAcumuladoAtual: novoAcumuladoGlobal 
    }, { merge: true });

    // 6. Registrar no Histórico Detalhado
    const historicoRef = doc(collection(db, 'historicoPremios'));
    batch.set(historicoRef, {
      jogoId: jogo.id,
      timeCasa: jogo.timeCasa,
      timeVisitante: jogo.timeVisitante,
      placarCasa,
      placarVisitante,
      valorAcumuladoAnterior,
      arrecadacaoPartida,
      valorTotalPote,
      vencedores: vencedoresFinal,
      valorPagoPorVencedor,
      dataProcessamento: Timestamp.now(),
      foiAcumulado: vencedoresFinal.length === 0,
      valorAcumuladoAposJogo: novoAcumuladoGlobal
    });

    // 7. Atualizar Status do Jogo e Limpar Prêmio Local
    const jogoRef = doc(db, 'jogos', jogo.id);
    batch.update(jogoRef, {
      status: 'encerrado',
      placarCasa,
      placarVisitante,
      premioAcumulado: 0 
    });

    await batch.commit();

    return {
      sucesso: true,
      vencedores: vencedoresFinal.length,
      poteTotal: valorTotalPote,
      valorPorVencedor: valorPagoPorVencedor,
      acumulou: vencedoresFinal.length === 0
    };

  } catch (error) {
    console.error("Erro ao encerrar partida:", error);
    throw error;
  }
};

/**
 * Função de Emergência: Reconstrói o saldo global a partir do histórico
 */
export const recalcularPremioAcumulado = async () => {
  try {
    const q = query(collection(db, 'historicoPremios'), orderBy('dataProcessamento', 'asc'));
    const snapshot = await getDocs(q);
    
    let saldo = 0;
    snapshot.docs.forEach(doc => {
      const h = doc.data();
      if (h.vencedores && h.vencedores.length > 0) {
        saldo = 0;
      } else {
        saldo = h.valorTotalPote || 0;
      }
    });

    await updateDoc(doc(db, 'configuracoes', 'geral'), { premioAcumuladoAtual: saldo });
    return saldo;
  } catch (error) {
    console.error("Erro no recálculo:", error);
    throw error;
  }
};
