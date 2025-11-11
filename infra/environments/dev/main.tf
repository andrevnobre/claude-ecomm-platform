# Development Environment Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state backend
  backend "s3" {
    bucket         = "ecomm-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ecomm-terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "ecommerce"
      Environment = "dev"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

# ============================================================================
# Cell Dev - Single Cell for Development
# ============================================================================

module "cell_dev" {
  source = "../../modules/cell"

  project_name = "ecommerce"
  environment  = "dev"
  cell_id      = "dev"
  aws_region   = "us-east-1"

  # VPC
  vpc_cidr = "10.10.0.0/16"

  # ECS - Minimal configuration for dev
  ecs_task_cpu      = 512   # 0.5 vCPU
  ecs_task_memory   = 1024  # 1 GB
  ecs_desired_count = 1
  ecs_min_count     = 1
  ecs_max_count     = 3
  ecr_repository_url = var.ecr_repository_url
  app_version       = var.app_version

  # RDS - Aurora Serverless v2 for cost efficiency
  db_engine_mode          = "serverless"
  db_instance_class       = "db.serverless"
  db_instance_count       = 0  # Serverless doesn't use instances
  db_backup_retention_days = 1

  # ElastiCache - Smallest instance
  cache_node_type = "cache.t4g.micro"
  cache_num_nodes = 1

  # CloudWatch - Shorter retention
  log_retention_days = 7

  tags = {
    Cell = "dev"
  }
}
