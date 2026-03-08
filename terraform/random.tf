# Auto-generate secure passwords if not provided
resource "random_password" "database_password" {
  count   = var.database_password == null || var.database_password == "" ? 1 : 0
  length  = 32
  special = true
}

resource "random_password" "api_secret_key" {
  count   = var.api_secret_key == "" ? 1 : 0
  length  = 64
  special = false # Easier to work with in HTTP headers
}

# Use provided values or auto-generated ones
locals {
  database_password = var.database_password != null && var.database_password != "" ? var.database_password : try(random_password.database_password[0].result, "")
  api_secret_key    = var.api_secret_key != "" ? var.api_secret_key : try(random_password.api_secret_key[0].result, "")
}
