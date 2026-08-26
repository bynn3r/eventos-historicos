resource "aws_dynamodb_table" "noticias" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "slug"

  attribute {
    name = "slug"
    type = "S"
  }

  attribute {
    name = "tipo"
    type = "S"
  }

  attribute {
    name = "data"
    type = "S"
  }

  global_secondary_index {
    name            = "tipo-data-index"
    hash_key        = "tipo"
    range_key       = "data"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Project     = "eventos-historicos"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
