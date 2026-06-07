import { MAPA_PAISES, normalizarNomePais } from './mapaPaises';

/**
 * Utilitário ultra-resiliente para formatar valores monetários em Real (BRL).
 * Aceita undefined, null, NaN e outros valores não numéricos, tratando-os como 0.
 */
export const formatarMoeda = (valor?: number | null | string) => {
  let valorNumerico: number;

  if (typeof valor === 'number') {
    valorNumerico = Number.isNaN(valor) ? 0 : valor;
  } else if (typeof valor === 'string') {
    valorNumerico = parseFloat(valor) || 0;
  } else {
    valorNumerico = 0;
  }

  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Função para gerar o Payload PIX estático (BRCode)
 * Baseado na especificação oficial do BACEN.
 */
export const gerarPayloadPix = (
  chave: string,
  valor: number,
  merchantName: string,
  txid: string,
  cidade: string = "SAO PAULO"
) => {
  const formatarCampo = (id: string, valor: string) => {
    const tamanho = valor.length.toString().padStart(2, '0');
    return `${id}${tamanho}${valor}`;
  };

  // 00 - Payload Format Indicator
  let payload = "000201";

  // 26 - Merchant Account Information - PIX
  const gui = "0014BR.GOV.BCB.PIX";
  const chavePix = formatarCampo("01", chave);
  payload += formatarCampo("26", `${gui}${chavePix}`);

  // 52 - Merchant Category Code
  payload += "52040000";

  // 53 - Transaction Currency (BRL = 986)
  payload += "5303986";

  // 54 - Transaction Amount
  payload += formatarCampo("54", valor.toFixed(2));

  // 58 - Country Code
  payload += "5802BR";

  // 59 - Merchant Name (Máx 25 char)
  payload += formatarCampo("59", merchantName.substring(0, 25).toUpperCase());

  // 60 - Merchant City
  payload += formatarCampo("60", cidade.substring(0, 15).toUpperCase());

  // 62 - Additional Data Field Template
  const campoTxid = formatarCampo("05", txid.substring(0, 25).toUpperCase());
  payload += formatarCampo("62", campoTxid);

  // 63 - CRC16 (Cálculo do Checksum)
  payload += "6304";
  payload += calcularCRC16(payload);

  return payload;
};

/**
 * Função simplificada para obter sigla do país para o TXID
 */
export const obterSiglaPais = (nomePais: string): string => {
  const nomeNormalizado = normalizarNomePais(nomePais);
  return MAPA_PAISES[nomeNormalizado] || "XX";
};

/**
 * Algoritmo CRC16 CCITT
 */
function calcularCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    let byte = payload.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      let bit = ((byte >> (7 - j)) & 1) === 1;
      let c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
