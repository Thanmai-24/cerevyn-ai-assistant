@echo off
echo 🚀 Deploying Cerevyn AI Assistant to Render...
echo.

echo 📋 Checking deployment files...
if exist "Procfile" (
    echo ✅ Procfile found
) else (
    echo ❌ Procfile missing!
    pause
    exit /b 1
)

if exist "requirements.txt" (
    echo ✅ requirements.txt found
) else (
    echo ❌ requirements.txt missing!
    pause
    exit /b 1
)

echo.
echo 🔄 Committing and pushing to GitHub...
git add .
git commit -m "Deploy Cerevyn AI Assistant to Render"
git push origin main

echo.
echo ✅ Code pushed to GitHub!
echo.
echo 🌐 Next steps for Render:
echo 1. Go to https://render.com
echo 2. Sign up with GitHub
echo 3. Click "New +" → "Web Service"
echo 4. Connect your cerevyn-ai-assistant repository
echo 5. Configure:
echo    - Name: cerevyn-ai-assistant
echo    - Environment: Python 3
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: gunicorn --bind 0.0.0.0:$PORT rag_server:app
echo    - Plan: Free
echo 6. Click "Create Web Service"
echo.
echo 🎉 Your Cerevyn AI Assistant will be live on Render!
echo.
pause
