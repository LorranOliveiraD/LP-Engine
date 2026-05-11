output "ec2_public_ip" {
  description = "IP Publico da Instancia EC2"
  value       = aws_instance.app_server.public_ip
}

output "rds_endpoint" {
  description = "Endpoint de conexao do banco de dados Postgres"
  value       = aws_db_instance.postgres.endpoint
}
