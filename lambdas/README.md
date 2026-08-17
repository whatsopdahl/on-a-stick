# Backend compute (planned, not yet built)

The app currently has no backend of its own — the browser talks directly
to Supabase (auth, Postgres, realtime) via `@supabase/supabase-js`. No
Lambda or API Gateway resources are deployed today; this folder reserves
the pattern for when there's an actual need (server-side validation, an
admin task, integrating something Supabase RLS/RPCs can't do alone).

## Planned shape, when needed

- CloudFront (`infra/cloudfront.tf`) gains a second `origin` pointing at
  an API Gateway HTTP API, plus an `ordered_cache_behavior` for
  `path_pattern = "/api/*"` using the AWS-managed `Managed-CachingDisabled`
  policy (dynamic responses shouldn't be cached).
- New `infra/lambda.tf` / `infra/apigateway.tf`: the `aws_lambda_function`
  (code sourced from this folder), a least-privilege execution role,
  `aws_apigatewayv2_integration` / `aws_apigatewayv2_route`, and a
  CloudWatch log group with retention.
- Any secrets the Lambda needs (e.g. a Supabase service-role key) go
  through SSM Parameter Store (SecureString) or Secrets Manager — never a
  plain Terraform variable.

Nothing in the current S3/CloudFront/Route53/ACM/OIDC setup needs to
change shape to accommodate this later — it's purely additive.
