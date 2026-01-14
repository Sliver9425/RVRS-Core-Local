# infrastructure/ecs.tf

locals {
  account_id   = "857521755952"
  region       = "us-east-1"
  lab_role_arn = "arn:aws:iam::857521755952:role/LabRole"
  # REEMPLAZA ESTA URL con la de Supabase que usaste en el push (con la contraseña codificada)
  supabase_url = var.supabase_db_url
}

resource "aws_ecs_task_definition" "monorepo_stack" {
  family                   = "rvrs-stack"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  
  # OPTIMIZACIÓN: Bajamos recursos porque ya no corremos Postgres internamente
  cpu                      = 2048  # 2 vCPU
  memory                   = 5120  # 5 GB RAM
  
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
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-command-service:v13",
      essential = true,
      portMappings = [{ containerPort = 3001 }],
      environment = [
        { name = "PORT", value = "3001" },
        { name = "DATABASE_URL", value = local.supabase_url }, # APUNTANDO A SUPABASE
        { name = "KAFKA_BROKER", value = "127.0.0.1:9092" },
        { name = "NODE_OPTIONS", value = "--dns-result-order=ipv4first" },
        { name = "B2_APPLICATION_KEY_ID", value = var.b2_key_id },
        { name = "B2_APPLICATION_KEY",    value = var.b2_application_key },
        { name = "B2_BUCKET_ID",          value = var.b2_bucket_id }
      ],
      dependsOn = [
        { containerName = "kafka", condition = "HEALTHY" }
      ],
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "command" } }
    },

    # --- 3. QUERY SERVICE ---
    {
      name      = "query-service",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-query-service:v13",
      essential = true,
      portMappings = [{ containerPort = 3002 }],
      environment = [
        { name = "PORT", value = "3002" },
        { name = "DATABASE_URL", value = local.supabase_url }, # APUNTANDO A SUPABASE
        { name = "NODE_OPTIONS", value = "--dns-result-order=ipv4first" },
        { name = "KAFKA_BROKER", value = "127.0.0.1:9092" },
        { name = "REDIS_HOST",   value = "127.0.0.1" }
      ],
      dependsOn = [
        { containerName = "kafka", condition = "HEALTHY" },
        { containerName = "redis", condition = "HEALTHY" }
      ],
      logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = "/ecs/rvrs-stack", "awslogs-region" = local.region, "awslogs-stream-prefix" = "query" } }
    },

    # --- 4. AI WORKER ---
    {
      name      = "ai-worker",
      image     = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/rvrs-ai-worker:v2",
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

    # --- INFRAESTRUCTURA LIGERA ---
    
    # REDIS (HealthCheck mantenido para caché de lecturas)
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
        { name = "KAFKA_AUTO_CREATE_TOPICS_ENABLE", value = "true" }
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

# --- SERVICIO ECS ---
resource "aws_ecs_service" "main" {
  name            = "rvrs-stack-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.monorepo_stack.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  enable_execute_command = true
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
}

# --- AUTO SCALING ---
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# --- TARGET GROUP & LISTENER RULE ---
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