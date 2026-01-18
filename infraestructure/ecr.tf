# infrastructure/ecr.tf

resource "aws_ecr_repository" "command_service" {
  name                 = "rvrs-command-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Para que no te cobre si borras el lab
}

resource "aws_ecr_repository" "query_service" {
  name                 = "rvrs-query-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "ai_worker" {
  name                 = "rvrs-ai-worker"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "gateway" {
  name                 = "rvrs-gateway"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "frontend" {
  name                 = "rvrs-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}