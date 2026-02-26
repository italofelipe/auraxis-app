# CODING_STANDARDS.md — auraxis-app

> Manual canônico de padrões de código para o aplicativo mobile do Auraxis.
> Stack: React Native 0.81.5 · Expo SDK 54 · TypeScript strict · Expo Router v6 · React Native Paper · TanStack Query
>
> Este documento define **como escrever código** neste repo. Não é opcional.
> Cada seção tem regras (**deve/nunca**) e exemplos práticos.

---

## Índice

1. [Princípios fundamentais](#1-princípios-fundamentais)
2. [TypeScript](#2-typescript)
3. [Componentes React Native](#3-componentes-react-native)
4. [Hooks customizados](#4-hooks-customizados)
5. [Navegação (Expo Router)](#5-navegação-expo-router)
6. [Serviços HTTP](#6-serviços-http)
7. [Estado e contexto](#7-estado-e-contexto)
8. [Estilização](#8-estilização)
9. [Testes](#9-testes)
10. [Performance](#10-performance)
11. [Segurança](#11-segurança)
12. [Quality Gates](#12-quality-gates)
13. [Referência de nomenclatura](#13-referência-de-nomenclatura)

---

## 1. Princípios fundamentais

| Princípio | Significado prático |
|:----------|:--------------------|
| **Explícito > Implícito** | Prefira verbosidade legível a magic strings ou inferências silenciosas |
| **Responsabilidade única** | Um arquivo = um propósito. Componente renderiza. Hook isola lógica. Serviço faz HTTP. |
| **Falha rápida** | Validação no limite do sistema (serviços), não espalhada nos componentes |
| **Sem lógica de negócio no front** | Toda regra de negócio fica em auraxis-api. Front exibe e navega. |
| **Plataforma primeiro** | Use APIs nativas do RN (`FlatList`, `Pressable`, `ActivityIndicator`) antes de libs externas |
| **Segurança por padrão** | Token em `expo-secure-store`, nunca em `AsyncStorage` |

---

## 1.1 Design System e UI Stack (obrigatório)

- Paleta oficial: `#262121`, `#ffbe4d`, `#413939`, `#0b0909`, `#ffd180`, `#ffab1a`.
- Tipografia oficial: `Playfair Display` (headings) + `Raleway` (body).
- Grid base: `8px` (layout em múltiplos de 8).
- Componentes base mobile devem derivar de React Native Paper customizado.
- Componentes de produto devem usar primariamente React Native Paper; componentes custom só por extensão/composição com wrappers internos.
- É proibido usar valores literais de cor, spacing, radius, shadow, font-size e line-height em telas/componentes. Sempre usar tokens.
- Tailwind é proibido no app.
- Server-state deve preferir `@tanstack/react-query` para integração com API.

---

## 2. TypeScript

### 2.1 Configuração obrigatória

```json
// tsconfig.json — não modificar sem aprovação
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2.2 Regras gerais

**DEVE:**

```typescript
// ✅ Tipos explícitos em interfaces
interface InvestorProfile {
  id: string
  name: string
  riskScore: number
  profileType: 'conservative' | 'moderate' | 'aggressive'
}

// ✅ Retorno explícito em funções utilitárias e hooks
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

// ✅ Props com interface nomeada
interface PortfolioCardProps {
  portfolio: Portfolio
  onPress: (id: string) => void
  isLoading?: boolean
}

// ✅ Union types para estados finitos
type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// ✅ Genéricos com restrição
function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id)
}
```

**NUNCA:**

```typescript
// ❌ any
const data: any = response.data

// ❌ type assertion sem validação
const user = response as User

// ❌ Non-null assertion sem garantia
const name = user!.name

// ❌ Enum (use union type)
enum Status { Active, Inactive }  // ❌
type Status = 'active' | 'inactive'  // ✅

// ❌ Props inline
const Card = ({ title, value }: { title: string; value: number }) => {}  // ❌ para componentes públicos

// ❌ Ignorar erros TypeScript
// @ts-ignore
// @ts-expect-error (só permitido em testes, com comentário explicativo)
```

### 2.3 Separação de tipos

```
types/
  api/        # Resposta crua da API (sufixo Response)
    portfolio.response.ts
  domain/     # Entidades de domínio limpas (sem sufixo)
    portfolio.ts
  ui/         # Props e estado local (sufixo Props, State)
    portfolio-card.props.ts
```

```typescript
// types/api/portfolio.response.ts
export interface PortfolioResponse {
  id: string
  name: string
  total_value: number       // snake_case da API
  created_at: string        // ISO string da API
}

// types/domain/portfolio.ts
export interface Portfolio {
  id: string
  name: string
  totalValue: number        // camelCase no domínio
  createdAt: Date           // Date no domínio
}
```

---

## 3. Componentes React Native

### 3.1 Estrutura canônica

Todo componente segue esta ordem:

```typescript
// components/portfolio/PortfolioCard.tsx
import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

// ---- 1. Imports --------------------------------------------------------

import { usePortfolioCard } from '@/hooks/usePortfolioCard'
import { formatCurrency } from '@/utils/format'
import type { Portfolio } from '@/types/domain/portfolio'
import { colors, spacing, typography } from '@/constants/theme'

// ---- 2. Interface de props ---------------------------------------------

interface PortfolioCardProps {
  portfolio: Portfolio
  onPress: (id: string) => void
  testID?: string
}

// ---- 3. Componente -----------------------------------------------------

export function PortfolioCard({ portfolio, onPress, testID }: PortfolioCardProps) {
  // 3a. Hooks
  const { isExpanded, toggleExpand } = usePortfolioCard(portfolio.id)

  // 3b. Handlers
  const handlePress = useCallback(() => {
    onPress(portfolio.id)
  }, [onPress, portfolio.id])

  // 3c. Derivações simples
  const formattedValue = formatCurrency(portfolio.totalValue, 'BRL')

  // 3d. Render
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
      testID={testID ?? `portfolio-card-${portfolio.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Portfólio ${portfolio.name}`}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{portfolio.name}</Text>
        <Text style={styles.value}>{formattedValue}</Text>
      </View>
    </Pressable>
  )
}

// ---- 4. Estilos --------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.body1,
    color: colors.textPrimary,
  },
  value: {
    ...typography.body1Bold,
    color: colors.textPrimary,
  },
})
```

### 3.2 Regras de componentes

**DEVE:**

- Componentes são **funções nomeadas** (`export function X`, não `export default`)
- Props tipadas com `interface`, nunca inline
- Usar `Pressable` em vez de `TouchableOpacity` (React Native moderno)
- Atributos de acessibilidade em elementos interativos (`accessibilityRole`, `accessibilityLabel`)
- `testID` em elementos interativos para testes
- Usar `useCallback` em handlers passados como prop para evitar re-renders
- `StyleSheet.create({})` — sempre, mesmo para um estilo único
- Exportação nomeada, nunca default (facilita refactoring e tree-shaking)

**NUNCA:**

```typescript
// ❌ default export
export default function Card() {}

// ❌ Estilos inline (salvo valores dinâmicos que PRECISAM ser inline)
<View style={{ padding: 16, backgroundColor: '#fff' }}>

// ❌ Lógica de negócio no componente
function PortfolioCard({ portfolioId }: Props) {
  const [portfolio, setPortfolio] = useState(null)
  useEffect(() => {
    fetch(`/api/portfolios/${portfolioId}`)  // ❌ HTTP no componente
      .then(r => r.json())
      .then(setPortfolio)
  }, [portfolioId])
}

// ❌ Mutação de estado direta
state.portfolios.push(newPortfolio)  // ❌

// ❌ console.log em produção
console.log('debug:', data)  // ❌ usar __DEV__ se necessário

// ❌ Ignorar dependências do useEffect
useEffect(() => {
  fetchData(id)
}, [])  // ❌ id faltando nas deps
```

### 3.3 Componentes com dados assíncronos

```typescript
// ✅ Padrão correto: hook isola o fetch, componente renderiza
function PortfolioScreen() {
  const { portfolios, isLoading, error, refetch } = usePortfolios()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />

  return (
    <FlatList
      data={portfolios}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PortfolioCard portfolio={item} onPress={navigateToDetail} />
      )}
      ListEmptyComponent={<EmptyState message="Nenhum portfólio encontrado" />}
    />
  )
}
```

### 3.4 Memoização

```typescript
// ✅ Memoizar componentes que recebem props estáveis e re-renderizam com frequência
export const PortfolioCard = React.memo(function PortfolioCard({ portfolio, onPress }: Props) {
  // ...
})

// ✅ useMemo para computações custosas
const sortedPortfolios = useMemo(
  () => [...portfolios].sort((a, b) => b.totalValue - a.totalValue),
  [portfolios]
)

// ✅ useCallback para handlers passados como prop
const handlePress = useCallback((id: string) => {
  router.push(`/portfolios/${id}`)
}, [router])
```

---

## 4. Hooks customizados

### 4.1 Estrutura canônica

```typescript
// hooks/usePortfolios.ts
import { useCallback, useEffect, useState } from 'react'
import { portfolioService } from '@/services/portfolioService'
import type { Portfolio } from '@/types/domain/portfolio'

// ---- Interface de retorno explícita ------------------------------------

interface UsePortfoliosReturn {
  portfolios: Portfolio[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// ---- Hook --------------------------------------------------------------

export function usePortfolios(): UsePortfoliosReturn {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await portfolioService.list()
      setPortfolios(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar portfólios'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  return {
    portfolios,
    isLoading,
    error,
    refetch: fetchPortfolios,
  }
}
```

### 4.2 Regras de hooks

**DEVE:**
- Nome sempre começa com `use`
- Retorno tipado com interface explícita
- Erros capturados internamente — componente recebe `error: Error | null`
- `useCallback` em funções retornadas pelo hook
- Um arquivo por hook

**NUNCA:**
- Retornar valores mutáveis sem wrapper (`Dispatch` setState pode ser exposto, mas documente)
- Hooks com efeitos colaterais fora de `useEffect`
- Chamar hooks condicionalmente

---

## 5. Navegação (Expo Router)

### 5.1 Estrutura de rotas

```
app/
  _layout.tsx           # Root layout (providers globais, fonte)
  (auth)/               # Grupo de autenticação (não aparece na URL)
    _layout.tsx         # AuthLayout — redireciona autenticados para (tabs)
    login.tsx
    register.tsx
  (tabs)/               # Grupo principal (bottom tabs)
    _layout.tsx         # TabsLayout — configuração das tabs
    index.tsx           # /  (dashboard)
    portfolios/
      _layout.tsx
      index.tsx         # /portfolios
      [id].tsx          # /portfolios/:id
    profile.tsx         # /profile
  +not-found.tsx        # 404
```

### 5.2 Auth guard

```typescript
// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <SplashScreen />
  if (isAuthenticated) return <Redirect href="/(tabs)/" />

  return <Stack screenOptions={{ headerShown: false }} />
}
```

### 5.3 Navegação tipada

```typescript
// ✅ Usar tipagem de rotas do Expo Router
import { router } from 'expo-router'
import type { Href } from 'expo-router'

// Navegação programática
router.push('/portfolios/abc123')
router.replace('/(auth)/login')

// ✅ Params tipados em telas dinâmicas
import { useLocalSearchParams } from 'expo-router'

interface PortfolioDetailParams {
  id: string
}

export default function PortfolioDetailScreen() {
  const { id } = useLocalSearchParams<PortfolioDetailParams>()
  // id é string garantido pelo tipo
}
```

### 5.4 Screen options

```typescript
// ✅ Metadata de tela na própria tela (não no layout)
import { Stack } from 'expo-router'

export default function PortfolioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Detalhes do Portfólio',
          headerBackTitle: 'Portfólios',
        }}
      />
      {/* conteúdo */}
    </>
  )
}
```

---

## 6. Serviços HTTP

### 6.1 Client base

```typescript
// services/api-client.ts
import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new ApiError(error.message ?? 'Erro na requisição', response.status)
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### 6.2 Serviço de domínio

```typescript
// services/portfolioService.ts
import { apiRequest } from './api-client'
import type { PortfolioResponse } from '@/types/api/portfolio.response'
import type { Portfolio } from '@/types/domain/portfolio'

// ---- Mapper: API → Domínio ---------------------------------------------

function toPortfolio(raw: PortfolioResponse): Portfolio {
  return {
    id: raw.id,
    name: raw.name,
    totalValue: raw.total_value,
    createdAt: new Date(raw.created_at),
  }
}

// ---- Serviço -----------------------------------------------------------

export const portfolioService = {
  async list(): Promise<Portfolio[]> {
    const raw = await apiRequest<PortfolioResponse[]>('/v1/portfolios')
    return raw.map(toPortfolio)
  },

  async getById(id: string): Promise<Portfolio> {
    const raw = await apiRequest<PortfolioResponse>(`/v1/portfolios/${id}`)
    return toPortfolio(raw)
  },

  async create(payload: CreatePortfolioPayload): Promise<Portfolio> {
    const raw = await apiRequest<PortfolioResponse>('/v1/portfolios', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return toPortfolio(raw)
  },
}
```

### 6.3 Regras de serviços

**DEVE:**
- Um arquivo por domínio: `portfolioService.ts`, `authService.ts`, `userService.ts`
- Mapper `toX(raw: XResponse): X` para cada entidade — isola a API do domínio
- Erros propagados como `ApiError` (não silenciados)
- Token sempre via `expo-secure-store`, nunca hardcoded
- Tipos de resposta em `types/api/`, tipos de domínio em `types/domain/`

**NUNCA:**
- Lógica de apresentação em serviços (sem `formatCurrency`, `toDateString`)
- Estado local em serviços (sem `useState`, sem variáveis de módulo que acumulam dados)
- `console.log` em produção (use `__DEV__ && console.log(...)` se necessário)

---

## 7. Estado e contexto

### 7.1 Hierarquia de estado

```
Nível           Onde fica           Exemplo
──────────────────────────────────────────────────────────────
Local UI        useState no comp.   modal aberto, item selecionado
Tela/Feature    hook customizado    dados do portfólio + loading
Global authn    AuthContext         usuário autenticado, token
Global app      AppContext          tema, locale, preferências
```

### 7.2 AuthContext canônico

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authService } from '@/services/authService'
import type { User } from '@/types/domain/user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restaurar sessão ao abrir o app
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('auth_token')
        if (token) {
          const me = await authService.getMe()
          setUser(me)
        }
      } catch {
        await SecureStore.deleteItemAsync('auth_token')
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedUser } = await authService.login({ email, password })
    await SecureStore.setItemAsync('auth_token', token)
    setUser(loggedUser)
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
```

### 7.3 Regras de estado

**DEVE:**
- `AuthContext` é o único estado global de autenticação
- Preferir hooks por feature a Context para estado local de tela
- Persistência segura sempre via `expo-secure-store`
- Context separado por domínio (não um "God Context" global)

**NUNCA:**
- `AsyncStorage` para tokens JWT ou dados sensíveis
- Estado derivável como estado (`const doubled = count * 2` — computed, não state)
- Prop drilling além de 2 níveis (criar Context ou hook compartilhado)

---

## 8. Estilização

### 8.1 Design system

```typescript
// constants/theme.ts
export const colors = {
  // Brand
  primary: '#ffab1a',
  primaryDark: '#ffbe4d',
  secondary: '#ffd180',

  // Semantic
  success: '#ffbe4d',
  error: '#ffab1a',
  warning: '#ffd180',
  info: '#ffbe4d',

  // Neutros
  background: '#0b0909',
  surface: '#262121',
  border: '#413939',
  textPrimary: '#ffd180',
  textSecondary: '#ffbe4d',
  textDisabled: '#413939',
} as const

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40, fontFamily: 'PlayfairDisplay-Bold' },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, fontFamily: 'PlayfairDisplay-Bold' },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, fontFamily: 'PlayfairDisplay-SemiBold' },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily: 'Raleway-Regular' },
  body1Bold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, fontFamily: 'Raleway-SemiBold' },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, fontFamily: 'Raleway-Regular' },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, fontFamily: 'Raleway-Regular' },
} as const

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const
```

### 8.2 StyleSheet.create

```typescript
// ✅ Correto — sempre StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
})

