# ADR 0003: Modelo de Comunicação

**Data:** 2026-06-03
**Status:** Aceito
**Deciders:** Arthur Caixeta, Deusmair Júnior, Ian Couto
**Contexto do Projeto:** ReservaGO — Fase 4 (Ciclo 3)

---

## Contexto

Com a separação de responsabilidades em serviços distintos (Auth, Reservas, Agente IA), o ReservaGO precisa definir como o app mobile e esses serviços se comunicam. As opções fundamentais são:

- **Comunicação síncrona:** o chamador envia a requisição e aguarda a resposta antes de prosseguir (REST/HTTP, gRPC, GraphQL);
- **Comunicação assíncrona:** o chamador envia uma mensagem e não bloqueia aguardando resposta — o resultado chega em momento futuro via callback, evento ou stream (message queues, WebSockets, Server-Sent Events).

A escolha do modelo impacta diretamente: latência percebida, consistência de dados, acoplamento entre serviços, complexidade de implementação e experiência do usuário final (HOHPE; WOOLF, 2003).

Não existe um modelo universalmente superior — a decisão deve ser tomada por caso de uso, avaliando o perfil de cada operação do sistema.

---

## Decisão

Adotar **modelo híbrido** com três protocolos distintos, cada um mapeado ao perfil da operação:

| Protocolo | Modelo | Operações mapeadas |
|-----------|--------|--------------------|
| REST / HTTPS | Síncrono | Autenticação, criação/cancelamento de reservas, listagem de propriedades |
| WebSocket — Supabase Realtime | Assíncrono (event-driven) | Notificações de mudança de status de reserva |
| Server-Sent Events (SSE) | Assíncrono (streaming unidirecional) | Respostas do Agente IA (Gemini API) |

---

## Justificativa Teórica

### Comunicação Síncrona — REST/HTTP para Operações Transacionais

REST (Representational State Transfer) é o estilo arquitetural predominante para APIs web, definido por Fielding (2000) com base em seis restrições, sendo *statelessness* a mais relevante: cada requisição carrega toda a informação necessária para ser processada, sem dependência de estado de sessão no servidor.

Em operações transacionais — onde o resultado da operação precisa ser conhecido **imediatamente** pelo cliente para determinar o próximo estado do fluxo — a comunicação síncrona é a escolha natural (RICHARDSON, 2018):

- **Autenticação:** o token JWT precisa ser obtido antes de qualquer operação subsequente — a sequência é estritamente bloqueante;
- **Criação de reserva:** o app precisa saber imediatamente se a reserva foi confirmada ou rejeitada (indisponibilidade de datas) — a consistência forte é requisito funcional;
- **Listagem de propriedades:** dados paginados consumidos diretamente pela UI — padrão request-response claro.

Richardson (2018) recomenda REST síncrono para operações com **consistência forte**: onde o resultado precisa ser conhecido antes de o sistema avançar para o próximo estado, e onde uma resposta de erro deve interromper o fluxo do usuário.

### Comunicação Assíncrona — WebSocket para Notificações em Tempo Real

Para notificações de mudança de status de reserva (ex.: anfitrião aceita ou rejeita uma reserva pendente), o modelo síncrono seria ineficiente: o app teria de fazer **polling** constante ("verificar a cada N segundos se o status mudou"), desperdiçando bateria, banda e conexões em dispositivos móveis — problema crítico para o público-alvo em regiões rurais com planos de dados limitados.

O **Supabase Realtime** implementa um canal WebSocket sobre **PostgreSQL LISTEN/NOTIFY**: quando uma linha na tabela `bookings` é atualizada (ex.: `status` muda de `PENDING` para `CONFIRMED`), o banco emite um evento via `NOTIFY` que é propagado em tempo real para todos os clientes WebSocket subscritos ao canal correspondente (SUPABASE, 2024).

Hohpe e Woolf (2003) em *Enterprise Integration Patterns* descrevem esse padrão como **Event-Driven Consumer**: o consumidor reage a eventos produzidos pelo sistema sem interrogação ativa. Os autores contrapõem a dois antipadrões: *Polling Consumer* (verificação periódica — ineficiente) e *Scheduled Consumer* (verificação temporizada — com delay intrínseco).

### Comunicação Assíncrona — SSE para o Agente IA

O Google Gemini API suporta resposta em **streaming via Server-Sent Events (SSE)**: em vez de aguardar a geração completa da resposta do LLM (~2–5 segundos), o app recebe tokens incrementais e os exibe progressivamente — padrão de UX consolidado por assistentes como ChatGPT e Claude.

O SSE é um protocolo HTTP unidirecional (servidor → cliente) padronizado pelo W3C, mais simples que WebSocket para fluxos unidirecionais: usa uma conexão HTTP comum com o header `Content-Type: text/event-stream`, sem necessidade de handshake de upgrade de protocolo.

Isso transforma a comunicação com o agente de **síncrona-bloqueante** (aguardar 4 segundos em tela congelada) para **assíncrona-progressiva** (exibir tokens à medida que chegam), reduzindo dramaticamente a latência *percebida* pelo usuário — mesmo que a latência real seja a mesma (FOWLER, 2002).

