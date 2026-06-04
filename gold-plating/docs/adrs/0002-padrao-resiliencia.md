# ADR 0002: Padrões de Resiliência

**Data:** 2026-06-03
**Status:** Aceito
**Deciders:** Arthur Caixeta, Deusmair Júnior, Ian Couto
**Contexto do Projeto:** ReservaGO — Fase 4 (Ciclo 3)

---

## Contexto

O ReservaGO integra serviços externos críticos: **Google Gemini API** (agente IA) e **Google OAuth / Google Identity** (autenticação). Ambos são dependências de terceiros sobre as quais a equipe não tem controle de disponibilidade, latência ou quota de requests.

Sem estratégia de resiliência, uma falha temporária em qualquer desses serviços pode se propagar e tornar o app inteiro indisponível — efeito conhecido como *cascading failure* (NYGARD, 2018). Um serviço lento pode monopolizar threads de I/O; um serviço indisponível pode bloquear o usuário na tela de carregamento indefinidamente.

Além das dependências externas, o roteamento de requisições entre o app mobile e os serviços internos (Auth, Reservas, Agente IA) precisa de um ponto central de controle para validação, observabilidade e proteção contra sobrecarga.

---

## Decisão

Adotar os seguintes padrões de resiliência em conjunto:

1. **API Gateway** via Supabase Edge Functions — ponto único de entrada com validação de JWT e roteamento;
2. **Circuit Breaker** — implementado no cliente (app mobile, `lib/agent.ts`) para chamadas ao Gemini API;
3. **Retry com Exponential Backoff e Jitter** — para falhas transientes em chamadas REST ao Supabase e ao Gemini API.

---

## Justificativa Teórica

### Padrão 1 — API Gateway

O padrão API Gateway (RICHARDSON, 2018) define um único ponto de entrada para todos os clientes, responsável por:

- **Autenticação/autorização:** validação do token JWT antes de encaminhar a requisição ao serviço destino;
- **Roteamento:** direcionar a requisição ao serviço correto com base no path ou payload;
- **Rate limiting:** proteger serviços internos contra abuso ou pico não previsto;
- **Observabilidade centralizada:** logs e métricas de todas as chamadas em um único ponto.

No ReservaGO, as **Supabase Edge Functions** assumem o papel de API Gateway: toda requisição originada no app mobile passa primeiro pela função de roteamento, que valida o JWT (emitido pelo Supabase Auth) antes de encaminhar ao serviço destino. Isso evita que lógica de autenticação seja duplicada em cada serviço.

Richardson (2018) aponta que o API Gateway é especialmente valioso em arquiteturas *mobile-first*, pois permite adaptar a interface dos serviços backend às necessidades específicas do cliente mobile (agregação de dados, formatação de resposta) sem modificar os serviços individuais.

### Padrão 2 — Circuit Breaker

O Circuit Breaker (NYGARD, 2018; FOWLER, 2014) é um proxy que monitora chamadas a um serviço externo e "abre o circuito" após um limiar de falhas consecutivas, retornando imediatamente um *fallback* sem tentar chamar o serviço degradado:

```
                  falhas > threshold
  [CLOSED] ──────────────────────────► [OPEN]
     ▲                                    │
     │                                    │ timeout expirado
     │         sucesso na sonda           ▼
     └──────────────────────────── [HALF-OPEN]
```

- **CLOSED:** chamadas normais; falhas são contabilizadas;
- **OPEN:** após N falhas consecutivas, retorna fallback imediatamente (sem tentar a chamada);
- **HALF-OPEN:** após o timeout de recuperação, permite uma chamada de sonda; se bem-sucedida, volta a CLOSED; se falhar, volta a OPEN.

No ReservaGO, o Circuit Breaker é aplicado às chamadas ao **Gemini API** em `lib/agent.ts`:

- **Estado OPEN:** retorna mensagem de fallback ("Assistente temporariamente indisponível. Tente novamente em instantes.") sem bloquear o fluxo principal do app;
- **Benefício direto:** falha no Gemini API não impede o usuário de navegar, buscar propriedades ou realizar reservas.

Fowler (2014) destaca que o Circuit Breaker não é apenas um mecanismo de recuperação, mas também uma ferramenta de *observabilidade*: a transição para OPEN é um sinal explícito de que um serviço externo está com problemas, facilmente logável e monitorável.

### Padrão 3 — Retry com Exponential Backoff e Jitter

