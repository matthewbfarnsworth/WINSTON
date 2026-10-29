locals {
  deployment_name_prefix = lower("${var.project_name}-${var.environment}")
  name_prefix            = local.deployment_name_prefix
  compact_name_prefix    = replace(local.name_prefix, "-", "")
  unique_suffix          = random_string.resource_suffix.result

  resource_group_name  = "${local.name_prefix}-rg"
  service_plan_name    = "${local.name_prefix}-plan"
  web_app_name         = coalesce(var.web_app_name, substr("${local.name_prefix}-${local.unique_suffix}", 0, 60))
  sql_server_name      = substr("${local.name_prefix}-sql-${local.unique_suffix}", 0, 63)
  sql_database_name    = "${local.name_prefix}-db"
  storage_account_name = "${substr(local.compact_name_prefix, 0, 18)}${local.unique_suffix}"

  app_url = "https://${azurerm_linux_web_app.winston.default_hostname}"

  allowed_user_app_settings = {
    for index, object_id in sort(tolist(var.allowed_user_object_ids)) :
    "AccessControl__AllowedUserObjectIds__${index}" => object_id
  }

  sql_connection_string = join("", [
    "Server=tcp:${azurerm_mssql_server.winston.fully_qualified_domain_name},1433;",
    "Initial Catalog=${azapi_resource.sql_database.name};",
    "Persist Security Info=False;",
    "User ID=${var.sql_admin_login};",
    "Password=${random_password.sql_admin.result};",
    "MultipleActiveResultSets=False;",
    "Encrypt=True;",
    "TrustServerCertificate=False;",
    "Connection Timeout=30;",
  ])

  common_tags = merge({
    Application = "WINSTON"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }, var.tags)
}
