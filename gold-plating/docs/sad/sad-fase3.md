# SAD — Software Architecture Document
## ReservaGO · Fase 4 · Ciclo 3

**Versão:** 1.0
**Data:** 2026-06-03
**Autores:** Arthur Caixeta, Deusmair Júnior, Ian Couto
**Status:** Aprovado

---

## 1. Introdução

### 1.1 Propósito

Descrever a arquitetura de software do ReservaGO na Fase 4, cobrindo a evolução de uma arquitetura monolítica BaaS (Backend as a Service) para um modelo orientado a serviços em nuvem (Cloud-Native). Este documento serve como referência técnica para a equipe e como artefato de avaliação do Ciclo 3 — Mini Projeto Arquiteto Decisor.

### 1.2 Escopo

O SAD cobre:

- Visão de contexto, stakeholders e missão do sistema;
- Decomposição em containers (serviços) e suas responsabilidades;
- Modelo de dados das principais entidades;
- Decisões arquiteturais chave (com remissão aos ADRs);
- Visão de implantação (deployment) nos ambientes de desenvolvimento e produção;
- Aspectos de qualidade: segurança, performance e manutenibilidade.

### 1.3 Referências Cruzadas

| Documento | Localização |
|-----------|-------------|
| ADR 0001 — Estratégia de Nuvem | `/docs/adrs/0001-estrategia-nuvem.md` |
| ADR 0002 — Padrões de Resiliência | `/docs/adrs/0002-padrao-resiliencia.md` |
| ADR 0003 — Modelo de Comunicação | `/docs/adrs/0003-modelo-comunicacao.md` |
| Diagrama C4 de Containers (Mermaid) | `README.md` |

### 1.4 Referências Bibliográficas

- BASS, Len; CLEMENTS, Paul; KAZMAN, Rick. **Software Architecture in Practice**. 4. ed. Addison-Wesley, 2021.
- BROWN, Simon. **The C4 Model for Visualising Software Architecture**. c4model.com, 2018.
- EVANS, Eric. **Domain-Driven Design: Tackling Complexity in the Heart of Software**. Addison-Wesley, 2003.
- NEWMAN, Sam. **Building Microservices**. 2. ed. O'Reilly Media, 2021.
- RICHARDSON, Chris. **Microservices Patterns**. Manning Publications, 2018.
- NYGARD, Michael T. **Release It!**. 2. ed. Pragmatic Bookshelf, 2018.

---

## 2. Descrição do Sistema

### 2.1 Missão

Conectar viajantes a anfitriões de acomodações rurais e em contato com a natureza no Brasil, por meio de um aplicativo mobile com experiência integrada de descoberta, reserva e assistência por IA.

### 2.2 Problema de Domínio

O mercado de hospedagem rural brasileiro é fragmentado: sem plataforma digital consolidada, anfitriões dependem de WhatsApp e redes sociais para gestão de reservas, e viajantes não têm canal único de descoberta e comparação de experiências rurais. O ReservaGO resolve essa fragmentação com uma plataforma mobile dedicada.

### 2.3 Stakeholders

| Stakeholder | Interesse Arquitetural |
|-------------|----------------------|
| **Viajante** | Performance do app; confiabilidade de reservas; experiência de busca |
| **Anfitrião** | Integridade de dados; notificações em tempo real de novas reservas |
| **Equipe de Desenvolvimento** | Manutenibilidade; baixo overhead operacional; DX (Developer Experience) |
| **Coordenação Acadêmica** | Qualidade da documentação; aderência a padrões arquiteturais |

### 2.4 Funcionalidades Principais

- Autenticação via Google OAuth 2.0 (sem senha);
- Listagem e busca de propriedades com galeria de imagens;
- Criação, visualização e cancelamento de reservas com controle de disponibilidade;
- Notificações em tempo real de mudança de status de reserva;
- Agente conversacional (Google Gemini API) para assistência ao usuário.

---

## 3. Metas e Restrições Arquiteturais

