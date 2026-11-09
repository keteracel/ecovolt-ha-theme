# EcoVolt Home Assistant theme
DEV := docker compose -f dev/docker-compose.yml

.PHONY: deploy check dev screenshots dev-down

deploy: ## Copy logos + font loader into an HA config dir. Usage: make deploy HA_CONFIG=/path/to/config
	@if [ -z "$(HA_CONFIG)" ]; then echo "HA_CONFIG is required, e.g. make deploy HA_CONFIG=/mnt/homeassistant/config"; exit 1; fi
	mkdir -p "$(HA_CONFIG)/www/ecovolt" "$(HA_CONFIG)/themes"
	rsync -a --delete www/ecovolt/ "$(HA_CONFIG)/www/ecovolt/"
	cp themes/ecovolt.yaml "$(HA_CONFIG)/themes/ecovolt.yaml"
	@echo "Done. Add extra_module_url (see README), then restart HA or run frontend.reload_themes."

check: ## Check text/background contrast in both modes
	python3 scripts/check-contrast.py themes/ecovolt.yaml

dev: ## Start a throwaway HA on http://localhost:8123 (set PAULS_CARDS_JS=... to include Paul's cards)
	$(DEV) up -d --wait homeassistant

screenshots: ## Onboard, apply the theme, run checks and save screenshots to docs/screenshots
	$(DEV) up -d --wait homeassistant
	$(DEV) run --rm -u $$(id -u):$$(id -g) screenshots

dev-down: ## Stop and wipe the throwaway HA
	$(DEV) down -v
