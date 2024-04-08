/// Infra variables.

variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "app_name" {
  description = "App name"
  default     = "reflyd"
}

variable "allowlist_ip" {
  description = "IP to allow access for the security groups (set 0.0.0.0/0 for world)"
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  description = "Type of EC2 instance to provision"
  default     = "t2.micro"
}

variable "instance_count" {
  description = "Application instance count"
  default     = 1
}

variable "image_name" {
  description = "Docker image repository url"
  default     = "public.ecr.aws/g1y9i0k2/reflyd"
}

variable "image_version" {
  description = "Version of application image"
  default     = "latest"
}

variable "site_name" {
  description = "Site DNS name, e.g. <site_name>.refly.ai"
  default     = "api"
}

variable "cloudflare_api_token" {
  description = "API Token for Cloudflare"
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone id"
  sensitive   = true
}

/// Application variables.

variable "app_env" {
  description = "App env"
  default     = "dev"
}

variable "database_url" {
  description = "Database URL"
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client id"
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth secret"
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  sensitive   = true
}

variable "google_callback_url" {
  description = "Callback URL for Google OAuth"
  default     = "https://api.refly.ai/v1/auth/callback/google"
}

variable "login_redirect_url" {
  description = "Callback URL for Google OAuth"
  default     = "https://refly.ai/dashboard?redirectFrom=login"
}