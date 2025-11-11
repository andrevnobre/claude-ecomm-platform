# Development Environment Variables

variable "ecr_repository_url" {
  description = "ECR repository URL for container images"
  type        = string
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ecommerce-api"
}

variable "app_version" {
  description = "Application version to deploy"
  type        = string
  default     = "latest"
}
