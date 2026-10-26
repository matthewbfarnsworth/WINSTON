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

resource "azuread_service_principal" "api" {
  client_id = azuread_application_registration.api.client_id
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

resource "azuread_service_principal" "spa" {
  client_id = azuread_application_registration.spa.client_id
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
