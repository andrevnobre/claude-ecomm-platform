# Production Environment Configuration

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
    key            = "prod/terraform.tfstate"
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
      Environment = "prod"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"

  default_tags {
    tags = {
      Project     = "ecommerce"
      Environment = "prod"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

provider "aws" {
  alias  = "sa_east"
  region = "sa-east-1"

  default_tags {
    tags = {
      Project     = "ecommerce"
      Environment = "prod"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

# ============================================================================
# Cell A - US East
# ============================================================================

module "cell_a" {
  source = "../../modules/cell"

  project_name = "ecommerce"
  environment  = "prod"
  cell_id      = "a"
  aws_region   = "us-east-1"

  # VPC
  vpc_cidr = "10.0.0.0/16"

  # ECS
  ecs_task_cpu       = 1024
  ecs_task_memory    = 2048
  ecs_desired_count  = 2
  ecs_min_count      = 2
  ecs_max_count      = 20
  ecr_repository_url = var.ecr_repository_url
  app_version        = var.app_version

  # RDS
  db_engine_mode          = "provisioned"
  db_instance_class       = "db.r6g.large"
  db_instance_count       = 2
  db_backup_retention_days = 14

  # ElastiCache
  cache_node_type = "cache.r6g.large"
  cache_num_nodes = 2

  # CloudWatch
  log_retention_days = 90

  tags = {
    Cell = "a"
  }
}

# ============================================================================
# Cell B - EU West
# ============================================================================

module "cell_b" {
  source = "../../modules/cell"

  providers = {
    aws = aws.eu_west
  }

  project_name = "ecommerce"
  environment  = "prod"
  cell_id      = "b"
  aws_region   = "eu-west-1"

  # VPC
  vpc_cidr = "10.1.0.0/16"

  # ECS
  ecs_task_cpu       = 1024
  ecs_task_memory    = 2048
  ecs_desired_count  = 2
  ecs_min_count      = 2
  ecs_max_count      = 20
  ecr_repository_url = var.ecr_repository_url
  app_version        = var.app_version

  # RDS
  db_engine_mode          = "provisioned"
  db_instance_class       = "db.r6g.large"
  db_instance_count       = 2
  db_backup_retention_days = 14

  # ElastiCache
  cache_node_type = "cache.r6g.large"
  cache_num_nodes = 2

  # CloudWatch
  log_retention_days = 90

  tags = {
    Cell = "b"
  }
}

# ============================================================================
# Cell C - South America East
# ============================================================================

module "cell_c" {
  source = "../../modules/cell"

  providers = {
    aws = aws.sa_east
  }

  project_name = "ecommerce"
  environment  = "prod"
  cell_id      = "c"
  aws_region   = "sa-east-1"

  # VPC
  vpc_cidr = "10.2.0.0/16"

  # ECS
  ecs_task_cpu       = 1024
  ecs_task_memory    = 2048
  ecs_desired_count  = 2
  ecs_min_count      = 2
  ecs_max_count      = 20
  ecr_repository_url = var.ecr_repository_url
  app_version        = var.app_version

  # RDS
  db_engine_mode          = "provisioned"
  db_instance_class       = "db.r6g.large"
  db_instance_count       = 2
  db_backup_retention_days = 14

  # ElastiCache
  cache_node_type = "cache.r6g.large"
  cache_num_nodes = 2

  # CloudWatch
  log_retention_days = 90

  tags = {
    Cell = "c"
  }
}
