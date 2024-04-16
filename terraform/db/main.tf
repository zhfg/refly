provider "aws" {
  region                   = var.region
  shared_credentials_files = ["~/.aws/credentials"]
}

resource "aws_security_group" "refly_db_sg" {
  name        = "refly-db-sg-${var.app_env}"
  description = "Refly DB Security Group"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.allowlist_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "refly_db" {
  ami                    = "ami-06f8dce63a6b60467"
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.refly_db_sg.id]

  root_block_device {
    volume_size = 50
  }

  user_data = <<-EOF
    #!/bin/bash
    set -ex
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
    apt-cache policy docker-ce
    sudo apt-get update
    sudo apt-get install -y docker-ce
    sudo usermod -a -G docker ubuntu
    docker run -d --name pg -p 5432:5432 \
        -v ~/data:/var/lib/postgresql/data \
        -e POSTGRES_DB=${var.db_name} \
        -e POSTGRES_USER=${var.pg_user} \
        -e POSTGRES_PASSWORD=${var.pg_password} \
        ankane/pgvector:v0.5.1
  EOF

  tags = {
    Name        = "refly_db_${var.app_env}"
    Environment = var.app_env
    ManagedBy   = "terraform"
  }
}

resource "aws_eip" "refly_db_ip" {
  domain   = "vpc"
  instance = aws_instance.refly_db.id

  tags = {
    Name        = "refly_db_eip_${var.app_env}"
    Environment = var.app_env
    ManagedBy   = "terraform"
  }
}

output "refly_db_ip" {
  value = aws_eip.refly_db_ip.public_ip
}