// ❌ Nunca estilos inline sem necessidade
<View style={{ flex: 1, padding: 16 }}>

// ✅ Estilos dinâmicos — inline somente quando o valor muda em runtime
<View style={[styles.container, { opacity: isVisible ? 1 : 0 }]}>
```

### 8.3 Regras de estilização

**DEVE:**
- Toda cor, espaçamento e tipografia via `constants/theme.ts`
- `StyleSheet.create({})` para todos os estilos estáticos
- Respeitar `SafeAreaView` / `useSafeAreaInsets` em todas as telas
- Usar `Platform.select` para diferenças iOS/Android quando necessário
- Testar em ambas as plataformas antes de commitar

**NUNCA:**
- Valores mágicos: `padding: 16` (use `spacing.md`)
- Cores hardcoded: `color: '#ffab1a'` (use `colors.primary`)
- `position: 'absolute'` sem comentário explicando por quê
- Ignorar suporte a dark mode se o design system suportar

---

## 9. Testes

> **Por que jest-expo e não Vitest?**
> Vitest não tem suporte oficial a React Native. O `@testing-library/react-native` é incompatível
> com o Vitest runtime. A biblioteca não-oficial `vitest-react-native` está abandonada (2 anos,
> 0 dependentes). O `jest-expo` resolve módulos `.ios.tsx`/`.android.tsx`, mocka o SDK do Expo
> e configura transformações específicas de plataforma. Esta escolha é definitiva enquanto o
> ecossistema RN não oferecer suporte nativo ao Vitest.

### 9.1 O que testar

| Alvo | Ferramenta | Obrigatório |
|:-----|:-----------|:-----------:|
| Hooks customizados (`hooks/`) | jest-expo + `renderHook` | ✅ |
| Utilitários (`utils/`) | jest-expo | ✅ |
| Serviços HTTP | jest-expo (`jest.mock('fetch')`) | ✅ |
| Componentes com lógica condicional | jest-expo + @testing-library/react-native | ✅ |
| Fluxos críticos (login, pagamento) | Detox E2E (quando macOS runner disponível) | ✅ |
| Componentes de apresentação pura | jest-expo | ⚠️ Opcional |
| Navegação (Expo Router) | Mock em `jest.setup.ts` | ⚠️ Opcional |

### 9.2 Configuração

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|expo|@expo|@unimodules|' +
      'sentry-expo|native-base|react-navigation|@react-navigation|' +
      'expo-router|expo-modules-core|expo-font|expo-asset|expo-constants|' +
      'expo-file-system|expo-secure-store' +
    ')/)',
  ],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.ts',
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/imageMock.ts',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    global: { lines: 85, functions: 85, statements: 85, branches: 85 },
  },
}
```

