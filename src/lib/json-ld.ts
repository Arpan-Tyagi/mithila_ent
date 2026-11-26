// SEC-10: serialise JSON-LD for a <script type="application/ld+json"> block.
// JSON.stringify does not escape "<", so a product title containing
// "</script><script>..." would end the block and run as HTML. Escaping <, >, &
// and the two JS line separators (U+2028, U+2029) keeps the output valid JSON
// that can never close the script element.
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .split(LS).join('\\u2028')
    .split(PS).join('\\u2029');
}
