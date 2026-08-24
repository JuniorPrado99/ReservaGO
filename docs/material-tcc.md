# ReservaGO — Material para o Documento do TCC

> Gerado em 2026-08-22 a partir da leitura direta do código-fonte na branch
> `feature/oauth-google` (não do README, que ainda descreve um estado antigo
> do projeto — ver `CLAUDE.md`, seção "Divergências"). Todo o conteúdo abaixo
> descreve o que **existe de fato no código**, não o que foi planejado.

> ⚠️ **Aviso importante sobre as seções 5 e 6 (RF/RNF)**: não existe, em
> nenhum lugar deste repositório, uma lista oficial de requisitos funcionais
> (RF-001 a RF-010) ou não funcionais (RNF-001 a RNF-007). Os números RF-001,
> RF-002, RF-003, RF-004, RF-009 e RF-010 foram citados nas instruções desta
> sessão associados a telas específicas (Explorar, Detalhes, Avaliações,
> Admin) — os demais (RF-005 a RF-008) e todos os RNF foram **inferidos**
> aqui a partir das funcionalidades reais do app, tentando preencher a
> lacuna de forma coerente. **Confira estas duas seções contra o documento
> oficial do seu TCC antes de usar** — se a numeração ou o texto oficial for
> diferente, é só reordenar/renomear; o *conteúdo* (o que está ou não
> conectado) continua válido.

---

## 1. Estrutura de pastas

```
ReservaGO/
├── app/                          # Rotas (Expo Router — cada arquivo/pasta = uma tela)
│   ├── (tabs)/                   # Grupo de rotas da tab bar inferior
│   │   ├── _layout.tsx           # Configuração das 5 abas
│   │   ├── index.tsx             # Aba "Explorar" — busca, filtros, carrosséis (Supabase)
│   │   ├── favorites.tsx         # Aba "Favoritos" (ainda local/AsyncStorage)
│   │   ├── bookings.tsx          # Aba "Viagens" — reservas reais + locais (Supabase + fallback)
│   │   ├── messages.tsx          # Aba "Mensagens" (ainda mock local)
│   │   └── profile.tsx           # Aba "Perfil"
│   ├── oauth-callback.tsx        # Callback do fluxo de login com Google (Supabase Auth, PKCE)
│   ├── login.tsx                 # Login (Google real + fallback estático em __DEV__)
│   ├── select-role.tsx           # Escolha hóspede/anfitrião (grava via RPC set_own_role)
│   ├── details.tsx               # Detalhes da cabana + fluxo de reserva (Supabase)
│   ├── review.tsx                # Avaliar uma estadia concluída (Supabase)
│   ├── create-listing.tsx        # Cadastro de cabana pelo anfitrião (Supabase + upload de imagem)
│   ├── my-cabins.tsx             # Painel do anfitrião — lista + status de aprovação (Supabase)
│   ├── admin-dashboard.tsx       # Painel admin — estatísticas, aprovações, denúncias (Supabase)
│   ├── notifications.tsx         # Notificações (ainda mock local)
│   ├── modal.tsx, +not-found.tsx, +html.tsx  # Utilitários do template Expo Router
│   └── _layout.tsx               # Layout raiz: monta os 5 Providers + Stack navigator
├── context/                      # Estado global via React Context — 5 contexts (ver seção 2)
├── components/                   # Componentes reutilizáveis (PropertyCard, Themed, StyledText)
│   └── __tests__/                # Testes de componente
├── services/                     # ★ Camada de acesso ao Supabase — toda query do app passa por aqui
│   ├── types.ts                  # Enums, interfaces de linha por tabela, ServiceResult<T>
│   ├── propertyService.ts        # CRUD de properties + upload de imagem (Storage)
│   ├── bookingService.ts         # Disponibilidade (RPC), criar/listar/cancelar reservas
│   ├── reviewService.ts          # Criar/listar avaliações, checar duplicidade
│   ├── messageService.ts         # Conversas/mensagens + assinatura Realtime (feito, não usado por nenhuma tela ainda)
│   ├── profileService.ts         # Perfil, troca de role (via RPC), exclusão de conta (soft delete)
│   ├── adminService.ts           # Estatísticas, aprovação de anúncios, denúncias
│   └── __tests__/                # Testes de service (mock do Supabase)
├── lib/
│   └── supabase.ts               # Client Supabase único (SecureStore, PKCE, validação de env vars)
├── constants/
│   └── Colors.ts                 # Paleta light/dark
├── supabase/
│   ├── schema.sql                # Schema completo do banco — fonte da verdade
│   ├── seed.sql                  # Dados de desenvolvimento (não aplicado automaticamente)
│   └── migrations/               # Migrações versionadas (ex.: correção de RLS)
├── .github/workflows/ci.yml      # CI — type-check + testes a cada push/PR
├── docs/
│   └── material-tcc.md           # Este arquivo
├── assets/                       # Fontes e imagens
├── app.json, eas.json            # Config do Expo e do EAS Build (dev client)
├── .env.example                  # Template das variáveis de ambiente necessárias
└── CLAUDE.md                     # Documentação viva do projeto para sessões de IA
```

