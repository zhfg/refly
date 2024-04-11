provider "aws" {
  region                   = var.region
  shared_credentials_files = ["~/.aws/credentials"]
}

resource "aws_security_group" "signoz_sg" {
  name        = "signoz-sg-${var.app_env}"
  description = "Signoz Security Group"

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

resource "aws_instance" "signoz" {
  ami                    = "ami-06f8dce63a6b60467"
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.signoz_sg.id]

  root_block_device {
    volume_size = 50
  }

  user_data = <<-EOF
    #!/bin/bash
    set -ex
    git clone -b main https://github.com/mrcfps/signoz.git && cd signoz/deploy/ && ./install.sh
  EOF

  tags = {
    Name        = "signoz_${var.app_env}"
    Environment = var.app_env
    ManagedBy   = "terraform"
  }
}

resource "aws_eip" "signoz_ip" {
  domain   = "vpc"
  instance = aws_instance.signoz.id

  tags = {
    Name        = "signoz_eip_${var.app_env}"
    Environment = var.app_env
    ManagedBy   = "terraform"
  }
}

output "signoz_public_ip" {
  value = aws_eip.signoz_ip.public_ip
}

output "signoz_private_ip" {
  value = aws_eip.signoz_ip.private_ip
}
