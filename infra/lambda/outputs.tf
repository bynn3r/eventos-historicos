output "function_url" {
  description = "Lambda Function URL — set as LAMBDA_API_URL in Next.js environment"
  value       = aws_lambda_function_url.noticias.function_url
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.noticias.arn
}

output "scheduler_name" {
  description = "EventBridge Scheduler name"
  value       = aws_scheduler_schedule.refresh.name
}
