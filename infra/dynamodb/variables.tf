variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "table_name" {
  description = "DynamoDB table name for news articles"
  type        = string
  default     = "eventos-historicos-noticias"
}

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}
