# infrastructure/variables.tf

# ==========================================
# 1. GENERAL
# ==========================================

variable "aws_region" {
  description = "La región de AWS donde desplegaremos (AWS Academy suele usar us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo para nombrar todos los recursos (Ej: rvrs-vpc, rvrs-cluster)"
  type        = string
  default     = "rvrs"
}

variable "environment" {
  description = "Entorno de despliegue (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ==========================================
# 2. REDES (NETWORKING)
# ==========================================

variable "vpc_cidr" {
  description = "El rango de IPs para toda la red privada"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Lista de rangos de IP para las subnets públicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "availability_zones" {
  description = "Zonas de disponibilidad para alta disponibilidad"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# ==========================================
# 3. PUERTOS DE MICROSERVICIOS
# ==========================================

variable "gateway_port" {
  description = "Puerto del API Gateway (Nginx)"
  type        = number
  default     = 80
}

variable "command_service_port" {
  description = "Puerto interno del Command Service"
  type        = number
  default     = 3001
}

variable "query_service_port" {
  description = "Puerto interno del Query Service"
  type        = number
  default     = 3002
}

# ==========================================
# 4. CREDENCIALES Y SERVICIOS EXTERNOS (SaaS/PaaS)
# ==========================================

variable "b2_key_id" {
  description = "Backblaze Key ID"
  type        = string
  sensitive   = true 
}

variable "b2_application_key" {
  description = "Backblaze Application Key"
  type        = string
  sensitive   = true
}

variable "b2_bucket_id" {
  description = "Backblaze Bucket ID"
  type        = string
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

# --- ESTA ES LA VARIABLE QUE FALTABA ---
variable "supabase_db_url" {
  description = "URL de conexión completa a Supabase (PaaS) con password codificado"
  type        = string
  sensitive   = true
}