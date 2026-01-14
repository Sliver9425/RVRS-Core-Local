# infrastructure/vpc.tf

# 1. La VPC (Tu nube privada)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "rvrs-vpc"
  }
}

# 2. Internet Gateway (Para que la red tenga salida a internet)
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "rvrs-igw"
  }
}

# 3. Subnets Públicas (Donde vivirán el Load Balancer y el Bastion Host)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags = {
    Name = "rvrs-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b" # Diferente zona para Alta Disponibilidad
  map_public_ip_on_launch = true
  tags = {
    Name = "rvrs-public-subnet-2"
  }
}

# 4. Route Table (Las reglas de tráfico)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rvrs-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Group para el Bastion
resource "aws_security_group" "bastion" {
  name        = "rvrs-bastion-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 22
    to_port     = 22
    cidr_blocks = ["0.0.0.0/0"] # Permite SSH
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# La instancia Bastion
resource "aws_instance" "bastion" {
  ami           = "ami-0c101f26f147fa7fd" # Amazon Linux 2023 us-east-1
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public_1.id # Usando tu subnet ya definida
  vpc_security_group_ids = [aws_security_group.bastion.id]
  key_name      = "vockey" # Requerido en AWS Academy

  tags = { Name = "rvrs-bastion" }
}