### 9.3 Mocks disponíveis (jest.setup.ts)

| Mock | O que fornece |
|:-----|:-------------|
| `expo-router` | `useRouter`, `useLocalSearchParams`, `Link`, `Stack`, `Tabs` |
| `expo-constants` | `expoConfig.name`, `expoConfig.slug` |
| `__mocks__/svgMock.ts` | `<View testID="svg-mock" />` |
| `__mocks__/imageMock.ts` | string `'image-mock'` |
| `@testing-library/jest-native` | `toBeVisible`, `toHaveText`, `toBeOnTheScreen`, etc. |

Para mockar módulo nativo adicional:
```typescript
// jest.setup.ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))
```

### 9.4 Teste de componente

```typescript
// components/portfolio/__tests__/PortfolioCard.test.tsx
import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { PortfolioCard } from '../PortfolioCard'
import type { Portfolio } from '@/types/domain/portfolio'

// ---- Factory -----------------------------------------------------------

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'portfolio-1',
    name: 'Renda Fixa',
    totalValue: 10000,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// ---- Testes ------------------------------------------------------------

describe('PortfolioCard', () => {
  it('renderiza nome e valor do portfólio', () => {
    const portfolio = makePortfolio({ name: 'Renda Variável', totalValue: 25000 })
    render(<PortfolioCard portfolio={portfolio} onPress={jest.fn()} />)
    expect(screen.getByText('Renda Variável')).toBeOnTheScreen()
    expect(screen.getByText(/R\$ 25\.000/)).toBeOnTheScreen()
  })

  it('chama onPress com o id ao pressionar', () => {
    const onPress = jest.fn()
    const portfolio = makePortfolio({ id: 'port-abc' })
    render(<PortfolioCard portfolio={portfolio} onPress={onPress} />)
    fireEvent.press(screen.getByTestId('portfolio-card-port-abc'))
    expect(onPress).toHaveBeenCalledWith('port-abc')
  })

  it('exibe estado de loading', () => {
    render(<PortfolioCard portfolio={makePortfolio()} onPress={jest.fn()} isLoading />)
    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen()
  })
})
```

