# 🚀 Fly.io Deployment Guide for Cerevyn AI Assistant

## ✅ Why Fly.io?
- **Free Tier**: 3 shared-cpu VMs, 256MB RAM each
- **Never Sleeps**: Always-on applications
- **Global**: Deploy worldwide
- **Fast**: Excellent performance
- **Persistent**: Your ChromaDB will persist

## 🎯 Step-by-Step Deployment

### Step 1: Install Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Or download from: https://fly.io/docs/hands-on/install-flyctl/
```

### Step 2: Create Fly Configuration
I'll create the necessary files for you:

### Step 3: Deploy
```bash
# Login to Fly.io
fly auth login

# Launch your app
fly launch

# Deploy
fly deploy
```

## 🔧 Fly.io Configuration Files

### fly.toml (I'll create this)
```toml
app = "cerevyn-ai-assistant"
primary_region = "ord"

[build]

[env]
  FLASK_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Dockerfile (I'll create this)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "rag_server:app"]
```

## 🌟 Features After Deployment

- **✅ Always On**: Never sleeps
- **✅ Fast**: Global CDN
- **✅ Persistent**: ChromaDB survives deployments
- **✅ Scalable**: Easy to upgrade
- **✅ All Features**: Web UI, API, file upload, multilingual

## ⚠️ Fly.io Limitations (Free Tier)

- **Memory**: 256MB RAM per VM
- **VMs**: 3 shared-cpu VMs max
- **Bandwidth**: 160GB/month
- **Storage**: 1GB persistent volume

## 💡 Pro Tips

1. **Memory**: Your app should fit in 256MB
2. **Optimize**: ChromaDB + sentence-transformers are memory-intensive
3. **Monitor**: Use `fly logs` to check status
4. **Scale**: Upgrade to paid plan for more resources

---

**Fly.io = Always-on, never sleeps! 🚀**
