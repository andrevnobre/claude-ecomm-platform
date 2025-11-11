# Infrastructure as Code - E-Commerce Platform

Este diretório contém a infraestrutura como código (IaC) da plataforma de e-commerce usando Terraform.

## Estrutura

```
infra/
├── modules/              # Módulos reutilizáveis
│   ├── cell/            # Célula completa (VPC, ECS, RDS, Cache, etc)
│   ├── frontend/        # CloudFront + S3 para frontend estático
│   └── observability/   # CloudWatch, X-Ray, dashboards, alarmes
├── environments/        # Configurações específicas por ambiente
│   ├── dev/            # Ambiente de desenvolvimento
│   ├── stage/          # Ambiente de staging
│   └── prod/           # Ambiente de produção
└── global/             # Recursos globais (Route 53, ACM, Cell Registry)
```

## Pré-requisitos

1. **Terraform** >= 1.5.0
   ```bash
   brew install terraform  # macOS
   # ou
   wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
   ```

2. **AWS CLI** configurado
   ```bash
   aws configure
   # AWS Access Key ID: [sua key]
   # AWS Secret Access Key: [seu secret]
   # Default region: us-east-1
   ```

3. **Permissões IAM** necessárias:
   - VPC, EC2, ECS, RDS, ElastiCache
   - S3, CloudFront, Route 53
   - IAM (para roles e policies)
   - CloudWatch, X-Ray

## Quick Start

### 1. Configurar Backend do Terraform

Primeiro, crie o bucket S3 e a tabela DynamoDB para gerenciar o state:

```bash
# Criar bucket para state
aws s3 mb s3://ecomm-terraform-state --region us-east-1

# Habilitar versionamento
aws s3api put-bucket-versioning \
  --bucket ecomm-terraform-state \
  --versioning-configuration Status=Enabled

# Criar tabela DynamoDB para state lock
aws dynamodb create-table \
  --table-name ecomm-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Deploy do Ambiente de Dev

```bash
cd environments/dev
terraform init
terraform plan
terraform apply
```

### 3. Deploy de Outros Ambientes

```bash
# Stage
cd ../stage
terraform init
terraform apply

# Prod (requer aprovação manual)
cd ../prod
terraform init
terraform plan -out=prod.tfplan
# Revisar o plan cuidadosamente
terraform apply prod.tfplan
```

## Módulos

### Cell Module

Módulo que cria uma célula completa da arquitetura:

```hcl
module "cell_a" {
  source = "../../modules/cell"

  cell_id     = "a"
  environment = "prod"
  region      = "us-east-1"

  # VPC
  vpc_cidr = "10.0.0.0/16"

  # ECS
  ecs_task_cpu    = 1024
  ecs_task_memory = 2048
  ecs_desired_count = 2

  # Database
  db_instance_class = "db.r6g.large"
  db_name          = "ecommerce"

  # Cache
  cache_node_type = "cache.r6g.large"

  tags = {
    Project     = "ecommerce"
    Environment = "prod"
    Cell        = "a"
  }
}
```

**Recursos Criados**:
- VPC com subnets públicas e privadas
- ALB e target groups
- ECS Fargate cluster e services
- Aurora PostgreSQL (Multi-AZ)
- ElastiCache Redis
- Security Groups
- IAM Roles e Policies
- CloudWatch Log Groups

### Frontend Module

Módulo para hospedagem de frontend estático:

```hcl
module "frontend" {
  source = "../../modules/frontend"

  environment = "prod"
  domain_name = "shop.example.com"

  # CloudFront
  cloudfront_price_class = "PriceClass_100"  # US, EU

  # S3
  s3_bucket_name = "ecomm-frontend-prod"

  tags = {
    Project     = "ecommerce"
    Environment = "prod"
  }
}
```

**Recursos Criados**:
- S3 bucket para site estático
- CloudFront distribution
- ACM certificate
- Route 53 records
- OAI (Origin Access Identity)

### Observability Module

Módulo para observabilidade centralizada:

```hcl
module "observability" {
  source = "../../modules/observability"

  environment = "prod"
  cell_ids    = ["a", "b", "c"]

  # X-Ray
  xray_sampling_rate = 0.05  # 5%

  # CloudWatch
  log_retention_days = 90

  # Alarmes
  alert_email = "ops@example.com"

