/**
 * @tane/ayrshare — wrapper de la API de Ayrshare Business.
 *
 * Abstrae la API HTTP y expone primitivas que usa nuestro dominio
 * (createProfile, generateLinkUrl, schedulePost, fetchAnalytics, etc.).
 *
 * Diseño deliberado: si algún día migramos a APIs nativas o Postiz,
 * solo cambia esta capa. El dominio no se entera.
 */
export { AyrshareClient } from './client'
export type {
  AyrshareConfig,
  CreateProfileResponse,
  GenerateJwtResponse,
  PostInput,
  PostResponse,
} from './client'
