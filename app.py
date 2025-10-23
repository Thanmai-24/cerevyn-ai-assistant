# Import the Flask app from rag_server.py
from rag_server import app

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("Starting Cerevyn AI Assistant...")
    print(f"Server will be available at: http://localhost:{port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
