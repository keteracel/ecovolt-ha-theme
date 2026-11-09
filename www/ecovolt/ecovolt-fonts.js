// Registers the self-hosted Montserrat font for the EcoVolt Home Assistant theme.
// Load it from configuration.yaml:
//
//   frontend:
//     extra_module_url:
//       - /local/ecovolt/ecovolt-fonts.js?v=1
//
// The theme then picks it up through `ha-font-family-body: Montserrat, ...`.
// Fonts are served from /local, so installs without internet access still work.
// HA lets browsers cache /local files for 31 days: bump ?v= when the fonts change,
// and the same ?v= is passed on to the font files so they refresh too.

const STYLE_ID = 'ecovolt-fonts';

if (!document.getElementById(STYLE_ID)) {
  const base = new URL('./fonts/', import.meta.url).href;
  const version = new URL(import.meta.url).search; // e.g. "?v=1", or "" if unversioned

  const face = (file, range) => `
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}${file}${version}') format('woff2-variations'), url('${base}${file}${version}') format('woff2');
  unicode-range: ${range};
}`;

  // HA's page template hardcodes `body { font-family: Roboto, ... }`, and the sidebar and
  // header inherit from it, so point body at the theme's font variable. Themes that don't
  // set --ha-font-family-body keep Roboto.
  const bodyFont = `
body {
  font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif);
}`;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    bodyFont +
    face(
      'montserrat-latin-ext-wght-normal.woff2',
      'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
    ) +
    face(
      'montserrat-latin-wght-normal.woff2',
      'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
    );
  document.head.appendChild(style);
}