### 9.5 Teste de hooks

```typescript
// hooks/__tests__/usePortfolios.test.ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { usePortfolios } from '../usePortfolios'
import { portfolioService } from '@/services/portfolioService'

jest.mock('@/services/portfolioService')
const mockService = portfolioService as jest.Mocked<typeof portfolioService>

describe('usePortfolios', () => {
  it('carrega portfólios com sucesso', async () => {
    const portfolios = [makePortfolio(), makePortfolio({ id: 'port-2' })]
    mockService.list.mockResolvedValue(portfolios)

    const { result } = renderHook(() => usePortfolios())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.portfolios).toEqual(portfolios)
    expect(result.current.error).toBeNull()
  })

  it('expõe erro quando o serviço falha', async () => {
    mockService.list.mockRejectedValue(new Error('Servidor indisponível'))

    const { result } = renderHook(() => usePortfolios())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error?.message).toBe('Servidor indisponível')
    expect(result.current.portfolios).toEqual([])
  })
})
```

### 9.6 Regras de testes

**DEVE:**
- Testar **comportamento**, não implementação (`fireEvent.press`, não `instance.handlePress()`)
- `testID` em todo elemento interativo — seletor estável para RNTL e Detox
- Factories para criar dados (`makePortfolio`, `makeUser`) — sem objeto literal inline nos testes
- Mock de serviços nos testes de hooks e telas
- Cobrir: happy path, erro de rede, estado vazio, estado de loading

