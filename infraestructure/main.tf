# infrastructure/main.tf

# ==========================================
# 1. SECURITY GROUPS (Cumple requisito: Security)
# ==========================================

# A. Seguridad para el Load Balancer (Público)
# Permite que cualquiera en internet (0.0.0.0/0) entre por el puerto 80
resource "aws_security_group" "lb" {
  name        = "rvrs-load-balancer-sg"
  description = "Controles de acceso para el ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_security_group" "ecs_tasks" {
  name        = "rvrs-ecs-tasks-sg"
  description = "Permitir entrada solo desde el ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 0   # Permitimos cualquier puerto interno
    to_port         = 65535
    security_groups = [aws_security_group.lb.id] # <--- La magia: Solo el ALB entra
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==========================================
# 2. APPLICATION LOAD BALANCER (Cumple requisito: ELB)
# ==========================================

resource "aws_lb" "main" {
  name               = "rvrs-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  # Usamos las subnets públicas que creamos en vpc.tf
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "rvrs-alb"
  }
}

# Listener: El "oído" del Load Balancer
# Escucha en puerto 80 y por defecto devuelve un 404 si no sabe a dónde ir
resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "404: Ruta no encontrada en RVRS Monorepo"
      status_code  = "404"
    }
  }
}

# ==========================================
# 3. ECS CLUSTER (Cumple requisito: Microservices)
# ==========================================

resource "aws_ecs_cluster" "main" {
  name = "rvrs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled" # Cumple requisito: Monitoring (CloudWatch)
  }
}


resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE_SPOT"
  }
}