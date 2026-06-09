/**
 * Dev-only missing-key handler.
 * Emits a console.warn when i18next cannot find a key,
 * so missing translations are caught during development.
 * In production this function is NOT registered (see index.ts).
 */
export function warnMissingKey(
  _lngs: readonly string[],
  ns: string,
  key: string,
): void {
  console.warn(`[i18n] missing key: ${ns}:${key}`)
}
