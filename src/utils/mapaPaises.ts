/**
 * Função para remover acentos, espaços extras e converter para minúsculas.
 */
export const normalizarNomePais = (nome: string): string => {
  if (!nome) return "";
  return nome
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

/**
 * Mapeamento explícito de nomes de países (NORMALIZADOS) 
 * para códigos ISO 3166-1 alpha-2.
 */
export const MAPA_PAISES: Record<string, string> = {
  // AMÉRICA DO SUL
  "brasil": "BR",
  "argentina": "AR",
  "uruguai": "UY",
  "paraguai": "PY",
  "chile": "CL",
  "peru": "PE",
  "colombia": "CO",
  "equador": "EC",
  "bolivia": "BO",
  "venezuela": "VE",

  // AMÉRICA DO NORTE E CENTRAL
  "mexico": "MX",
  "estados unidos": "US",
  "eua": "US",
  "canada": "CA",
  "costa rica": "CR",
  "panama": "PA",
  "jamaica": "JM",
  "haiti": "HT",

  // EUROPA
  "alemanha": "DE",
  "franca": "FR",
  "espanha": "ES",
  "portugal": "PT",
  "italia": "IT",
  "holanda": "NL",
  "paises baixos": "NL",
  "belgica": "BE",
  "suica": "CH",
  "croacia": "HR",
  "dinamarca": "DK",
  "suecia": "SE",
  "noruega": "NO",
  "polonia": "PL",
  "austria": "AT",
  "servia": "RS",

  // ÁFRICA
  "marrocos": "MA",
  "tunisia": "TN",
  "argelia": "DZ",
  "egito": "EG",
  "nigeria": "NG",
  "camaroes": "CM",
  "senegal": "SN",
  "gana": "GH",

  // ÁSIA E OCEANIA
  "japao": "JP",
  "coreia do sul": "KR",
  "china": "CN",
  "australia": "AU",
  "nova zelandia": "NZ",

  // REINO UNIDO (Territórios Específicos mapeados para GB na biblioteca padrão)
  "inglaterra": "GB",
  "escocia": "GB",
  "pais de gales": "GB",
  "irlanda do norte": "GB"
};

// Conjunto para evitar logs repetidos no console
const paisesNaoMapeadosRegistrados = new Set<string>();

/**
 * Retorna o código ISO do país utilizando normalização robusta.
 */
export const obterCodigoISO = (nomePais: string): string => {
  const nomeNormalizado = normalizarNomePais(nomePais);
  const codigo = MAPA_PAISES[nomeNormalizado];
  
  if (!codigo && nomePais) {
    if (!paisesNaoMapeadosRegistrados.has(nomeNormalizado)) {
      console.warn(`[Bandeira] País não mapeado: "${nomePais}" (normalizado: "${nomeNormalizado}")`);
      paisesNaoMapeadosRegistrados.add(nomeNormalizado);
    }
  }
  
  return codigo || "";
};

/**
 * Retorna o emoji da bandeira do país.
 */
export const obterEmojiBandeira = (nomePais: string): string => {
  const code = obterCodigoISO(nomePais);
  if (!code) return "";
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
};
