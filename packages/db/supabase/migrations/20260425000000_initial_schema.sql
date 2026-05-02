-- ============================================================================
-- Trendora — Schema inicial
-- Migración 20260425000000_initial_schema
-- ============================================================================
-- Multi-tenant SaaS con aislamiento por org_id mediante RLS.
-- Toda tabla con datos de cliente lleva org_id NOT NULL + política RLS.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type plan_tier as enum ('trial', 'starter', 'pro', 'agency', 'enterprise');
create type member_role as enum ('owner', 'admin', 'editor', 'viewer');
create type social_platform as enum (
  'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok',
  'youtube', 'pinterest', 'threads', 'bluesky', 'gmb', 'reddit', 'telegram'
);
create type social_status as enum ('connected', 'disconnected', 'expired', 'error');
create type draft_status as enum (
  'draft', 'in_review', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
);
create type generation_type as enum ('text', 'image', 'video', 'repurpose', 'hashtags');
create type approval_decision as enum ('pending', 'approved', 'rejected');

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS (tenant raíz)
-- ----------------------------------------------------------------------------

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  vertical text,
  plan plan_tier not null default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),

  -- Stripe
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  -- Ayrshare
  ayrshare_profile_key text unique,
  ayrshare_profile_id text,

  -- Limits/uso
  posts_used_this_period integer not null default 0,
  ai_credits_used_this_period integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_orgs_slug on organizations(slug) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS (usuarios dentro de una organización)
-- ----------------------------------------------------------------------------

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'editor',
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index idx_memberships_user on memberships(user_id);
create index idx_memberships_org on memberships(org_id);

-- Función helper: organizaciones del usuario actual
-- Vivimos en `public` (no `auth`) porque el SQL Editor del dashboard no
-- tiene permisos sobre el schema `auth` en proyectos nuevos.
create or replace function public.user_orgs() returns setof uuid
language sql stable security definer
set search_path = public, auth
as $$
  select org_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.user_role_in(org uuid) returns member_role
language sql stable security definer
set search_path = public, auth
as $$
  select role from public.memberships
  where user_id = auth.uid() and org_id = org
  limit 1;
$$;

grant execute on function public.user_orgs to authenticated;
grant execute on function public.user_role_in to authenticated;

-- ----------------------------------------------------------------------------
-- BRAND KITS (identidad de marca por organización)
-- ----------------------------------------------------------------------------

create table brand_kits (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,

  voice_prompt text,         -- prompt sistema inyectado en cada generación
  tone text[],               -- ['professional', 'cercano', 'experto']
  do_say text[],             -- frases de marca aprobadas
  do_not_say text[],         -- palabras prohibidas

  primary_color text,        -- hex
  accent_color text,
  fonts jsonb default '{}'::jsonb,
  logo_url text,
  cover_url text,

  hashtag_sets jsonb default '[]'::jsonb,
  default_cta text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_brand_kits_org on brand_kits(org_id);

-- ----------------------------------------------------------------------------
-- BRAND ASSETS (imágenes, vídeos, plantillas)
-- ----------------------------------------------------------------------------

create table brand_assets (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_kit_id uuid references brand_kits(id) on delete set null,
  type text not null check (type in ('image', 'video', 'logo', 'template', 'font')),
  storage_path text not null,        -- bucket Supabase Storage
  mime_type text,
  width integer,
  height integer,
  size_bytes bigint,
  metadata jsonb default '{}'::jsonb,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_brand_assets_org on brand_assets(org_id);

-- ----------------------------------------------------------------------------
-- SOCIAL ACCOUNTS (cuentas conectadas vía Ayrshare)
-- ----------------------------------------------------------------------------

create table social_accounts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  platform social_platform not null,
  handle text,                       -- @usuario o nombre de página
  display_name text,
  profile_image_url text,
  status social_status not null default 'connected',
  ayrshare_ref text,                 -- referencia interna en Ayrshare
  metadata jsonb default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  unique (org_id, platform, handle)
);

create index idx_social_accounts_org on social_accounts(org_id);

-- ----------------------------------------------------------------------------
-- CONTENT DRAFTS (el corazón: posts en cualquier estado)
-- ----------------------------------------------------------------------------

create table content_drafts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  brand_kit_id uuid references brand_kits(id) on delete set null,

  title text,
  body text,
  bodies_per_platform jsonb default '{}'::jsonb,  -- { instagram: "...", twitter: "..." }
  media jsonb default '[]'::jsonb,                -- [{ type, url, alt, ... }]
  platforms social_platform[] not null default '{}',
  hashtags text[],
  mentions text[],

  status draft_status not null default 'draft',
  scheduled_at timestamptz,
  timezone text default 'Europe/Madrid',
  published_at timestamptz,

  ayrshare_post_ids jsonb default '{}'::jsonb,    -- { instagram: "ayr_xxx" }

  generated_from uuid,                            -- id de la generation que originó
  approval_token text unique,                     -- token público para aprobación
  approval_token_expires_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint scheduled_requires_date check (
    (status != 'scheduled') or (scheduled_at is not null)
  )
);

