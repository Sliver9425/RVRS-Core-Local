# infrastructure/provider.tf

provider "aws" {
  region = "us-east-1" # La región clásica de AWS Academy
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}