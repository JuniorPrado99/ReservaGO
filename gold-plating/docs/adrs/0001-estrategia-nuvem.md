# ADR 0001: Estratégia de Nuvem e Escalabilidade

**Data:** 2026-06-03
**Status:** Aceito
**Deciders:** Arthur Caixeta, Deusmair Júnior, Ian Couto
**Contexto do Projeto:** ReservaGO — Fase 4 (Ciclo 3)

---

## Contexto

Na Fase 3 do ReservaGO, a arquitetura operava integralmente sobre o Supabase como BaaS (Backend as a Service), sem distinção explícita entre camadas de serviço. Com a evolução para o Ciclo 3, o projeto precisa adotar uma estratégia de nuvem que:

1. Suporte crescimento da base de usuários sem redesenho arquitetural;
2. Minimize o overhead operacional (equipe de 3 desenvolvedores, sem DevOps dedicado);
3. Permita separação de responsabilidades entre serviços (Auth, Reservas, Agente IA);
4. Viabilize entrega contínua do app mobile sem submissão manual às lojas a cada release.

O modelo de serviço de nuvem adotado determina quais responsabilidades a equipe retém versus quais são delegadas ao provedor — decisão com impacto direto em custo operacional, autonomia técnica e capacidade de escala (MELL; GRANCE, 2011).

---

## Decisão

**Adotar PaaS (Platform as a Service) como estratégia principal**, utilizando:

- **Supabase** (PaaS gerenciado) para: banco de dados PostgreSQL, autenticação (Auth + Google OAuth), armazenamento de mídia (Storage) e computação serverless (Edge Functions em runtime Deno);
- **Expo EAS — Expo Application Services** (PaaS mobile) para: build automatizado, distribuição OTA (Over-The-Air) e pipeline de CI/CD do aplicativo;
- **Escalabilidade horizontal** como estratégia padrão: o pool de conexões do banco é gerenciado via **pgBouncer** (embutido no Supabase), e as Edge Functions escalam automaticamente por demanda (modelo serverless, sem provisionamento de instâncias).

---

## Justificativa Teórica

### Modelo de Serviço em Nuvem

O NIST define três modelos fundamentais de serviço em nuvem (MELL; GRANCE, 2011):

| Modelo | Responsabilidade do cliente | Exemplo |
|--------|-----------------------------|---------|
| IaaS (Infrastructure as a Service) | SO, runtime, middleware, app, dados | AWS EC2, Google Compute Engine |
| **PaaS (Platform as a Service)** | **Aplicação e dados** | **Supabase, Heroku, Railway** |
| SaaS (Software as a Service) | Apenas configuração e uso | Gmail, Notion, Figma |

O PaaS foi escolhido porque **elimina a gestão de infraestrutura** (provisionamento de VMs, patching de sistema operacional, configuração de rede e load balancers) sem abrir mão do controle sobre lógica de negócio e dados — equilíbrio adequado para uma equipe pequena sem especialista em operações.

Bass, Clements e Kazman (2021) definem escalabilidade como a capacidade do sistema de suportar aumento de carga sem degradação proporcional de desempenho. Os autores distinguem dois mecanismos:

### Escalabilidade Horizontal vs. Vertical

- **Escalabilidade vertical (scale-up):** aumentar capacidade de uma única instância — mais CPU, mais RAM. Possui limite físico e frequentemente implica downtime durante o upgrade;
- **Escalabilidade horizontal (scale-out):** replicar instâncias e distribuir carga entre elas. Preferível para sistemas web por não ter teto físico definido, pela tolerância a falhas (uma instância cai, as demais absorvem o tráfego) e pelo custo gradual.

O modelo serverless das Supabase Edge Functions implementa escalabilidade horizontal de forma transparente: cada invocação é isolada em um novo worker, sem estado compartilhado entre execuções — alinhado ao princípio de *stateless services* descrito por Richardson (2018) como condição necessária para escala horizontal segura.