create index idx_drafts_org on content_drafts(org_id);
create index idx_drafts_status on content_drafts(org_id, status);
create index idx_drafts_scheduled on content_drafts(scheduled_at) where status = 'scheduled';
create index idx_drafts_approval_token on content_drafts(approval_token) where approval_token is not null;

-- ----------------------------------------------------------------------------
-- APPROVALS (workflow de aprobación cliente)
-- ----------------------------------------------------------------------------

create table approvals (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  draft_id uuid not null references content_drafts(id) on delete cascade,
  requested_by uuid references auth.users(id),
  approver_email citext,
  approver_name text,
  decision approval_decision not null default 'pending',
  comment text,
  decided_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_approvals_org on approvals(org_id);
create index idx_approvals_draft on approvals(draft_id);

-- ----------------------------------------------------------------------------
-- POST METRICS (analytics por post + plataforma)
-- ----------------------------------------------------------------------------

create table post_metrics (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  draft_id uuid not null references content_drafts(id) on delete cascade,
  platform social_platform not null,
  ayrshare_post_id text not null,

  impressions integer default 0,
  reach integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  clicks integer default 0,
  video_views integer default 0,
  engagement_rate numeric(5,4),
  raw jsonb default '{}'::jsonb,

  fetched_at timestamptz not null default now(),
  unique (draft_id, platform, ayrshare_post_id, fetched_at)
);

create index idx_metrics_org on post_metrics(org_id);
create index idx_metrics_draft on post_metrics(draft_id);

-- ----------------------------------------------------------------------------
-- GENERATIONS (log llamadas IA con coste para metering)
-- ----------------------------------------------------------------------------

create table generations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  type generation_type not null,
  provider text not null,                  -- 'anthropic' | 'openai' | 'replicate' | 'google'
  model text not null,                     -- 'claude-sonnet-4-6' | 'flux-pro' | ...
  prompt_excerpt text,
  output_excerpt text,
  tokens_in integer,
  tokens_out integer,
  duration_ms integer,
  cost_usd numeric(10,6),
  credits_charged integer not null default 0,  -- créditos descontados al cliente
  draft_id uuid references content_drafts(id) on delete set null,
  status text not null default 'success',
  error text,
  created_at timestamptz not null default now()
);

create index idx_generations_org on generations(org_id);
create index idx_generations_org_period on generations(org_id, created_at);

-- ----------------------------------------------------------------------------
-- USAGE METER (resumen por periodo de facturación)
-- ----------------------------------------------------------------------------

create table usage_meter (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  posts_published integer not null default 0,
  ai_credits_used integer not null default 0,
  video_seconds_used integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  unique (org_id, period_start)
);

create index idx_usage_org on usage_meter(org_id);

