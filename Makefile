# EcoVolt Home Assistant theme
DEV := docker compose -f dev/docker-compose.yml

.PHONY: deploy deploy-theme check release dev screenshots dev-down

deploy: ## Copy the font + logos (www/ecovolt) into an HA config dir. Usage: make deploy HA_CONFIG=/path/to/config
	@if [ -z "$(HA_CONFIG)" ]; then echo "HA_CONFIG is required, e.g. make deploy HA_CONFIG=/mnt/homeassistant/config"; exit 1; fi
	mkdir -p "$(HA_CONFIG)/www/ecovolt"
	rsync -a --delete www/ecovolt/ "$(HA_CONFIG)/www/ecovolt/"
	@echo "Done. Hard-reload browsers to pick up changed files. First install? See INSTALL.md for extra_module_url."

deploy-theme: ## Installs not using Marketplace only: also copy the theme YAML. Usage: make deploy-theme HA_CONFIG=/path/to/config
	@if [ -z "$(HA_CONFIG)" ]; then echo "HA_CONFIG is required, e.g. make deploy-theme HA_CONFIG=/mnt/homeassistant/config"; exit 1; fi
	@if [ -d "$(HA_CONFIG)/themes/ecovolt" ]; then echo "Marketplace manages this theme ($(HA_CONFIG)/themes/ecovolt). Update it under Settings → Updates instead."; exit 1; fi
	mkdir -p "$(HA_CONFIG)/themes"
	cp themes/ecovolt.yaml "$(HA_CONFIG)/themes/ecovolt.yaml"
	@echo "Done. Run the frontend.reload_themes action to apply."

check: ## Check text/background contrast in both modes
	python3 scripts/check-contrast.py themes/ecovolt.yaml

release: check ## Tag + publish a release with the assets tarball. Usage: make release VERSION=v0.2.0 NOTES_FILE=/tmp/notes.md
	@if [ -z "$(VERSION)" ]; then echo "VERSION is required, e.g. make release VERSION=v0.2.0 NOTES_FILE=/tmp/notes.md"; exit 1; fi
	@if [ -z "$(NOTES_FILE)" ]; then echo "NOTES_FILE is required (a file path), e.g. make release VERSION=v0.2.0 NOTES_FILE=/tmp/notes.md"; exit 1; fi
	@if [ "$$(git branch --show-current)" != "main" ] || [ -n "$$(git status --porcelain)" ]; then echo "Release from a clean main branch."; exit 1; fi
	rm -rf dist && mkdir -p dist/stage
	cp -R www/ecovolt dist/stage/ecovolt
	echo "$(VERSION)" > dist/stage/ecovolt/VERSION
	tar -czf dist/ecovolt-assets.tar.gz -C dist/stage ecovolt
	git tag -a $(VERSION) -m "$(VERSION)"
	git push origin $(VERSION)
	gh release create $(VERSION) dist/ecovolt-assets.tar.gz --title "$(VERSION)" --notes-file "$(NOTES_FILE)"

dev: ## Start a throwaway HA on http://localhost:8123 (set PAULS_CARDS_JS=... to include Paul's cards)
	$(DEV) up -d --wait homeassistant

screenshots: ## Onboard, apply the theme, run checks and save screenshots to docs/screenshots
	$(DEV) up -d --wait homeassistant
	$(DEV) run --rm -u $$(id -u):$$(id -g) screenshots

dev-down: ## Stop and wipe the throwaway HA
	$(DEV) down -v
