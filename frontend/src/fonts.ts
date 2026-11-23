import figtreeLatin from "@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url";
import figtreeLatinExt from "@fontsource-variable/figtree/files/figtree-latin-ext-wght-normal.woff2?url";
import fredokaLatin from "@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2?url";
import fredokaLatinExt from "@fontsource-variable/fredoka/files/fredoka-latin-ext-wght-normal.woff2?url";
import outfitLatin from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import outfitLatinExt from "@fontsource-variable/outfit/files/outfit-latin-ext-wght-normal.woff2?url";
import jakartaVietnamese from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-vietnamese-wght-normal.woff2?url";
import jakartaLatin from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url";
import jakartaLatinExt from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2?url";

// Fonts ship with the integration (OFL-1.1) so the panel never depends on an
// external CDN. @font-face only works reliably from the document, not from
// inside the panel's shadow root, so it is injected into <head> once.
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const VIETNAMESE = "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB";

function face(family: string, url: string, range: string): string {
  return `@font-face{font-family:"${family}";font-style:normal;font-display:swap;font-weight:100 900;src:url("${url}") format("woff2-variations");unicode-range:${range};}`;
}

export function installFonts(): void {
  if (document.getElementById("homesmart-fonts")) return;
  const style = document.createElement("style");
  style.id = "homesmart-fonts";
  style.textContent = [
    // Vietnamese full coverage for both Outfit and Figtree
    face("HomeSmart Outfit", jakartaVietnamese, VIETNAMESE),
    face("HomeSmart Outfit", outfitLatinExt, LATIN_EXT),
    face("HomeSmart Outfit", outfitLatin, LATIN),

    face("HomeSmart Figtree", jakartaVietnamese, VIETNAMESE),
    face("HomeSmart Figtree", figtreeLatinExt, LATIN_EXT),
    face("HomeSmart Figtree", figtreeLatin, LATIN),

    // Unified HomeSmart Sans for standalone fallback
    face("HomeSmart Sans", jakartaVietnamese, VIETNAMESE),
    face("HomeSmart Sans", jakartaLatinExt, LATIN_EXT),
    face("HomeSmart Sans", jakartaLatin, LATIN),

    face("HomeSmart Fredoka", fredokaLatinExt, LATIN_EXT),
    face("HomeSmart Fredoka", fredokaLatin, LATIN),
  ].join("");
  document.head.append(style);
}