-- ----------------------------------------------------------------------------
-- AUDIT LOG (acciones sensibles)
-- ----------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_org on audit_log(org_id, created_at desc);

-- ----------------------------------------------------------------------------
-- STRIPE EVENTS (idempotencia de webhooks)
-- ----------------------------------------------------------------------------

create table stripe_events (
  id text primary key,                      -- event.id de Stripe
  type text not null,
  org_id uuid references organizations(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TRIGGER updated_at
-- ----------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger orgs_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger brand_kits_updated_at before update on brand_kits
  for each row execute function set_updated_at();
create trigger drafts_updated_at before update on content_drafts
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table organizations enable row level security;
alter table memberships enable row level security;
alter table brand_kits enable row level security;
alter table brand_assets enable row level security;
alter table social_accounts enable row level security;
alter table content_drafts enable row level security;
alter table approvals enable row level security;
alter table post_metrics enable row level security;
alter table generations enable row level security;
alter table usage_meter enable row level security;
alter table audit_log enable row level security;
-- stripe_events: solo service_role accede

-- Macro de aislamiento por organización
-- Cada usuario ve solo orgs en las que es miembro

create policy "members read own org" on organizations
  for select using (id in (select public.user_orgs()));

create policy "owners update own org" on organizations
  for update using (
    id in (select public.user_orgs())
    and public.user_role_in(id) = 'owner'
  );

-- Memberships: ves los miembros de tus orgs
create policy "read memberships of own orgs" on memberships
  for select using (org_id in (select public.user_orgs()));

create policy "owners admin manage memberships" on memberships
  for all using (
    org_id in (select public.user_orgs())
    and public.user_role_in(org_id) in ('owner', 'admin')
  );

-- Política helper: tablas con org_id
do $$
declare
  t text;
  tables text[] := array[
    'brand_kits', 'brand_assets', 'social_accounts', 'content_drafts',
    'approvals', 'post_metrics', 'generations', 'usage_meter', 'audit_log'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create policy "tenant_read_%I" on %I
        for select using (org_id in (select public.user_orgs()));
    $f$, t, t);

    execute format($f$
      create policy "tenant_write_%I" on %I
        for insert with check (
          org_id in (select public.user_orgs())
          and public.user_role_in(org_id) in ('owner', 'admin', 'editor')
        );
    $f$, t, t);

    execute format($f$
      create policy "tenant_update_%I" on %I
        for update using (
          org_id in (select public.user_orgs())
          and public.user_role_in(org_id) in ('owner', 'admin', 'editor')
        );
    $f$, t, t);

    execute format($f$
      create policy "tenant_delete_%I" on %I
        for delete using (
          org_id in (select public.user_orgs())
          and public.user_role_in(org_id) in ('owner', 'admin')
        );
    $f$, t, t);
  end loop;
end $$;

-- ============================================================================
-- STORAGE: bucket privado por organización
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

create policy "tenant read brand-assets" on storage.objects
  for select using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select org_id::text from memberships where user_id = auth.uid()
    )
  );

create policy "tenant write brand-assets" on storage.objects
  for insert with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select org_id::text from memberships where user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPERS PARA DESARROLLO
-- ============================================================================

-- Cuando un usuario se registra, no se crea org automáticamente.
-- La org se crea explícitamente desde el flujo de onboarding.

-- Función para crear organización + membership atómicamente
create or replace function public.create_organization(
  org_name text,
  org_slug text,
  org_vertical text default null
) returns uuid
language plpgsql security definer as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth.uid is null — usuario no autenticado';
  end if;

  insert into organizations (name, slug, vertical)
  values (org_name, org_slug, org_vertical)
  returning id into new_org_id;

  insert into memberships (org_id, user_id, role, accepted_at)
  values (new_org_id, auth.uid(), 'owner', now());

  return new_org_id;
end $$;

grant execute on function public.create_organization to authenticated;
