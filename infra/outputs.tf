output "site_bucket_name" {
  description = "S3 bucket holding the built site assets. Used as AWS_S3_BUCKET in CI."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID. Used as AWS_CLOUDFRONT_DISTRIBUTION_ID in CI."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront's default *.cloudfront.net domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "Public URL of the deployed site."
  value       = "https://${var.domain_name}"
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN used by the CloudFront distribution."
  value       = aws_acm_certificate.site.arn
}

output "github_actions_role_arn" {
  description = "IAM role ARN GitHub Actions assumes via OIDC. Used as AWS_DEPLOY_ROLE_ARN in CI."
  value       = aws_iam_role.github_actions_deploy.arn
}

output "route53_zone_name_servers" {
  description = "Name servers of the looked-up Route53 zone, for confirming registrar delegation."
  value       = data.aws_route53_zone.this.name_servers
}
