-- ============================================================
-- FIX: auto-promoção pra admin via profiles_self_update
-- ============================================================
-- Achado: a policy "profiles_self_update" original (supabase/schema.sql,
-- linha 541) só checava `auth.uid() = id` (o usuário está editando a
-- própria linha), sem nenhum WITH CHECK. Isso permite que QUALQUER usuário
-- autenticado grave role='admin' na própria linha via um UPDATE comum
-- (ex.: chamando a REST API do Supabase direto com a anon key + o próprio
-- JWT, sem precisar nem passar pelo app) — uma escalação de privilégio real.
--
-- Isso não era explorável na prática até agora porque nada no app gravava
-- profiles.role de verdade (ver AuthContext.updateRole, corrigido na mesma
-- sessão que gerou esta migração). Agora que updateRole() grava mesmo,
-- precisa fechar essa brecha no banco.
--
-- Decisão de design: continua dando pra um usuário trocar a PRÓPRIA role
-- entre 'hospede' e 'anfitriao' (é o fluxo normal de app/select-role.tsx) —
-- só bloqueia a própria linha virar 'admin' por esse caminho. Promover
-- alguém a admin continua sendo uma operação manual no banco (é o que o
-- próprio schema.sql já documentava nos comentários do final, seção "DADOS
-- INICIAIS (seed)"), não existe hoje nenhuma policy que deixe um admin
-- promover OUTRO usuário via client — se isso for necessário no futuro,
-- precisa de uma function SECURITY DEFINER dedicada, não desta policy.
--
-- Como aplicar: cole no SQL Editor do painel do Supabase e rode uma vez.
-- ============================================================

DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role <> 'admin');

-- ============================================================
-- Depois de rodar isso no Supabase, supabase/schema.sql (a fonte da
-- verdade documentada no CLAUDE.md) também precisa ser atualizado pra
-- refletir essa policy nova - não fiz isso automaticamente nesta sessão
-- porque não foi pedido; avisar se quiserem que eu sincronize os dois.
-- ============================================================
