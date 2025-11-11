# Cell Module Variables

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ecommerce"
}

variable "environment" {
  description = "Environment (dev, stage, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "stage", "prod"], var.environment)
    error_message = "Environment must be dev, stage, or prod."
  }
}

variable "cell_id" {
  description = "Cell identifier (a, b, c, etc.)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# ============================================================================
# VPC
# ============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ============================================================================
# ECS
# ============================================================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task (in MB)"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 2
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 10
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 3000
}

variable "ecr_repository_url" {
  description = "ECR repository URL for container image"
  type        = string
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ecommerce-api"
}

variable "app_version" {
  description = "Application version/tag"
  type        = string
  default     = "latest"
}

# ============================================================================
# RDS
# ============================================================================

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "ecommerce"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_engine_mode" {
  description = "Aurora engine mode (provisioned or serverless)"
  type        = string
  default     = "provisioned"

  validation {
    condition     = contains(["provisioned", "serverless"], var.db_engine_mode)
    error_message = "Engine mode must be provisioned or serverless."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "db_instance_count" {
  description = "Number of RDS instances (for read replicas)"
  type        = number
  default     = 2
}

variable "db_backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# ============================================================================
# ElastiCache
# ============================================================================

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "cache_num_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

# ============================================================================
# CloudWatch
# ============================================================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

# ============================================================================
# Tags
# ============================================================================

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
