# Cerevyn - Advanced Multilingual AI Assistant with RAG

A powerful, ChatGPT-like AI assistant that can learn from your data and answer questions in both English and Hindi. Cerevyn combines offline pattern matching with RAG (Retrieval Augmented Generation) and Ollama for intelligent, context-aware responses.

## 🚀 **Key Features**

- 🧠 **RAG System** - Learn from any data you provide
- 🎤 **Speech-to-Text** - Speak in English or Hindi
- 🌐 **Multilingual** - Automatic language detection and response
- 📁 **File Support** - Upload PDFs, Word docs, CSV, JSON, Excel files
- 🔄 **Real-time Learning** - Add knowledge instantly
- 💬 **ChatGPT Interface** - Modern, responsive chat UI
- 🏠 **Completely Offline** - No external API dependencies (except Ollama)

## 🛠️ **Architecture**

```
User Input → RAG Search → Context + Ollama → Intelligent Response
     ↓
Offline Fallback (Pattern Matching)
```

## 📋 **Prerequisites**

- **Python 3.8+** - For RAG server
- **Ollama** (Optional) - For advanced AI responses
- **Modern Browser** - Chrome/Edge recommended for speech recognition

## 🚀 **Quick Setup**

### **Option 1: Automated Setup (Windows)**
```bash
# Run the setup script
setup.bat
```

### **Option 2: Manual Setup**

1. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Ollama (Optional but Recommended):**
   ```bash
   # Download from https://ollama.ai
   ollama pull llama3.1:8b
   ```

3. **Start RAG Server:**
   ```bash
   python rag_server.py
   ```

4. **Start Web Interface:**
   ```bash
   python -m http.server 8000
   ```

5. **Open Cerevyn:**
   - Navigate to `http://localhost:8000`
   - Grant microphone permissions when prompted

## 🎯 **How to Use**

### **1. Basic Chat**
- Type messages in English or Hindi
- Click microphone for voice input
- Switch languages using header buttons

### **2. Add Knowledge**
- Click the green **+** button (bottom right)
- **Add Text:** Paste any information you want Cerevyn to learn
- **Upload Files:** Support for PDF, DOCX, TXT, CSV, JSON, XLSX
- **Instant Learning:** Data becomes available immediately

### **3. Ask Questions**
- Ask about your uploaded data
- General questions (works offline)
- Complex queries (uses Ollama + your data)

## 📁 **Supported File Types**

| Format | Description | Use Case |
|--------|-------------|----------|
| **PDF** | Documents, reports, manuals | Business documents, research papers |
| **DOCX** | Word documents | Policies, procedures, guides |
| **TXT** | Plain text files | Notes, articles, documentation |
| **CSV** | Spreadsheet data | Financial data, inventory, records |
| **JSON** | Structured data | API responses, configuration |
| **XLSX** | Excel files | Complex spreadsheets, budgets |

## 🔧 **Technical Details**

### **RAG System Components:**
- **ChromaDB** - Vector database for semantic search
- **Sentence Transformers** - Text embeddings
- **Flask API** - Backend server (port 5000)
- **Ollama Integration** - Local LLM for responses

### **Fallback System:**
- **Pattern Matching** - Offline responses when RAG/Ollama unavailable
- **Language Detection** - Automatic English/Hindi detection
- **Context Awareness** - Smart response selection

## 🌟 **Example Use Cases**

### **Business Assistant:**
```
Upload: Company policies PDF
Ask: "What is our remote work policy?"
Response: Detailed policy information
```

### **Technical Support:**
```
Upload: API documentation
Ask: "How do I authenticate with the API?"
Response: Step-by-step authentication guide
```

### **Educational:**
```
Upload: Course materials
Ask: "Explain machine learning concepts"
Response: Educational content from your materials
```

### **Multilingual Support:**
```
English: "What are the GST rates?"
Hindi: "GST की दरें क्या हैं?"
Response: Same information in detected language
```

## 🔍 **API Endpoints**

The RAG server provides these endpoints:

- `POST /add_text` - Add text data
- `POST /add_file` - Upload file
- `POST /search` - Search knowledge base
- `POST /get_context` - Get context for queries
- `GET /health` - Server health check

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"RAG server not available"**
   - Ensure `python rag_server.py` is running
   - Check port 5000 is not blocked

2. **"Ollama not responding"**
   - Install Ollama from https://ollama.ai
   - Run `ollama pull llama3.1:8b`
   - Start Ollama: `ollama serve`

3. **Speech recognition not working**
   - Use Chrome/Edge browser
   - Grant microphone permissions
   - Check microphone is working

4. **File upload fails**
   - Check file format is supported
   - Ensure file size is reasonable
   - Verify RAG server is running

### **Performance Tips:**
- **Large files:** Split into smaller chunks for better processing
- **Many files:** Add files gradually to avoid memory issues
- **Complex queries:** Use specific keywords for better results

## 🔮 **Future Enhancements**

- [ ] **More Languages** - Spanish, French, German support
- [ ] **Voice Responses** - Text-to-speech output
- [ ] **Chat History** - Persistent conversation memory
- [ ] **Export Features** - Save conversations and knowledge
- [ ] **Advanced Search** - Filters, categories, tags
- [ ] **Real-time Updates** - Live data integration
- [ ] **Custom Models** - Fine-tuned models for specific domains

## 📄 **License**

This project is open source and available under the MIT License.

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

---

**Cerevyn** - Your intelligent, multilingual AI assistant that learns from your data! 🌟
