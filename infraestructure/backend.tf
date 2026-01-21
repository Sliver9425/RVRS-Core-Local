terraform {
  backend "s3" {
    bucket                      = "nombre-de-tu-bucket"
    key                         = "terraform/state/rvrs-stack.tfstate"
    region                      = "us-east-1"
    endpoint                    = "s3.us-east-005.backblazeb2.com" # Verifica tu endpoint en B2
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}