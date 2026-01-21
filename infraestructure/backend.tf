terraform {
  backend "s3" {
    bucket = "despliegue-RVRS"
    key    = "terraform.tfstate"
    region = "us-east-1" # Se deja us-east-1 por compatibilidad, aunque sea B2

    # Cambia 'endpoint' por 'endpoints' y añade https://
    endpoints = {
      s3 = "https://s3.us-east-005.backblazeb2.com"
    }

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true # Esto ayuda con los errores de permisos de cuenta
    use_path_style             = true
  }
}