### 3.1 Atributos de Qualidade (Quality Attribute Scenarios)

Bass, Clements e Kazman (2021) definem atributos de qualidade como propriedades mensuráveis do sistema que indicam o quão bem ele satisfaz os requisitos de seus stakeholders. Os cenários abaixo foram priorizados para o Ciclo 3:

| Atributo | Cenário | Meta / Solução |
|----------|---------|---------------|
| **Disponibilidade** | Gemini API indisponível por 30 min | App permanece funcional para reservas; chat exibe fallback via Circuit Breaker (ADR 0002) |
| **Escalabilidade** | Pico de acessos em feriados nacionais | Escala horizontal automática via Edge Functions serverless; pgBouncer gerencia conexões (ADR 0001) |
| **Segurança** | Usuário tenta acessar reservas de outro usuário | Row Level Security (RLS) no PostgreSQL bloqueia acesso no nível do banco |
| **Manutenibilidade** | Novo desenvolvedor precisa entender a codebase | Separação clara de responsabilidades + ADRs + SAD como fonte de verdade arquitetural |
| **Usabilidade (Performance Percebida)** | Resposta do agente IA percebida como lenta | SSE streaming exibe tokens progressivamente, reduzindo latência percebida (ADR 0003) |

### 3.2 Restrições

| Tipo | Restrição |
|------|-----------|
| **Equipe** | 3 desenvolvedores; sem perfil DevOps ou SRE dedicado |
| **Tecnológica** | React Native / Expo (mobile); TypeScript; Supabase como plataforma de backend |
| **Orçamentária** | Uso de tiers gratuitos/freemium de todos os serviços em nuvem |
| **Acadêmica** | Repositório público; documentação em `.md` ou `.pdf`; sem `.docx` ou `.pptx` |
| **Temporal** | Ciclo de desenvolvimento semestral; entrega única ao final do ciclo |

---

## 4. Visão Arquitetural

### 4.1 Estilo Arquitetural Adotado

O ReservaGO Fase 4 adota **arquitetura orientada a serviços em escala reduzida**, com características de microsserviços aplicadas nos serviços de borda (Edge Functions). Os princípios norteadores são:

- **Separação de responsabilidades por bounded context** (EVANS, 2003): Auth, Reservas e Agente IA são contextos delimitados com responsabilidades não sobrepostas;
- **API-first:** toda comunicação entre app e serviços passa pelo API Gateway; nenhum serviço é acessado diretamente pelo cliente;
- **Stateless services:** Edge Functions não mantêm estado entre invocações — toda informação de contexto é carregada no JWT ou no payload da requisição.

### 4.2 Visão de Contexto (C4 Nível 1)

O sistema interage com:
- **2 perfis de usuário:** Viajante (busca e reserva) e Anfitrião (gestão de propriedades);
- **2 sistemas externos:** Google Identity (autenticação delegada) e Google Gemini API (IA);
- **1 plataforma PaaS:** Supabase (banco, auth, storage, realtime, edge functions).

O App Móvel é o único ponto de contato do usuário com o sistema.

### 4.3 Visão de Containers (C4 Nível 2)

O diagrama interativo em sintaxe Mermaid está disponível no `README.md` do repositório. A descrição textual dos containers segue abaixo.

#### Containers e Responsabilidades

| Container | Tecnologia | Responsabilidade Principal |
|-----------|-----------|---------------------------|
| **App Móvel** | React Native / Expo SDK 51 / TypeScript | Interface do usuário; estado local (Context API); chamadas de serviço via SDK Supabase |
| **API Gateway** | Supabase Edge Functions (Deno/TS) | Ponto único de entrada; validação JWT; roteamento; rate limiting |
| **Serviço de Autenticação** | Supabase Auth + Google OAuth 2.0 | Emissão e validação de tokens JWT; gestão de sessões; fluxo PKCE |
| **Serviço de Reservas** | TypeScript / PostgREST / RLS | Verificação de disponibilidade; CRUD de reservas; gestão de propriedades e imagens |
| **Agente IA** | Google Gemini 1.5 Flash / `lib/agent.ts` | Processamento de mensagens de chat; respostas contextuais sobre reservas |
| **Banco de Dados** | PostgreSQL 15 via Supabase | Persistência relacional; Row Level Security; LISTEN/NOTIFY para Realtime |
| **Armazenamento de Mídia** | Supabase Storage (S3-compatible) | Imagens de propriedades; políticas de acesso por bucket |

