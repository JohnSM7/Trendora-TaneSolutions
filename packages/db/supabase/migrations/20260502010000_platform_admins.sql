-- ============================================================================
-- Trendora — Platform admins
-- Migración 20260502010000_platform_admins
-- ============================================================================
-- Define quién es "admin de la plataforma" (Tane Solutions) — esto NO es lo
-- mismo que `member_role = 'admin'` que es admin DENTRO de una org cliente.
--
-- Se usa para gatear /app/admin/** (panel interno donde Tane ve todas las
-- orgs, KPIs, solicitudes de conexión, audit log cross-tenant).
-- ============================================================================

create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  notes text
);

-- Helper: ¿es el usuario actual admin de plataforma?
-- security definer + search_path para que funcione bajo RLS.
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

-- RLS: solo los propios admins pueden leer la tabla. Inserts/updates solo via
-- service-role (CLI o panel super-admin futuro). No exponemos el padrón.
alter table platform_admins enable row level security;

create policy "platform_admins read self or admin"
  on platform_admins for select
  using (user_id = auth.uid() or public.is_platform_admin());

-- ============================================================================
-- Bootstrap: marca el email del founder como admin SI el user existe en
-- auth.users. Si aún no se ha registrado, lo apuntamos por email y al primer
-- login un trigger lo convertirá en admin (ver más abajo).
-- ============================================================================

-- Tabla de "admins pendientes por email" — cuando el user se registre con
-- ese email, lo promovemos automáticamente.
create table platform_admin_invites (
  email citext primary key,
  invited_at timestamptz not null default now(),
  notes text
);

-- Sembrar el founder
insert into platform_admin_invites (email, notes)
values ('info@tanesolutions.com', 'Founder Tane Solutions — bootstrap')
on conflict (email) do nothing;

-- Trigger: al insertarse un user en auth.users, si su email está en
-- platform_admin_invites, lo convertimos en platform_admin y borramos la
-- invitación.
create or replace function public.handle_admin_invite_on_signup()
returns trigger
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if exists (select 1 from public.platform_admin_invites where email = new.email) then
    insert into public.platform_admins (user_id, email, notes)
    values (new.id, new.email, 'Auto-promoted from invite')
    on conflict (user_id) do nothing;

    delete from public.platform_admin_invites where email = new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_admin_invite_on_signup();

-- Si info@tanesolutions.com ya existe en auth.users, promovemos ahora mismo.
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'info@tanesolutions.com' limit 1;
  if v_user_id is not null then
    insert into public.platform_admins (user_id, email, notes)
    values (v_user_id, 'info@tanesolutions.com', 'Founder Tane Solutions — bootstrap')
    on conflict (user_id) do nothing;

    delete from public.platform_admin_invites where email = 'info@tanesolutions.com';
  end if;
end $$;
