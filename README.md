# E-Commerce Platform - Reference Architecture

Uma plataforma de e-commerce escalável, resiliente e de baixo custo, hospedada 100% na AWS com arquitetura baseada em células (cell-based architecture).

## Visão Geral

Esta plataforma foi projetada para ser uma solução realista de e-commerce que equilibra:

- **Escalabilidade**: Horizontal scaling via células independentes
- **Custo**: Pay-per-use, autoscaling e otimizações AWS
- **Resiliência**: Isolamento de falhas com blast radius limitado
- **Observabilidade**: Métricas, logs e tracing end-to-end
- **Simplicidade**: Infraestrutura como código e automação

## Arquitetura

A plataforma utiliza **Cell-Based Architecture**, onde cada célula é uma unidade autônoma e isolada contendo:

- **Compute**: ECS Fargate tasks e Lambda functions
- **Data**: Aurora PostgreSQL (shard dedicado)
- **Cache**: ElastiCache Redis
- **Queue**: SQS para processamento assíncrono

### Diagrama Simplificado

```
                    ┌─────────────┐
                    │  CloudFront │
                    │   + WAF     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Cell Router │
                    │ Lambda@Edge │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌───▼─────┐
    │ Cell A  │       │ Cell B  │       │ Cell C  │
    │ US East │       │ EU West │       │ SA East │
    └─────────┘       └─────────┘       └─────────┘
```

Cada célula atende um subconjunto de clientes e é completamente isolada das demais. Se uma célula falhar, as outras continuam operando normalmente.

## Características Principais

### Cell-Based Architecture

- **Isolamento de falhas**: Blast radius limitado a ~33% dos usuários
- **Escalabilidade horizontal**: Adicione células para mais capacidade
- **Deploy independente**: Atualiza uma célula por vez
- **Multi-região**: Células em US, EU e LATAM

### Stack Tecnológico (AWS)

| Camada | Serviços |
|--------|----------|
| **Frontend** | CloudFront + S3 (Static Site) |
| **API Gateway** | API Gateway + Lambda@Edge |
| **Compute** | ECS Fargate + Lambda |
| **Database** | Aurora PostgreSQL |
| **Cache** | ElastiCache Redis |
| **Queue** | SQS + EventBridge |
| **Storage** | S3 |
| **Observability** | CloudWatch + X-Ray |

### Performance e SLOs

| Métrica | Target |
|---------|--------|
| Disponibilidade | 99.9% |
| Latência p95 (API) | < 200ms |
| Latência p99 (API) | < 500ms |
| Throughput | 10,000 RPS |
| Error rate | < 0.1% |

### Custos Estimados

| Ambiente | Células | Custo Mensal |
|----------|---------|--------------|
| Dev | 1 | ~$100 |
| Stage | 1 | ~$275 |
| Prod | 3 | ~$1,800 |

*Custos podem ser reduzidos em 30-50% com Savings Plans após 3-6 meses.*

## Documentação

### Documentação Completa

- **[docs/arquitetura.md](docs/arquitetura.md)**: Documentação detalhada da arquitetura
  - Diagramas C4 (Nível 1 e 2)
  - Justificativas de escolha de serviços AWS (ADRs)
  - Estratégia de Cell-Based Architecture
  - Performance, custo e observabilidade
  - Roadmap de implementação
  - SLOs e requisitos não funcionais

### Infraestrutura como Código

- **[infra/](infra/)**: Terraform para toda a infraestrutura
  - `modules/cell/`: Módulo reutilizável de célula completa
  - `modules/frontend/`: CloudFront + S3
  - `modules/observability/`: CloudWatch + X-Ray
  - `environments/dev/`: Ambiente de desenvolvimento
  - `environments/stage/`: Ambiente de staging
  - `environments/prod/`: Ambiente de produção

## Quick Start

### Pré-requisitos

- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [AWS CLI](https://aws.amazon.com/cli/) configurado
- Permissões IAM para criar recursos AWS

### Deploy do Ambiente de Dev

```bash
# 1. Configurar backend do Terraform
aws s3 mb s3://ecomm-terraform-state --region us-east-1
aws dynamodb create-table \
  --table-name ecomm-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 2. Deploy da infraestrutura
cd infra/environments/dev
terraform init
terraform plan
terraform apply
```

### Comandos Úteis

```bash
# Ver recursos criados
terraform show

# Ver outputs (endpoints, etc)
terraform output

# Destruir ambiente (cuidado!)
terraform destroy
```

## Roadmap

### Fase 1: MVP (2-3 meses)

- [x] Arquitetura documentada
- [x] Infraestrutura como código (Terraform)
- [ ] Backend APIs (Catálogo, Carrinho, Checkout)
- [ ] Frontend (Next.js)
- [ ] Observabilidade básica
- [ ] Deploy em 1 célula

### Fase 2: Cell-Based Architecture (1-2 meses)

- [ ] Cell Router (Lambda@Edge)
- [ ] 3 células (US, EU, LATAM)
- [ ] Data sharding por região/tenant
- [ ] Health checks e failover
- [ ] Load testing e chaos engineering

### Fase 3: Otimização e Expansão (ongoing)

- [ ] Performance tuning (cache, queries)
- [ ] Cost optimization (Savings Plans, Spot)
- [ ] Novas features (recomendações, marketplace)
- [ ] Compliance (GDPR, LGPD, PCI-DSS)

## Como Evoluir a Arquitetura

### Adicionar Nova Célula

```bash
# 1. Criar configuração da célula
cd infra/environments/prod
# Editar main.tf para adicionar module "cell_d"

# 2. Deploy
terraform apply -target=module.cell_d

# 3. Registrar no Cell Registry
aws dynamodb put-item --table-name CellRegistry \
  --item '{"cellId": {"S": "d"}, "status": {"S": "active"}}'
```

### Escalar Horizontalmente

- **Adicionar células**: Para mais capacidade geográfica
- **Autoscaling**: ECS aumenta tasks automaticamente
- **Read replicas**: Aurora adiciona replicas para leitura

### Reduzir Custos

1. **Fargate Spot**: 70% desconto para workers não críticos
2. **Aurora Serverless**: Autoscaling fino de capacidade
3. **Savings Plans**: 30-50% desconto após 3 meses
4. **S3 Lifecycle**: Move dados antigos para tiers baratos
5. **Right-sizing**: Ajustar tamanhos baseado em métricas

### Melhorar Observabilidade

- **Custom metrics**: Métricas de negócio (GMV, conversão)
- **Dashboards avançados**: Grafana + CloudWatch
- **Alertas inteligentes**: Machine learning para anomalias
- **SLIs/SLOs formais**: Error budgets, SLA tracking

## Estrutura do Repositório

```
.
├── README.md                    # Este arquivo
├── docs/
│   └── arquitetura.md          # Documentação detalhada
├── infra/                      # Infraestrutura como código
│   ├── modules/
│   │   ├── cell/              # Módulo de célula
│   │   ├── frontend/          # Módulo de frontend
│   │   └── observability/     # Módulo de observabilidade
│   ├── environments/
│   │   ├── dev/               # Ambiente de desenvolvimento
│   │   ├── stage/             # Ambiente de staging
│   │   └── prod/              # Ambiente de produção
│   └── global/                # Recursos globais (Route 53, WAF)
├── src/                        # (Futuro) Código da aplicação
│   ├── api/                   # Backend APIs
│   ├── frontend/              # Frontend React/Next.js
│   └── workers/               # Lambda workers
└── .github/
    └── workflows/             # CI/CD pipelines
```

## Contribuindo

### Issues e Features

Criamos issues no GitHub para segregar tarefas:

- **Issue #13**: Implementar backend APIs (Catálogo, Carrinho, Checkout)
- **Issue #14**: Implementar frontend (Next.js + CloudFront)
- **Issue #15**: Setup de observabilidade (CloudWatch + X-Ray)
- **Issue #16**: Cell Router e roteamento inteligente
- **Issue #17**: CI/CD pipeline (GitHub Actions)

### Desenvolvimento

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ecommerce-platform.git
cd ecommerce-platform

# 2. Crie uma branch para sua feature
git checkout -b feature/nova-feature

# 3. Faça suas alterações e commit
git commit -m "feat: adiciona nova feature"

# 4. Push e abra um Pull Request
git push origin feature/nova-feature
```

## Recursos e Referências

### AWS

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Reference Architectures](https://aws.amazon.com/architecture/)
- [Cell-based Architecture on AWS](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/)

### Observabilidade

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)

### Terraform

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

## Suporte

- **Issues**: Abrir issue no GitHub
- **Documentação**: Ver [docs/arquitetura.md](docs/arquitetura.md)

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Projeto**: E-Commerce Platform Reference Architecture
**Versão**: 1.0.0
**Data**: 2025-11-11
**Managed by**: Terraform