Falhas transientes — timeout de rede, sobrecarga momentânea, resposta 429 (rate limit) — não justificam Circuit Breaker e são melhor tratadas por **retry com backoff exponencial** (RICHARDSON, 2018):

```
Tentativa 1: aguarda 1s
Tentativa 2: aguarda 2s
Tentativa 3: aguarda 4s
Tentativa N: aguarda min(2^N, delay_máximo) + jitter
```

O **jitter** (variação aleatória somada ao intervalo) é essencial para evitar o *thundering herd problem* (AWS, 2015): sem ele, N clientes que falharam simultaneamente retentariam exatamente ao mesmo instante após o backoff, sobrecarregando o serviço no momento exato de sua recuperação. O jitter distribui as tentativas ao longo do tempo, suavizando o pico de carga.

Este padrão é especialmente relevante para o contexto mobile do ReservaGO, onde redes 3G/4G com qualidade variável são comuns no público-alvo (regiões rurais, áreas de ecoturismo).

---

## Consequências

### Positivas

- Falha no Gemini API não degrada o fluxo de reservas (isolamento via Circuit Breaker);
- API Gateway centraliza autenticação, eliminando código de validação de JWT duplicado nos serviços;
- Retry com jitter aumenta a taxa de sucesso em redes móveis instáveis sem sobrecarregar o servidor na recuperação;
- Fallback explícito melhora UX: usuário recebe mensagem clara em vez de timeout genérico ou crash.

### Negativas / Trade-offs

- **Estado no cliente:** o Circuit Breaker implementado no app mobile precisa gerenciar estado (contador de falhas, timestamp de abertura do circuito) — requer cuidado com persistência de estado entre navegações de tela;
- **Latência adicional:** validação JWT no API Gateway acrescenta ~10–30 ms por requisição — aceitável para o SLA atual;
- **Falsos positivos:** o Circuit Breaker pode abrir por falha de rede local do usuário (e não por falha do Gemini), exigindo calibração cuidadosa do threshold de falhas;
- **Complexidade de teste:** testar comportamento de retry e Circuit Breaker requer simulação de falhas externas (mocks de serviços).

---

## Alternativas Consideradas

### Alternativa 1 — Bulkhead (Anteparo)

**Descrição:** Isolar recursos (pools de conexões, threads) por serviço, de forma que a exaustão de recursos de um não afete os demais. Nygard (2018) usa a analogia dos compartimentos estanques de navios: um furo em um compartimento não afunda o navio inteiro.

**Motivo da rejeição:** Bulkhead é mais aplicável em arquiteturas server-side com pools de threads concorrentes (Java, .NET). No contexto de um app mobile com runtime JavaScript/TypeScript (single-threaded, event loop), o padrão não se aplica diretamente. A separação de responsabilidades entre os serviços (Auth, Reservas, IA) já provê o isolamento de falhas que o Bulkhead busca em nível de recursos.

### Alternativa 2 — Service Mesh (Istio / Linkerd)

**Descrição:** Proxy sidecar em cada serviço gerenciando resiliência (retry, circuit breaker, mTLS) de forma transparente à aplicação.

**Motivo da rejeição:** Requer orquestração Kubernetes e arquitetura de containers, incompatível com a estratégia PaaS serverless adotada no ADR 0001. O overhead operacional é injustificável para o escopo e tamanho do projeto.

### Alternativa 3 — Sem padrão de resiliência (fail-fast direto ao usuário)

**Descrição:** Propagar erros diretamente ao usuário sem tratamento intermediário.

**Motivo da rejeição:** Inaceitável para experiência do usuário. Falha no Gemini API exporia exceções cruas na tela de chat; falha transiente de rede abortaria operações de reserva sem possibilidade de recuperação automática — ambos os cenários prejudicam diretamente a percepção de qualidade do produto.

---

## Referências

- NYGARD, Michael T. **Release It!: Design and Deploy Production-Ready Software**. 2. ed. Raleigh: Pragmatic Bookshelf, 2018.
- FOWLER, Martin. **CircuitBreaker**. martinfowler.com, 2014. Disponível em: https://martinfowler.com/bliki/CircuitBreaker.html. Acesso em: jun. 2026.
- RICHARDSON, Chris. **Microservices Patterns: With Examples in Java**. Shelter Island: Manning Publications, 2018.
- NEWMAN, Sam. **Building Microservices: Designing Fine-Grained Systems**. 2. ed. Sebastopol: O'Reilly Media, 2021.
- AMAZON WEB SERVICES. **Exponential Backoff And Jitter**. AWS Architecture Blog, 2015. Disponível em: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter.
