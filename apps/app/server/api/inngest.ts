/**
 * Endpoint que Inngest usa para registrar y ejecutar funciones.
 * En desarrollo: `npx inngest-cli@latest dev` apunta aquí.
 */
import { serve } from 'inngest/h3'
import { inngest } from '../inngest/client'
import { functions } from '../inngest/functions'

export default defineEventHandler(serve({ client: inngest, functions }))
