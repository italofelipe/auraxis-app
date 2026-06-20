/**
 * Registro de âncoras do tour guiado.
 *
 * Cada alvo da tela registra a si mesmo (uma `View`) sob uma chave estável via
 * {@link useTourAnchor}. O motor mede a âncora registrada através de
 * `measureInWindow` (coordenadas de janela), com fallback central quando o alvo
 * não está montado/visível. Mantemos um `Provider` único montado num ponto que
 * tanto a tela de Cartões quanto a tab bar (FAB) alcançam — assim o FAB, que vive
 * fora da árvore da tela, também pode ser destacado.
 *
 * O contexto NÃO mede no `onLayout`: o `onLayout` apenas serve de gatilho/registro
 * barato; a medição real (em janela) é sob demanda, no momento do passo — nunca
 * dependemos de auto-scroll do layout.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import type { LayoutChangeEvent, View } from "react-native";

import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";

/** Componente que expõe `measureInWindow` (uma `View` nativa). */
export interface MeasurableHandle {
  measureInWindow: (
    // Assinatura fixa de `View.measureInWindow` do React Native (x, y, w, h).
    // eslint-disable-next-line max-params
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/** API devolvida por {@link useTourAnchor} para um alvo se registrar. */
export interface TourAnchorBinding {
  /** Ref a anexar na `View` alvo (`ref={binding.ref}`). */
  readonly ref: (node: MeasurableHandle | null) => void;
  /** Handler a anexar no `onLayout` da `View` alvo (registro barato). */
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

/** Contrato do contexto de âncoras do tour. */
export interface TourAnchorContextValue {
  /** Registra/atualiza o nó medível de uma âncora. */
  readonly register: (key: string, node: MeasurableHandle | null) => void;
  /** Mede a âncora registrada em coordenadas de janela (ou null). */
  readonly measureAnchor: (key: string) => Promise<Rect | null>;
}

/**
 * Valor padrão tolerante: registrar é no-op e medir devolve null. Permite que
 * alvos que usam {@link useTourAnchor} sejam renderizados isoladamente (testes,
 * telas sem o tour montado) sem exigir o provider; o tour real sobrepõe isto.
 */
const DEFAULT_CONTEXT_VALUE: TourAnchorContextValue = {
  register: () => undefined,
  measureAnchor: async () => null,
};

const TourAnchorContext = createContext<TourAnchorContextValue>(
  DEFAULT_CONTEXT_VALUE,
);

/**
 * Promisifica `measureInWindow`, resolvendo um {@link Rect} ou `null` quando o
 * nó não responde (desmontado/sem layout) dentro de um timeout curto.
 *
 * @param node Nó medível registrado.
 * @returns Retângulo em coordenadas de janela, ou null.
 */
const measureNode = (node: MeasurableHandle): Promise<Rect | null> => {
  return new Promise<Rect | null>((resolve) => {
    let settled = false;
    const finish = (rect: Rect | null): void => {
      if (!settled) {
        settled = true;
        resolve(rect);
      }
    };
    // Guarda contra callbacks que nunca disparam (nó fora da árvore nativa).
    const guard = setTimeout(() => finish(null), 400);
    try {
      // eslint-disable-next-line max-params
      node.measureInWindow((x, y, width, height) => {
        clearTimeout(guard);
        finish({ left: x, top: y, width, height });
      });
    } catch {
      clearTimeout(guard);
      finish(null);
    }
  });
};

/**
 * Provider do registro de âncoras. Guarda os nós num `ref` (Map) — registrar uma
 * âncora não deve causar re-render da árvore.
 *
 * @param props Filhos a envolver.
 * @returns Provider com a API de registro/medição.
 */
export function TourAnchorProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const nodesRef = useRef<Map<string, MeasurableHandle>>(new Map());

  const register = useCallback(
    (key: string, node: MeasurableHandle | null): void => {
      if (node === null) {
        nodesRef.current.delete(key);
        return;
      }
      nodesRef.current.set(key, node);
    },
    [],
  );

  const measureAnchor = useCallback(
    async (key: string): Promise<Rect | null> => {
      const node = nodesRef.current.get(key);
      if (node === undefined) {
        return null;
      }
      return measureNode(node);
    },
    [],
  );

  const value = useMemo<TourAnchorContextValue>(
    () => ({ register, measureAnchor }),
    [register, measureAnchor],
  );

  return (
    <TourAnchorContext.Provider value={value}>
      {children}
    </TourAnchorContext.Provider>
  );
}

/**
 * Acessa o contexto de âncoras. Fora de um {@link TourAnchorProvider} devolve o
 * valor padrão tolerante (registrar = no-op, medir = null) — o tour só funciona
 * de fato sob o provider, mas componentes/telas renderizam sem ele.
 *
 * @returns Valor do contexto de âncoras.
 */
export const useTourAnchorContext = (): TourAnchorContextValue => {
  return useContext(TourAnchorContext);
};

/**
 * Hook que um alvo usa para se registrar como âncora do tour. Mantém os
 * `testID`s existentes intactos — basta espalhar `ref`/`onLayout` na `View`.
 *
 * @param key Chave estável da âncora (ex.: `"cards"`, `"fab"`).
 * @returns `ref` + `onLayout` para anexar na `View` alvo.
 */
export const useTourAnchor = (key: string): TourAnchorBinding => {
  const { register } = useTourAnchorContext();

  const ref = useCallback(
    (node: MeasurableHandle | null): void => {
      register(key, node);
    },
    [register, key],
  );

  const onLayout = useCallback((_event: LayoutChangeEvent): void => {
    // O registro acontece via `ref`; o `onLayout` é só um gatilho barato que
    // garante que o nó já passou por layout antes de uma medição sob demanda.
  }, []);

  return { ref, onLayout };
};

/** Tipo de uma `View` registrável (usado por consumidores que tipam o ref). */
export type TourAnchorView = View;