**NUNCA:**
- `act()` manual desnecessário — RNTL envolve automaticamente
- Snapshots como teste principal — use assertions explícitas
- Testar detalhes internos de hooks (`result.current._internalState`)
- `waitFor` com sleep manual (`await new Promise(r => setTimeout(r, 1000))`)
- Testar estilos visuais — use Storybook ou testes visuais dedicados

---

## 10. Performance

### 10.1 Listas

```typescript
// ✅ FlatList para listas longas — NUNCA ScrollView + map
<FlatList
  data={portfolios}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <PortfolioCard portfolio={item} onPress={handlePress} />}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews
  ListEmptyComponent={<EmptyState />}
  ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
/>

// ❌ Nunca para listas com dados dinâmicos
<ScrollView>
  {portfolios.map(p => <PortfolioCard key={p.id} portfolio={p} />)}
</ScrollView>
```

### 10.2 Imagens

```typescript
// ✅ Usar expo-image (lazy load, cache automático)
import { Image } from 'expo-image'

<Image
  source={{ uri: user.avatarUrl }}
  style={styles.avatar}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>

// ❌ Evitar Image do React Native para conteúdo remoto
import { Image } from 'react-native'  // ❌ sem lazy load nativo
```

### 10.3 Interações

```typescript
// ✅ useCallback em handlers passados para componentes filhos
const handlePortfolioPress = useCallback((id: string) => {
  router.push(`/portfolios/${id}`)
}, [router])

// ✅ useMemo para listas derivadas custosas
const sortedAndFilteredPortfolios = useMemo(
  () =>
    portfolios
      .filter((p) => p.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue),
  [portfolios]
)

// ✅ React.memo em componentes de lista
export const PortfolioCard = React.memo(PortfolioCardComponent)
```

