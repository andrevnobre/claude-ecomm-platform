# Deployment Configuration

This directory contains deployment configurations for the Catalog API.

## ECS Fargate Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Docker installed locally
3. ECR repository created for catalog-api
4. ECS cluster created
5. Aurora PostgreSQL and ElastiCache Redis provisioned
6. Secrets stored in AWS Secrets Manager

### Step 1: Build and Push Docker Image

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t catalog-api:latest .

# Tag image
docker tag catalog-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/catalog-api:latest

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/catalog-api:latest
```

### Step 2: Update Task Definition

Update the `ecs-task-definition.json` file with your:
- AWS Account ID
- AWS Region
- ECR image URI
- IAM role ARNs
- Secrets Manager ARNs

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://deployment/ecs-task-definition.json
```

### Step 3: Create ECS Service

```bash
aws ecs create-service \
  --cluster ecommerce-cluster \
  --service-name catalog-api \
  --task-definition catalog-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT_ID:targetgroup/catalog-api-tg,containerName=catalog-api,containerPort=3000"
```

### Step 4: Configure Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/ecommerce-cluster/catalog-api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/ecommerce-cluster/catalog-api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name catalog-api-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Resource Configuration

### CPU and Memory

| Environment | vCPU | Memory | Estimated Cost |
|-------------|------|--------|----------------|
| Dev | 0.25 | 512 MB | ~$10/month |
| Stage | 0.5 | 1 GB | ~$30/month |
| Prod | 0.5-1 | 1-2 GB | ~$70/month per task |

### Auto Scaling Targets

| Metric | Target | Scale Out | Scale In |
|--------|--------|-----------|----------|
| CPU | 70% | +1 task | -1 task |
| Memory | 80% | +1 task | -1 task |
| Requests | 1000 RPS | +2 tasks | -1 task |

## Secrets Management

Store sensitive configuration in AWS Secrets Manager:

```bash
# Database credentials
aws secretsmanager create-secret \
  --name catalog/db/host \
  --secret-string "aurora-cluster.cluster-xxx.region.rds.amazonaws.com"

# Redis endpoint
aws secretsmanager create-secret \
  --name catalog/redis/host \
  --secret-string "catalog-redis.xxx.cache.amazonaws.com"
```

## Monitoring

### CloudWatch Logs

Logs are automatically sent to CloudWatch Logs groups:
- `/ecs/catalog-api` - Application logs
- `/ecs/catalog-api-xray` - X-Ray daemon logs

### CloudWatch Metrics

Key metrics to monitor:
- `CPUUtilization`
- `MemoryUtilization`
- `TargetResponseTime`
- `RequestCount`
- `HTTPCode_Target_5XX_Count`

### X-Ray Tracing

X-Ray daemon runs as a sidecar container and collects distributed traces.

## CI/CD Pipeline

See `.github/workflows/deploy.yml` for automated deployment pipeline.

## Troubleshooting

### Task Fails to Start

1. Check CloudWatch Logs for errors
2. Verify secrets are accessible
3. Ensure security groups allow database/redis access
4. Check IAM role permissions

### High Response Times

1. Check database query performance
2. Verify cache hit rates in Redis
3. Review X-Ray traces for bottlenecks
4. Consider scaling up task resources

### Connection Issues

1. Verify security group rules
2. Check VPC configuration
3. Ensure subnets have proper routing
4. Verify DNS resolution

## Rollback

To rollback to a previous version:

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix catalog-api

# Update service with previous task definition
aws ecs update-service \
  --cluster ecommerce-cluster \
  --service catalog-api \
  --task-definition catalog-api:PREVIOUS_VERSION
```

## Cost Optimization

1. Use Fargate Spot for non-critical workloads (70% savings)
2. Right-size tasks based on actual usage
3. Implement request caching to reduce compute
4. Use Aurora Serverless v2 for auto-scaling database
5. Set up Savings Plans after stable usage patterns emerge
