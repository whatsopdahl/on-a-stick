# Populated after running `infra/bootstrap` once (see infra/README.md).
# Backend blocks cannot reference variables, so these values are literal.

terraform {
  backend "s3" {
    bucket       = "on-a-stick-tfstate-381491860914"
    key          = "on-a-stick/root/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
