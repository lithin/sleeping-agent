# Cloud Run Backend Service
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.app_name}-backend"
  location = var.region

  template {
    service_account = google_service_account.cloudrun_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    timeout = "300s"

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/backend:latest"

      env {
        name  = "DB_SOCKET_PATH"
        value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
      }

      env {
        name  = "DB_NAME"
        value = var.database_name
      }

      env {
        name = "DB_USER"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_user.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "API_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.api_secret_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.openai_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.api_secret_key,
    google_secret_manager_secret_version.openai_api_key,
    google_secret_manager_secret_version.database_user,
    google_secret_manager_secret_version.database_password
  ]
}

# Allow unauthenticated access to backend
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
