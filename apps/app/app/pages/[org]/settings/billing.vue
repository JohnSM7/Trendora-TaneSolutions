<script setup lang="ts">
import { Button, Card, Badge, Alert, Separator, Skeleton } from '@tane/ui'

const { currentOrg } = useCurrentOrg()
const supabase = useDb()
const toast = useToast()

interface UsageRow {
  posts_published: number
  ai_credits_used: number
  video_seconds_used: number
}

interface OrgBilling {
  plan: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_ends_at: string | null
  ai_credits_used_this_period: number
  posts_used_this_period: number
}

const loading = ref(true)
const billing = ref<OrgBilling | null>(null)
const opening = ref(false)

const PLAN_NAMES: Record<string, string> = {
  trial: 'Prueba gratuita',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
  enterprise: 'Enterprise',
}

interface PlanLimit {
  posts: number | null
  credits: number
  networks: number
}
const TRIAL_LIMITS: PlanLimit = { posts: 30, credits: 100, networks: 3 }
const PLAN_LIMITS: Record<string, PlanLimit> = {
  trial: TRIAL_LIMITS,
  starter: { posts: 60, credits: 200, networks: 3 },
  pro: { posts: null, credits: 1000, networks: 8 },
  agency: { posts: null, credits: 5000, networks: 30 },
  enterprise: { posts: null, credits: 999999, networks: 999 },
}

async function load() {
  if (!currentOrg.value?.id) return
  loading.value = true
  const { data } = await supabase
    .from('organizations')
    .select(`
      plan, current_period_end, cancel_at_period_end, trial_ends_at,
      ai_credits_used_this_period, posts_used_this_period
    `)
    .eq('id', currentOrg.value.id)
    .single()

  billing.value = (data as OrgBilling | null) ?? null
  loading.value = false
}

watchEffect(() => {
  if (currentOrg.value) load()
})

const limits = computed<PlanLimit>(() => {
  const plan = billing.value?.plan ?? 'trial'
  return PLAN_LIMITS[plan] ?? TRIAL_LIMITS
})

const creditsPercentage = computed(() => {
  if (!billing.value || !limits.value) return 0
  return Math.min(100, (billing.value.ai_credits_used_this_period / limits.value.credits) * 100)
})

const postsPercentage = computed(() => {
  if (!billing.value || !limits.value || !limits.value.posts) return 0
  return Math.min(100, (billing.value.posts_used_this_period / limits.value.posts) * 100)
})

async function openCustomerPortal() {
  if (!currentOrg.value) return
  opening.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/billing/portal', {
      method: 'POST',
      body: { orgSlug: currentOrg.value.slug },
    })
    window.location.href = url
  } catch (e: any) {
    toast.error('No se pudo abrir el portal', e?.data?.message ?? e.message)
  } finally {
    opening.value = false
  }
}

async function startCheckout(plan: 'starter' | 'pro' | 'agency', period: 'monthly' | 'yearly') {
  if (!currentOrg.value) return
  opening.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: { orgSlug: currentOrg.value.slug, plan, period },
    })
    window.location.href = url
  } catch (e: any) {
    toast.error('No se pudo iniciar el pago', e?.data?.message ?? e.message)
  } finally {
    opening.value = false
  }
}