**Novidade central desta fase**: a pasta `services/`, que centraliza 100% do acesso ao Supabase.
Nenhuma tela importa `lib/supabase.ts` diretamente — toda leitura/escrita no banco passa por uma
função de `services/`, com retorno uniforme `{ data, error }`.

---

## 2. Contexts (`context/`) — são 5, não 4

Providers React puros, montados em `app/_layout.tsx` nesta ordem:
`AuthProvider > BookingProvider > FavoritesProvider > NotificationProvider > ListingProvider`.

| Context | O que gerencia | Persistência | Conectado ao Supabase? |
|---|---|---|---|
| `AuthContext` | Sessão do usuário (login Google real via Supabase Auth + fallback estático em `__DEV__`), troca de role, exclusão de conta | SecureStore (sessão) via SDK | **Sim** — login, perfil e troca de role (via RPC `set_own_role`) |
| `BookingContext` | Reservas feitas **localmente** (usuário estático, ou fallback quando o Supabase falha) | AsyncStorage | Não — é justamente o "modo offline/fallback"; reservas reais vivem só no banco, lidas via `bookingService` |
| `FavoritesContext` | Cabanas favoritadas | AsyncStorage | Não |
| `ListingContext` | Catálogo de cabanas **local** (8 hardcoded) — usado como fallback quando `propertyService` falha ou o usuário é estático | Memória | Não — é o fallback da tela Explorar |
| `NotificationContext` | Notificações do usuário | Memória | Não |

---

## 3. Estratégia de testes

**Ferramentas**: `jest` (29.7.0) com o preset `jest-expo` (54.0.18, alinhado ao Expo SDK 54) +
`@testing-library/react-native` (13.3.3, compatível com React 19/`react-test-renderer` 19.1.0
já usados no projeto) + `@types/jest`.

**Por que Testing Library e não `react-test-renderer` puro**: o teste original do template
(`react-test-renderer.create(...).toJSON()`) "passava" com um snapshot `null` — o Scheduler
assíncrono do React 19 ainda não tinha comitado a árvore no momento do `toJSON()`. Testing Library
usa `act()` internamente e resolve isso corretamente.

**Cobertura atual**: 6 suítes de teste, 19 testes, 0 pendências (`it.todo`).

| Suíte | O que cobre |
|---|---|
| `components/__tests__/StyledText-test.js` | Renderização do componente `MonoText` |
| `components/__tests__/PropertyCard.test.tsx` | Renderização, toque no favorito (sem navegar), toque no card (navega pra `/details`) |
| `context/__tests__/AuthContext.test.tsx` | Estado inicial sem sessão, login com role correta, login inválido, logout |
| `context/__tests__/BookingContext.test.tsx` | Criar reserva válida, rejeitar `check_out <= check_in`, persistência com desconto Pix, persistência por usuário, cancelamento |
| `context/__tests__/FavoritesContext.test.tsx` | Adicionar/remover favorito, persistência por usuário |
| `services/__tests__/profileService.test.ts` | Confirma que a troca de role usa o RPC `set_own_role` e nunca um `UPDATE` direto |

