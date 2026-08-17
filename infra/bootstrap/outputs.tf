output "tfstate_bucket" {
  description = "S3 bucket that holds Terraform remote state and native lock files for the root module."
  value       = aws_s3_bucket.tfstate.bucket
}
