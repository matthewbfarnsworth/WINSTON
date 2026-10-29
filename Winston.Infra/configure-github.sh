#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for required_command in gh terraform; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required command not found: $required_command" >&2
    exit 1
  fi
done

if [[ ! -f "$script_directory/terraform.tfstate" ]]; then
  echo "Terraform state was not found. Run terraform apply before configuring GitHub." >&2
  exit 1
fi

gh auth status >/dev/null

terraform_output() {
  terraform -chdir="$script_directory" output -raw "$1"
}

repository="$(terraform_output github_repository)"
environment="$(terraform_output github_environment)"

gh api \
  --method PUT \
  "repos/${repository}/environments/${environment}" \
  >/dev/null

set_variable() {
  local name="$1"
  local value="$2"
  gh variable set "$name" \
    --repo "$repository" \
    --env "$environment" \
    --body "$value"
}

set_variable AZURE_CLIENT_ID "$(terraform_output github_actions_client_id)"
set_variable AZURE_TENANT_ID "$(terraform_output azure_tenant_id)"
set_variable AZURE_SUBSCRIPTION_ID "$(terraform_output azure_subscription_id)"
set_variable AZURE_WEBAPP_NAME "$(terraform_output web_app_name)"
set_variable ENTRA_CLIENT_ID "$(terraform_output entra_spa_client_id)"
set_variable ENTRA_API_CLIENT_ID "$(terraform_output entra_api_client_id)"

echo "Configured GitHub environment '${environment}' for ${repository}."
