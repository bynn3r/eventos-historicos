output "table_name" {
  description = "DynamoDB table name — use as DYNAMODB_NOTICIAS_TABLE env var"
  value       = aws_dynamodb_table.noticias.name
}

output "table_arn" {
  description = "DynamoDB table ARN — use in IAM policies"
  value       = aws_dynamodb_table.noticias.arn
}
