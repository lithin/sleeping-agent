# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "${var.app_name}-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
  }

  deletion_protection = var.deletion_protection

  depends_on = [google_project_service.required_apis]
}

# Database
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

# Database user
resource "google_sql_user" "db_user" {
  name     = var.database_user
  instance = google_sql_database_instance.postgres.name
  password = local.database_password
}
