# Production Environment Outputs

# ============================================================================
# Cell A Outputs
# ============================================================================

output "cell_a_alb_dns" {
  description = "Cell A ALB DNS name"
  value       = module.cell_a.alb_dns_name
}

output "cell_a_ecs_cluster" {
  description = "Cell A ECS cluster name"
  value       = module.cell_a.ecs_cluster_name
}

output "cell_a_rds_endpoint" {
  description = "Cell A RDS endpoint"
  value       = module.cell_a.rds_cluster_endpoint
  sensitive   = true
}

output "cell_a_redis_endpoint" {
  description = "Cell A Redis endpoint"
  value       = module.cell_a.redis_endpoint
  sensitive   = true
}

# ============================================================================
# Cell B Outputs
# ============================================================================

output "cell_b_alb_dns" {
  description = "Cell B ALB DNS name"
  value       = module.cell_b.alb_dns_name
}

output "cell_b_ecs_cluster" {
  description = "Cell B ECS cluster name"
  value       = module.cell_b.ecs_cluster_name
}

output "cell_b_rds_endpoint" {
  description = "Cell B RDS endpoint"
  value       = module.cell_b.rds_cluster_endpoint
  sensitive   = true
}

output "cell_b_redis_endpoint" {
  description = "Cell B Redis endpoint"
  value       = module.cell_b.redis_endpoint
  sensitive   = true
}

# ============================================================================
# Cell C Outputs
# ============================================================================

output "cell_c_alb_dns" {
  description = "Cell C ALB DNS name"
  value       = module.cell_c.alb_dns_name
}

output "cell_c_ecs_cluster" {
  description = "Cell C ECS cluster name"
  value       = module.cell_c.ecs_cluster_name
}

output "cell_c_rds_endpoint" {
  description = "Cell C RDS endpoint"
  value       = module.cell_c.rds_cluster_endpoint
  sensitive   = true
}

output "cell_c_redis_endpoint" {
  description = "Cell C Redis endpoint"
  value       = module.cell_c.redis_endpoint
  sensitive   = true
}
