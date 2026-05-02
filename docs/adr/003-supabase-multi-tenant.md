# ADR 003 — Supabase con RLS para multi-tenancy

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

SaaS multi-tenant con datos sensibles por organización. Necesitamos:
- Aislamiento estricto entre orgs (un cliente no puede ver datos de otro)
- Auth con email/magic link/Google OAuth
- Storage para assets de marca
- Realtime para colaboración en tiempo real (futuro)
- Bajo coste hasta 1.000+ clientes
- Dev experience que no nos frene

## Opciones consideradas

| Opción | Multi-tenant | Coste 100 clientes | DX |
|---|---|---|---|
| **Supabase + RLS** | Compartido con RLS | $25/mes Pro | Excelente |
| Firebase + Firestore rules | Compartido con rules | $25-100/mes | Bueno (NoSQL) |
| Postgres self-host + auth custom | Total control | $50/mes VPS + tiempo | Pobre |
| PlanetScale + Clerk + S3 | Stack premium | $80+/mes | Bueno |
| Schema por tenant (Postgres) | Aislamiento físico | Igual | Pesadilla migraciones |
| DB por tenant | Aislamiento total | Inviable | Inviable |

## Decisión

**Supabase con Row Level Security, schema único, columna `org_id` en todas las tablas tenant.**

### Patrón estándar

```sql
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON content_drafts
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );
```

Roles dentro de la org: `owner | admin | editor | viewer` con políticas adicionales según acción.

## Consecuencias

✅ Aislamiento aplicado a nivel BD, imposible saltarlo desde el frontend
✅ Migración a schema-per-tenant (si crece) requiere refactor pero es factible
✅ Storage Supabase también con RLS por bucket/path
✅ Coste predecible: ~25 €/mes hasta cientos de clientes
⚠️ Tests de aislamiento son obligatorios en cada PR que toque schema
⚠️ Funciones SQL deben usar `SECURITY INVOKER` (default) salvo casos justificados
⚠️ Service role key NUNCA en frontend, solo en server routes Nitro
