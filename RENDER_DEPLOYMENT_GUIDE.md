# 🚀 Render Deployment Guide for Cerevyn AI Assistant

## ✅ Why Render?
- **Free Tier**: 750 hours/month (enough for personal use)
- **Auto-Deploy**: Connects to GitHub, deploys on push
- **Easy Setup**: Similar to Railway
- **Persistent Storage**: Your ChromaDB will persist

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Code
Your code is already ready! All files are committed to GitHub.

### Step 2: Deploy on Render

1. **Go to [render.com](https://render.com)**
2. **Sign up** with your GitHub account
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**: `Thanmai-24/cerevyn-ai-assistant`
5. **Configure the service**:
   - **Name**: `cerevyn-ai-assistant`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT rag_server:app`
   - **Plan**: `Free`

6. **Click "Create Web Service"**

### Step 3: Environment Variables (Optional)
In Render dashboard, add:
- `FLASK_ENV=production`
- `PYTHON_VERSION=3.11.0`

### Step 4: Deploy
Render will automatically:
- ✅ Clone your repository
- ✅ Install Python dependencies
- ✅ Start your Flask app
- ✅ Give you a URL like `https://cerevyn-ai-assistant.onrender.com`

## 🔧 Render-Specific Configuration

### Update requirements.txt (if needed):
```
flask==2.3.3
flask-cors==4.0.0
chromadb==0.4.15
sentence-transformers==2.2.2
PyPDF2==3.0.1
python-docx==0.8.11
pandas==2.0.3
openpyxl==3.1.2
gunicorn==21.2.0
```

### Your Procfile works perfectly:
```
web: gunicorn --bind 0.0.0.0:$PORT rag_server:app
```

## 🌟 Features After Deployment

- **✅ Web Interface**: ChatGPT-like UI
- **✅ API Endpoints**: All RAG endpoints working
- **✅ File Upload**: PDF, DOCX, CSV, JSON, XLSX
- **✅ ChromaDB**: Persistent vector database
- **✅ Multilingual**: English/Hindi support
- **✅ Speech-to-Text**: Browser-based voice input

## ⚠️ Render Limitations (Free Tier)

- **Sleep**: App sleeps after 15 minutes of inactivity
- **Cold Start**: Takes 30-60 seconds to wake up
- **Memory**: 512MB RAM limit
- **Bandwidth**: 100GB/month

## 💡 Pro Tips

1. **Keep Alive**: Use uptime monitoring services
2. **Optimize**: Your app is already optimized for production
3. **Monitor**: Check Render logs for any issues
4. **Scale**: Upgrade to paid plan if needed

---

**Render is the easiest Railway alternative! 🎉**
