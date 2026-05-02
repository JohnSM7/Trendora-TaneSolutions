<script setup lang="ts">
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Avatar,
  Badge,
  Dialog,
  Skeleton,
  Separator,
} from '@tane/ui'

const { currentOrg } = useCurrentOrg()
const supabase = useDb()
const me = useSupabaseUser()
const toast = useToast()

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  accepted_at: string | null
  invited_at: string | null
  email: string | null
  full_name: string | null
}

const members = ref<Member[]>([])
const loading = ref(true)

const showInviteDialog = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'editor' | 'viewer'>('editor')
const inviting = ref(false)

async function loadMembers() {
  if (!currentOrg.value?.id) return
  loading.value = true

  const { data } = await supabase
    .from('memberships')
    .select(`
      id, user_id, role, accepted_at, invited_at,
      users:user_id ( email, raw_user_meta_data )
    `)
    .eq('org_id', currentOrg.value.id)
    .order('role')

  members.value = (data ?? []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    accepted_at: m.accepted_at,
    invited_at: m.invited_at,
    email: m.users?.email ?? null,
    full_name: m.users?.raw_user_meta_data?.full_name ?? null,
  }))

  loading.value = false
}

watchEffect(() => {
  if (currentOrg.value) loadMembers()
})

const myRole = computed(() => members.value.find((m) => m.user_id === me.value?.id)?.role)
const canManage = computed(() => myRole.value === 'owner' || myRole.value === 'admin')

async function invite() {
  if (!currentOrg.value || !inviteEmail.value) return
  inviting.value = true
  try {
    await $fetch('/api/orgs/invite', {
      method: 'POST',
      body: {
        orgSlug: currentOrg.value.slug,
        email: inviteEmail.value,
        role: inviteRole.value,
      },
    })
    toast.success('Invitación enviada', `${inviteEmail.value} recibirá un email`)
    inviteEmail.value = ''
    showInviteDialog.value = false
    await loadMembers()
  } catch (e: any) {
    toast.error('No se pudo invitar', e?.data?.message ?? e.message)
  } finally {
    inviting.value = false
  }
}

async function changeRole(member: Member, newRole: Member['role']) {
  if (!currentOrg.value) return
  const { error } = await supabase
    .from('memberships')
    .update({ role: newRole } as never)
    .eq('id', member.id)
  if (error) {
    toast.error('Error al cambiar rol', error.message)
    return
  }
  toast.success('Rol actualizado')
  await loadMembers()
}

async function removeMember(member: Member) {
  if (!confirm(`¿Eliminar a ${member.email} del equipo?`)) return
  const { error } = await supabase.from('memberships').delete().eq('id', member.id)
  if (error) {
    toast.error('Error al eliminar', error.message)
    return
  }
  toast.success('Miembro eliminado')
  await loadMembers()
}

const ROLE_LABELS = {
  owner: 'Propietario',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

const ROLE_DESCRIPTIONS = {
  owner: 'Acceso total, incluido facturación y eliminar la organización.',
  admin: 'Gestiona equipo, redes y todo el contenido.',
  editor: 'Crea, edita y programa contenido.',
  viewer: 'Solo puede ver. No genera ni programa.',
}
</script>

<template>
  <div class="space-y-6">
    <Card class="p-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h2 class="font-display font-semibold">Equipo</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Invita a colegas, clientes o agencia que gestionan la cuenta.
          </p>
        </div>
        <Button v-if="canManage" @click="showInviteDialog = true">+ Invitar miembro</Button>
      </div>

      <div v-if="loading" class="space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-14" />
      </div>

      <div v-else-if="members.length" class="divide-y">
        <div
          v-for="member in members"
          :key="member.id"
          class="py-4 flex items-center gap-4"
        >
          <Avatar :fallback="member.full_name ?? member.email ?? '?'" />
          <div class="flex-1">
            <p class="font-medium text-sm">
              {{ member.full_name || member.email || '—' }}
              <span v-if="member.user_id === me?.id" class="text-xs text-muted-foreground">
                (tú)
              </span>
            </p>
            <p class="text-xs text-muted-foreground">
              {{ member.email }}
              <span v-if="!member.accepted_at"> · Pendiente de aceptar</span>
            </p>
          </div>
          <div v-if="canManage && member.role !== 'owner' && member.user_id !== me?.id">
            <Select
              :model-value="member.role"
              :options="[
                { value: 'admin', label: ROLE_LABELS.admin },
                { value: 'editor', label: ROLE_LABELS.editor },
                { value: 'viewer', label: ROLE_LABELS.viewer },
              ]"
              @update:model-value="(v) => changeRole(member, v as Member['role'])"
            />
          </div>
          <Badge v-else :variant="member.role === 'owner' ? 'default' : 'secondary'">
            {{ ROLE_LABELS[member.role] }}
          </Badge>
          <Button
            v-if="canManage && member.role !== 'owner' && member.user_id !== me?.id"
            variant="ghost"
            size="sm"
            class="text-destructive"
            @click="removeMember(member)"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Card>

    <!-- Roles explicados -->
    <Card class="p-6">
      <h3 class="font-medium mb-4">Roles</h3>
      <div class="space-y-3 text-sm">
        <div v-for="(desc, role) in ROLE_DESCRIPTIONS" :key="role" class="flex gap-3">
          <Badge :variant="role === 'owner' ? 'default' : 'secondary'" class="shrink-0">
            {{ ROLE_LABELS[role] }}
          </Badge>
          <p class="text-muted-foreground">{{ desc }}</p>
        </div>
      </div>
    </Card>

    <!-- Dialog invitar -->
    <Dialog
      :open="showInviteDialog"
      title="Invitar miembro"
      description="Recibirá un email con el enlace de acceso."
      @update:open="showInviteDialog = $event"
    >
      <form class="space-y-4" @submit.prevent="invite">
        <div>
          <Label for="invite-email">Email</Label>
          <Input
            id="invite-email"
            v-model="inviteEmail"
            type="email"
            required
            placeholder="colega@empresa.com"
            class="mt-1.5"
          />
        </div>
        <div>
          <Label for="invite-role">Rol</Label>
          <Select
            id="invite-role"
            v-model="inviteRole"
            :options="[
              { value: 'admin', label: ROLE_LABELS.admin },
              { value: 'editor', label: ROLE_LABELS.editor },
              { value: 'viewer', label: ROLE_LABELS.viewer },
            ]"
            class="mt-1.5"
          />
        </div>
      </form>

      <template #footer>
        <Button variant="outline" @click="showInviteDialog = false">Cancelar</Button>
        <Button :disabled="inviting || !inviteEmail" @click="invite">
          {{ inviting ? 'Enviando…' : 'Enviar invitación' }}
        </Button>
      </template>
    </Dialog>
  </div>
</template>
