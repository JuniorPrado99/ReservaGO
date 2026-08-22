# CLAUDE.md — ReservaGO

Este arquivo orienta o Claude Code (e qualquer sessão futura) sobre a estrutura real deste projeto. Ele foi gerado a partir da leitura direta do código-fonte em 2026-08-21 — não do README, que contém informações desatualizadas (ver seção "Divergências conhecidas").

## Visão geral

ReservaGO é um app mobile (Expo + React Native) de reserva de cabanas/hospedagens, tipo Airbnb, com três perfis de usuário: `hospede`, `anfitriao`, `admin`. TCC de 7º período.

**Estado real do projeto:** o front-end está funcional com dados estáticos/locais. O banco Supabase tem um schema completo e pronto (`supabase/schema.sql`), mas **nenhuma tela do app está de fato conectada a ele** — ver seção 8.

---

## 1. Stack e versões exatas

Lido de `package.json` / `app.json` / `tsconfig.json`:

| Item | Versão |
|---|---|
| Expo SDK | ~54.0.33 |
| expo-router | ~6.0.23 (file-based routing, `typedRoutes` habilitado em `app.json`) |
| React | 19.1.0 |
| React Native | 0.81.5 |
| React DOM | 19.1.0 |
| TypeScript | ~5.9.2 (`strict: true`, path alias `@/*` → raiz) |
| @supabase/supabase-js | ^2.105.4 |
| @react-native-async-storage/async-storage | 2.2.0 |
| react-native-reanimated | ~4.1.1 |
| react-native-worklets | 0.5.1 |
| lucide-react-native | ^1.7.0 (biblioteca de ícones usada nas telas novas) |
| @expo/vector-icons (FontAwesome) | ^15.0.3 (usado só na tab bar e no login) |
| expo-image-picker | ~17.0.11 |
| newArchEnabled | `true` (New Architecture do RN ligada em `app.json`) |
| scheme (deep link) | `reservago` |

Sem back-end próprio em Node — o único "backend" é o Supabase (projeto gerenciado, configurado via variáveis de ambiente).

---

## 2. Como rodar o projeto (PowerShell / Windows)

```powershell
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente (NÃO existe .env.example no repo — ver Divergências)
New-Item -Path .env -ItemType File
# Edite o .env manualmente com:
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Iniciar o Expo
npx expo start --clear

# 4. Rodar em plataforma específica (opcional, com o Metro já rodando)
npm run android
npm run ios
npm run web
```

> ⚠️ `npm test` **não funciona** hoje — não há script `test` no `package.json` nem a dependência `jest`. Ver Divergências.

> O login com Google OAuth mencionado no README (`ngrok http 127.0.0.1:8081`) não é necessário para rodar o app atualmente, porque o login real ainda não está implementado — ver seção 8.

---

## 3. Estrutura de pastas e papel de cada uma

```
ReservaGO/
├── app/                     # Rotas (Expo Router — cada arquivo = uma tela)
│   ├── _layout.tsx          # Layout raiz: monta os 5 Providers de contexto + Stack navigator
│   ├── (tabs)/               # Grupo de rotas da tab bar inferior
│   │   ├── _layout.tsx      # Configuração das 5 abas (Tabs.Screen)
│   │   ├── index.tsx        # Aba "Explorar" — home, busca, filtros, carrosséis por categoria
│   │   ├── favorites.tsx    # Aba "Favoritos"
│   │   ├── bookings.tsx     # Aba "Viagens" — reservas do usuário
│   │   ├── messages.tsx     # Aba "Mensagens" — chat (mock local, sem Supabase)
│   │   └── profile.tsx      # Aba "Perfil" — dashboard por role, editar perfil, privacidade/termos
│   ├── --/oauth-callback.tsx # Rota de callback OAuth (nome de pasta literal "--" — ver Divergências)
│   ├── login.tsx            # Tela de login (autenticação estática, ver seção 5)
│   ├── select-role.tsx      # Escolher hóspede/anfitrião (+ backdoor admin com 10 taps)
│   ├── details.tsx          # Detalhes da cabana + fluxo de reserva (datas → pagamento)
│   ├── create-listing.tsx   # Formulário de cadastro de cabana (anfitrião)
│   ├── my-cabins.tsx        # Painel do anfitrião — lista/edita/exclui cabanas
│   ├── admin-dashboard.tsx  # Painel admin — estatísticas, aprovações, denúncias, destaques (tudo mock)
│   ├── notifications.tsx    # Tela de notificações com filtro por tipo
│   ├── modal.tsx            # Modal placeholder do template padrão do Expo Router
│   ├── +not-found.tsx       # Tela 404
│   └── +html.tsx            # Configuração do HTML raiz (build web)
├── context/                 # Estado global via React Context (ver seção 5)
├── components/              # Componentes reutilizáveis
│   ├── PropertyCard.tsx     # Card de cabana (usado em index/favorites)
│   ├── ExternalLink.tsx     # Link que abre browser in-app (template Expo)
│   ├── useColorScheme(.web).ts / useClientOnlyValue(.web).ts  # Helpers do template Expo Router
│   └── __tests__/StyledText-test.js  # Teste quebrado — ver Divergências
├── constants/
│   ├── Colors.ts            # Paleta light/dark usada pela tab bar (tint = #2D5A27)
│   └── Properties.ts        # Lista de cabanas hardcoded, ÓRFÃ/não usada — ver Divergências
├── lib/
│   └── supabase.ts          # Client Supabase (auto-refresh e persistência de sessão DESLIGADOS)
├── supabase/
│   └── schema.sql           # Schema completo do banco (tabelas, triggers, RLS) — fonte da verdade do banco
├── assets/                  # Fontes e imagens (ícone, splash)
├── app.json, package.json, tsconfig.json
└── .env                     # Variáveis do Supabase (gitignored, não versionar)
```

