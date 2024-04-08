provider "aws" {
  region                   = var.region
  shared_credentials_files = ["~/.aws/credentials"]
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "reflyd_sg" {
  name        = "reflyd_sg_${var.app_env}"
  description = "Reflyd Security Group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowlist_ip]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowlist_ip]
  }

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "reflyd" {
  ami                    = "ami-06f8dce63a6b60467"
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.reflyd_sg.id]
  count                  = var.instance_count

  root_block_device {
    volume_size = 20
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
    docker run -d --name reflyd --restart always -p 3000:3000 \
      -e GOOGLE_CLIENT_ID=${var.google_client_id} \
      -e GOOGLE_CLIENT_SECRET=${var.google_client_secret} \
      -e GOOGLE_CALLBACK_URL=${var.google_callback_url} \
      -e LOGIN_REDIRECT_URL=${var.login_redirect_url} \
      -e OPENAI_API_KEY=${var.openai_api_key} \
      -e DATABASE_URL=${var.database_url} \
      ${var.image_name}:${var.image_version}
  EOF

  tags = {
    Name        = "reflyd_${var.app_env}"
    Environment = var.app_env
    ManagedBy   = "terraform"
  }
}

resource "tls_private_key" "refly_pk" {
  algorithm = "RSA"
}

resource "tls_cert_request" "refly_cr" {
  private_key_pem = tls_private_key.refly_pk.private_key_pem

  subject {
    common_name  = "refly.ai"
    organization = "Refly AI"
  }
}

resource "cloudflare_origin_ca_certificate" "refly_cert" {
  csr                = tls_cert_request.refly_cr.cert_request_pem
  hostnames          = ["refly.ai", "*.refly.ai"]
  request_type       = "origin-rsa"
  requested_validity = 5475
}

resource "aws_acm_certificate" "cert" {
  private_key      = tls_private_key.refly_pk.private_key_pem
  certificate_body = cloudflare_origin_ca_certificate.refly_cert.certificate
}

resource "aws_lb" "reflyd_lb" {
  name               = "reflyd-lb-${var.app_env}"
  internal           = false
  load_balancer_type = "application"
  subnets            = data.aws_subnets.default.ids

  tags = {
    Environment = "production"
  }
}

resource "aws_lb_target_group" "reflyd_lb" {
  name        = "reflyd-tg-${var.app_env}"
  port        = 3000
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_lb_target_group_attachment" "reflyd_lb" {
  for_each = {
    for k, v in aws_instance.reflyd :
    k => v
  }

  target_group_arn = aws_lb_target_group.reflyd_lb.arn
  target_id        = each.value.id
  port             = 3000
}

resource "aws_lb_listener" "reflyd_lb" {
  load_balancer_arn = aws_lb.reflyd_lb.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.reflyd_lb.arn
  }
}

resource "cloudflare_record" "refly_dns" {
  zone_id = var.cloudflare_zone_id
  name    = var.site_name
  proxied = true
  type    = "CNAME"
  value   = aws_lb.reflyd_lb.dns_name
  ttl     = 1
}

output "reflyd_lb_dns_name" {
  value = aws_lb.reflyd_lb.dns_name
}

output "reflyd_host_name" {
  value = cloudflare_record.refly_dns.hostname
}