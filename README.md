# ReservaGO

Aplicativo mobile de reserva de hotéis desenvolvido como Projeto Final de Curso (TCC) — 7º Período.

---

## Sobre o projeto

O ReservaGO permite que usuários busquem, visualizem e reservem hospedagens diretamente pelo celular. O app integra APIs externas de hotéis, pagamento e localização em uma interface mobile moderna.

---

## Tecnologias utilizadas

**Frontend (Mobile)**
- React Native + Expo SDK 54
- TypeScript
- Expo Router (navegação baseada em arquivos)
- Lucide React Native (ícones)

**Backend**
- Node.js
- API REST / JSON
- PostgreSQL (AWS RDS)
- Redis (AWS ElastiCache)

**Infraestrutura**
- AWS EC2 / Render (backend)
- Vercel (frontend web)
- Amazon S3 (imagens e documentos)
- Cloudflare CDN + AWS ALB

**Serviços externos**
- Booking / Expedia / Hoteis.com (APIs de hotéis)
- Stripe / Pix (pagamentos)
- Google Maps (localização)

---

## Pré-requisitos

Antes de rodar o projeto, instale:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/client) no celular (Android ou iOS)

---

## Como rodar localmente

````bash
# 1. Clonar o repositório
git clone https://github.com/JuniorPrado99/ReservaGO.git
cd ReservaGO

# 2. Instalar dependências
npm install

# 3. Iniciar o projeto
npx expo start
````

Após iniciar, escaneie o QR Code com o Expo Go (Android) ou com a câmera (iOS).

Para rodar sem internet:

````bash
npx expo start --offline
````

---
## Dependências adicionais

Algumas dependências nativas precisam ser instaladas separadamente com o Expo CLI para garantir compatibilidade com a versão correta do SDK:

| Pacote | Motivo |
|---|---|
| `@react-native-async-storage/async-storage` | Persistência local de favoritos e reservas por usuário entre sessões do app |

Para instalar:

```bash
npx expo install @react-native-async-storage/async-storage
```

> Sempre use `npx expo install` (não `npm install`) para pacotes nativos — o Expo garante a versão compatível com o SDK atual.

---

## Estrutura do projeto

````
ReservaGO/
├── app/              # Telas e rotas (Expo Router)
├── components/       # Componentes reutilizáveis (botões, cards, formulários)
├── context/          # Estado global (autenticação, reservas, favoritos)
├── constants/        # Cores, fontes, textos fixos
├── assets/           # Imagens e ícones
├── app.json          # Configuração do Expo
├── package.json      # Dependências
└── tsconfig.json     # Configuração TypeScript
````

---

## Arquitetura

O sistema é dividido em camadas:

| Camada | Tecnologia |
|---|---|
| Cliente (Mobile) | React Native + Expo |
| Rede / Edge | Cloudflare CDN + AWS ALB |
| Aplicação | Node.js (API REST) |
| Dados | PostgreSQL + Redis + S3 |
| Segurança | HTTPS/TLS + JWT + AWS Shield |

Pipeline de CI/CD via GitHub Actions: push na `main` → build → testes → deploy automático.

---

## Equipe

| Nome | GitHub |
|---|---|
| Junior Prado | [@JuniorPrado99](https://github.com/JuniorPrado99) |
| Arthur Caixeta | [@ArthurCaixet0](https://github.com/ArthurCaixet0) |
| Ian Couto | [@IanCoutoFTT](https://github.com/IanCoutoFTT) |

---

## Licença

MIT License — veja o arquivo [LICENSE](./LICENSE) para detalhes.
