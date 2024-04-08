# terraform

Provisioning and deployment utilities.

## Install Terraform

Follow the instructions [here](https://developer.hashicorp.com/terraform/install).

## Get Variable Files

Variable files contain sensitive data, so they will not be tracked by Git. Contact @mrcfps to get the files.

## Provision

```sh
# provision db
cd db && terraform init && terraform apply

# provision api
cd api && terraform init && terraform apply
```
