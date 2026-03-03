# Satyrs M/C — root Makefile with colorful help and static/Docker targets
# API_ORIGIN: optional; set for production static build (e.g. API_ORIGIN=https://satyrs-api.nynex.io)
# S3_BUCKET: required for deploy-static; or run: terraform -chdir=terraform output -raw static_hosting_bucket_name

CYN := \033[1;36m
GRN := \033[1;32m
DIM := \033[2m
RST := \033[0m

STATIC_DIR := dist

.PHONY: help build-static deploy-static deploy-static-dry docker-api docker-api-run dev run-api

help:
	@printf '$(CYN)Satyrs M/C$(RST)\n\n'
	@printf '$(CYN)Targets:$(RST)\n'
	@printf '  $(GRN)build-static$(RST)     Build unified static site (app-public + app-admin) into $(STATIC_DIR)/\n'
	@printf '  $(DIM)                     Set API_ORIGIN for production (e.g. API_ORIGIN=https://api.example.com)$(RST)\n'
	@printf '  $(GRN)deploy-static$(RST)    Sync $(STATIC_DIR)/ to S3. Set S3_BUCKET or use terraform output$(RST)\n'
	@printf '  $(GRN)deploy-static-dry$(RST) Same as deploy-static but with --dryrun$(RST)\n'
	@printf '  $(GRN)docker-api$(RST)       Build API-only Docker image (packages/api)$(RST)\n'
	@printf '  $(GRN)docker-api-run$(RST)   Run API container (port 3000, data in ./data)$(RST)\n'
	@printf '  $(GRN)dev$(RST)              Run dev server (bun run dev)$(RST)\n'
	@printf '  $(GRN)run-api$(RST)          Start API server only (port 3000)$(RST)\n'
	@printf '\n$(CYN)Examples:$(RST)\n'
	@printf '  make build-static\n'
	@printf '  API_ORIGIN=https://satyrs-api.nynex.io make build-static\n'
	@printf '  S3_BUCKET=$$(terraform -chdir=terraform output -raw static_hosting_bucket_name) make deploy-static\n'
	@printf '  make deploy-static-dry\n'

build-static:
	@printf '$(CYN)Building static site (app-public + app-admin) -> $(STATIC_DIR)/$(RST)\n'
	@rm -rf $(STATIC_DIR) && mkdir -p $(STATIC_DIR) $(STATIC_DIR)/admin
	@cd packages/app-public && OUTDIR=../../$(STATIC_DIR) API_ORIGIN="$(API_ORIGIN)" bun run build
	@cd packages/app-admin && OUTDIR=../../$(STATIC_DIR)/admin API_ORIGIN="$(API_ORIGIN)" bun run build
	@printf '$(GRN)Done. Output in $(STATIC_DIR)/$(RST)\n'

deploy-static: build-static
	@if [ -z '$(S3_BUCKET)' ]; then \
		printf '$(DIM)S3_BUCKET not set. Run: export S3_BUCKET=$$(terraform -chdir=terraform output -raw static_hosting_bucket_name)$(RST)\n'; \
		exit 1; \
	fi
	@printf '$(CYN)Syncing $(STATIC_DIR)/ -> s3://$(S3_BUCKET)/$(RST)\n'
	@aws s3 sync $(STATIC_DIR)/ s3://$(S3_BUCKET)/ --delete --exclude '*.js.map'
	@printf '$(GRN)Deployed to s3://$(S3_BUCKET)/$(RST)\n'

deploy-static-dry: build-static
	@if [ -z '$(S3_BUCKET)' ]; then \
		printf '$(DIM)S3_BUCKET not set. Run: export S3_BUCKET=$$(terraform -chdir=terraform output -raw static_hosting_bucket_name)$(RST)\n'; \
		exit 1; \
	fi
	@printf '$(CYN)Dry run: $(STATIC_DIR)/ -> s3://$(S3_BUCKET)/$(RST)\n'
	@aws s3 sync $(STATIC_DIR)/ s3://$(S3_BUCKET)/ --delete --dryrun --exclude '*.js.map'

# Default to host platform so image runs natively (arm64 on Apple Silicon, amd64 on Intel/CI).
UNAME_M := $(shell uname -m)
ifeq ($(UNAME_M),arm64)
DOCKER_PLATFORM := linux/arm64
else
ifeq ($(UNAME_M),aarch64)
DOCKER_PLATFORM := linux/arm64
else
DOCKER_PLATFORM := linux/amd64
endif
endif

docker-api:
	@printf '$(CYN)Building API Docker image (api-only) for $(DOCKER_PLATFORM)...$(RST)\n'
	@docker build --platform $(DOCKER_PLATFORM) --build-arg TARGETPLATFORM=$(DOCKER_PLATFORM) -t satyrsmc-api:latest -f packages/api/Dockerfile .
	@printf '$(GRN)Image built: satyrsmc-api:latest$(RST)\n'

docker-api-run:
	@mkdir -p data/data
	@printf '$(CYN)Starting API container at http://localhost:3000$(RST)\n'
	@docker run -it --rm -p 3000:3000 -v "$(PWD)/data:/data" -e DATA_DIR=/data satyrsmc-api:latest

dev:
	@bun run dev

run-api:
	@printf '$(CYN)Starting API server on http://localhost:3000$(RST)\n'
	@bun run start:api-only
