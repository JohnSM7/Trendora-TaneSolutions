-- ============================================================================
-- Seed de desarrollo
-- ============================================================================
-- Para probar localmente: supabase db reset (carga migrations + seed)
-- ============================================================================

-- NOTA: este seed asume que has creado un usuario test con email
-- 'demo@tane.solutions' vía Supabase Studio o Auth API antes de correr el seed.

do $$
declare
  demo_user_id uuid;
  demo_org_id uuid;
  demo_brand_kit_id uuid;
begin
  select id into demo_user_id from auth.users where email = 'demo@tane.solutions' limit 1;

  if demo_user_id is null then
    raise notice 'Usuario demo no existe. Crea uno con email demo@tane.solutions y vuelve a ejecutar seed.';
    return;
  end if;

  -- Org demo: una pizzería
  insert into organizations (name, slug, vertical, plan)
  values ('Pizzería La Strada', 'la-strada', 'restaurante', 'pro')
  returning id into demo_org_id;

  insert into memberships (org_id, user_id, role, accepted_at)
  values (demo_org_id, demo_user_id, 'owner', now());

  -- Brand kit
  insert into brand_kits (
    org_id, name, is_default, voice_prompt,
    tone, do_say, do_not_say,
    primary_color, accent_color, default_cta
  ) values (
    demo_org_id,
    'La Strada — Marca principal',
    true,
    'Eres el community manager de Pizzería La Strada, una pizzería italiana familiar en el centro. Tono cercano, auténtico, con guiños a la cultura italiana sin caricaturizarla. Resaltar productos frescos, masa madre, horno de leña. Evitar clichés como "la mejor del mundo".',
    array['cercano', 'autentico', 'familiar'],
    array['masa madre', 'horno de leña', 'productos frescos del día'],
    array['barato', 'la mejor del mundo', 'fast food'],
    '#C8102E',
    '#F1C40F',
    'Reserva tu mesa en la-strada.com'
  ) returning id into demo_brand_kit_id;

  -- Cuenta social demo
  insert into social_accounts (org_id, platform, handle, display_name, status)
  values (demo_org_id, 'instagram', '@lastrada_pizza', 'La Strada Pizzería', 'connected');

  raise notice 'Seed completado. Org: %, Brand kit: %', demo_org_id, demo_brand_kit_id;
end $$;