O **pgBouncer** (connection pooler integrado ao Supabase) resolve o gargalo clássico do PostgreSQL em ambientes com muitas conexões concorrentes: o banco mantém um número limitado de conexões reais, enquanto pgBouncer multiplexa centenas de conexões de clientes nessas slots, permitindo escala horizontal de consumers sem esgotar o limite de conexões do banco (NEWMAN, 2021).

---

## Consequências

### Positivas

- Zero overhead de infraestrutura: sem VMs, sem Docker para deploy, sem load balancers manuais;
- Escalabilidade horizontal automática nas Edge Functions (modelo serverless pay-per-use);
- SDK oficial com suporte nativo a React Native (`@supabase/supabase-js`), reduzindo a fricção de integração;
- Expo EAS elimina a necessidade de conta ativa de desenvolvedor Apple/Google para testes de equipe (builds via cloud);
- Supabase é open-source (licença Apache 2.0), possibilitando self-hosting futuro sem reescrita.

### Negativas / Trade-offs

- **Vendor lock-in:** a equipe passa a depender do Supabase como plataforma central. Migração futura para IaaS (AWS RDS + Lambda) exigiria refatoração de camada de dados, autenticação e funções de borda;
- **Cold start em Edge Functions:** funções serverless têm latência de inicialização (~200–500 ms) em períodos de baixa demanda — aceitável para este escopo, mas relevante para SLAs de produção com requisitos de P99 agressivos;
- **Controle limitado de runtime:** impossível personalizar a versão do Deno nas Edge Functions ou instalar dependências nativas que exijam código compilado.

---

## Alternativas Consideradas

### Alternativa 1 — IaaS: AWS EC2 + RDS + S3

**Descrição:** Provisionar VMs EC2 para API backend (Node.js/Express), banco RDS (PostgreSQL gerenciado), armazenamento S3 e ALB (Application Load Balancer) para roteamento.

**Motivo da rejeição:** Overhead operacional incompatível com o tamanho e escopo da equipe. Requer configuração de VPC, security groups, IAM roles, monitoramento com CloudWatch e gestão de certificados SSL — responsabilidades de SRE/DevOps que demandariam um perfil técnico adicional. O custo fixo mínimo (instâncias EC2 rodando continuamente) também é desvantajoso para um projeto com tráfego irregular.

### Alternativa 2 — SaaS puro: Firebase (Firestore + Auth + Storage + Cloud Functions)

**Descrição:** Substituir o Supabase por Firebase como plataforma de backend.

**Motivo da rejeição:** (1) Firestore é um banco NoSQL orientado a documentos — inadequado para o modelo relacional do domínio do ReservaGO, onde integridade referencial entre `users`, `properties` e `bookings` é requisito funcional; (2) vendor lock-in mais severo que o Supabase, que é open-source e auto-hospedável; (3) custo de egress de dados do Firebase tende a ser mais elevado em cenários de leitura intensa de mídia.

### Alternativa 3 — Serverless puro: AWS Lambda + API Gateway + Aurora Serverless

**Descrição:** Arquitetura totalmente serverless na AWS, com Lambda para lógica de negócio, API Gateway da AWS para roteamento e Aurora Serverless v2 para banco de dados.

**Motivo da rejeição:** Complexidade de configuração (IAM roles, VPC, cold starts do Lambda em VPC, configuração de Aurora) sem ganho proporcional para o volume atual do projeto. Mantida como opção de evolução natural para escala produtiva com equipe de engenharia maior.

---

## Referências

- MELL, Peter; GRANCE, Timothy. **The NIST Definition of Cloud Computing**. NIST Special Publication 800-145. Gaithersburg: NIST, 2011.
- BASS, Len; CLEMENTS, Paul; KAZMAN, Rick. **Software Architecture in Practice**. 4. ed. Boston: Addison-Wesley, 2021.
- RICHARDSON, Chris. **Microservices Patterns: With Examples in Java**. Shelter Island: Manning Publications, 2018.
- NEWMAN, Sam. **Building Microservices: Designing Fine-Grained Systems**. 2. ed. Sebastopol: O'Reilly Media, 2021.
