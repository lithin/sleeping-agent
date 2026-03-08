# Terraform Deployment for Sleep Agent

This directory contains Terraform configuration to deploy the Sleep Agent application to Google Cloud Platform.

## Architecture

- **Cloud Run** - Serverless containers for backend and frontend
- **Cloud SQL PostgreSQL** - Managed PostgreSQL database
- **Secret Manager** - Secure storage for API keys
- **Artifact Registry** - Docker image storage
- **Cloud SQL Connector (Cloud Run integration)** - Secure backend-to-database connection

## Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install
3. **Terraform** installed (>= 1.0): https://developer.hashicorp.com/terraform/install
4. **Docker** installed for building images

## Initial Setup

### 1. Create a GCP Project

```bash
# Create a new project
gcloud projects create YOUR-PROJECT-ID --name="Sleep Agent"

# Set as default project
gcloud config set project YOUR-PROJECT-ID

# Link billing account (required)
gcloud billing accounts list
gcloud billing projects link YOUR-PROJECT-ID --billing-account=BILLING_ACCOUNT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Authenticate

```bash
# Login to gcloud
gcloud auth login

# Set application default credentials for Terraform
gcloud auth application-default login
```

### 4. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `project_id` - Your GCP project ID
- `database_password` - Secure database password
- `api_secret_key` - Generate with: `openssl rand -hex 32`
- `openai_api_key` - Your OpenAI API key

## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

This shows what resources will be created.

### 3. Apply Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This will take ~10-15 minutes as it creates:
- Cloud SQL PostgreSQL instance
- Artifact Registry
- Secret Manager secrets
- Cloud Run services (initial deployment will fail - this is expected)

### 4. Build and Push Docker Images

After infrastructure is ready, build and push your images:

```bash
# Get the push commands from Terraform output
terraform output -raw docker_push_commands

# Or manually:
REGION=$(terraform output -raw region 2>/dev/null || echo "us-central1")
PROJECT_ID=$(terraform output -raw project_id 2>/dev/null)
REPO=$(terraform output -raw artifact_registry)

# Configure Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push backend
cd ../backend
docker build -t ${REPO}/backend:latest -f Dockerfile .
docker push ${REPO}/backend:latest

# Build and push frontend  
cd ../frontend
docker build -t ${REPO}/frontend:latest -f Dockerfile.frontend .
docker push ${REPO}/frontend:latest
```

### 5. Run Database Migrations

```bash
# Get the backend Cloud Run service URL
BACKEND_URL=$(cd terraform && terraform output -raw backend_url)

# The backend runs migrations automatically on startup
# Check the logs to verify:
gcloud run services logs read sleep-agent-backend --region us-central1 --limit 50
```

### 6. Access Your Application

```bash
# Get URLs
cd terraform
terraform output backend_url
terraform output frontend_url
```

Open the frontend URL in your browser!

## Production Dockerfiles

You'll need to create production Dockerfiles that don't rely on dev features:

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

**frontend/Dockerfile.frontend:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_BACKEND_URL
ARG VITE_API_SECRET_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_API_SECRET_KEY=$VITE_API_SECRET_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Note: For frontend, you'll need to rebuild the image whenever the backend URL changes.

## Updating the Application

```bash
# Rebuild and push images
docker build -t ${REPO}/backend:latest -f Dockerfile .
docker push ${REPO}/backend:latest

# Cloud Run will automatically deploy the new revision
```

## Cost Optimization

- **Cloud Run**: Only charged when handling requests (scales to zero)
- **Cloud SQL**: 
  - `db-f1-micro`: ~$10/month (shared CPU, 0.6GB RAM)
  - `db-g1-small`: ~$25/month (shared CPU, 1.7GB RAM)
  - Consider pausing the instance when not in use
- **Secret Manager**: First 6 secret versions free per month
- **Artifact Registry**: 0.5GB free per month

To reduce costs:
```bash
# Stop Cloud SQL instance when not in use
gcloud sql instances patch sleep-agent-db --activation-policy NEVER

# Restart when needed
gcloud sql instances patch sleep-agent-db --activation-policy ALWAYS
```

## Monitoring

```bash
# View backend logs
gcloud run services logs read sleep-agent-backend --region us-central1

# View frontend logs
gcloud run services logs read sleep-agent-frontend --region us-central1

# View Cloud SQL logs
gcloud sql operations list --instance sleep-agent-db
```

## Cleanup

To destroy all resources:

```bash
cd terraform

# Disable deletion protection first
terraform apply -var="deletion_protection=false"

# Destroy everything
terraform destroy
```

**Warning**: This will delete your database and all data permanently!

## Troubleshooting

### Backend won't start
- Check logs: `gcloud run services logs read sleep-agent-backend --limit 50`
- Verify secrets exist: `gcloud secrets list`
- Check Cloud SQL instance connection name and mounted `/cloudsql` path

### Frontend can't reach backend
- Verify backend URL in frontend environment variables
- Check CORS settings in backend
- Ensure API_SECRET_KEY matches between frontend and backend

### Database connection fails
- Ensure Cloud Run service has Cloud SQL instance attachment configured
- Check Cloud SQL authorized networks are not broadly open
- Verify service account has `roles/cloudsql.client`

### High costs
- Check Cloud Run instance counts: `gcloud run services list`
- Review Cloud SQL tier - consider downgrading to `db-f1-micro`
- Set max instances to 1-2 for testing

## CI/CD Integration

For automatic deployments on git push, consider using:
- **Cloud Build** - Google's native CI/CD
- **GitHub Actions** - With workload identity federation
- **GitLab CI** - With GCP integration

Example Cloud Build trigger:
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:$COMMIT_SHA', 'backend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'run'
      - 'deploy'
      - 'sleep-agent-backend'
      - '--image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:$COMMIT_SHA'
      - '--region=${_REGION}'
```

## Support

For issues or questions:
1. Check Cloud Run logs
2. Review Terraform state: `terraform show`
3. Validate configuration: `terraform validate`
