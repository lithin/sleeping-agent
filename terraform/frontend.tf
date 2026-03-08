# Cloud Storage bucket for static website hosting
resource "google_storage_bucket" "frontend" {
  name          = "${var.project_id}-${var.app_name}-frontend"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"  # SPA routing - serve index.html for all paths
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.required_apis]
}

# Make bucket public
resource "google_storage_bucket_iam_member" "frontend_public" {
  count  = var.frontend_public ? 1 : 0
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
