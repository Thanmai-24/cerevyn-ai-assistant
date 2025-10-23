from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from sentence_transformers import SentenceTransformer
import json
import os
from datetime import datetime
import PyPDF2
import docx
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Initialize ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("cerevyn_knowledge")

# Initialize embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

class RAGSystem:
    def __init__(self):
        self.collection = collection
        self.model = model
    
    def add_document(self, text, metadata=None):
        """Add document to knowledge base"""
        if metadata is None:
            metadata = {"timestamp": datetime.now().isoformat()}
        
        # Generate embedding
        embedding = self.model.encode(text).tolist()
        
        # Add to collection
        self.collection.add(
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
            ids=[f"doc_{len(self.collection.get()['ids'])}"]
        )
        return True
    
    def add_file(self, file_path):
        """Add file to knowledge base"""
        text = self.extract_text_from_file(file_path)
        metadata = {
            "file_path": file_path,
            "timestamp": datetime.now().isoformat(),
            "file_type": os.path.splitext(file_path)[1]
        }
        return self.add_document(text, metadata)
    
    def extract_text_from_file(self, file_path):
        """Extract text from various file types"""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
            return text
        
        elif ext in ['.docx', '.doc']:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        
        elif ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        
        elif ext in ['.csv', '.xlsx']:
            if PANDAS_AVAILABLE:
                df = pd.read_csv(file_path) if ext == '.csv' else pd.read_excel(file_path)
                return df.to_string()
            else:
                # Fallback: read CSV as plain text
                if ext == '.csv':
                    with open(file_path, 'r', encoding='utf-8') as file:
                        return file.read()
                else:
                    return f"Excel file support requires pandas. File: {file_path}"
        
        elif ext == '.json':
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                return json.dumps(data, indent=2)
        
        else:
            return f"Unsupported file type: {ext}"
    
    def search(self, query, n_results=3):
        """Search knowledge base"""
        query_embedding = self.model.encode(query).tolist()
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results
    
    def get_context(self, query, n_results=3):
        """Get relevant context for query"""
        results = self.search(query, n_results)
        
        if not results['documents'] or not results['documents'][0]:
            return ""
        
        context = "\n\n".join(results['documents'][0])
        return context

# Initialize RAG system
rag = RAGSystem()

@app.route('/add_text', methods=['POST'])
def add_text():
    """Add text data to knowledge base"""
    data = request.json
    text = data.get('text')
    metadata = data.get('metadata', {})
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        rag.add_document(text, metadata)
        return jsonify({"success": True, "message": "Text added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_file', methods=['POST'])
def add_file():
    """Add file to knowledge base"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Save file temporarily
        file_path = f"./temp_{file.filename}"
        file.save(file_path)
        
        # Add to knowledge base
        rag.add_file(file_path)
        
        # Clean up
        os.remove(file_path)
        
        return jsonify({"success": True, "message": "File added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/search', methods=['POST'])
def search():
    """Search knowledge base"""
    data = request.json
    query = data.get('query')
    n_results = data.get('n_results', 3)
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        results = rag.search(query, n_results)
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_context', methods=['POST'])
def get_context():
    """Get context for query"""
    data = request.json
    query = data.get('query')
    n_results = data.get('n_results', 3)
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        context = rag.get_context(query, n_results)
        return jsonify({"context": context})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "RAG server is running"})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("Starting Cerevyn RAG Server...")
    print(f"Server will be available at: http://localhost:{port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