  tags = {
    Project     = "ecommerce"
    Environment = "prod"
  }
}
```

**Recursos Criados**:
- CloudWatch Dashboards
- CloudWatch Alarms (CPU, memória, erros)
- SNS Topics para alertas
- X-Ray sampling rules
- Log Groups centralizados

## Ambientes

### Dev

- **Objetivo**: Desenvolvimento rápido, custo mínimo
- **Configuração**:
  - 1 célula (us-east-1)
  - Aurora Serverless v2 (mínimo 0.5 ACU)
  - Cache: t4g.micro
  - ECS: 1 task (0.5 vCPU, 1GB RAM)
- **Custo estimado**: ~$100/mês

### Stage

- **Objetivo**: Testes de integração, simulação de prod
- **Configuração**:
  - 1 célula (us-east-1)
  - Aurora: db.t4g.medium
  - Cache: cache.t4g.small
  - ECS: 2 tasks (1 vCPU, 2GB RAM)
- **Custo estimado**: ~$275/mês

### Prod

- **Objetivo**: Workloads de produção, alta disponibilidade
- **Configuração**:
  - 3 células (us-east-1, eu-west-1, sa-east-1)
  - Aurora: db.r6g.large (Multi-AZ)
  - Cache: cache.r6g.large
  - ECS: 2-20 tasks autoscaling (1 vCPU, 2GB RAM)
- **Custo estimado**: ~$1,800/mês

## Recursos Globais

Recursos compartilhados entre células:

```bash
cd global
terraform init
terraform apply
```

**Recursos Criados**:
- Route 53 hosted zone
- ACM certificates (wildcard)
- WAF Web ACL
- DynamoDB Global Table (Cell Registry)
- Lambda@Edge (Cell Router)

## Workflow de Deploy

### Deploy Padrão (Dev/Stage)

```bash
cd environments/dev
terraform plan
terraform apply
```

### Deploy Produção (Gradual)

Para produção, faça deploy célula por célula:

```bash
cd environments/prod

# Deploy Cell A
terraform apply -target=module.cell_a

# Validar saúde da Cell A
aws ecs describe-services --cluster ecomm-prod-a --services api

# Se OK, deploy Cell B
terraform apply -target=module.cell_b

# Validar Cell B, então Cell C
terraform apply -target=module.cell_c

# Finalmente, deploy recursos compartilhados
terraform apply
```

### Rollback

```bash
# Opção 1: Terraform state rollback
terraform state pull > backup.tfstate
terraform state push <previous-state>

# Opção 2: Remover célula com problema do pool
# Editar Cell Registry no DynamoDB
aws dynamodb update-item \
  --table-name CellRegistry \
  --key '{"cellId": {"S": "b"}}' \
  --update-expression "SET #status = :disabled" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":disabled": {"S": "disabled"}}'
```

## Variáveis de Ambiente

Crie um arquivo `terraform.tfvars` (não versionado):

```hcl
# AWS
aws_region = "us-east-1"
aws_profile = "default"

# Project
project_name = "ecommerce"
environment  = "prod"

# Network
vpc_cidr = "10.0.0.0/16"

# Database
db_username = "admin"
db_password = "CHANGE-ME"  # Usar Secrets Manager em prod!

# Alertas
alert_email = "ops@example.com"
pagerduty_integration_key = "xxx"

# Tags
tags = {
  Project     = "ecommerce"
  Environment = "prod"
  ManagedBy   = "terraform"
  Owner       = "platform-team"
}
```

## Secrets Management

**NUNCA** commitar secrets no repositório!

### Opção 1: AWS Secrets Manager (Recomendado)

```hcl
# Criar secret
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.environment}/db/password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# Usar no RDS
resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}
```

### Opção 2: Terraform Cloud (Variáveis sensíveis)

1. Criar workspace no Terraform Cloud
2. Adicionar variáveis sensíveis na UI
3. Marcar como "sensitive"

## CI/CD

### GitHub Actions (Exemplo)

```yaml
name: Terraform Deploy

on:
  push:
    branches: [main]
    paths: ['infra/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: infra/environments/prod

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: infra/environments/prod

      - name: Terraform Apply (manual approval)
        if: github.event_name == 'push'
        run: terraform apply tfplan
        working-directory: infra/environments/prod
```

## Troubleshooting

### Erro: "Error locking state"

```bash
# Forçar unlock (cuidado!)
terraform force-unlock <lock-id>
```

### Erro: "Resource already exists"

```bash
# Importar recurso existente
terraform import aws_vpc.main vpc-xxx
```

### Debug

```bash
# Verbose logging
export TF_LOG=DEBUG
terraform apply

# Visualizar state
terraform show
terraform state list
terraform state show aws_ecs_service.api
```

## Custos

### Monitorar Custos

```bash
# Cost Explorer CLI
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=TAG,Key=Environment

# Ou usar AWS Cost Explorer UI
```

### Otimização

1. **Right-sizing**: Baseado em métricas do CloudWatch
2. **Spot Instances**: Para ECS tasks não críticos
3. **Savings Plans**: Após 2-3 meses com métricas reais
4. **Lifecycle Policies**: S3, logs antigos

## Segurança

### Checklist

- [ ] Backend do Terraform criptografado (S3 encryption)
- [ ] State lock habilitado (DynamoDB)
- [ ] Secrets no Secrets Manager (não no código)
- [ ] IAM roles com least privilege
- [ ] Security Groups restritivos
- [ ] VPC Flow Logs habilitados
- [ ] CloudTrail habilitado
- [ ] GuardDuty habilitado

### Scan de Segurança

```bash
# Checkov (static analysis)
pip install checkov
checkov -d infra/

# tfsec
brew install tfsec
tfsec infra/

# Terrascan
brew install terrascan
terrascan scan -d infra/
```

## Documentação

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

## Suporte

- **Issues**: Abrir issue no GitHub
- **Slack**: #platform-team
- **On-call**: PagerDuty rotation

---

**Última atualização**: 2025-11-11
