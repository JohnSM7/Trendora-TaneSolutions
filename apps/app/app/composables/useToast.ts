/**
 * Composable de toasts. Una instancia global por app.
 *
 * Uso:
 *   const toast = useToast()
 *   toast.success('Guardado')
 *   toast.error('Algo falló')
 */
interface ToastItem {
  id: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  title?: string
  description?: string
  duration?: number
}

const toasts = ref<ToastItem[]>([])

let counter = 0
const nextId = () => `t-${Date.now()}-${++counter}`

function add(toast: Omit<ToastItem, 'id'>) {
  const id = nextId()
  toasts.value = [...toasts.value, { id, ...toast }]
  return id
}

function dismiss(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    show: (toast: Omit<ToastItem, 'id'>) => add(toast),
    success: (title: string, description?: string) =>
      add({ variant: 'success', title, description }),
    error: (title: string, description?: string) =>
      add({ variant: 'error', title, description }),
    warning: (title: string, description?: string) =>
      add({ variant: 'warning', title, description }),
    info: (title: string, description?: string) =>
      add({ variant: 'default', title, description }),
  }
}
