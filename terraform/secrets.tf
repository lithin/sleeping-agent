# Secret Manager Secrets
resource "google_secret_manager_secret" "api_secret_key" {
  secret_id = "${var.app_name}-api-secret-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "api_secret_key" {
  secret      = google_secret_manager_secret.api_secret_key.id
  secret_data = local.api_secret_key
}

resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "${var.app_name}-openai-api-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

resource "google_secret_manager_secret" "database_user" {
  secret_id = "${var.app_name}-database-user"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "database_user" {
  secret      = google_secret_manager_secret.database_user.id
  secret_data = var.database_user
}

resource "google_secret_manager_secret" "database_password" {
  secret_id = "${var.app_name}-database-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "database_password" {
  secret      = google_secret_manager_secret.database_password.id
  secret_data = local.database_password
}

# Grant Cloud Run SA access to secrets
resource "google_secret_manager_secret_iam_member" "api_secret_access" {
  secret_id = google_secret_manager_secret.api_secret_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "openai_secret_access" {
  secret_id = google_secret_manager_secret.openai_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "database_user_access" {
  secret_id = google_secret_manager_secret.database_user.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "database_password_access" {
  secret_id = google_secret_manager_secret.database_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}
