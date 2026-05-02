<script setup lang="ts">
import { Card, Switch, Label, Button } from '@tane/ui'

const toast = useToast()

const settings = reactive({
  emailOnPublish: true,
  emailOnFail: true,
  emailWeeklyReport: true,
  emailLowCredits: true,
  emailNewApproval: true,
  emailMarketing: false,
})

function save() {
  // TODO: persistir en tabla user_preferences
  toast.success('Preferencias guardadas')
}
</script>

<template>
  <Card class="p-6 space-y-5">
    <div>
      <h2 class="font-display font-semibold">Notificaciones por email</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Recibe alertas solo de lo que te interesa.
      </p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <Label>Cuando se publica un post</Label>
          <p class="text-xs text-muted-foreground">Confirmación con enlaces a las publicaciones reales.</p>
        </div>
        <Switch v-model="settings.emailOnPublish" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <Label>Cuando falla una publicación</Label>
          <p class="text-xs text-muted-foreground">Aviso inmediato con motivo del error y acción recomendada.</p>
        </div>
        <Switch v-model="settings.emailOnFail" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <Label>Resumen semanal</Label>
          <p class="text-xs text-muted-foreground">Cada lunes: posts publicados, métricas y mejor post.</p>
        </div>
        <Switch v-model="settings.emailWeeklyReport" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <Label>Créditos bajos</Label>
          <p class="text-xs text-muted-foreground">Aviso cuando queda menos del 20% del plan.</p>
        </div>
        <Switch v-model="settings.emailLowCredits" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <Label>Nueva solicitud de aprobación</Label>
          <p class="text-xs text-muted-foreground">Si el cliente comenta o pide cambios.</p>
        </div>
        <Switch v-model="settings.emailNewApproval" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <Label>Producto y novedades</Label>
          <p class="text-xs text-muted-foreground">Funcionalidades nuevas, casos de éxito, tips. Una vez al mes.</p>
        </div>
        <Switch v-model="settings.emailMarketing" />
      </div>
    </div>

    <Button @click="save">Guardar preferencias</Button>
  </Card>
</template>
