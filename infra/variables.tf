variable "aws_region" {
  description = "AWS region for regional resources (S3, DynamoDB)."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used to prefix resource names and tags."
  type        = string
  default     = "on-a-stick"
}

variable "domain_name" {
  description = "Fully-qualified domain the site is served from, e.g. fair.example.com."
  type        = string
}

variable "include_www_alias" {
  description = "Whether to also issue/serve the certificate for www.<domain_name>."
  type        = bool
  default     = false
}

variable "route53_zone_name" {
  description = "Name of the existing Route53 hosted zone to look up (e.g. example.com). Defaults to domain_name."
  type        = string
  default     = null
}

variable "github_repository" {
  description = "GitHub repo allowed to assume the deploy role, as \"owner/name\" (not a local git remote alias)."
  type        = string
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

locals {
  route53_zone_name = coalesce(var.route53_zone_name, var.domain_name)
  aliases           = var.include_www_alias ? [var.domain_name, "www.${var.domain_name}"] : [var.domain_name]
}
