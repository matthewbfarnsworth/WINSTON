resource "random_uuid" "api_scope" {}

resource "azuread_application_registration" "api" {
  display_name                   = "${local.name_prefix}-api"
  description                    = "WINSTON protected web API"
  requested_access_token_version = 2
  sign_in_audience               = "PersonalMicrosoftAccount"
}

resource "azuread_application_owner" "api" {
  application_id  = azuread_application_registration.api.id
  owner_object_id = data.azuread_client_config.current.object_id
}

resource "azuread_application_identifier_uri" "api" {
  application_id = azuread_application_registration.api.id
  identifier_uri = "api://${azuread_application_registration.api.client_id}"
}

resource "azuread_application_permission_scope" "access_as_user" {
  application_id = azuread_application_registration.api.id
  scope_id       = random_uuid.api_scope.result
  value          = "access_as_user"
  type           = "User"

  admin_consent_description  = "Allow WINSTON to access its API as the signed-in user."
  admin_consent_display_name = "Access WINSTON as a user"
  user_consent_description   = "Allow WINSTON to access its API on your behalf."
  user_consent_display_name  = "Access WINSTON as you"

  depends_on = [azuread_application_identifier_uri.api]
}

resource "azuread_application_registration" "spa" {
  display_name                   = "${local.name_prefix}-spa"
  description                    = "WINSTON Angular single-page application"
  requested_access_token_version = 2
  sign_in_audience               = "PersonalMicrosoftAccount"
}

resource "azuread_application_owner" "spa" {
  application_id  = azuread_application_registration.spa.id
  owner_object_id = data.azuread_client_config.current.object_id
}

resource "azuread_application_redirect_uris" "spa" {
  application_id = azuread_application_registration.spa.id
  type           = "SPA"

  redirect_uris = [
    "http://localhost:4200",
    local.app_url,
  ]
}

resource "azuread_application_api_access" "spa_to_api" {
  application_id = azuread_application_registration.spa.id
  api_client_id  = azuread_application_registration.api.client_id
  scope_ids      = [random_uuid.api_scope.result]

  depends_on = [azuread_application_permission_scope.access_as_user]
}

resource "azuread_application_registration" "github_deploy" {
  display_name     = "${local.name_prefix}-github-deploy"
  description      = "GitHub Actions deployment identity for WINSTON"
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_application_owner" "github_deploy" {
  application_id  = azuread_application_registration.github_deploy.id
  owner_object_id = data.azuread_client_config.current.object_id
}

resource "azuread_service_principal" "github_deploy" {
  client_id = azuread_application_registration.github_deploy.client_id
}

resource "azuread_application_federated_identity_credential" "github_deploy" {
  application_id = azuread_application_registration.github_deploy.id
  display_name   = "github-${var.github_environment}"
  description    = "Trust ${var.github_repository} GitHub Actions in the ${var.github_environment} environment"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_repository}:environment:${var.github_environment}"
}

resource "azurerm_role_assignment" "github_web_app_deploy" {
  scope                            = azurerm_linux_web_app.winston.id
  role_definition_name             = "Website Contributor"
  principal_id                     = azuread_service_principal.github_deploy.object_id
  principal_type                   = "ServicePrincipal"
  skip_service_principal_aad_check = true
}