### 4.4 Modelo de Dados

Principais entidades e seus relacionamentos:

```
users
├── id            UUID         PK
├── email         TEXT         NOT NULL UNIQUE
├── name          TEXT
└── avatar_url    TEXT

properties
├── id            UUID         PK
├── owner_id      UUID         FK → users.id
├── name          TEXT         NOT NULL
├── description   TEXT
├── location      TEXT
├── price_night   NUMERIC
└── created_at    TIMESTAMPTZ

property_images
├── id            UUID         PK
├── property_id   UUID         FK → properties.id
└── url           TEXT         NOT NULL  → Supabase Storage

bookings
├── id            UUID         PK
├── property_id   UUID         FK → properties.id
├── guest_id      UUID         FK → users.id
├── check_in      DATE         NOT NULL
├── check_out     DATE         NOT NULL
├── status        ENUM         PENDING | CONFIRMED | CANCELLED
├── total_price   NUMERIC
└── created_at    TIMESTAMPTZ

reviews
├── id            UUID         PK
├── booking_id    UUID         FK → bookings.id
├── rating        INT          CHECK (1..5)
└── comment       TEXT
```

**Integridade garantida por:** chaves estrangeiras, CHECK constraints e Row Level Security (RLS) — políticas que restringem acesso por linha com base no `auth.uid()` do usuário autenticado.

---

## 5. Decisões Arquiteturais Chave

| # | Decisão | ADR | Impacto |
|---|---------|-----|---------|
| 1 | PaaS (Supabase + Expo EAS) como estratégia de nuvem | [ADR 0001](../adrs/0001-estrategia-nuvem.md) | Elimina overhead de infra; escalabilidade horizontal automática |
| 2 | API Gateway + Circuit Breaker + Retry com Backoff | [ADR 0002](../adrs/0002-padrao-resiliencia.md) | Isola falhas de serviços externos; centraliza autenticação |
| 3 | REST síncrono + WebSocket + SSE streaming | [ADR 0003](../adrs/0003-modelo-comunicacao.md) | Consistência para transações; eficiência para notificações; UX progressiva no chat |

---

## 6. Visão de Implantação

### 6.1 Ambiente de Desenvolvimento

```
Desenvolvedor (máquina local)
    └── Expo Go (dispositivo físico ou emulador Android/iOS)
         └── SDK Supabase → Supabase Cloud (projeto de staging)
                            ├── PostgreSQL (staging)
                            ├── Edge Functions (staging)
                            ├── Auth (staging)
                            └── Storage (staging)
```

Variáveis de ambiente gerenciadas via arquivo `.env` local (não versionado).

### 6.2 Ambiente de Produção

```
Usuário Final (iOS / Android)
    └── App distribuído via Expo EAS
         │   └── OTA Updates (sem aprovação de loja para atualizações JS)
         │
         └── Supabase Cloud (projeto de produção)
              ├── PostgreSQL 15
              │    └── pgBouncer (connection pooler — escala horizontal de conexões)
              ├── Edge Functions (serverless, Deno, auto-scale por demanda)
              ├── Supabase Auth (JWT + Google OAuth 2.0)
              ├── Supabase Realtime (WebSocket sobre PostgreSQL LISTEN/NOTIFY)
              └── Supabase Storage (S3-compatible)
                   │
                   └── Serviços Externos
                        ├── Google Identity (OAuth 2.0)
                        └── Google Gemini API (LLM — SSE streaming)
```

### 6.3 Estratégia de Deploy e Rollback