Todo acesso ao Supabase nos testes é mockado (`jest.mock('@supabase/supabase-js', ...)` e o mock
oficial de `@react-native-async-storage/async-storage`) — nenhum teste bate em rede ou em banco real.

**Como executar**:
```powershell
npm test              # roda a suíte inteira uma vez
npm run test:watch    # modo watch, reroda ao salvar
```

**Lacuna conhecida**: `services/` (fora `profileService`) ainda não tem testes próprios — os outros
6 arquivos de service não foram cobertos nesta fase (não foi pedido explicitamente).

---

## 4. Pipeline de CI/CD

`.github/workflows/ci.yml`, executa em todo `push` e `pull_request`:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` — Node 20, com cache de `npm`
3. `npm ci` — instalação limpa a partir do `package-lock.json`
4. `npx tsc --noEmit` — type-check completo do projeto
5. `npm test -- --ci` — roda a suíte de testes em modo CI (não escreve snapshots novos silenciosamente; snapshot divergente = falha)

Não há, até o momento, um job de build/deploy automatizado (nem publicação em loja, nem build EAS
via CI) — o pipeline cobre só qualidade de código (tipos + testes).

---

## 5. Requisitos Funcionais (RF) — status real

*(ver aviso no topo do documento sobre a origem desta numeração)*

| ID | Requisito | Status | Onde |
|---|---|---|---|
| RF-001 | Buscar/explorar cabanas por categoria | ✅ Conectado ao Supabase | `app/(tabs)/index.tsx` → `propertyService.getProperties()` |
| RF-002 | Filtrar cabanas por preço e nível de isolamento | ✅ Conectado (filtro em sandbox, sobre dados reais) | `app/(tabs)/index.tsx` |
| RF-003 | Ver detalhes completos de uma cabana | ✅ Conectado ao Supabase | `app/details.tsx` → `propertyService.getPropertyById()` |
| RF-004 | Reservar uma cabana (datas, pagamento, disponibilidade) | ✅ Conectado ao Supabase | `app/details.tsx` → `bookingService.checkAvailability()` + `createBooking()`, desconto PIX 5% mantido |
| RF-005 | Autenticação de usuário (login com Google) | ⚠️ Implementado, mas **bloqueado para teste** | `app/login.tsx`, `app/oauth-callback.tsx`, `AuthContext` — funciona via Supabase Auth (PKCE), mas o Expo Go não completa o redirect no iOS; validação pendente em development build Android |
| RF-006 | Favoritar cabanas | ❌ Não conectado | `FavoritesContext` — 100% local (AsyncStorage), tabela `favorites` existe no banco mas não é usada |
| RF-007 | Anfitrião cadastrar e gerenciar suas cabanas | ✅ Conectado ao Supabase | `app/create-listing.tsx` (+ upload de imagem pro Storage), `app/my-cabins.tsx` |
| RF-008 | Mensagens entre hóspede e anfitrião | ❌ Não conectado | `app/(tabs)/messages.tsx` continua 100% mock local; `services/messageService.ts` existe e está pronto (inclusive assinatura Realtime), mas nenhuma tela o usa ainda |
| RF-009 | Avaliar uma estadia concluída | ✅ Implementado nesta fase | `app/review.tsx`, botão "Avaliar" em `app/(tabs)/bookings.tsx`, reviews reais exibidas em `app/details.tsx` |
| RF-010 | Painel administrativo (estatísticas, moderação) | ✅ Conectado nesta fase | `app/admin-dashboard.tsx` → `adminService` — estatísticas, aprovação de anúncios e denúncias reais; ranking de mais reservadas e gerenciador de destaques continuam ilustrativos (sem função de serviço correspondente) |

**Resumo**: 6 de 10 conectados de ponta a ponta, 1 implementado mas bloqueado por infraestrutura de
teste (não por código), 2 ainda não iniciados (favoritos, mensagens).

---

## 6. Requisitos Não Funcionais (RNF) — status real

*(ver aviso no topo do documento — lista inferida, sem fonte oficial encontrada no repositório)*

| ID | Requisito | Status | Evidência |
|---|---|---|---|
| RNF-001 | Segurança dos dados do usuário | ✅ Implementado, com uma ressalva conhecida | RLS habilitado em todas as tabelas; migração fechando escalação de privilégio via `profiles.role` (troca de role só via RPC `set_own_role`); segredos fora do versionamento (`.env` no `.gitignore`, `.env.example` documentado). Ressalva: PKCE usa `code_challenge_method=plain` em vez de `s256` por limitação do runtime RN/Hermes (não bloqueante, documentado em `CLAUDE.md`) |
| RNF-002 | Usabilidade (feedback claro de loading/erro/vazio) | ⚠️ Parcial | Implementado em todas as telas conectadas nesta fase (Explorar, Detalhes, Anfitrião, Avaliações, Admin); ausente nas telas ainda não conectadas (Mensagens, Notificações, Favoritos) |
| RNF-003 | Compatibilidade multiplataforma (iOS/Android) | ⚠️ Parcial | App roda em Expo (iOS/Android/Web) com New Architecture habilitada; porém o fluxo de login com Google só será validado em Android por ora — build iOS pendente por falta de conta Apple Developer Program |
| RNF-004 | Desempenho | ⚠️ Não medido formalmente | Filtros da Explorar memoizados (`useMemo`); banco com índices (`gin`/`trgm` para busca textual, `btree` para preço/status/isolamento) — mas sem testes de carga ou medição de tempo de resposta nesta fase |
| RNF-005 | Disponibilidade / resiliência a falhas do backend | ✅ Implementado | Toda tela conectada ao Supabase tem fallback para dados locais (contexts) quando a query falha ou o usuário é o de desenvolvimento (`static-*`) — o app nunca fica bloqueado por indisponibilidade do backend |
| RNF-006 | Manutenibilidade | ✅ Implementado | Camada `services/` isolando acesso a dados; 19 testes automatizados; CI rodando type-check + testes a cada push/PR; `CLAUDE.md` mantido sincronizado com o código real a cada sessão |
| RNF-007 | Escalabilidade | ⚠️ Arquitetura permite, não testado | Backend gerenciado (Supabase/Postgres) desacoplado do cliente via `services/`; sem testes de carga/concorrência realizados |

---

## 7. Tecnologias em uso (real, a partir de `package.json`)

| Categoria | Tecnologia | Versão |
|---|---|---|
| Framework | Expo SDK | ~54.0.33 |
| Roteamento | expo-router (file-based) | ~6.0.23 |
| UI | React | 19.1.0 |
| UI | React Native | 0.81.5 |
| Linguagem | TypeScript (`strict: true`) | ~5.9.2 |
| Backend / BaaS | Supabase (`@supabase/supabase-js`) — Auth, Postgres, Storage, Realtime | ^2.105.4 |
| Autenticação | Supabase Auth (OAuth Google, fluxo PKCE) | — |
| Persistência local | `@react-native-async-storage/async-storage` (reservas/favoritos locais) | 2.2.0 |
| Persistência de sessão | `expo-secure-store` | ~15.0.8 |
| Ícones | `lucide-react-native` (telas novas) + `@expo/vector-icons` (tab bar/login) | ^1.7.0 / ^15.0.3 |
| Seleção de imagem | `expo-image-picker` | ~17.0.11 |
| Navegador in-app / deep link | `expo-web-browser`, `expo-linking` | ~15.0.11 / ~8.0.11 |
| Animações/gestos | `react-native-reanimated`, `react-native-worklets`, `react-native-screens`, `react-native-safe-area-context` | ~4.1.1 / 0.5.1 / ~4.16.0 / ~5.6.0 |
| Build nativo (dev/preview) | `expo-dev-client` + EAS Build | ~6.0.21 |
| Testes | `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` | 29.7.0 / 54.0.18 / 13.3.3 / ^29.5.9 |
| CI | GitHub Actions | — |
| Web (suporte, não é o foco do produto) | `react-native-web`, Metro bundler | ~0.21.0 |

**Removido da lista em relação a documentações antigas** (README/anteprojeto, se citavam):
`ngrok` — chegou a ser necessário num fluxo de OAuth anterior (túnel local), mas o fluxo atual usa
deep link nativo (`reservago://` em dev build, `exp://` no Expo Go) e não depende mais dele.