const trialDaysLeft = computed(() => {
  if (!billing.value?.trial_ends_at) return null
  const ms = new Date(billing.value.trial_ends_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
})
</script>

<template>
  <div class="space-y-6">
    <Skeleton v-if="loading" class="h-32" />

    <template v-else-if="billing">
      <!-- Plan actual -->
      <Card class="p-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="text-sm text-muted-foreground">Plan actual</p>
            <h2 class="text-2xl font-display font-bold mt-1">
              {{ PLAN_NAMES[billing.plan] }}
            </h2>
            <p class="text-sm text-muted-foreground mt-2">
              <span v-if="billing.plan === 'trial' && trialDaysLeft !== null">
                Te quedan <strong>{{ trialDaysLeft }} días</strong> de prueba.
              </span>
              <span v-else-if="billing.current_period_end">
                Próxima renovación
                {{ new Date(billing.current_period_end).toLocaleDateString('es-ES') }}.
              </span>
            </p>
            <Badge v-if="billing.cancel_at_period_end" variant="warning" class="mt-2">
              Cancelación pendiente
            </Badge>
          </div>

          <div class="flex gap-2">
            <Button v-if="billing.plan !== 'trial'" variant="outline" :disabled="opening" @click="openCustomerPortal">
              Gestionar facturación
            </Button>
            <Button
              v-if="billing.plan === 'trial' || billing.plan === 'starter'"
              :disabled="opening"
              @click="startCheckout('pro', 'monthly')"
            >
              {{ billing.plan === 'trial' ? 'Activar plan Pro' : 'Subir a Pro' }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- Uso del periodo -->
      <Card class="p-6">
        <h3 class="font-display font-semibold mb-4">Uso de este periodo</h3>

        <div class="space-y-5">
          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span>Créditos IA</span>
              <span class="font-medium">
                {{ billing.ai_credits_used_this_period.toLocaleString() }}
                / {{ limits.credits.toLocaleString() }}
              </span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full transition-all"
                :class="creditsPercentage > 90 ? 'bg-destructive' : creditsPercentage > 70 ? 'bg-amber-500' : 'bg-tane-primary'"
                :style="{ width: creditsPercentage + '%' }"
              />
            </div>
          </div>

          <div v-if="limits.posts">
            <div class="flex justify-between text-sm mb-1.5">
              <span>Posts publicados</span>
              <span class="font-medium">
                {{ billing.posts_used_this_period }} / {{ limits.posts }}
              </span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-tane-primary transition-all"
                :style="{ width: postsPercentage + '%' }"
              />
            </div>
          </div>

          <div v-else class="flex justify-between text-sm">
            <span>Posts publicados</span>
            <span class="font-medium text-tane-accent-600">Ilimitados ✨</span>
          </div>
        </div>

        <Alert v-if="creditsPercentage > 80" variant="warning" title="Te quedan pocos créditos" class="mt-5">
          Considera comprar un pack adicional o subir de plan para no quedarte sin generaciones.
          <Button variant="outline" size="sm" class="mt-2">
            Comprar pack 100 créditos · 19 €
          </Button>
        </Alert>
      </Card>

      <!-- Cambiar plan -->
      <Card class="p-6">
        <h3 class="font-display font-semibold mb-4">Cambiar de plan</h3>
        <div class="grid md:grid-cols-3 gap-4">
          <div
            v-for="plan in ['starter', 'pro', 'agency'] as const"
            :key="plan"
            class="rounded-lg border p-4"
            :class="billing.plan === plan ? 'border-tane-primary bg-tane-primary/5' : ''"
          >
            <p class="font-medium">{{ PLAN_NAMES[plan] }}</p>
            <p class="text-2xl font-display font-bold mt-1">
              {{ plan === 'starter' ? '99' : plan === 'pro' ? '249' : '599' }} €
              <span class="text-xs text-muted-foreground">/mes</span>
            </p>
            <ul class="text-xs text-muted-foreground mt-3 space-y-1">
              <li>· {{ PLAN_LIMITS[plan]?.networks ?? '—' }} redes sociales</li>
              <li>
                · {{ PLAN_LIMITS[plan]?.posts ? PLAN_LIMITS[plan]!.posts + ' posts/mes' : 'Posts ilimitados' }}
              </li>
              <li>· {{ PLAN_LIMITS[plan]?.credits.toLocaleString() ?? '—' }} créditos IA</li>
            </ul>
            <Button
              v-if="billing.plan !== plan"
              variant="outline"
              size="sm"
              class="w-full mt-4"
              :disabled="opening"
              @click="startCheckout(plan, 'monthly')"
            >
              Cambiar a {{ PLAN_NAMES[plan] }}
            </Button>
            <Badge v-else variant="success" class="mt-4">Plan actual</Badge>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
