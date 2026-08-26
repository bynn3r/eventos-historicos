terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── IAM role for Lambda ──────────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "eventos-historicos-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "dynamodb" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.dynamodb_table}",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.dynamodb_table}/index/*",
    ]
  }
}

resource "aws_iam_role_policy" "dynamodb" {
  name   = "dynamodb-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dynamodb.json
}

# ─── Lambda function ──────────────────────────────────────────────────────────

locals {
  tags = {
    Project     = "eventos-historicos"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_lambda_function" "noticias" {
  function_name    = "eventos-historicos-noticias"
  role             = aws_iam_role.lambda.arn
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 300  # 5 minutes — needed for refresh operation
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_NOTICIAS_TABLE  = var.dynamodb_table
      DEEPL_API_KEY            = var.deepl_api_key
      OPENAI_API_KEY           = var.openai_api_key
      OPENAI_EDITORIAL_MODEL   = var.openai_model
      MYMEMORY_EMAIL           = var.mymemory_email
      CRON_SECRET              = var.cron_secret
      ALLOWED_ORIGIN           = var.allowed_origin
    }
  }

  tags = local.tags
}

# ─── Lambda Function URL (for Next.js API calls) ─────────────────────────────

resource "aws_lambda_function_url" "noticias" {
  function_name      = aws_lambda_function.noticias.function_name
  authorization_type = "AWS_IAM"

  cors {
    allow_credentials = false
    allow_origins     = [var.allowed_origin]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["authorization", "content-type", "x-amz-date", "x-amz-security-token"]
    max_age           = 86400
  }
}

# Allow the deploy IAM user to invoke the Function URL with IAM auth
resource "aws_iam_user_policy" "invoke_lambda_url" {
  name = "invoke-noticias-lambda-url"
  user = var.deploy_iam_user

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunctionUrl"
      Resource = aws_lambda_function.noticias.arn
      Condition = {
        StringEquals = { "lambda:FunctionUrlAuthType" = "AWS_IAM" }
      }
    }]
  })
}

# ─── EventBridge Scheduler (replaces QStash) ─────────────────────────────────

data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "eventos-historicos-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "scheduler_invoke" {
  name = "invoke-lambda"
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "lambda:InvokeFunction"
      Effect   = "Allow"
      Resource = aws_lambda_function.noticias.arn
    }]
  })
}

resource "aws_scheduler_schedule" "refresh" {
  name       = "eventos-historicos-refresh"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = "UTC"

  target {
    arn      = aws_lambda_function.noticias.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ source = "aws.scheduler", "detail-type" = "Scheduled Event" })

    retry_policy {
      maximum_retry_attempts = 2
    }
  }
}
