# Frontend Guide — auraxis-app (React Native + Expo)

Stack: **Expo SDK 54 · React Native 0.81.5 · React 19 · TypeScript strict · Expo Router v6 · ESLint**

Este documento é a referência técnica definitiva para desenvolvimento no `auraxis-app`.
Tudo aqui é **obrigatório**, não sugestão.

---

## Índice

1. [Estrutura de diretórios](#1-estrutura-de-diretórios)
2. [TypeScript](#2-typescript)
3. [Componentes](#3-componentes)
4. [Hooks customizados](#4-hooks-customizados)
5. [Navegação (Expo Router)](#5-navegação-expo-router)
6. [Serviços HTTP](#6-serviços-http)
7. [Estado e contexto](#7-estado-e-contexto)
8. [Estilização](#8-estilização)
9. [Testes](#9-testes)
10. [Performance](#10-performance)
11. [Segurança](#11-segurança)
12. [Quality Gates](#12-quality-gates)
13. [Erros comuns e como evitar](#13-erros-comuns-e-como-evitar)

---

## 1. Estrutura de diretórios

```
auraxis-app/
  app/                        # Telas — Expo Router file-based routing
    (auth)/                   # Grupo: rotas públicas (login, registro)
      _layout.tsx
      login.tsx               → /login
      register.tsx            → /register
    (app)/                    # Grupo: rotas protegidas
      _layout.tsx             # Tab navigator + auth guard
      index.tsx               → / (dashboard)
      transactions/
        index.tsx             → /transactions
        [id].tsx              → /transactions/:id
      goals/
        index.tsx             → /goals
        [id].tsx              → /goals/:id
      profile.tsx             → /profile
    _layout.tsx               # Root layout (providers, fontes, splash)
    +not-found.tsx            # 404
  components/
    base/                     # Primitivos: Button, Input, Card, Badge, etc.
    domain/                   # Componentes de negócio: TransactionItem, GoalCard
    layout/                   # AppHeader, BottomTabBar, SafeWrapper
  hooks/                      # Custom hooks (lógica reutilizável)
  services/                   # Clientes HTTP por domínio
  stores/                     # Estado global (Context API ou Zustand)
  types/
    api/                      # Tipos de request/response da auraxis-api
    domain/                   # Tipos de domínio (Transaction, Goal, User)
  constants/                  # Tema, cores, fontes, strings
  utils/                      # Formatadores, validadores, helpers
  assets/                     # Imagens, fontes, ícones
  scripts/                    # Utilitários de dev
  app.json                    # Config Expo (pedir aprovação antes de alterar)
  tsconfig.json
  eslint.config.js
```

---

## 2. TypeScript

### Configuração atual (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

Path alias `@/` mapeia para a raiz. Usar sempre — nunca caminhos relativos longos:

```typescript
// ❌ Caminho relativo profundo
import { formatCurrency } from '../../../utils/formatters'

// ✅ Path alias
import { formatCurrency } from '@/utils/formatters'
```

### Sem `any` — sem exceção

```typescript
// ❌ PROIBIDO
const data: any = await response.json()
function handlePress(event: any) {}

// ✅ Tipar corretamente
const data: TransactionResponse = await response.json()
function handlePress(event: GestureResponderEvent) {}
```

### Tipos explícitos em retornos de funções públicas

```typescript
// ❌
export function calculateBalance(transactions: Transaction[]) {
  return transactions.reduce(...)
}

// ✅
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce(...)
}
```

### Tipos de API em `types/api/`, domínio em `types/domain/`

```typescript
// types/api/transaction.ts — formato da auraxis-api
export interface TransactionResponse {
  id: string
  description: string
  amount: number
  category_id: string
  date: string          // ISO 8601
  type: 'income' | 'expense'
  created_at: string
}

// types/domain/transaction.ts — representação interna
export interface Transaction {
  id: string
  description: string
  amount: number        // centavos
  category: Category
  date: Date            // Date real, não string
  type: TransactionType
}

export type TransactionType = 'income' | 'expense'
```

---

## 3. Componentes

### Functional components com TypeScript explícito

```tsx
// components/domain/TransactionItem.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Transaction } from '@/types/domain/transaction'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { colors } from '@/constants/theme'

interface Props {
  transaction: Transaction
  onDelete?: (id: string) => void
  compact?: boolean
}

export function TransactionItem({ transaction, onDelete, compact = false }: Props) {
  const isExpense = transaction.type === 'expense'

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.description}>{transaction.description}</Text>
        {!compact && (
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        )}
      </View>
      <Text style={[
        styles.amount,
        isExpense ? styles.expense : styles.income,
      ]}>
        {isExpense ? '−' : '+'} {formatCurrency(transaction.amount)}
      </Text>
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(transaction.id)}
          testID="delete-btn"
          accessibilityRole="button"
          accessibilityLabel="Excluir transação"
        >
          <Text>×</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  info: { flex: 1 },
  description: { fontSize: 16, fontWeight: '500' },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
  expense: { color: colors.danger },
  income: { color: colors.success },
})
```

### Regras de componentes

| Regra | Detalhe |
|:------|:--------|
| Componentes são funções nomeadas | Nunca `export default function()` anônimo |
| Um componente = uma responsabilidade | Componente que faz fetch + renderiza = separar em dois |
| Sem lógica de negócio em componentes | Extrair para hooks |
| Sem chamadas HTTP em componentes | Usar hooks ou stores |
| `StyleSheet.create` obrigatório | Nunca objetos de estilo inline |
| `accessibilityRole` e `accessibilityLabel` | Em todos os elementos interativos |
| `testID` em elementos de interação | Para testes com Testing Library |
| Nomes em PascalCase com extensão `.tsx` | `TransactionItem.tsx`, não `transactionItem.js` |

### Componentes base em `components/base/`

```tsx
// components/base/Button.tsx
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { colors, typography } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  label: string
  onPress: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  testID?: string
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, testID,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[size], (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
        : <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}
```

---

## 4. Hooks customizados

### Prefixo `use` obrigatório, um hook = uma preocupação

```typescript
// hooks/useTransactions.ts
import { useCallback, useEffect, useState } from 'react'
import { transactionService } from '@/services/transaction.service'
import type { Transaction } from '@/types/domain/transaction'
import type { CreateTransactionDto } from '@/types/api/transaction'

interface State {
  items: Transaction[]
  isLoading: boolean
  error: string | null
}

export function useTransactions() {
  const [state, setState] = useState<State>({
    items: [],
    isLoading: false,
    error: null,
  })

  const fetchAll = useCallback(async (): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const items = await transactionService.getAll()
      setState(s => ({ ...s, items, isLoading: false }))
    } catch {
      setState(s => ({ ...s, isLoading: false, error: 'Falha ao carregar transações' }))
    }
  }, [])

  const create = useCallback(async (dto: CreateTransactionDto): Promise<void> => {
    const created = await transactionService.create(dto)
    setState(s => ({ ...s, items: [created, ...s.items] }))
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await transactionService.delete(id)
    setState(s => ({ ...s, items: s.items.filter(t => t.id !== id) }))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { ...state, fetchAll, create, remove }
}
```

### Regras de hooks

| Regra | Detalhe |
|:------|:--------|
| Retornar objeto nomeado, nunca array (exceto `useState`) | `return { items, isLoading }` — facilita desestruturação seletiva |
| `useCallback` para funções passadas como prop | Evita re-renders desnecessários |
| `useMemo` para computações custosas | Nunca em template — sempre em hook |
| Estado de loading e error sempre presentes | Todo hook que faz fetch tem `isLoading` e `error` |
| Não chamar hooks condicionalmente | Regra do React — hooks sempre na mesma ordem |

---

## 5. Navegação (Expo Router)

### Estrutura de grupos de rota

```
app/
  (auth)/              # Usuários não autenticados
    _layout.tsx        # Stack simples sem tab bar
    login.tsx
    register.tsx
  (app)/               # Usuários autenticados
    _layout.tsx        # Tab navigator com verificação de auth
    index.tsx          # Dashboard
    transactions/
      index.tsx
      [id].tsx
    profile.tsx
  _layout.tsx          # Root: providers globais (fonts, splash, auth context)
```

### Root layout — providers globais

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { AuthProvider } from '@/stores/auth.context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useFonts({ /* fontes customizadas */ })

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}
```

### Auth guard no layout protegido

```tsx
// app/(app)/_layout.tsx
import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '@/stores/auth.context'

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null          // splash ou skeleton
  if (!isAuthenticated) return <Redirect href="/login" />

  return (
    <Tabs screenOptions={{ /* ... */ }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="transactions/index" options={{ title: 'Transações' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
```

### Navegação programática

```typescript
import { router } from 'expo-router'

// ✅ Tipada com rotas válidas
router.push('/transactions/txn-001')
router.replace('/login')
router.back()

// ❌ String sem tipo — sem autocomplete, sem erro em compilação
router.push('/transacoes/alguma-coisa')
```

### Links tipados

```tsx
import { Link } from 'expo-router'

// ✅
<Link href="/transactions/new">Nova transação</Link>

// ✅ Com parâmetros
<Link href={`/transactions/${id}`}>Ver detalhes</Link>
```

---

## 6. Serviços HTTP

### Um service por domínio

```typescript
// services/transaction.service.ts
import type { Transaction } from '@/types/domain/transaction'
import type {
  CreateTransactionRequest,
  TransactionResponse,
} from '@/types/api/transaction'
import { apiClient } from '@/services/api-client'

function toTransaction(raw: TransactionResponse): Transaction {
  return {
    id: raw.id,
    description: raw.description,
    amount: raw.amount,
    category: { id: raw.category_id, name: '' }, // completar com endpoint de categoria
    date: new Date(raw.date),
    type: raw.type,
  }
}

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const data = await apiClient.get<TransactionResponse[]>('/transactions')
    return data.map(toTransaction)
  },

  async getById(id: string): Promise<Transaction> {
    const data = await apiClient.get<TransactionResponse>(`/transactions/${id}`)
    return toTransaction(data)
  },

  async create(dto: CreateTransactionRequest): Promise<Transaction> {
    const data = await apiClient.post<TransactionResponse>('/transactions', dto)
    return toTransaction(data)
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`)
  },
}
```

### API client centralizado com auth header

```typescript
// services/api-client.ts
import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, body.message ?? 'Erro desconhecido')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
```

---

## 7. Estado e contexto

### Context API para estado global de auth

```typescript
// stores/auth.context.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authService } from '@/services/auth.service'
import type { User } from '@/types/domain/user'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('access_token')
        if (token) {
          const user = await authService.getMe()
          setState({ user, isAuthenticated: true, isLoading: false })
        } else {
          setState(s => ({ ...s, isLoading: false }))
        }
      } catch {
        await SecureStore.deleteItemAsync('access_token')
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
    restoreSession()
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const { access_token, user } = await authService.login({ email, password })
    await SecureStore.setItemAsync('access_token', access_token)
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  async function logout(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token')
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Regras de estado

| Regra | Detalhe |
|:------|:--------|
| Auth token em `expo-secure-store` | Keychain/Keystore — nunca AsyncStorage |
| Context API para auth global | Estado simples, sem necessidade de lib externa |
| Hooks locais para estado de tela | `useState` no componente/hook da tela |
| Sem prop drilling > 2 níveis | Criar contexto ou hook compartilhado |
| Estado de loading e error em todo fetch | Nunca mostrar tela vazia silenciosa |

---

## 8. Estilização

### `StyleSheet.create` — obrigatório

```typescript
// ❌ Objeto inline — sem otimização nativa, sem autocomplete
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>

// ✅ StyleSheet.create — processado nativamente, memoizado
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
})
```

### Design system centralizado em `constants/theme.ts`

```typescript
// constants/theme.ts

export const colors = {
  primary: '#5C6BC0',
  primaryLight: '#8E99F3',
  success: '#43A047',
  danger: '#E53935',
  warning: '#FB8C00',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const
```

### Suporte a dark mode

```typescript
import { useColorScheme } from '@/hooks/use-color-scheme'

export function useThemeColors() {
  const scheme = useColorScheme()
  return scheme === 'dark' ? darkColors : lightColors
}
```

---

## 9. Testes

### Jest + React Native Testing Library

```tsx
// components/domain/__tests__/TransactionItem.test.tsx
import { render, fireEvent, screen } from '@testing-library/react-native'
import { TransactionItem } from '../TransactionItem'
import { mockTransaction } from '@/tests/factories/transaction.factory'

describe('TransactionItem', () => {
  it('exibe descrição e valor formatado', () => {
    const transaction = mockTransaction({ amount: 5000, type: 'expense' })
    render(<TransactionItem transaction={transaction} />)

    expect(screen.getByText(transaction.description)).toBeTruthy()
    expect(screen.getByText('− R$ 50,00')).toBeTruthy()
  })

  it('chama onDelete com id correto ao pressionar', () => {
    const onDelete = jest.fn()
    const transaction = mockTransaction()
    render(<TransactionItem transaction={transaction} onDelete={onDelete} />)

    fireEvent.press(screen.getByTestId('delete-btn'))
    expect(onDelete).toHaveBeenCalledWith(transaction.id)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('não renderiza botão delete quando onDelete não é passado', () => {
    const transaction = mockTransaction()
    render(<TransactionItem transaction={transaction} />)

    expect(screen.queryByTestId('delete-btn')).toBeNull()
  })
})
```

### Factory para dados de teste

```typescript
// tests/factories/transaction.factory.ts
import type { Transaction } from '@/types/domain/transaction'

let seq = 0
export function mockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  seq++
  return {
    id: `txn-${seq.toString().padStart(3, '0')}`,
    description: 'Supermercado',
    amount: 15000,
    category: { id: 'cat-001', name: 'Alimentação' },
    date: new Date('2026-02-01'),
    type: 'expense',
    ...overrides,
  }
}
```

### Regras de testes

| Regra | Detalhe |
|:------|:--------|
| `screen.getByTestId` ou `screen.getByText` | Não selecionar por classe ou atributo interno |
| `testID` em elementos de interação | Sempre presente em botões, inputs, touchables |
| Factories para todos os tipos | Sem literais inline nos testes |
| Mockar services, não implementação | `jest.mock('@/services/transaction.service')` |
| Sem `setTimeout` em testes | Usar `act()` ou `waitFor()` |
| Testar comportamento, não estado interno | O que o usuário vê, não `component.state` |

---

## 10. Performance

### `React.memo` para componentes de lista

```tsx
import { memo } from 'react'

// ✅ Evita re-render quando props não mudam
export const TransactionItem = memo(function TransactionItem({ transaction, onDelete }: Props) {
  return (/* ... */)
})
```

### `useCallback` para handlers em listas

```tsx
// ✅ handler estável — TransactionItem não re-renderiza desnecessariamente
const handleDelete = useCallback((id: string) => {
  remove(id)
}, [remove])

<FlatList
  data={transactions}
  renderItem={({ item }) => (
    <TransactionItem transaction={item} onDelete={handleDelete} />
  )}
/>
```

### `FlatList` para listas longas — nunca `ScrollView` + `map`

```tsx
// ❌ ScrollView renderiza todos os itens de uma vez
<ScrollView>
  {transactions.map(t => <TransactionItem key={t.id} transaction={t} />)}
</ScrollView>

// ✅ FlatList virtualiza — só renderiza o visível
<FlatList
  data={transactions}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <TransactionItem transaction={item} onDelete={handleDelete} />}
  getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
  initialNumToRender={15}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Regras de performance

| Regra | Detalhe |
|:------|:--------|
| `FlatList` para listas > 20 itens | Virtualização obrigatória |
| `React.memo` em componentes de lista | Evita re-render no scroll |
| `getItemLayout` quando altura é fixa | Elimina salto de scroll |
| `useCallback` para callbacks em `renderItem` | Referência estável |
| Imagens com `expo-image` | Lazy load, cache automático, placeholder |
| Animações com `react-native-reanimated` | Roda na thread nativa — nunca `Animated` do core para UI complexa |
| Evitar re-renders em cascata | Checar com React DevTools Profiler |

---

## 11. Segurança

### Tokens em `expo-secure-store` obrigatório

```typescript
import * as SecureStore from 'expo-secure-store'

// ✅ Keychain (iOS) / Keystore (Android)
await SecureStore.setItemAsync('access_token', token)
const token = await SecureStore.getItemAsync('access_token')
await SecureStore.deleteItemAsync('access_token')

// ❌ PROIBIDO — AsyncStorage não é criptografado
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('token', token)
```

### Variáveis de ambiente

```bash
# .env (nunca commitado)
EXPO_PUBLIC_API_URL=https://api.auraxis.app

# Acesso no código
const API_URL = process.env.EXPO_PUBLIC_API_URL
```

Prefixo `EXPO_PUBLIC_` expõe para o bundle client-side. Para variáveis que não devem estar no bundle, usar apenas no servidor/build.

### Regras de segurança

| Regra | Detalhe |
|:------|:--------|
| Nunca `AsyncStorage` para dados sensíveis | `expo-secure-store` sempre |
| Nunca secrets em código | Variáveis de ambiente |
| Nunca logar dados de usuário | `console.log(user)` — proibido em produção |
| Nunca `eval()` | Sem execução dinâmica de código |
| `app.json` nunca com secrets | Arquivo commitado e visível |
| `certificate pinning` (futuro) | Avaliar para versão de produção |

---

## 12. Quality Gates

Execute antes de **todo commit**, nesta ordem:

```bash
# 1. Lint
npm run lint

# 2. Type-check
npx tsc --noEmit

# 3. Testes
npx jest --passWithNoTests

# Combinado:
npm run lint && npx tsc --noEmit && npx jest --passWithNoTests
```

**Falha em qualquer gate = não commitar.**

> Build nativo (EAS Build) **não** é gate de commit local. Apenas gate de CI.

Para referência completa dos thresholds e CI: `.context/quality_gates.md`

---

## 13. Erros comuns e como evitar

| Erro | Causa | Solução |
|:-----|:------|:--------|
| `Cannot update unmounted component` | setState após navegação/desmontagem | Usar `AbortController` ou flag `isMounted` nos fetches |
| Re-renders em cascata | Objeto/função recriado a cada render como prop | `useMemo` / `useCallback` / `React.memo` |
| Tela branca sem mensagem de erro | Exception não tratada em hook | `try/catch` + estado `error` em todo hook com fetch |
| Token expirado silencioso | Sem interceptor de 401 | Interceptor no `api-client` que chama `logout()` em 401 |
| Teclado sobrepõe input | Sem `KeyboardAvoidingView` | Envolver formulários com `KeyboardAvoidingView behavior="padding"` |
| Imagem com borda pixelada | `borderRadius` sem `overflow: 'hidden'` | Adicionar `overflow: 'hidden'` no container da imagem |
| Deep link não funciona | `scheme` incorreto no `app.json` | Conferir `"scheme": "auraxisapp"` e testar com `npx uri-scheme` |
| `StyleSheet` em loop | StyleSheet.create dentro de componente | Mover para fora do componente — executar uma vez |
| Expo Router 404 em rota dinâmica | Arquivo `[id].tsx` faltando | Criar `[id].tsx` no diretório correto |
| `any` silencioso | `strict` não ativo | Confirmar `"strict": true` no `tsconfig.json` |

---

## Referências

- Governança: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `../CLAUDE.md`
- Quality gates: `.context/quality_gates.md`
- Tasks: `tasks.md`
- Expo Router docs: https://docs.expo.dev/router/introduction/
- React Native docs: https://reactnative.dev/docs/getting-started
