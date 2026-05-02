/**
 * useTheme — gestión de tema light/dark con persistencia en localStorage.
 *
 * Soporta:
 *   - 'light' | 'dark' | 'system' (sigue prefers-color-scheme)
 *
 * Aplica la clase `dark` al <html> que activa los CSS variables de shadcn-vue.
 */
export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'trendora.theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'system')

  function getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const resolvedTheme = computed<'light' | 'dark'>(() =>
    theme.value === 'system' ? getSystemPreference() : theme.value,
  )

  function apply(value: Theme) {
    if (typeof document === 'undefined') return
    const resolved = value === 'system' ? getSystemPreference() : value
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
  }

  function setTheme(value: Theme) {
    theme.value = value
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value)
    }
    apply(value)
  }

  // Inicializar desde localStorage en cliente
  onMounted(() => {
    if (typeof localStorage === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      theme.value = saved
    }
    apply(theme.value)

    // Reaccionar a cambios del sistema cuando theme === 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme.value === 'system') apply('system')
    }
    mq.addEventListener('change', handler)
    onBeforeUnmount(() => mq.removeEventListener('change', handler))
  })

  return {
    theme: readonly(theme),
    resolvedTheme,
    setTheme,
    toggle: () => setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark'),
  }
}
