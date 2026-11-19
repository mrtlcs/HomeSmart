// "Text size" on this device (Settings → This device): every font size of the panel's style sheet is
// multiplied by --hd-font (1 unless chosen), so text grows or shrinks while the layout keeps its size.
// Done once when the style sheet is put together, so each theme keeps writing plain sizes.

const RELATIVE = /^(?:[\d.]+(?:em|rem|%)|inherit|initial|unset|smaller|larger|0)$/;
const SIZE = /^(?:[\d.]+(?:px|vw|vh|vmin|vmax|pt)|(?:calc|clamp|min|max)\(|var\(--)/;

/** Splits on whitespace outside parentheses. */
function tokens(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (/\s/.test(char) && depth === 0) { if (current) out.push(current); current = ""; } else current += char;
  }
  if (current) out.push(current);
  return out;
}

/** The size before a "/" outside parentheses (the line height after it stays). */
function splitSlash(token: string): [string, string] {
  let depth = 0;
  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "/" && depth === 0) return [token.slice(0, index), token.slice(index)];
  }
  return [token, ""];
}

const scaled = (size: string) => (RELATIVE.test(size) || !SIZE.test(size) ? size : `calc(${size} * var(--hd-font, 1))`);

export function scaleFonts(css: string): string {
  return css.replace(/(^|[;{\s])(font-size|font)\s*:\s*([^;{}]+)/g, (match, before: string, property: string, raw: string) => {
    const important = /\s*!important\s*$/.exec(raw)?.[0] ?? "";
    const value = raw.slice(0, raw.length - important.length).trim();
    if (property === "font-size") return `${before}font-size: ${scaled(value)}${important}`;
    const parts = tokens(value);
    const at = parts.findIndex((part) => { const [size] = splitSlash(part); return SIZE.test(size) || RELATIVE.test(size) && /\d/.test(size); });
    if (at < 0) return match;
    const [size, rest] = splitSlash(parts[at]);
    parts[at] = scaled(size) + rest;
    return `${before}font: ${parts.join(" ")}${important}`;
  });
}
