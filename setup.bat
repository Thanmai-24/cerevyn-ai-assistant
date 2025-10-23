@echo off
echo ========================================
echo    Cerevyn RAG System Setup
echo ========================================
echo.

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Checking Ollama installation...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Ollama not found. Please install Ollama from https://ollama.ai
    echo The system will work with offline responses only.
) else (
    echo Ollama found! Pulling Llama 3.1 model...
    ollama pull llama3.1:8b
)

echo.
echo [3/4] Starting RAG server...
start "Cerevyn RAG Server" python rag_server.py

echo.
echo [4/4] Starting Cerevyn web interface...
timeout /t 3 /nobreak >nul
start "Cerevyn" http://localhost:8000

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Services started:
echo - RAG Server: http://localhost:5000
echo - Cerevyn Web: http://localhost:8000
echo.
echo To add knowledge to Cerevyn:
echo 1. Click the green + button in the web interface
echo 2. Add text or upload files (PDF, DOCX, TXT, CSV, JSON)
echo 3. Ask Cerevyn questions about your data!
echo.
echo Press any key to exit...
pause >nul
