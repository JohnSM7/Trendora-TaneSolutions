<script setup lang="ts">
import { Button, Card, Input, Label, Select, Alert } from '@tane/ui'

const { currentOrg, refresh } = useCurrentOrg()
const supabase = useDb()
const toast = useToast()

const form = reactive({ name: '', vertical: '' })
const saving = ref(false)

watchEffect(() => {
  if (currentOrg.value) {
    form.name = currentOrg.value.name
    form.vertical = currentOrg.value.vertical ?? ''
  }
})

const VERTICALES = [
  { value: 'restaurante', label: 'Restaurante / bar / cafetería' },
  { value: 'gimnasio', label: 'Gimnasio / fitness' },
  { value: 'clinica-dental', label: 'Clínica dental' },
  { value: 'peluqueria', label: 'Peluquería / barbería' },
  { value: 'tienda', label: 'Tienda física / comercio' },
  { value: 'saas-b2b', label: 'SaaS B2B / startup' },
  { value: 'otro', label: 'Otro' },
]

async function save() {
  if (!currentOrg.value) return
  saving.value = true
  const { error } = await supabase
    .from('organizations')
    .update({ name: form.name, vertical: form.vertical } as never)
    .eq('id', currentOrg.value.id)
  saving.value = false

  if (error) {
    toast.error('Error al guardar', error.message)
    return
  }
  toast.success('Cambios guardados')
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <Card class="p-6 space-y-4">
      <h2 class="font-display font-semibold">Información general</h2>

      <div>
        <Label for="org-name">Nombre de la organización</Label>
        <Input id="org-name" v-model="form.name" class="mt-1.5" />
      </div>

      <div>
        <Label for="vertical">Sector</Label>
        <Select id="vertical" v-model="form.vertical" :options="VERTICALES" class="mt-1.5" />
        <p class="text-xs text-muted-foreground mt-1">
          Influye en plantillas y prompts. Cámbialo si pivotas el negocio.
        </p>
      </div>

      <div>
        <Label>URL en Tane</Label>
        <p class="text-sm text-muted-foreground mt-1">
          <code class="bg-muted px-2 py-1 rounded">app.trendora.tanesolutions.com/{{ currentOrg?.slug }}</code>
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          La URL no se puede cambiar. Si la necesitas cambiar, contacta soporte.
        </p>
      </div>

      <Button :disabled="saving" @click="save">
        {{ saving ? 'Guardando…' : 'Guardar cambios' }}
      </Button>
    </Card>

    <Card class="p-6 space-y-4 border-destructive/30">
      <h2 class="font-display font-semibold text-destructive">Zona de peligro</h2>

      <Alert variant="destructive" title="Eliminar organización">
        Borra todos los datos: brand kits, posts, métricas, conexiones sociales. Esta acción es irreversible.
      </Alert>

      <Button variant="destructive">Solicitar eliminación</Button>
    </Card>
  </div>
</template>
