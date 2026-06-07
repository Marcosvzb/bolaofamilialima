# 🚀 Guia de Deploy - Bolão Família Lima

Este projeto está configurado para ser hospedado na **Vercel** com banco de dados **Firebase**.

## 1. Configuração do Firebase
Certifique-se de que as regras do Firestore permitem leitura/escrita para as coleções:
- `jogos`
- `apostas`
- `configuracoes`
- `historicoPremios`

## 2. Preparação para Vercel
As variáveis de ambiente devem ser configuradas no painel da Vercel (Settings > Environment Variables).

### Variáveis Necessárias:
| Variável | Valor Exemplo |
|----------|---------------|
| `VITE_ADMIN_PASSWORD` | sua-senha-admin |
| `VITE_FIREBASE_API_KEY` | AIzaSy... |
| `VITE_FIREBASE_AUTH_DOMAIN` | bolao-fbdff.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | bolao-fbdff |
| `VITE_FIREBASE_STORAGE_BUCKET` | bolao-fbdff.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 1098428709552 |
| `VITE_FIREBASE_APP_ID` | 1:1098428709552:web:ffcbc... |

## 3. Comandos de Build
A Vercel detectará automaticamente o Vite, mas as configurações padrão são:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 4. Instalação PWA (Mobile)

### Android (Chrome)
1. Acesse a URL do projeto.
2. Clique nos três pontos (menu).
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

### iPhone (Safari)
1. Acesse a URL do projeto no Safari.
2. Clique no ícone de **Compartilhar** (quadrado com seta para cima).
3. Role para baixo e clique em **"Adicionar à Tela de Início"**.

## 5. Estrutura do Banco (Primeiro Acesso)
Após o deploy, acesse o painel `/admin` e:
1. Crie o primeiro jogo (o sistema criará a coleção `jogos`).
2. Confirme um pagamento de teste (o sistema criará a coleção `apostas`).
