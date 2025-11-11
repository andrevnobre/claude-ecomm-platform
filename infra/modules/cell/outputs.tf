# Cell Module Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "ecs_cluster_id" {
  description = "ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS Service name"
  value       = aws_ecs_service.app.name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster write endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS cluster read endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.main.id
}

output "rds_database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "db_password_secret_arn" {
  description = "ARN of the secret containing database password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "cell_id" {
  description = "Cell identifier"
  value       = var.cell_id
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}
