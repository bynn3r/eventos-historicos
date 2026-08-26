variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "dynamodb_table" {
  description = "DynamoDB table name for news articles"
  type        = string
  default     = "eventos-historicos-noticias"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda deployment zip"
  type        = string
  default     = "../../lambda/function.zip"
}

variable "deepl_api_key" {
  description = "DeepL API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_model" {
  description = "OpenAI model for article expansion"
  type        = string
  default     = "gpt-4o-mini"
}

variable "mymemory_email" {
  description = "MyMemory email for higher translation quota"
  type        = string
  default     = ""
}

variable "cron_secret" {
  description = "Secret for /refresh endpoint authorization"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_origin" {
  description = "CORS allowed origin for the Lambda Function URL"
  type        = string
  default     = "*"
}

variable "deploy_iam_user" {
  description = "IAM username that Next.js uses to call AWS (gets InvokeFunctionUrl permission)"
  type        = string
  default     = "eventos-historicos-deploy"
}

variable "schedule_expression" {
  description = "EventBridge Scheduler cron expression (4x/day)"
  type        = string
  default     = "cron(0 6,12,18,0 * * ? *)"
}
