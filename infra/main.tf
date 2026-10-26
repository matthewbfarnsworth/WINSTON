resource "random_string" "resource_suffix" {
  length  = 6
  lower   = true
  numeric = true
  special = false
  upper   = false
}

resource "random_password" "sql_admin" {
  length           = 24
  special          = true
  override_special = "!#$%&*+-=?@_"
}

resource "azurerm_resource_group" "winston" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_service_plan" "winston" {
  name                = local.service_plan_name
  resource_group_name = azurerm_resource_group.winston.name
  location            = azurerm_resource_group.winston.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku_name
  tags                = local.common_tags
}

resource "azurerm_mssql_server" "winston" {
  name                          = local.sql_server_name
  resource_group_name           = azurerm_resource_group.winston.name
  location                      = azurerm_resource_group.winston.location
  version                       = "12.0"
  administrator_login           = var.sql_admin_login
  administrator_login_password  = random_password.sql_admin.result
  minimum_tls_version           = "1.2"
  public_network_access_enabled = true
  tags                          = local.common_tags
}

resource "azapi_resource" "sql_database" {
  type      = "Microsoft.Sql/servers/databases@2023-08-01"
  parent_id = azurerm_mssql_server.winston.id
  name      = local.sql_database_name
  location  = azurerm_resource_group.winston.location
  tags      = local.common_tags

  body = {
    sku = {
      name     = "GP_S_Gen5_2"
      tier     = "GeneralPurpose"
      family   = "Gen5"
      capacity = 2
    }

    properties = {
      autoPauseDelay                   = 60
      freeLimitExhaustionBehavior      = "AutoPause"
      maxSizeBytes                     = 34359738368
      minCapacity                      = 0.5
      requestedBackupStorageRedundancy = "Local"
      useFreeLimit                     = true
      zoneRedundant                    = false
    }
  }
}

resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.winston.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_storage_account" "winston" {
  name                            = local.storage_account_name
  resource_group_name             = azurerm_resource_group.winston.name
  location                        = azurerm_resource_group.winston.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  account_kind                    = "StorageV2"
  access_tier                     = "Hot"
  allow_nested_items_to_be_public = true
  min_tls_version                 = "TLS1_2"
  tags                            = local.common_tags
}

resource "azurerm_storage_container" "receipts" {
  name                  = var.receipt_container_name
  storage_account_id    = azurerm_storage_account.winston.id
  container_access_type = "blob"
}

resource "azurerm_linux_web_app" "winston" {
  name                = local.web_app_name
  resource_group_name = azurerm_resource_group.winston.name
  location            = azurerm_service_plan.winston.location
  service_plan_id     = azurerm_service_plan.winston.id

  https_only                                     = true
  public_network_access_enabled                  = true
  ftp_publish_basic_authentication_enabled       = false
  webdeploy_publish_basic_authentication_enabled = true

  app_settings = merge({
    ASPNETCORE_ENVIRONMENT             = "Production"
    WEBSITE_RUN_FROM_PACKAGE           = "1"
    WEBSITE_WEBDEPLOY_USE_SCM          = "true"
    AzureAd__Instance                  = "https://login.microsoftonline.com/"
    AzureAd__TenantId                  = "consumers"
    AzureAd__ClientId                  = azuread_application_registration.api.client_id
    AzureAd__Audience                  = azuread_application_registration.api.client_id
    AzureBlobStorage__ConnectionString = azurerm_storage_account.winston.primary_connection_string
    AzureBlobStorage__ContainerName    = azurerm_storage_container.receipts.name
  }, local.allowed_user_app_settings)

  connection_string {
    name  = "DefaultConnection"
    type  = "SQLAzure"
    value = local.sql_connection_string
  }

  site_config {
    always_on           = !contains(["F1", "D1"], upper(var.app_service_sku_name))
    ftps_state          = "FtpsOnly"
    http2_enabled       = true
    minimum_tls_version = "1.2"

    application_stack {
      dotnet_version = "10.0"
    }
  }

  tags = local.common_tags
}
