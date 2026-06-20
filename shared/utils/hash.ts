/**
 * Hash determinístico de uma string para um índice estável dentro de
 * `[0, modulo)`. Usado para escolher cores de paleta de forma estável por id
 * (sem aleatoriedade — `Math.random` quebraria a estabilidade entre renders).
 *
 * @param value String de entrada (ex.: id de cartão ou categoria).
 * @param modulo Tamanho do intervalo de saída (ex.: tamanho da paleta).
 * @returns Índice inteiro em `[0, modulo)`; 0 quando `modulo <= 0`.
 */
export const hashStringToIndex = (value: string, modulo: number): number => {
  if (modulo <= 0) {
    return 0;
  }
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % modulo;
};