---

## 4. Contexts existentes (`context/`)

Todos são providers React puros, montados em `app/_layout.tsx` nesta ordem: `AuthProvider > BookingProvider > FavoritesProvider > NotificationProvider > ListingProvider`.

| Context | O que gerencia | Persistência | Conectado ao Supabase? |
|---|---|---|---|
| `AuthContext.tsx` | Login/logout, `user` atual, troca de role (`updateRole`), exclusão de conta | Só em memória (`useState`) — some ao recarregar o app | **Não.** 3 usuários hardcoded (`admin@reservago.com`, `hospede@reservago.com`, `anfitriao@reservago.com`, senha `1234` para todos) |
| `BookingContext.tsx` | Lista de reservas do usuário logado (`addBooking`, `cancelBooking`) | `AsyncStorage`, chave `@reservago:bookings:<userId>` | Não |
| `FavoritesContext.tsx` | IDs de cabanas favoritadas (`toggleFavorite`) | `AsyncStorage`, chave `@reservago:favorites:<userId>` | Não |
| `ListingContext.tsx` | Catálogo de cabanas (`listings`/`allProperties`, `addListing`, `removeListing`, `updateListing`) | Só em memória — 8 cabanas hardcoded em `INITIAL_PROPERTIES`, resetam ao recarregar | Não |
| `NotificationContext.tsx` | Notificações do usuário (`markAsRead`, `markAllAsRead`, `addNotification`) | Só em memória — 8 notificações hardcoded | Não |

---

## 5. Banco de dados (`supabase/schema.sql`)

### Tabelas

| Tabela | Papel |
|---|---|
| `profiles` | Extensão de `auth.users` (nome, email, avatar, `role`, bio, interesses, soft-delete via `deleted_at`) |
| `properties` | Cabanas anunciadas (título, descrição, localização, preço, `isolation_level`, categoria/subcategoria, imagens, amenidades, rating, status de moderação `cabin_status`) |
| `bookings` | Reservas (check-in/check-out, `nights` gerado automaticamente, forma de pagamento, desconto PIX, status) |
| `favorites` | Relação usuário ↔ propriedade favoritada (unique) |
| `reviews` | Avaliações (nota 1–5, vinculada a uma `booking`, unique por `booking_id + author_id`) |
| `conversations` / `messages` | Chat entre hóspede e anfitrião |
| `notifications` | Notificações por usuário, com referências opcionais a `property/booking/message` |
| `reports` | Denúncias (de propriedade e/ou usuário), com status de moderação |

### Enums

`user_role` (hospede/anfitriao/admin), `booking_status` (reservada/realizada/cancelada), `pay_method` (pix/card), `notification_type` (reserva/mensagem/promocao/aviso), `isolation_level` (urbano/semi/isolado/extremo), `report_status` (pendente/em_analise/resolvido/arquivado), `cabin_status` (ativo/pendente/suspenso/inativo).

### Triggers e funções

