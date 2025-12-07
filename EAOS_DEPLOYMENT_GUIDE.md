# EAOS DEPLOYMENT GUIDE — CLOUD / DOCKER / KUBERNETES

Version: 1.0.0

---

# 1. DOCKER DEPLOYMENT

## Build
```shell
docker build -t eaos:latest .
```

## Run
```shell
docker run -d
-v $(pwd)/memory:/app/memory
-v $(pwd)/config:/app/config
eaos:latest
```

---

# 2. DOCKER COMPOSE

```yaml
services:
eaos:
image: eaos:latest
container_name: eaos
restart: always
volumes:
- ./memory:/app/memory
- ./logs:/app/logs
- ./config:/app/config
environment:
EAOS_MODE: production
```

---

# 3. KUBERNETES DEPLOYMENT

## Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
name: eaos
spec:
replicas: 2
selector:
matchLabels:
app: eaos
template:
metadata:
labels:
app: eaos
spec:
containers:
- name: eaos
image: eaos:latest
volumeMounts:
- name: memory
mountPath: /memory
- name: config
mountPath: /config
volumes:
- name: memory
persistentVolumeClaim:
claimName: eaos-memory
- name: config
configMap:
name: eaos-config
```

## Service

```yaml
apiVersion: v1
kind: Service
metadata:
name: eaos
spec:
type: ClusterIP
selector:
app: eaos
ports:

name: http
port: 8080
targetPort: 8080
```

---

# 4. CLOUD DEPLOYMENT NOTES

## AWS
- deploy via ECS, EKS, or Lambda-based invocation  
- Store Memory Kernel in DynamoDB + S3  
- Use CloudWatch for logs  
- Use AWS Config for compliance  

## GCP
- GKE or Cloud Run  
- Use Firestore for Memory Kernel  
- Cloud Logging + Monitoring  

## Azure
- AKS + Azure Monitor  
- Enforce Azure Policy for compliance  
