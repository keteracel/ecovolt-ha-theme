# EcoVolt theme for Home Assistant

> **Private use only.** All rights reserved. Use requires permission, see [Licence](#licence).

Brand theme for Home Assistant installs by EcoVolt Renewables: brand green, navy and amber, the Montserrat font, and the EcoVolt logo, with light and dark modes.

| Light | Dark |
|---|---|
| ![Light mode](docs/screenshots/demo-light.png) | ![Dark mode](docs/screenshots/demo-dark.png) |

## What's included

| Path | What it is |
|---|---|
| `themes/ecovolt.yaml` | The theme. Sets colours, font, card style and energy colours (solar is amber, battery green, grid navy) |
| `www/ecovolt/ecovolt-fonts.js` | Loads the self-hosted Montserrat font, so it works without internet access |
| `www/ecovolt/ecovolt-logo.svg`, `-white.svg` | Logo, tightly cropped (colour for light backgrounds, white with the "renewables" line for dark) |
| `www/ecovolt/ecovolt-banner.svg`, `-white.svg` | Same logos with padding, for dashboard header cards |
| `www/ecovolt/ecovolt-mark.svg` | Pin icon only, square |
| `examples/dashboard-header.yaml` | Logo header card that switches logo with light/dark mode |

## Install

### 1. Theme

**With HACS:** in HACS, open the ⋮ menu, choose *Custom repositories*, and add this repo's URL with category **Theme**. Then install *EcoVolt*.

**Without HACS:** copy `themes/ecovolt.yaml` into `/config/themes/`.

Either way, `configuration.yaml` needs to load themes:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

### 2. Font and logos (one-time per install)

HACS only installs the theme file, so copy `www/ecovolt/` to `/config/www/ecovolt/`. From a machine with the HA config mounted (e.g. over Samba or SSH):

```sh
make deploy HA_CONFIG=/path/to/homeassistant/config
```

Then load the font in `configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/ecovolt/ecovolt-fonts.js
```

Restart Home Assistant.

### 3. Select the theme

- **For everyone:** run the action `frontend.set_theme` with `name: EcoVolt`, then again with `name: EcoVolt` and `mode: dark`. This makes it the default in both modes.
- **Per user:** open *Profile*, then *Theme*, and choose *EcoVolt*.

Light or dark follows the device setting unless the user picks one in their profile.

### 4. Logo on dashboards

Add the card from [`examples/dashboard-header.yaml`](examples/dashboard-header.yaml) to the top of a dashboard (in edit mode, use *Add card*, choose *Manual*, and paste it in).

The sidebar title ("Home Assistant") can't be replaced by a theme. If a customer wants the logo there too, [custom-sidebar](https://github.com/elchininet/custom-sidebar) or card-mod can do it.

## Accessibility

Brand green `#009f17` reaches 3.5:1 against white. That's fine for icons, toggles and large shapes, but too low for small text. So links, the selected sidebar item, and text on filled buttons use a darker green, `#028813`. Check every text/background pair after changing colours:

```sh
make check
```

## Previewing changes

`make screenshots` starts a throwaway Home Assistant in Docker with the demo integration, applies the theme in light and dark mode, and checks:

- the colours, font and logo actually applied;
- the font actually loaded.

It then saves screenshots to `docs/screenshots/`. To include [Paul's custom cards](https://github.com/keteracel/pauls-custom-cards) in the preview, build them first and run:

```sh
PAULS_CARDS_JS=/path/to/pauls-custom-cards/dist/pauls-cards.js make screenshots
```

Use `make dev` to poke around at http://localhost:8123 (user `dev`, password `dev-password`, created by `make screenshots`), and `make dev-down` to remove it.

## Licence

**Not licensed for public use.** This repo is public only so that EcoVolt installs can get it and update it through HACS. Any use needs prior written permission, see [`LICENSE`](LICENSE). The EcoVolt name and logos are EcoVolt Renewables' brand marks, used with permission. The Montserrat font files are under the SIL Open Font License, see [NOTICE.md](NOTICE.md).