| Componente | Mecanismo de Deploy | Rollback |
|------------|-------------------|---------|
| App Mobile (JS bundle) | `eas update` — OTA sem submissão à loja | `eas update --channel production` apontando para bundle anterior |
| Edge Functions | `supabase functions deploy <nome>` | Redeployar versão anterior do arquivo `index.ts` |
| Schema do Banco | `supabase db push` (migrations versionadas em `/supabase/migrations`) | Migration de reversão explícita (`down.sql`) |

---

## 7. Aspectos de Qualidade

### 7.1 Segurança

| Mecanismo | Camada | Descrição |
|-----------|--------|-----------|
| **JWT Validation** | API Gateway | Todo request ao API Gateway valida o token antes de encaminhar ao serviço destino |
| **Row Level Security (RLS)** | Banco de Dados | Políticas PostgreSQL garantem que usuários acessam apenas seus próprios dados (`auth.uid()`) |
| **OAuth 2.0 com PKCE** | Autenticação | Fluxo sem exposição de `client_secret` no app mobile (IETF RFC 7636) |
| **API Key em Edge Functions** | Agente IA | `GEMINI_API_KEY` reside apenas nas Edge Functions — nunca exposta no bundle do app |
| **HTTPS obrigatório** | Transporte | Toda comunicação app ↔ Supabase usa TLS 1.2+ |

### 7.2 Performance

- **pgBouncer** gerencia pool de conexões PostgreSQL, suportando maior concorrência sem degradar o banco;
- **Lazy loading de imagens** via Expo Image com cache local — reduz requests redundantes e melhora tempo de carregamento da listagem;
- **SSE streaming** no Agente IA reduz latência *percebida*: usuário vê tokens em ~300 ms em vez de aguardar 3–5 s pela resposta completa;
- **Paginação em cursor** na listagem de propriedades — evita queries sem limite em tabelas grandes.

### 7.3 Manutenibilidade

- **Tipagem estrita TypeScript** em toda a codebase — reduz bugs de integração entre camadas;
- **Separação em camadas:** `lib/` (lógica de negócio e integrações), `components/` (UI reutilizável), `screens/` (navegação e composição);
- **ADRs como fonte de verdade** para decisões arquiteturais — facilita onboarding de novos membros e auditoria de decisões passadas;
- **`.gitignore` padronizado** para Expo/React Native — previne commit acidental de `.env`, `node_modules`, builds locais.

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| **BaaS** | Backend as a Service — plataforma que abstrai infraestrutura e provê serviços de backend prontos (auth, banco, storage) |
| **Bounded Context** | Limite explícito dentro do qual um modelo de domínio é consistente e coeso (EVANS, 2003) |
| **Circuit Breaker** | Padrão que "abre o circuito" após falhas consecutivas a um serviço externo, retornando fallback sem tentar a chamada |
| **Cold Start** | Latência de inicialização de uma função serverless que não estava em execução (worker inativo) |
| **Edge Function** | Função serverless executada próxima ao usuário, em runtime Deno (JavaScript/TypeScript) |
| **JWT** | JSON Web Token — padrão de token de autenticação stateless assinado digitalmente |
| **OTA** | Over-The-Air — atualização de app sem revisão da Apple App Store ou Google Play |
| **PaaS** | Platform as a Service — modelo de nuvem onde o provedor gerencia infraestrutura e plataforma; equipe gerencia app e dados |
| **pgBouncer** | Connection pooler para PostgreSQL — multiplexa múltiplas conexões de clientes em um pool menor de conexões reais |
| **PKCE** | Proof Key for Code Exchange — extensão do OAuth 2.0 para fluxos em clientes públicos (mobile apps) sem client_secret |
| **RLS** | Row Level Security — recurso do PostgreSQL para definir políticas de acesso por linha, baseadas no contexto do usuário |
| **SSE** | Server-Sent Events — protocolo HTTP para streaming unidirecional de dados do servidor para o cliente |
