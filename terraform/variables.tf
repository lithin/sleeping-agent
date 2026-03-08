variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name (used for resource naming)"
  type        = string
  default     = "sleep-agent"
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "sleepagent"
}

variable "database_user" {
  description = "PostgreSQL database user"
  type        = string
  default     = "sleepagent"
}

variable "database_password" {
  description = "PostgreSQL database password (auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = null
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro" # Smallest tier for cost savings
}

variable "api_secret_key" {
  description = "API secret key for authentication (auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "deletion_protection" {
  description = "Enable deletion protection for Cloud SQL"
  type        = bool
  default     = true
}
