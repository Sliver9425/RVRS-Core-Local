# infrastructure/ecs.tf

locals {
  account_id   = "857521755952"
  region       = "us-east-1"
  lab_role_arn = "arn:aws:iam::857521755952:role/LabRole"
}

resource "aws_ecs_task_definition" "monorepo_stack" {
  family                   = "rvrs-stack"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 4096  # 4 vCPU
  memory                   = 8192  # 8 GB RAM
  
  execution_role_arn       = local.lab_role_arn
  task_role_arn            = local.lab_role_arn

  container_definitions = jsonencode([
    
    # --- 1. GATEWAY (NGINX) ---
    {
      name      = "gateway",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-gateway:latest",
      essential = true,
      portMappings = [{ containerPort = 80 }],
      dependsOn = [
        { containerName = "command-service", condition = "START" },
        { containerName = "query-service",   condition = "START" }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "gateway", "awslogs-create-group" = "true" }
      }
    },

    # --- 2. COMMAND SERVICE ---
    {
      name      = "command-service",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-command-service:v9",
      essential = true,
      portMappings = [{ containerPort = 3001 }],
      environment = [
        { name = "PORT", value = "3001" },
        { name = "DATABASE_URL", value = "postgresql://postgres:password@127.0.0.1:5432/rvrs_db?schema=public" },
        { name = "KAFKA_BROKER", value = "127.0.0.1:9092" },
        { name = "B2_APPLICATION_KEY_ID", value = var.b2_key_id },
        { name = "B2_APPLICATION_KEY",    value = var.b2_application_key },
        { name = "B2_BUCKET_ID",          value = var.b2_bucket_id }
      ],
      dependsOn = [
        { containerName = "kafka",    condition = "HEALTHY" },
        { containerName = "postgres", condition = "HEALTHY" }
      ],
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "command" } }
    },

    # --- 3. QUERY SERVICE ---
    {
      name      = "query-service",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-query-service:v7",
      essential = true,
      portMappings = [{ containerPort = 3002 }],
      environment = [
        { name = "PORT", value = "3002" },
        { name = "DATABASE_URL", value = "postgresql://postgres:password@127.0.0.1:5432/rvrs_db?schema=public" },
        { name = "KAFKA_BROKER", value = "127.0.0.1:9092" },
        { name = "REDIS_HOST",   value = "127.0.0.1" }
      ],
      # CAMBIO AQUÍ: Ahora espera también a que REDIS esté HEALTHY 👇
      dependsOn = [
        { containerName = "kafka",    condition = "HEALTHY" },
        { containerName = "postgres", condition = "HEALTHY" },
        { containerName = "redis",    condition = "HEALTHY" }
      ],
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "query" } }
    },

    # --- 4. AI WORKER ---
    {
      name      = "ai-worker",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-ai-worker:latest",
      essential = false, 
      environment = [
        { name = "KAFKA_BROKER", value = "127.0.0.1:9092" },
        { name = "GEMINI_API_KEY", value = var.gemini_api_key }
      ],
      dependsOn = [
        { containerName = "kafka", condition = "HEALTHY" }
      ],
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "ai" } }
    },

    # --- INFRAESTRUCTURA ---
    
    # POSTGRES (Con HealthCheck)
    {
      name = "postgres", 
      image = "postgres:15-alpine", 
      essential = true, 
      portMappings = [{ containerPort = 5432 }],
      environment = [{ name = "POSTGRES_USER", value = "postgres" }, { name = "POSTGRES_PASSWORD", value = "password" }, { name = "POSTGRES_DB", value = "rvrs_db" }],
      healthCheck = {
        command     = ["CMD-SHELL", "pg_isready -U postgres || exit 1"]
        interval    = 10
        timeout     = 5
        retries     = 5
        startPeriod = 10
      },
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "db" } }
    },

    # REDIS (CAMBIO AQUÍ: Agregamos HealthCheck) 👇
    {
      name = "redis", 
      image = "redis:alpine", 
      essential = true, 
      portMappings = [{ containerPort = 6379 }],
      healthCheck = {
        command     = ["CMD-SHELL", "redis-cli ping || exit 1"]
        interval    = 10
        timeout     = 5
        retries     = 3
        startPeriod = 5
      }
    },

    # ZOOKEEPER
    {
      name = "zookeeper", image = "confluentinc/cp-zookeeper:7.3.0", essential = true,
      environment = [{ name = "ZOOKEEPER_CLIENT_PORT", value = "2181" }, { name = "ZOOKEEPER_TICK_TIME", value = "2000" }]
    },

    # KAFKA (Con HealthCheck)
    {
      name = "kafka", image = "confluentinc/cp-kafka:7.3.0", essential = true, portMappings = [{ containerPort = 9092 }],
      dependsOn = [{ containerName = "zookeeper", condition = "START" }],
      environment = [
        { name = "KAFKA_BROKER_ID", value = "1" },
        { name = "KAFKA_ZOOKEEPER_CONNECT", value = "127.0.0.1:2181" },
        { name = "KAFKA_ADVERTISED_LISTENERS", value = "PLAINTEXT://127.0.0.1:9092" },
        { name = "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR", value = "1" },
        { name = "KAFKA_AUTO_CREATE_TOPICS_ENABLE", value = "true" } # Aseguramos que cree los temas
      ],
      healthCheck = {
        command     = ["CMD-SHELL", "kafka-topics --bootstrap-server 127.0.0.1:9092 --list || exit 1"]
        interval    = 10
        timeout     = 5
        retries     = 10
        startPeriod = 30
      }
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "rvrs-stack-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.monorepo_stack.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  health_check_grace_period_seconds = 300

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "gateway"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.front_end]
}

resource "aws_lb_target_group" "main" {
  name        = "rvrs-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 60
    interval            = 300
    matcher             = "200,404"
  }
}

resource "aws_lb_listener_rule" "main" {
  listener_arn = aws_lb_listener.front_end.arn
  priority     = 100
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}