### 10.4 Métricas obrigatórias

| Métrica | Target |
|:--------|:-------|
| Cold start (app launch → interativo) | < 2s |
| Transição de tela | < 300ms |
| FPS em scroll de lista | ≥ 60fps |
| JS bundle size | < 500KB gzip |
| Re-renders desnecessários | 0 (verificar com React DevTools Profiler) |

---

## 11. Segurança

### 11.1 Armazenamento seguro

```typescript
// ✅ SEMPRE expo-secure-store para dados sensíveis
import * as SecureStore from 'expo-secure-store'

// Salvar token
await SecureStore.setItemAsync('auth_token', token)

// Ler token
const token = await SecureStore.getItemAsync('auth_token')

// Remover token (logout)
await SecureStore.deleteItemAsync('auth_token')

// ❌ NUNCA AsyncStorage para tokens
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('auth_token', token)  // ❌ não criptografado
```

### 11.2 Comunicação segura

```typescript
// ✅ HTTPS sempre em produção (garantido via EXPO_PUBLIC_API_URL)
// ✅ Certificate Pinning (para apps com alta sensibilidade financeira)
// A configurar via expo-build-properties + React Native native modules

// ✅ Validar que URL da API vem de variável de ambiente
const BASE_URL = process.env.EXPO_PUBLIC_API_URL
if (!BASE_URL) throw new Error('EXPO_PUBLIC_API_URL não configurado')
```

### 11.3 Dados sensíveis no código

**NUNCA:**
```typescript
// ❌ Hardcoded secrets
const API_KEY = 'abc123secret'

// ❌ Token em variável sem criptografia
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ❌ Logs que expõem dados de usuário
console.log('User data:', user)
console.log('Token:', token)
```

**DEVE:**
```typescript
// ✅ Variáveis de ambiente para configuração
const BASE_URL = process.env.EXPO_PUBLIC_API_URL

// ✅ __DEV__ guard em qualquer log de debug
if (__DEV__) {
  console.log('Debug info:', sanitizedInfo)
}

// ✅ Sanitizar antes de qualquer log
const sanitizedUser = { id: user.id, email: '[REDACTED]' }
```

### 11.4 Deep links e inputs externos

```typescript
// ✅ Validar params de rotas antes de usar
const { id } = useLocalSearchParams<{ id: string }>()
if (!id || typeof id !== 'string') {
  router.replace('/not-found')
  return null
}

// ✅ Validar URLs externas antes de abrir
import { Linking } from 'react-native'
const ALLOWED_DOMAINS = ['auraxis.com.br', 'api.auraxis.com.br']

async function openExternalUrl(url: string) {
  const parsed = new URL(url)
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) return
  await Linking.openURL(url)
}
```

---

## 12. Quality Gates

### 12.1 Gates locais (antes de todo commit — obrigatório)

```bash
# Comando único — roda tudo:
npm run quality-check
# = npm run lint && npm run typecheck && npm run test:coverage

# Individualmente:
npm run lint           # ESLint (--max-warnings 0)
npm run typecheck      # tsc --noEmit
npm run test           # jest-expo (todos os testes)
npm run test:coverage  # jest-expo + coverage report
npm run test:watch     # modo watch durante desenvolvimento

# Arquivo específico:
npx jest src/hooks/useBalance.test.ts --watch

# Limpar cache (quando módulos mudam):
npx jest --clearCache
```

| Gate | Threshold | Bloqueia |
|:-----|:----------|:---------|
| ESLint | 0 erros, 0 warnings | commit (lint-staged) + CI |
| TypeScript | 0 erros | commit (pre-push) + CI |
| jest-expo — testes | 100% passando | CI |
| jest-expo — lines | ≥ 85% | CI |
| jest-expo — functions | ≥ 85% | CI |
| jest-expo — statements | ≥ 85% | CI |
| jest-expo — branches | ≥ 85% | CI |

