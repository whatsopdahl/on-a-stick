# Infrastructure (Terraform)

Deploys the built `dist/` output to S3, served via CloudFront on a custom
domain, with deploys performed by GitHub Actions using an OIDC-federated
IAM role (no long-lived AWS keys). No backend compute (Lambda) is deployed
yet — see [`../lambdas/README.md`](../lambdas/README.md) for the planned
seam.

## One-time setup

### 1. Bootstrap the remote state backend

This creates the S3 bucket that holds Terraform's own state (and, via
native S3 locking, its lock files — no DynamoDB table needed). It
intentionally uses local state itself, since it can't depend on the
backend it's creating.

```bash
cd infra/bootstrap
terraform init
terraform apply
```

Note the `tfstate_bucket` output. Update `infra/backend.tf` in the root
module: replace `on-a-stick-tfstate-REPLACE_WITH_ACCOUNT_ID` with that
bucket name (it will already match `on-a-stick-tfstate-<your-account-id>`).

### 2. Configure and apply the root module

```bash
cd infra
terraform init
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: domain_name, github_repository, etc.
terraform plan
terraform apply
```

The domain's Route53 hosted zone must already exist and be delegated at
the registrar — this config looks it up via `data "aws_route53_zone"`, it
does not create it. ACM DNS validation typically resolves within minutes
against a live zone (occasionally up to ~30 min). First CloudFront
distribution creation can take 5–15 minutes to reach `Deployed`.

### 3. Wire up GitHub Actions

From `terraform output`, set:

- Repo **Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Repo **Variables**: `AWS_DEPLOY_ROLE_ARN` (`github_actions_role_arn`),
  `AWS_S3_BUCKET` (`site_bucket_name`),
  `AWS_CLOUDFRONT_DISTRIBUTION_ID` (`cloudfront_distribution_id`)

Trigger `.github/workflows/deploy.yml` once via `workflow_dispatch` to
confirm the OIDC role assumption works before relying on push-to-main.

## Ongoing use

Application deploys happen automatically via GitHub Actions on push to
`main` — see `.github/workflows/deploy.yml`. Only run `terraform apply`
here again when infrastructure itself changes (new domain, cache
behavior, IAM changes, etc).

## Estimated cost (<50 users/month, us-east-1)

| Item | Estimate |
|---|---|
| S3 (site + state) | ~$0.00–0.01/mo |
| CloudFront | ~$0.00–0.50/mo (free tier covers this traffic many times over) |
| Route53 hosted zone | **~$0.50/mo (fixed, independent of traffic)** |
| Route53 queries | ~$0.00 |
| ACM certificate | $0.00 (free with CloudFront) |
| **Total** | **~$0.50–$1.50/month** |

Consider a low-threshold AWS Budgets alert (e.g. $5/month) as a cheap
safety net.

## Future: adding backend compute (Lambda)

See [`../lambdas/README.md`](../lambdas/README.md).
