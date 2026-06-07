/**
 * Definição centralizada do tema visual exclusivo da Família Lima.
 * Cores extraídas e inspiradas na foto oficial e na bandeira do Brasil.
 */
export const TEMA_LIMA = {
  cores: {
    // Escala de Verdes (Primária)
    verdeLima: '#009739',
    verdeEscuro: '#006727',
    verdeSuave: '#E6F4EA',
    
    // Escala de Amarelos (Destaque)
    amareloOuro: '#FFDF00',
    amareloLima: '#FFEA00',
    
    // Escala de Azuis (Profundidade)
    azulCopa: '#012169',
    azulNoite: '#00143D',
    
    // Neutros Fintech
    fundo: '#F4F7F6',
    superficie: '#FFFFFF',
    texto: '#1A1D21',
    textoSecundario: '#64748B',
  },
  
  gradientes: {
    hero: 'linear-gradient(to top, rgba(0, 151, 57, 1) 0%, rgba(0, 151, 57, 0.6) 50%, rgba(0, 151, 57, 0) 100%)',
    overlay: 'linear-gradient(135deg, rgba(1, 33, 105, 0.8) 0%, rgba(0, 151, 57, 0.8) 100%)',
    festivo: 'linear-gradient(to bottom, rgba(255, 223, 0, 0.2) 0%, rgba(255, 223, 0, 0) 100%)',
  },
  
  sombras: {
    premium: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    interna: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  bordas: {
    extra: '40px',
    card: '32px',
    suave: '24px'
  }
};