### 12.2 Pre-commit hooks (husky + lint-staged)

```javascript
// lint-staged.config.js
module.exports = {
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0 --no-warn-ignored',
  ],
  '**/*.{json,md}': [
    'prettier --write',
  ],
}
```

Hooks ativos:
- `pre-commit` → lint-staged (ESLint + Prettier nos arquivos staged)
- `commit-msg` → commitlint (Conventional Commits)
- `pre-push` → `tsc --noEmit` + `jest --passWithNoTests`

### 12.3 Gates de CI (GitHub Actions — 10 jobs)

```
push / PR → master
│
├── lint              (ESLint — 0 erros, --max-warnings 0)
├── typecheck         (tsc --noEmit — 0 erros)
├── test              (jest-expo + coverage ≥ 85%)
│
├── expo-bundle       (export android — valida que bundle JS compila)
│   └── bundle-analysis   (comenta tamanho no PR; hard limit 6 MB)
│
├── secret-scan-gitleaks    (0 secrets — bloqueia)
├── secret-scan-trufflehog  (0 secrets validados — bloqueia)
├── audit             (npm audit --audit-level=high — bloqueia)
├── sonarcloud        (análise estática + hotspots de segurança)
└── commitlint        (apenas em PR — Conventional Commits)

```

Workflows adicionais:
- `dependency-review.yml` — bloqueia PRs com CVEs ≥ high em novas deps
- `auto-merge.yml` — auto squash-merge de PRs Dependabot (patch; não react-native/react minor)

### 12.4 Roadmap de gates (pendentes)

| Item | Situação | Quando implementar |
|:-----|:---------|:-------------------|
| Detox E2E no CI | Scaffold pronto — requer macOS runner | APP5 / Fase Beta |
| EAS Build gate | Requer conta EAS | APP5 |
| EAS Update / OTA | Requer aprovação de release | Pós-MVP |
| Sentry (error tracking) | A integrar | APP3+ |
| Stryker (mutation testing) | A avaliar | APP5+ |

> **Build nativo (EAS) não faz parte do gate de commit local** — apenas CI/EAS Cloud.

---

## 13. Referência de nomenclatura

| Elemento | Convenção | Exemplo |
|:---------|:----------|:--------|
| Componente | PascalCase | `PortfolioCard`, `LoadingSpinner` |
| Hook | camelCase com `use` | `usePortfolios`, `useAuth` |
| Serviço | camelCase + `Service` | `portfolioService`, `authService` |
| Context | PascalCase + `Context` | `AuthContext`, `ThemeContext` |
| Provider | PascalCase + `Provider` | `AuthProvider` |
| Interface de props | PascalCase + `Props` | `PortfolioCardProps` |
| Interface de retorno de hook | PascalCase + `Return` | `UsePortfoliosReturn` |
| Tipo de API | PascalCase + `Response` | `PortfolioResponse` |
| Arquivo de componente | PascalCase | `PortfolioCard.tsx` |
| Arquivo de hook | camelCase | `usePortfolios.ts` |
| Arquivo de serviço | camelCase | `portfolioService.ts` |
| Arquivo de tipo | kebab-case | `portfolio.response.ts`, `portfolio.ts` |
| Arquivo de teste | `*.test.tsx` | `PortfolioCard.test.tsx` |
| Diretório de testes | `__tests__/` | `components/portfolio/__tests__/` |
| Constante global | camelCase | `colors.primary`, `spacing.md` |
| Variável de ambiente | `EXPO_PUBLIC_*` | `EXPO_PUBLIC_API_URL` |
| Branch git | `tipo/escopo` | `feat/portfolio-detail-screen` |
| testID | kebab-case descritivo | `portfolio-card-abc123`, `login-button` |

---

---

## 14. Arquitetura feature-based

> Regra central: **features não importam de outras features.**
> Todo compartilhamento passa por `shared/`.

```
src/
  shared/
    components/        ← Button, Input, Card (sem lógica de negócio)
    hooks/             ← useDebounce, useLocalStorage (agnósticos de domínio)
    theme/             ← TODOS os tokens de design (ver seção 15)
    types/             ← tipos globais compartilhados
    utils/             ← funções puras agnósticas
    constants/         ← constantes globais

  features/
    auth/
      components/      ← LoginForm, PinPad (só usados por auth)
      hooks/           ← useAuth, useSession, useOTP
      screens/         ← LoginScreen, ForgotPasswordScreen
      services/        ← authService (chama a API)
      types/           ← AuthUser, LoginPayload, SessionToken
      tests/           ← unitários co-localizados
      e2e/             ← specs Detox desta feature
    transactions/
      ...

  app/                 ← Expo Router: routing, providers, _layout.tsx
```