### Mapeamento Completo de Trade-offs

| Operação | Protocolo | Consistência | Latência percebida | Motivo da escolha |
|----------|-----------|-------------|-------------------|------------------|
| Login / OAuth | REST síncrono | Forte | Alta (aceitável) | Token necessário antes de qualquer operação |
| Criação de reserva | REST síncrono | Forte | Alta (aceitável) | Confirmação imediata de disponibilidade é requisito |
| Cancelamento de reserva | REST síncrono | Forte | Alta (aceitável) | Transação com rollback em caso de falha |
| Listagem de propriedades | REST síncrono | Eventual (ok) | Baixa | Request-response simples, dados paginados |
| Notificação de status | WebSocket (Realtime) | Eventual | Muito baixa | Evita polling; eficiência de bateria |
| Chat com Agente IA | SSE streaming | N/A | Muito baixa (progressiva) | UX progressiva; unidirecional suficiente |

---

## Consequências

### Positivas

- REST síncrono garante consistência forte para operações de negócio críticas sem complexidade adicional;
- WebSocket elimina polling de notificações, reduzindo consumo de banda e bateria em dispositivos móveis;
- SSE no Agente IA melhora significativamente a UX do chat sem a complexidade bidirecional do WebSocket;
- Supabase provê infraestrutura de WebSocket e Realtime gerenciada — sem necessidade de servidor de WebSocket próprio ou broker de mensagens.

### Negativas / Trade-offs

- **Acoplamento temporal (REST síncrono):** se o Serviço de Reservas estiver lento, o app bloqueia aguardando resposta — mitigado pelo Circuit Breaker e retry com backoff definidos no ADR 0002;
- **Gestão de reconexão (WebSocket):** o app precisa implementar lógica de reconnect automático ao Supabase Realtime em caso de perda de conectividade — comum em redes móveis com cobertura instável;
- **Consistência eventual nas notificações:** em caso de desconexão do WebSocket, o app pode perder eventos e precisará reconciliar o estado ao reconectar (consulta REST ao estado atual da reserva como fallback);
- **Três protocolos distintos:** exige que a equipe compreenda e mantenha três modelos de comunicação — custo de complexidade cognitiva compensado pelos benefícios específicos de cada modelo.

---

## Alternativas Consideradas

### Alternativa 1 — Comunicação Assíncrona Total via Message Queue (RabbitMQ / AWS SQS)

**Descrição:** Toda comunicação passa por filas de mensagens. Serviços produzem eventos em tópicos; consumers processam de forma assíncrona e independente.

**Motivo da rejeição:** (1) A maioria das operações do ReservaGO requer resposta imediata — reservas e autenticação são estritamente síncronas por natureza; filas introduziriam latência artificial sem benefício; (2) requer infraestrutura adicional de broker de mensagens incompatível com a estratégia PaaS do ADR 0001; (3) a complexidade de garantias de entrega (idempotência, dead-letter queues, ordenação de mensagens) é injustificável para o escopo do projeto.

### Alternativa 2 — GraphQL + Subscriptions

**Descrição:** GraphQL para queries e mutations síncronos, com GraphQL Subscriptions (via WebSocket) para dados em tempo real, substituindo REST e Supabase Realtime.

**Motivo da rejeição:** (1) Supabase provê REST via PostgREST e Realtime via WebSocket nativamente — usar GraphQL exigiria um servidor Apollo adicional não suportado pela plataforma; (2) para o volume de endpoints do ReservaGO, o benefício do GraphQL (evitar over/under-fetching) não justifica a curva de aprendizagem e a complexidade adicional de setup; (3) o SDK `@supabase/supabase-js` já abstrai eficientemente o consumo REST e Realtime.

### Alternativa 3 — gRPC para Comunicação Inter-Serviços

**Descrição:** Comunicação binária com Protocol Buffers entre serviços, mais eficiente que REST para alto volume de chamadas inter-serviços.

**Motivo da rejeição:** (1) Suporte a gRPC em browsers e React Native é limitado (requer proxy gRPC-Web); (2) Supabase Edge Functions usam runtime Deno com suporte HTTP/1.1 — gRPC requer HTTP/2 com suporte a trailers, não disponível neste runtime; (3) o volume de dados e o número de chamadas inter-serviços do ReservaGO não justificam a eficiência binária do gRPC.

---

## Referências

- HOHPE, Gregor; WOOLF, Bobby. **Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions**. Boston: Addison-Wesley, 2003.
- FIELDING, Roy Thomas. **Architectural Styles and the Design of Network-Based Software Architectures**. Dissertação de Doutorado — University of California, Irvine, 2000.
- RICHARDSON, Chris. **Microservices Patterns: With Examples in Java**. Shelter Island: Manning Publications, 2018.
- FOWLER, Martin. **Patterns of Enterprise Application Architecture**. Boston: Addison-Wesley, 2002.
- SUPABASE. **Realtime Documentation**. Disponível em: https://supabase.com/docs/guides/realtime. Acesso em: jun. 2026.
- W3C. **Server-Sent Events**. W3C Recommendation. Disponível em: https://www.w3.org/TR/eventsource. Acesso em: jun. 2026.
