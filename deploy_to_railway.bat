@echo off
echo 🚀 Deploying Cerevyn AI Assistant to Railway...
echo.

echo 📋 Checking deployment files...
if exist "Procfile" (
    echo ✅ Procfile found
) else (
    echo ❌ Procfile missing!
    pause
    exit /b 1
)

if exist "runtime.txt" (
    echo ✅ runtime.txt found
) else (
    echo ❌ runtime.txt missing!
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
git commit -m "Deploy Cerevyn AI Assistant to Railway"
git push origin main

echo.
echo ✅ Code pushed to GitHub!
echo.
echo 🌐 Next steps:
echo 1. Go to https://railway.app
echo 2. Sign in with GitHub
echo 3. Click "New Project"
echo 4. Select "Deploy from GitHub repo"
echo 5. Choose your cerevyn-ai-assistant repository
echo 6. Click "Deploy Now"
echo.
echo 🎉 Your Cerevyn AI Assistant will be live in minutes!
echo.
pause
