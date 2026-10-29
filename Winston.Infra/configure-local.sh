#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_directory="$(cd "$script_directory/.." && pwd)"
api_project="$repository_directory/Winston.API/Winston.API.csproj"
environment_template="$repository_directory/Winston.UI/src/environments/environment.example.ts"
environment_file="$repository_directory/Winston.UI/src/environments/environment.ts"

for required_command in az dotnet python3 terraform; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required command not found: $required_command" >&2
    exit 1
  fi
done

if [[ ! -f "$script_directory/terraform.tfstate" ]]; then
  echo "Terraform state was not found. Run terraform apply before configuring local development." >&2
  exit 1
fi

terraform_output() {
  terraform -chdir="$script_directory" output -raw "$1"
}

resource_group_name="$(terraform_output resource_group_name)"
storage_account_name="$(terraform_output storage_account_name)"
subscription_id="$(terraform_output azure_subscription_id)"
sql_server_fqdn="$(terraform_output sql_server_fqdn)"
sql_database_name="$(terraform_output sql_database_name)"
sql_admin_login="$(terraform_output sql_admin_login)"
sql_admin_password="$(terraform_output sql_admin_password)"
receipt_container_name="$(terraform_output receipt_container_name)"
access_request_email="$(terraform_output access_request_email)"
entra_spa_client_id="$(terraform_output entra_spa_client_id)"
entra_api_client_id="$(terraform_output entra_api_client_id)"

storage_connection_string="$(
  az storage account show-connection-string \
    --subscription "$subscription_id" \
    --resource-group "$resource_group_name" \
    --name "$storage_account_name" \
    --query connectionString \
    --output tsv
)"

sql_connection_string="Server=tcp:${sql_server_fqdn},1433;Initial Catalog=${sql_database_name};Persist Security Info=False;User ID=${sql_admin_login};Password=${sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

dotnet user-secrets clear --project "$api_project" >/dev/null
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "$sql_connection_string" --project "$api_project" >/dev/null
dotnet user-secrets set "AzureAd:ClientId" "$entra_api_client_id" --project "$api_project" >/dev/null
dotnet user-secrets set "AzureAd:Audience" "$entra_api_client_id" --project "$api_project" >/dev/null
dotnet user-secrets set "AccessControl:AccessRequestEmail" "$access_request_email" --project "$api_project" >/dev/null
dotnet user-secrets set "ReceiptStorage:ConnectionString" "$storage_connection_string" --project "$api_project" >/dev/null
dotnet user-secrets set "ReceiptStorage:ContainerName" "$receipt_container_name" --project "$api_project" >/dev/null

allowed_user_index=0
while IFS= read -r object_id; do
  [[ -z "$object_id" ]] && continue
  dotnet user-secrets set \
    "AccessControl:AllowedUserObjectIds:${allowed_user_index}" \
    "$object_id" \
    --project "$api_project" >/dev/null
  ((allowed_user_index += 1))
done < <(
  terraform -chdir="$script_directory" output -json allowed_user_object_ids |
    python3 -c 'import json, sys; print("\n".join(json.load(sys.stdin)))'
)

python3 - "$environment_template" "$environment_file" "$entra_spa_client_id" "$entra_api_client_id" <<'PY'
from pathlib import Path
import sys

template_path = Path(sys.argv[1])
environment_path = Path(sys.argv[2])
spa_client_id = sys.argv[3]
api_client_id = sys.argv[4]

contents = template_path.read_text()
contents = contents.replace("ENTRA_CLIENT_ID", spa_client_id)
contents = contents.replace("ENTRA_API_CLIENT_ID", api_client_id)
environment_path.write_text(contents)
PY

echo "Local WINSTON configuration is ready."
echo "Run the API with: dotnet run --project Winston.API"
echo "Run the UI with:  npm start --prefix Winston.UI"