**Regra de importação:**

```typescript
// ✅ Feature importa de shared
import { Button } from '@/shared/components/Button'
import { colors } from '@/shared/theme'

// ✅ Feature importa de si mesma
import { useAuth } from '../hooks/useAuth'

// ❌ NUNCA — feature importa de outra feature
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
// ↑ isso em features/auth/ é uma violação
```

---

## 15. Design Tokens — Zero valores hardcoded

Nenhum valor de estilo pode aparecer diretamente em um componente.
Todo valor pertence ao sistema de tokens em `shared/theme/`.

```
shared/theme/
  tokens/
    primitives.ts    ← valores brutos (não usar em componentes)
    semantic.ts      ← tokens semânticos (use estes)
    typography.ts    ← escala tipográfica
    spacing.ts       ← escala de espaçamento
    radius.ts        ← border-radius
    shadows.ts       ← elevações
    motion.ts        ← durações e easings
  index.ts           ← exporta tudo
```

```typescript
// ❌ NUNCA — valores hardcoded
const styles = StyleSheet.create({
  title: { fontSize: 16, color: '#ffab1a', marginTop: 8 }
})

// ✅ SEMPRE — tokens semânticos
import { typography, colors, spacing } from '@/shared/theme'

const styles = StyleSheet.create({
  title: {
    fontSize:  typography.size.md,   // $font-md = 16
    color:     colors.action.primary,
    marginTop: spacing.sm,           // $space-sm = 8
  }
})
```

Hierarquia de tokens:
- **Primitivos** → `color.brandPrimary: '#ffab1a'` — nunca referenciar em componentes
- **Semânticos** → `colors.action.primary: primitives.color.brandPrimary` — usar estes

---

## 16. Limite de arquivo e extração

- **Máximo 250 linhas por arquivo de componente.** Acima disso, algo deve ser extraído.
- Se o componente tem mais de um bloco visual independente → dois componentes.
- Se há lógica reutilizável → hook separado.
- Se há constantes de tema → `shared/theme/`.

```
Sinal de que deve extrair:
  → Arquivo > 250 linhas
  → useState com mais de 3 variáveis relacionadas → hook
  → Bloco de JSX que se repete → subcomponente
  → StyleSheet com > 15 entradas → arquivo de estilo separado ou tokens
```

---

## 17. Zero `any` — TypeScript como Java

`any` é proibido em qualquer forma. O compilador está em `strict: true` e
`noImplicitAny: true`. Trate TypeScript como Java: se não tem tipo, não compila.

```typescript
// ❌ NUNCA
const handle = (data: any) => { ... }
const result = (response as any).payload
const items: object[] = []

// ✅ Discriminated union para estados
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// ✅ unknown com narrowing obrigatório
function parseError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unexpected error'
}

// ✅ satisfies para validar sem perder tipo
const theme = {
  colors: { primary: '#ffab1a' }
} satisfies DeepPartial<ThemeConfig>
```

Tipos de retorno explícitos são obrigatórios em:
- Todos os hooks customizados (interface `Use*Return` exportada)
- Todos os serviços de API
- Todas as funções públicas com lógica não trivial

---

## 18. Perfil ESLint estrito (mix OO + funcional)

Este repositório adota lint **rigoroso** para evitar código solto e manter consistência entre agentes.

Regras obrigatórias de estilo:
- `semi: always`
- `quotes: double`
- `eqeqeq: always`
- `curly: all`
- `no-console` (exceto `warn` e `error`)

Regras obrigatórias de disciplina:
- `complexity <= 12`
- `max-params <= 3`
- `max-lines-per-function <= 80` (ignorando comentários e linhas em branco)
- `max-depth <= 3`
- `max-statements <= 18`
- `consistent-return`

Regras obrigatórias de TypeScript:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars` (prefixo `_` permitido para parâmetros ignorados)
- `@typescript-eslint/consistent-type-imports`

Diretriz arquitetural:
- Em camadas de domínio/aplicação (`services`, `repositories`, `use-cases`), manter design orientado a objeto com alta coesão.
- Em UI/hook (`components`, `hooks`, `app`), permitir estilo funcional, mantendo regras de complexidade e clareza.
- Em testes (`*.test.*`, `*.spec.*`), limites de complexidade e tamanho de função são mais altos para setup de cenário.

---

*Última atualização: 2026-02-24*
*Relacionado: steering.md, .context/quality_gates.md, auraxis-platform/.context/25_quality_security_playbook.md, auraxis-platform/.context/26_frontend_architecture.md*
