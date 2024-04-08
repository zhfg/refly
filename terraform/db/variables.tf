variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "app_env" {
  description = "App env"
  default     = "dev"
}

variable "allowlist_ip" {
  description = "IP to allow access for the security groups (set 0.0.0.0/0 for world)"
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  description = "Type of EC2 instance to provision"
  default     = "t2.micro"
}

variable "db_name" {
  description = "Name of database"
  default     = "refly"
}

variable "pg_user" {
  description = "DB user"
  sensitive   = true
}

variable "pg_password" {
  description = "DB password"
  sensitive   = true
}