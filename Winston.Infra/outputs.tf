output "resource_group_name" {
  description = "Azure resource group containing the WINSTON infrastructure."
  value       = azurerm_resource_group.winston.name
}

output "web_app_name" {
  description = "Value for the AZURE_WEBAPP_NAME GitHub Actions variable."
  value       = azurerm_linux_web_app.winston.name
}

output "web_app_url" {
  description = "Public URL for WINSTON after the application is deployed."
  value       = local.app_url
}

output "entra_spa_client_id" {
  description = "Value for the ENTRA_CLIENT_ID GitHub Actions variable."
  value       = azuread_application_registration.spa.client_id
}

output "entra_api_client_id" {
  description = "Value for the ENTRA_API_CLIENT_ID GitHub Actions variable."
  value       = azuread_application_registration.api.client_id
}

output "entra_api_scope" {
  description = "Delegated API scope requested by the Angular application."
  value       = "api://${azuread_application_registration.api.client_id}/access_as_user"
}

output "github_actions_client_id" {
  description = "Value for the AZURE_CLIENT_ID GitHub Actions variable."
  value       = azuread_application_registration.github_deploy.client_id
}

output "github_repository" {
  description = "GitHub owner/repository permitted to deploy WINSTON."
  value       = var.github_repository
}

output "github_environment" {
  description = "GitHub environment trusted by the Azure deployment identity."
  value       = var.github_environment
}

output "azure_subscription_id" {
  description = "Value for the AZURE_SUBSCRIPTION_ID GitHub Actions variable."
  value       = var.subscription_id
}

output "azure_tenant_id" {
  description = "Value for the AZURE_TENANT_ID GitHub Actions variable."
  value       = var.tenant_id
}

output "storage_account_name" {
  description = "Storage account containing receipt images."
  value       = azurerm_storage_account.winston.name
}

output "sql_server_fqdn" {
  description = "Azure SQL Server fully qualified domain name."
  value       = azurerm_mssql_server.winston.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Azure SQL database name."
  value       = azapi_resource.sql_database.name
}

output "sql_admin_login" {
  description = "Azure SQL administrator login."
  value       = var.sql_admin_login
}

output "sql_admin_password" {
  description = "Generated Azure SQL administrator password. Keep this value private."
  value       = random_password.sql_admin.result
  sensitive   = true
}

output "receipt_container_name" {
  description = "Blob container used for receipt images."
  value       = var.receipt_container_name
}

output "access_request_email" {
  description = "Email address shown to users requesting access."
  value       = var.access_request_email
  sensitive   = true
}

output "allowed_user_object_ids" {
  description = "Microsoft account object IDs permitted to use WINSTON."
  value       = sort(tolist(var.allowed_user_object_ids))
  sensitive   = true
}
