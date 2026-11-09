# Installation and update guide

How to install the EcoVolt theme on a customer's Raspberry Pi running **Home Assistant OS**, update it remotely afterwards, and remove it.

> This theme is for authorised EcoVolt installs only. See [Licence](README.md#licence).

- [Before you start](#before-you-start)
- [Connecting to the Pi](#connecting-to-the-pi)
- [First install (on site)](#first-install-on-site)
- [Check it worked](#check-it-worked)
- [Updating (remotely)](#updating-remotely)
- [Troubleshooting](#troubleshooting)
- [Uninstall](#uninstall)

## Before you start

- Home Assistant OS is already running on the Pi, onboarded, and on **Home Assistant 2026.11 or later**, which has the built-in [Marketplace](https://www.home-assistant.io/integrations/marketplace/). If it's older, update it first under **Settings → Updates**. A Pi that used HACS is moved to Marketplace automatically, with its installed content kept.
- The Pi's network connection reaches the internet, because Marketplace and the asset download fetch from GitHub.
- You have an **admin** login for the customer's Home Assistant.
- You have a **GitHub account**. Marketplace needs one to add repositories that aren't in its catalog, like this one. It only asks for read access to public repositories.

There are two parts to the install, and both can be updated from the web UI alone:

| Part | What it is | Installed and updated by |
|---|---|---|
| **Theme** | Colours, card style, font name | Marketplace |
| **Assets** | Montserrat font files and logos, in `/config/www/ecovolt/` | The **`shell_command.ecovolt_update_assets`** action, which downloads them from GitHub |

## Connecting to the Pi

**On site:** connect your laptop to the customer's network (Wi-Fi or Ethernet) and open **http://homeassistant.local:8123**.

If that address doesn't load (some Windows and Android devices don't resolve `.local` names), find the Pi's IP address in the customer's router device list. It's usually named `homeassistant`. Then open `http://<ip-address>:8123`.

**Remotely:** open the customer's remote address in your browser, for example their HTTPS subdomain, and log in with the admin account. All of [Updating](#updating-remotely) works this way. You never need SSH or file-share access to the Pi.

## First install (on site)

Allow about 15 minutes, including two restarts.

### 1. Turn on Advanced mode

Click your user name at the bottom of the sidebar and turn on **Advanced mode**. This shows the add-on store and other settings used below.

### 2. Install the File editor add-on

1. Go to **Settings → Add-ons → Add-on store**, search for **File editor**, and click **Install**.
2. Turn on **Show in sidebar**, then click **Start**.

File editor is how you change `configuration.yaml`, both now and remotely later.

### 3. Install the theme from Marketplace

1. Go to **Settings → Marketplace**. The first time, read the warning about community content and accept it.
2. Select **Add from link** (top right). Under **GitHub link**, enter `keteracel/ecovolt-ha-theme` and select **Add**. If it asks for a **Type**, choose **Theme** and select **Add** again.
3. If Marketplace asks you to connect GitHub, select **Continue**, enter the code it shows on the GitHub page that opens, and approve it.
4. Open **EcoVolt**, select **Install**, check the version, and select **Install** again.

The theme is installed to `config/themes/ecovolt/` and loads straight away, with no restart needed.

### 4. Edit `configuration.yaml`

1. Open **File editor** from the sidebar, click the folder icon, and open **`configuration.yaml`**.
2. Add the contents of [`examples/configuration.yaml`](examples/configuration.yaml) to the end of the file. If the file already has a `frontend:` or `shell_command:` line, put the new lines under the existing one instead of adding a second. Two `frontend:` sections break the config.
3. Click **Save** (the red disk icon).

### 5. Check and restart

Go to **Developer tools → YAML**, click **Check configuration**, and fix anything it reports. Then click **Restart → Restart Home Assistant**. The UI comes back after a minute or two.

### 6. Download the font and logos

1. Go to **Developer tools → Actions**.
2. Choose **Shell Command: ecovolt_update_assets** and click **Perform action**.
3. The response should show `returncode: 0` and `EcoVolt assets updated: ecovolt-banner-white.svg … fonts`.

### 7. Restart once more

On a first install only, restart again (**Developer tools → YAML → Restart**). Home Assistant only serves files from a `www` folder that existed when it started.

### 8. Select the theme

Go to **Developer tools → Actions** and run `frontend.set_theme` twice. Switch to YAML mode with **⋮ → Edit in YAML** to paste these:

```yaml
action: frontend.set_theme
data:
  name: EcoVolt
```

```yaml
action: frontend.set_theme
data:
  name: EcoVolt
  mode: dark
```

Users whose profile theme is left at the default (**Backend-selected**) now get EcoVolt, in light or dark mode to match their device.

### 9. Add the logo to dashboards

1. Open the dashboard, click the pencil icon, choose **Add card**, and then **Manual**.
2. Paste [`examples/dashboard-header.yaml`](examples/dashboard-header.yaml):

   ```yaml
   type: picture-elements
   image: /local/ecovolt/ecovolt-banner.svg?v=1
   dark_mode_image: /local/ecovolt/ecovolt-banner-white.svg?v=1
   alt_text: EcoVolt Renewables
   elements: []
   ```

3. Save, and drag the card to the top.

## Check it worked

Hard-reload the browser (**Ctrl+Shift+R**, or **Cmd+Shift+R** on Mac), then check:

- [ ] The top bar is navy and toggles are green.
- [ ] Text, including the sidebar, is in Montserrat: rounded geometric letters, not Roboto.
- [ ] The logo card shows the colour logo, and the white logo when the device is in dark mode.
- [ ] The customer's phone or wall tablet looks the same. If not, in the Companion app open **Settings → Companion app → Debugging → Reset frontend cache**.

## Updating (remotely)

Everything here works through the customer's remote address in a browser.

There are no versioned releases. Marketplace offers an update whenever `main` changes, and checks this repository about every 2 days, so a change can take that long to show up. To see what changed, check the [commit history](https://github.com/keteracel/ecovolt-ha-theme/commits/main). Updates to the font and logos also show up in the [history for `www/`](https://github.com/keteracel/ecovolt-ha-theme/commits/main/www).

### Theme changes

1. Go to **Settings → Updates**, select **EcoVolt**, and install the update.
2. Marketplace reloads themes itself, so the new colours apply on the next page load. If they don't, run the **`frontend.reload_themes`** action from **Developer tools → Actions**.

### Font or logo changes

1. Run **Shell Command: ecovolt_update_assets** from **Developer tools → Actions** and check the response shows `returncode: 0`.
2. Bump the version number so devices fetch the new files. Browsers keep `/local` files for up to 31 days, and you can't clear the cache on a customer's tablet from here.
   - **Logo changed:** edit the logo card on each dashboard and change both `?v=1` to `?v=2` (then `?v=3` next time, and so on).
   - **Font changed:** in **File editor**, open `configuration.yaml`, change `ecovolt-fonts.js?v=1` to `?v=2`, save, and restart Home Assistant.

### After a Home Assistant upgrade

Home Assistant sometimes renames theme variables. After a major HA upgrade, check the [list above](#check-it-worked) remotely. If something has gone back to HA's default blue, the theme needs updating for the new variable names.

## Troubleshooting

| Symptom | Fix |
|---|---|
| **EcoVolt** isn't in the theme list | Check the `themes: !include_dir_merge_named themes` line is under `frontend:` in `configuration.yaml`, then run `frontend.reload_themes`. |
| **Shell Command: ecovolt_update_assets** isn't in the Actions list | The `shell_command:` block is missing from `configuration.yaml`, or HA hasn't restarted since you added it. |
| The asset action returns a non-zero `returncode` | The Pi couldn't download from GitHub. Check its internet connection under **Settings → System → Network**, then run it again. The existing files are left in place when a download fails. |
| The font is still Roboto | Open `<ha-address>/local/ecovolt/ecovolt-fonts.js?v=1`. A 404 means the assets aren't installed (step 6), or HA hasn't restarted since `www` was created (step 7). If the file loads, check the `extra_module_url` line and restart. |
| The logo card shows a broken image | Same check, with `<ha-address>/local/ecovolt/ecovolt-banner.svg`. |
| Old logo or font still showing after an update | Bump `?v=` as described in [Font or logo changes](#font-or-logo-changes). |
| Dark mode still uses HA's default colours | Run `frontend.set_theme` with `mode: dark` (step 8). |
| One user doesn't get the theme | Their profile has a specific theme set. Change **Profile → Theme** to **Backend-selected** or **EcoVolt**. |
| **Add from link** fails or asks for GitHub | Connect GitHub when prompted. To connect or change the account later, open **Settings → Devices & services → Marketplace → ⋮ → Reconfigure**. If it asks for a **Type**, choose **Theme**. |
| No EcoVolt update shows up | Marketplace checks this repository about every 2 days. Compare the installed version (a commit) on the EcoVolt repository page with the [latest commit](https://github.com/keteracel/ecovolt-ha-theme/commits/main). |

## Uninstall

1. Run `frontend.set_theme` with `name: default`, and again with `name: default` and `mode: dark`.
2. Remove the logo card from dashboards.
3. In **Settings → Marketplace**, open **EcoVolt** and choose **⋮ → Uninstall**.
4. In **File editor**, remove the EcoVolt lines from `configuration.yaml`: the `ecovolt-fonts.js` line under `extra_module_url`, and the `ecovolt_update_assets` block under `shell_command`. Save.
5. In **File editor**, delete the `www/ecovolt` folder.
6. Check the configuration and restart Home Assistant.

---

**Developing the theme?** `make deploy HA_CONFIG=…` copies the assets straight into a mounted config folder, for example over the Pi's Samba share. `make deploy-theme` does the same for the theme, for installs that don't use Marketplace. See the [README](README.md#previewing-changes).
