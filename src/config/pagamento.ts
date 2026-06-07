export const CONFIG_PAGAMENTO = {
  chavePix: "13407859600",
  tipoChave: "CPF",
  titular: "Bolão Família Lima",
  cidade: "São Paulo"
};

export interface DadosPix {
  chavePix: string;
  valor: number;
  identificador: string;
}

/**
 * Utilitário para formatar CPF para exibição
 */
export const formatarCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};
