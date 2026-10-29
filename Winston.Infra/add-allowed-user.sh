#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./add-allowed-user.sh [--apply] <oid> [<oid> ...]

Adds one or more Microsoft account OIDs to terraform.tfvars, formats the file,
initializes Terraform when needed, and creates a plan. By default, the script
asks before applying the plan. Pass --apply to skip that prompt.
EOF
}

apply_without_prompt=false
object_ids=()

while (($# > 0)); do
  case "$1" in
    --apply)
      apply_without_prompt=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while (($# > 0)); do
        object_ids+=("$1")
        shift
      done
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      object_ids+=("$1")
      ;;
  esac
  shift
done

if ((${#object_ids[@]} == 0)); then
  usage >&2
  exit 2
fi

oid_pattern='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
for object_id in "${object_ids[@]}"; do
  if [[ ! "$object_id" =~ $oid_pattern ]]; then
    echo "Invalid OID: $object_id" >&2
    exit 2
  fi
done

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
variables_file="$script_directory/terraform.tfvars"

if [[ ! -f "$variables_file" ]]; then
  echo "Missing $variables_file. Copy terraform.tfvars.example and configure it first." >&2
  exit 1
fi

for required_command in python3 terraform; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required command not found: $required_command" >&2
    exit 1
  fi
done

python3 - "$variables_file" "${object_ids[@]}" <<'PY'
from pathlib import Path
import re
import sys

variables_path = Path(sys.argv[1])
requested_ids = sys.argv[2:]
contents = variables_path.read_text()
pattern = re.compile(r"(?ms)^allowed_user_object_ids\s*=\s*\[(.*?)^\]")
match = pattern.search(contents)

if match is None:
    raise SystemExit(f"Could not find allowed_user_object_ids in {variables_path}")

existing_ids = re.findall(r'"([^"]+)"', match.group(1))
ids_by_lowercase_value = {object_id.lower(): object_id for object_id in existing_ids}
added_ids = []

for object_id in requested_ids:
    normalized_id = object_id.lower()
    if normalized_id not in ids_by_lowercase_value:
        ids_by_lowercase_value[normalized_id] = normalized_id
        added_ids.append(normalized_id)

sorted_ids = sorted(ids_by_lowercase_value.values(), key=str.lower)
replacement = "allowed_user_object_ids = [\n"
replacement += "".join(f'  "{object_id}",\n' for object_id in sorted_ids)
replacement += "]"

updated_contents = contents[:match.start()] + replacement + contents[match.end():]
variables_path.write_text(updated_contents)

if added_ids:
    for object_id in added_ids:
        print(f"Added {object_id}")
else:
    print("All requested OIDs were already present.")
PY

terraform -chdir="$script_directory" fmt terraform.tfvars

if [[ ! -d "$script_directory/.terraform" ]]; then
  terraform -chdir="$script_directory" init
fi

plan_file="$(mktemp "${TMPDIR:-/tmp}/winston-allow-list.XXXXXX")"
trap 'rm -f "$plan_file"' EXIT

terraform -chdir="$script_directory" plan \
  -var-file=terraform.tfvars \
  -out="$plan_file"

if [[ "$apply_without_prompt" != true ]]; then
  read -r -p "Apply this Terraform plan? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES|Yes)
      ;;
    *)
      echo "Plan not applied. The OID changes remain in terraform.tfvars."
      exit 0
      ;;
  esac
fi

terraform -chdir="$script_directory" apply "$plan_file"