- `handle_new_user()` → cria `profiles` automaticamente ao criar usuário em `auth.users`.
- `update_updated_at()` → atualiza `updated_at` em `profiles`, `properties`, `bookings`.
- `update_property_bookings_count()` → recalcula `properties.bookings_count` a cada mudança em `bookings`.
- `update_property_rating()` → recalcula `rating`/`reviews_count` de `properties` a cada mudança em `reviews`.
- `update_conversation_last_message()` → atualiza `last_message`/`last_message_at` da conversa a cada nova mensagem.
- `create_notification(...)` → função auxiliar genérica para inserir notificações.
- `notify_host_on_booking()` → notifica anfitrião (nova reserva) e ambas as partes (cancelamento).
- `notify_on_message()` → notifica o destinatário de uma nova mensagem.
- `notify_admins_on_report()` → notifica todos os admins ao criar uma denúncia.
- `handle_report_resolution()` → notifica o anfitrião quando uma denúncia sobre sua propriedade é resolvida.
- `get_unread_notifications_count(p_user_id)`, `mark_all_notifications_read(p_user_id)`, `is_property_available(...)` → funções auxiliares de uso direto pelo app (ainda não chamadas no código).

### RLS

RLS habilitado em todas as tabelas. Padrão geral: leitura pública restrita a dados "ativos"/próprios; escrita restrita ao dono do recurso; admin com acesso amplo via checagem de `profiles.role = 'admin'`. Buckets de Storage: `avatars` e `properties` (públicos).

Realtime habilitado para `messages`, `notifications`, `bookings`.

---

## 6. Convenções de nomenclatura observadas no código

- **Arquivos de tela**: `kebab-case.tsx` (`create-listing.tsx`, `my-cabins.tsx`, `admin-dashboard.tsx`); telas de tab em `app/(tabs)/` usam nome simples (`index`, `bookings`).
- **Componentes/Contexts**: `PascalCase.tsx` (`PropertyCard.tsx`, `AuthContext.tsx`).
- **Hooks customizados**: `useX` exportado junto do respectivo Context (`useAuth`, `useListings`, `useBookings`, `useFavorites`, `useNotifications`).
- **Estilos**: sempre `StyleSheet.create` no fim do arquivo, objeto chamado `styles`.
- **Cor de marca**: verde `#2D5A27` usado direto em várias telas (não centralizado em `constants/Colors.ts` de forma consistente — só a tab bar usa o arquivo de constantes).
- **Strings/dados de negócio**: em português (`'reservada'`, `'hospede'`, `'anfitriao'`), consistente entre schema SQL e front-end.
- **IDs mock**: prefixo por categoria nos dados estáticos de `ListingContext` (`p1`/`p2`... para praia, `c1`.. para campo, `w1`.. para cachoeira, "w" de waterfall/cachoeira).
- **AsyncStorage**: chaves padronizadas como `` `@reservago:<recurso>:<userId>` ``.

---

## 7. Quais telas já usam Supabase e quais ainda usam dados estáticos

| Tela/arquivo | Usa Supabase? | Fonte real dos dados |
|---|---|---|
| `app/--/oauth-callback.tsx` | **Sim** — único arquivo do app que importa `lib/supabase.ts` (`supabase.auth.exchangeCodeForSession`) | — |
| `app/login.tsx` | Não | `AuthContext` (lista `STATIC_USERS` hardcoded) |
| `app/select-role.tsx` | Não | `AuthContext.updateRole` (memória) |
| `app/(tabs)/index.tsx` | Não | `ListingContext.allProperties` (memória) |
| `app/(tabs)/favorites.tsx` | Não | `FavoritesContext` (AsyncStorage) + `ListingContext` |
| `app/(tabs)/bookings.tsx` | Não | `BookingContext` (AsyncStorage) + `ListingContext` |
| `app/(tabs)/messages.tsx` | Não | Estado local do componente (`INITIAL_CHATS` hardcoded, chat simulado com timeout) |
| `app/(tabs)/profile.tsx` | Não | `AuthContext` + dados hardcoded (`PAST_TRIPS`, estatísticas fixas 4.9/12/2023) |
| `app/details.tsx` | Não | Parâmetros de rota + `BookingContext.addBooking`; reviews (`REVIEWS`), anfitrião e comodidades (`AMENITIES`) hardcoded |
| `app/create-listing.tsx` | Não | `ListingContext.addListing` (memória, não persiste) |
| `app/my-cabins.tsx` | Não | `ListingContext.listings` |
| `app/admin-dashboard.tsx` | Não | Tudo mock local (`stats`, `pendingCabins`, `topCabins`, `reports`) — nenhum botão de ação tem efeito real |
| `app/notifications.tsx` | Não | `NotificationContext` (memória) |

