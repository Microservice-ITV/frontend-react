const SWATCH_BY_NAME: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#e8d5b0",
  bisque: "#ffe4c4",
  black: "#111827",
  blanchedalmond: "#ffebcd",
  blue: "#2563eb",
  blueviolet: "#8a2be2",
  brown: "#6b4423",
  burgundy: "#800020",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  camel: "#c19a6b",
  charcoal: "#36454f",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  copper: "#b87333",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  cream: "#fffdd0",
  crimson: "#dc143c",
  cyan: "#06b6d4",
  darkblue: "#1e3a8a",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#4b5563",
  darkgreen: "#166534",
  darkgrey: "#4b5563",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  default: "#e5e7eb",
  denim: "#1560bd",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  glacier: "#80b5c6",
  gold: "#d4af37",
  goldenrod: "#daa520",
  gray: "#6b7280",
  green: "#16a34a",
  greenyellow: "#adff2f",
  grey: "#6b7280",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4f46e5",
  ivory: "#fffff0",
  khaki: "#c3b091",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#7dd3fc",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#e5e7eb",
  lightgreen: "#86efac",
  lightgrey: "#e5e7eb",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#65a30d",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#c026d3",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mint: "#98ff98",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  mustard: "#e1ad01",
  navajowhite: "#ffdead",
  navy: "#1e3a8a",
  nude: "#e3bc9a",
  offwhite: "#f4f1ea",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ea580c",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peach: "#ffcba4",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ec4899",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#9333ea",
  rebeccapurple: "#663399",
  red: "#dc2626",
  redbrown: "#a52a2a",
  rose: "#e11d48",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  rust: "#b7410e",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sand: "#c2b280",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#38bdf8",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  taupe: "#8b8589",
  teal: "#0f766e",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#7c3aed",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  wine: "#722f37",
  yellow: "#eab308",
  yellowgreen: "#9acd32",
};

const SWATCH_BY_CODE: Record<string, string> = {
  beg: "#e8d5b0",
  bgd: "#800020",
  blk: "#111827",
  blu: "#2563eb",
  brn: "#6b4423",
  crm: "#fffdd0",
  def: "#e5e7eb",
  glc: "#80b5c6",
  gld: "#d4af37",
  grn: "#16a34a",
  gry: "#6b7280",
  mar: "#800000",
  mnt: "#98ff98",
  nvy: "#1e3a8a",
  olv: "#808000",
  org: "#ea580c",
  pnk: "#ec4899",
  pur: "#9333ea",
  rb: "#a52a2a",
  red: "#dc2626",
  sky: "#38bdf8",
  slv: "#c0c0c0",
  tea: "#0f766e",
  wht: "#ffffff",
  ylw: "#eab308",
};

const colorKey = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, "");

/** Resolve a paint color from catalog name and/or code (hex, BLK, Glacier, …). */
export const swatchColor = (name: string, code?: string) => {
  const trimmedCode = code?.trim() ?? "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmedCode)) return trimmedCode;
  const codeAlias = SWATCH_BY_CODE[colorKey(trimmedCode)];
  if (codeAlias) return codeAlias;
  const nameAlias = SWATCH_BY_NAME[colorKey(name)];
  if (nameAlias) return nameAlias;
  const key = colorKey(name);
  if (!key) return "#d1d5db";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360} 46% 46%)`;
};

export const isLightSwatch = (color: string) => {
  const value = color.toLowerCase();
  if (
    value === "#ffffff" ||
    value === "#fff" ||
    value === "#f4f1ea" ||
    value === "#fffdd0" ||
    value === "#fffff0" ||
    value === "#f5f5dc" ||
    value === "#e8d5b0" ||
    value === "#e5e7eb" ||
    value === "#eab308" ||
    value === "#c0c0c0" ||
    value === "#80b5c6" ||
    value === "#98ff98"
  ) {
    return true;
  }
  const hex = value.match(/^#([0-9a-f]{6})$/);
  if (!hex) return false;
  const n = Number.parseInt(hex[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
};
