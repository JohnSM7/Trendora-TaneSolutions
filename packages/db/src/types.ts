/**
 * Tipos de la base de datos.
 *
 * Este archivo es un placeholder estable. Los tipos reales se generan ejecutando:
 *
 *   pnpm db:types
 *
 * que regenera `types.gen.ts` con los tipos derivados del schema actual.
 * Mientras tanto, exportamos un esqueleto mínimo para que el monorepo compile.
 */
import type { Database as GeneratedDatabase } from './types.gen'

export type Database = GeneratedDatabase

export type PlanTier = 'trial' | 'starter' | 'pro' | 'agency' | 'enterprise'
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'threads'
  | 'bluesky'
  | 'gmb'
  | 'reddit'
  | 'telegram'
export type SocialStatus = 'connected' | 'disconnected' | 'expired' | 'error'
export type DraftStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled'
export type GenerationType = 'text' | 'image' | 'video' | 'repurpose' | 'hashtags'
export type ApprovalDecision = 'pending' | 'approved' | 'rejected'
