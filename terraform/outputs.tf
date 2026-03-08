output "backend_url" {
  description = "Backend Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "database_instance" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "database_public_ip" {
  description = "Cloud SQL instance public IP"
  value       = google_sql_database_instance.postgres.public_ip_address
}

output "artifact_registry" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

output "generated_api_secret_key" {
  description = "Auto-generated API secret key (if not provided)"
  value       = local.api_secret_key
  sensitive   = true
}

output "generated_database_password" {
  description = "Auto-generated database password (if not provided)"
  value       = local.database_password
  sensitive   = true
}

output "docker_push_commands" {
  description = "Commands to build and deploy"
  value       = <<-EOT
    # Authenticate with Artifact Registry
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # Build and push backend
    cd backend
    docker build -t ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/backend:latest -f Dockerfile.prod .
    docker push ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/backend:latest
  EOT
}