**Resumo:** o Supabase está configurado (`lib/supabase.ts`) e o schema está pronto, mas **0 telas de fato leem/escrevem nas tabelas do banco**. Todo o app roda hoje sobre dados estáticos ou `AsyncStorage` local.

---

## 8. Divergências e inconsistências encontradas (ver também a mensagem de resumo enviada ao usuário)

Estes pontos devem ser considerados antes de qualquer nova implementação nesta área, para não repetir os mesmos problemas:

1. **README desatualizado**: descreve login real via Google OAuth + Supabase Auth, mas `AuthContext.tsx` é 100% estático.
2. **Tabela `listings` citada no README não existe** — o schema real chama essa tabela de `properties`.
3. **Rota de callback OAuth inconsistente**: pasta `app/--/` (nome literal `--`) gera a rota `/--/oauth-callback`, mas o fluxo esperado (README) é `reservago://oauth-callback`. Se o login Google for reativado, o deep link não vai bater com o callback.
4. **`constants/Properties.ts` é código morto**: define uma lista `PROPERTIES` que não é importada por nenhuma tela; a lista realmente usada é `INITIAL_PROPERTIES` dentro de `context/ListingContext.tsx`, com valores de `isolationLevel` diferentes (`"Alto"/"Médio"` vs. o enum real do banco `urbano|semi|isolado|extremo`).
5. **`app/my-cabins.tsx` lê `cabin.bookingsCount`**, mas a interface `Listing` (`ListingContext.tsx`) só tem o campo `bookings` — portanto "Ganhos estimados" e "Reservas ativas" no painel do anfitrião sempre exibem 0.
6. **`app/details.tsx` chama `addBooking(id, { ..., hostId })`**, mas o tipo do segundo parâmetro de `addBooking` em `BookingContext.tsx` não declara `hostId` — incompatibilidade de tipos.
7. **`npm test` não funciona**: não há script `test` no `package.json` nem a dependência `jest`/`jest-expo`. Além disso, `components/__tests__/StyledText-test.js` importa `../StyledText`, arquivo que não existe em `components/`.
8. **`.env.example` não existe** no repositório, apesar do README instruir `cp .env.example .env`.
9. **Reorganização de rotas em andamento e não commitada**: `git status` mostra `bookings.tsx`, `details.tsx`, `favorites.tsx`, `index.tsx`, `messages.tsx`, `profile.tsx` deletados na raiz e recriados/modificados dentro de `app/(tabs)/` (mais `app/details.tsx`) — provável migração de arquivos soltos para dentro de `app/`.
10. **PKCE cai em `code_challenge_method=plain` em vez de `s256`** (warning no console: `WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.`). Causa exata, conferida em `node_modules/@supabase/auth-js/src/lib/helpers.ts` (`generatePKCEChallenge`): o SDK checa `typeof crypto.subtle !== 'undefined'` pra decidir entre `s256` e `plain`; o runtime do Hermes/React Native não expõe `crypto.subtle` (WebCrypto), então sempre cai em `plain`. **`react-native-get-random-values` não resolve** (só faz polyfill de `crypto.getRandomValues`, não de `crypto.subtle`). **`expo-crypto` sozinho também não resolve** — ele expõe uma API própria (`Crypto.digestStringAsync`), não um polyfill de `crypto.subtle`/`SubtleCrypto`; resolver de verdade exigiria uma lib que polyfille `crypto.subtle` (ex.: `react-native-quick-crypto`) ou um adapter manual ligando `expo-crypto` a `global.crypto.subtle`. **Não é bloqueante**: `plain` é um método válido do PKCE (RFC 7636) e o servidor do Supabase aceita — só é uma proteção mais fraca contra interceptação da URL de autorização do que `s256` seria.

## 9. REGRAS PERMANENTES para todas as sessões neste projeto

1. Nunca altere arquivos que eu não pedi explicitamente.
2. Sempre me mostre o plano antes de escrever código.
3. Sempre me entregue arquivos completos, prontos para colar, nunca trechos soltos.
4. Sempre indique o caminho exato de cada arquivo.
5. Sempre me diga quais comandos rodar no PowerShell (Windows), na ordem.
6. Nunca invente nomes de tabelas ou colunas — confira sempre no `supabase/schema.sql`.
7. Se algo estiver ambíguo, pergunte antes de assumir.
8. Responda sempre em português.
