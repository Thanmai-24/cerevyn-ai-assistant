// Cerevyn AI Assistant - Main JavaScript File

class CerevynAssistant {
    constructor() {
        this.currentLanguage = 'en';
        this.isRecording = false;
        this.recognition = null;
        this.chatHistory = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.updateLanguageUI();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('statusText');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.langButtons = document.querySelectorAll('.lang-btn');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key to send
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Microphone button
        this.micButton.addEventListener('click', () => this.toggleRecording());

        // Language switching
        this.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.micButton.classList.add('recording');
                this.updateStatus('Listening... Speak now');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('Speech recognition error. Please try again.');
                this.stopRecording();
            };

            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            console.warn('Speech recognition not supported');
            this.micButton.style.display = 'none';
        }
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update UI
        this.langButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });

        // Update speech recognition language
        if (this.recognition) {
            this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        }

        // Update placeholder text
        this.messageInput.placeholder = lang === 'hi' 
            ? 'यहाँ अपना संदेश टाइप करें...' 
            : 'Type your message here...';

        this.updateLanguageUI();
    }

    updateLanguageUI() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            if (this.currentLanguage === 'hi') {
                welcomeMessage.innerHTML = `
                    <div class="welcome-content">
                        <i class="fas fa-robot"></i>
                        <h2>करेविन में आपका स्वागत है</h2>
                        <p>आपका बहुभाषी AI सहायक। मैं अंग्रेजी और हिंदी में समझ और जवाब दे सकता हूं।</p>
                        <p>बोलने के लिए माइक्रोफोन पर क्लिक करें या नीचे अपना संदेश टाइप करें।</p>
                    </div>
                `;
            } else {
                welcomeMessage.innerHTML = `
                    <div class="welcome-content">
                        <i class="fas fa-robot"></i>
                        <h2>Welcome to Cerevyn</h2>
                        <p>Your multilingual AI assistant. I can understand and respond in English and Hindi.</p>
                        <p>Click the microphone to speak or type your message below.</p>
                    </div>
                `;
            }
        }
    }

    toggleRecording() {
        if (!this.recognition) {
            this.updateStatus('Speech recognition not supported in this browser');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.updateStatus('Error starting speech recognition');
        }
    }

    stopRecording() {
        this.isRecording = false;
        this.micButton.classList.remove('recording');
        this.updateStatus('Ready to chat');
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show loading
        this.showLoading();

        try {
            // Detect language and get response
            const response = await this.getGeminiResponse(message);
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('Error getting response:', error);
            const errorMessage = this.currentLanguage === 'hi' 
                ? 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
                : 'Sorry, an error occurred. Please try again.';
            this.addMessage(errorMessage, 'assistant');
        } finally {
            this.hideLoading();
        }
    }

    async getGeminiResponse(message) {
        try {
            // Try RAG + Ollama first
            const context = await this.getRAGContext(message);
            if (context) {
                const response = await this.getOllamaResponse(message, context);
                return response;
            }
        } catch (error) {
            console.log('RAG/Ollama not available, using offline responses');
        }
        
        // Fallback to offline AI
        return this.getOfflineAIResponse(message);
    }

    async getRAGContext(query) {
        try {
            // Skip RAG for simple greetings and casual questions
            const simpleQuestions = [
                'how are you', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 
                'good evening', 'how do you do', 'what\'s up', 'how\'s it going',
                'thank you', 'thanks', 'bye', 'goodbye', 'see you later'
            ];
            
            const queryLower = query.toLowerCase().trim();
            const isSimpleQuestion = simpleQuestions.some(q => queryLower.includes(q));
            
            if (isSimpleQuestion) {
                return ''; // Don't use RAG context for simple questions
            }
            
            const response = await fetch('http://localhost:5000/get_context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query, n_results: 3 })
            });
            
            if (!response.ok) {
                throw new Error(`RAG server error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.context || '';
        } catch (error) {
            console.error('RAG Context Error:', error);
            return '';
        }
    }

    async getOllamaResponse(message, context) {
        const detectedLang = this.detectLanguage(message);
        
        let systemPrompt;
        
        if (context && context.trim()) {
            // Use context when available
            if (detectedLang === 'hi') {
                systemPrompt = `आप करेविन हैं, एक मददगार AI सहायक। आपको हमेशा हिंदी में जवाब देना है।

निम्नलिखित जानकारी का उपयोग करें:
${context}

उपयोगकर्ता का प्रश्न: ${message}

IMPORTANT: आपको केवल हिंदी में जवाब देना है। अंग्रेजी में कुछ भी न लिखें। उपरोक्त जानकारी के आधार पर हिंदी में विस्तृत उत्तर दें।`;
            } else {
                systemPrompt = `You are Cerevyn, a helpful AI assistant. Use the following information:

${context}

User's question: ${message}

Answer based on the above information. If information is not available, provide a general response.`;
            }
        } else {
            // No context - provide general response
            if (detectedLang === 'hi') {
                systemPrompt = `आप करेविन हैं, एक मददगार AI सहायक। आपको हमेशा हिंदी में जवाब देना है।

उपयोगकर्ता का प्रश्न: ${message}

IMPORTANT: आपको केवल हिंदी में जवाब देना है। अंग्रेजी में कुछ भी न लिखें। सहायक और मैत्रीपूर्ण तरीके से हिंदी में जवाब दें।`;
            } else {
                systemPrompt = `You are Cerevyn, a helpful AI assistant. User's question: ${message}

Provide a general, helpful response. If you don't have specific information, respond in a friendly and helpful manner.`;
            }
        }

        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                    body: JSON.stringify({
                        model: 'llama3.2:1b',
                        prompt: systemPrompt,
                        stream: false
                    })
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || 'Sorry, I could not generate a response.';
        } catch (error) {
            console.error('Ollama Error:', error);
            throw error;
        }
    }

    getOfflineAIResponse(message) {
        const detectedLang = this.detectLanguage(message);
        const lowerMessage = message.toLowerCase();
        
        // English responses
        if (detectedLang === 'en') {
            return this.getEnglishResponse(lowerMessage);
        } 
        // Hindi responses
        else {
            return this.getHindiResponse(lowerMessage);
        }
    }

    getEnglishResponse(message) {
        // Greeting patterns
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            const greetings = [
                "Hello! I'm Cerevyn, your AI assistant. How can I help you today?",
                "Hi there! Nice to meet you. What would you like to know?",
                "Hey! I'm here to assist you. What's on your mind?",
                "Greetings! I'm Cerevyn, ready to help with anything you need."
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // How are you patterns
        if (message.includes('how are you') || message.includes('how do you do')) {
            const responses = [
                "I'm doing great, thank you for asking! I'm here and ready to help you with anything you need.",
                "I'm excellent! As an AI, I'm always ready to assist. How can I help you today?",
                "I'm doing well! I'm excited to chat with you. What would you like to talk about?",
                "I'm fantastic! I love helping people. What can I do for you?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Name patterns
        if (message.includes('name') || message.includes('who are you')) {
            return "I'm Cerevyn, your multilingual AI assistant! I can help you with questions, have conversations, and assist in both English and Hindi.";
        }

        // Help patterns
        if (message.includes('help') || message.includes('what can you do')) {
            return "I can help you with conversations, answer questions, provide information, and chat in both English and Hindi. I can also understand speech input! What would you like to know?";
        }

        // Weather patterns
        if (message.includes('weather') || message.includes('rain') || message.includes('sunny')) {
            return "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for current conditions in your area!";
        }

        // Time patterns
        if (message.includes('time') || message.includes('what time')) {
            const now = new Date();
            return `The current time is ${now.toLocaleTimeString()}. Is there anything else I can help you with?`;
        }

        // Thank you patterns
        if (message.includes('thank') || message.includes('thanks')) {
            const responses = [
                "You're very welcome! I'm happy to help. Anything else you'd like to know?",
                "My pleasure! I'm here whenever you need assistance.",
                "You're welcome! Feel free to ask me anything else.",
                "Happy to help! What else can I do for you?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Goodbye patterns
        if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
            const responses = [
                "Goodbye! It was nice chatting with you. Come back anytime!",
                "See you later! I'm always here when you need me.",
                "Take care! Feel free to return whenever you want to chat.",
                "Farewell! I enjoyed our conversation. See you soon!"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Question patterns
        if (message.includes('?')) {
            const responses = [
                "That's an interesting question! While I don't have access to real-time data, I'd be happy to discuss what I know about that topic.",
                "Great question! I can help you think through that. What specific aspect would you like to explore?",
                "I'd love to help with that! Could you provide a bit more detail about what you're looking for?",
                "That's a thoughtful question. Let me help you work through that. What would you like to know more about?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Default responses
        const defaultResponses = [
            "That's interesting! Tell me more about what you're thinking.",
            "I understand. How can I help you with that?",
            "That's a good point. What would you like to explore further?",
            "I see. Is there anything specific you'd like to know about that?",
            "Interesting! I'd love to help you with that. What's your next question?",
            "That sounds fascinating! Can you tell me more about it?",
            "I'm here to help! What else would you like to discuss?",
            "That's worth exploring! What aspect interests you most?"
        ];
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    getHindiResponse(message) {
        // Hindi greeting patterns
        if (message.includes('नमस्ते') || message.includes('नमस्कार') || message.includes('हैलो') || message.includes('हाय')) {
            const greetings = [
                "नमस्ते! मैं करेविन हूं, आपका AI सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?",
                "नमस्कार! आपसे मिलकर खुशी हुई। आप क्या जानना चाहते हैं?",
                "हैलो! मैं यहां आपकी सहायता के लिए हूं। आपके मन में क्या है?",
                "आदाब! मैं करेविन हूं, आपकी जरूरत की किसी भी चीज में मदद के लिए तैयार हूं।"
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // How are you patterns in Hindi
        if (message.includes('कैसे हैं') || message.includes('कैसी हैं') || message.includes('कैसे हो')) {
            const responses = [
                "मैं बहुत अच्छा हूं, धन्यवाद पूछने के लिए! मैं यहां हूं और आपकी किसी भी जरूरत में मदद के लिए तैयार हूं।",
                "मैं बेहतरीन हूं! एक AI के रूप में, मैं हमेशा सहायता के लिए तैयार हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
                "मैं ठीक हूं! मुझे आपसे बात करने में खुशी हो रही है। आप किस बारे में बात करना चाहते हैं?",
                "मैं शानदार हूं! मुझे लोगों की मदद करना पसंद है। मैं आपके लिए क्या कर सकता हूं?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Name patterns in Hindi
        if (message.includes('नाम') || message.includes('कौन हैं') || message.includes('पहचान')) {
            return "मैं करेविन हूं, आपका बहुभाषी AI सहायक! मैं आपकी प्रश्नों में मदद कर सकता हूं, बातचीत कर सकता हूं, और अंग्रेजी और हिंदी दोनों में सहायता प्रदान कर सकता हूं।";
        }

        // Help patterns in Hindi
        if (message.includes('मदद') || message.includes('क्या कर सकते') || message.includes('सहायता')) {
            return "मैं आपकी बातचीत में मदद कर सकता हूं, प्रश्नों के उत्तर दे सकता हूं, जानकारी प्रदान कर सकता हूं, और अंग्रेजी और हिंदी दोनों में बात कर सकता हूं। मैं भाषण इनपुट भी समझ सकता हूं! आप क्या जानना चाहते हैं?";
        }

        // Weather patterns in Hindi
        if (message.includes('मौसम') || message.includes('बारिश') || message.includes('धूप')) {
            return "मेरे पास रियल-टाइम मौसम डेटा तक पहुंच नहीं है, लेकिन मैं आपके क्षेत्र में वर्तमान स्थितियों के लिए मौसम ऐप या वेबसाइट चेक करने की सलाह दूंगा!";
        }

        // Time patterns in Hindi
        if (message.includes('समय') || message.includes('कितना बजा')) {
            const now = new Date();
            return `वर्तमान समय ${now.toLocaleTimeString('hi-IN')} है। क्या मैं आपकी किसी और चीज में मदद कर सकता हूं?`;
        }

        // Thank you patterns in Hindi
        if (message.includes('धन्यवाद') || message.includes('शुक्रिया') || message.includes('थैंक्स')) {
            const responses = [
                "आपका स्वागत है! मैं मदद करके खुश हूं। क्या आप कुछ और जानना चाहते हैं?",
                "मेरी खुशी! मैं जब भी आपको सहायता की जरूरत हो तो यहां हूं।",
                "आपका स्वागत है! मुझसे कुछ भी पूछने में संकोच न करें।",
                "मदद करके खुशी हुई! मैं आपके लिए और क्या कर सकता हूं?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Goodbye patterns in Hindi
        if (message.includes('अलविदा') || message.includes('गुडबाय') || message.includes('फिर मिलते')) {
            const responses = [
                "अलविदा! आपसे बात करके अच्छा लगा। कभी भी वापस आएं!",
                "फिर मिलते हैं! मैं जब भी आपको जरूरत हो तो यहां हूं।",
                "संभाल कर रहना! जब भी आप बात करना चाहें तो वापस आएं।",
                "विदाई! मुझे हमारी बातचीत में मजा आया। जल्द मिलते हैं!"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Question patterns in Hindi
        if (message.includes('?')) {
            const responses = [
                "यह एक दिलचस्प सवाल है! हालांकि मेरे पास रियल-टाइम डेटा तक पहुंच नहीं है, मैं उस विषय के बारे में जो जानता हूं उस पर चर्चा करने में खुशी होगी।",
                "बेहतरीन सवाल! मैं आपको उसके बारे में सोचने में मदद कर सकता हूं। आप किस विशेष पहलू को जानना चाहते हैं?",
                "मैं उसमें मदद करना चाहूंगा! क्या आप जो खोज रहे हैं उसके बारे में थोड़ा और विस्तार से बता सकते हैं?",
                "यह एक विचारशील सवाल है। मैं आपको उस पर काम करने में मदद करता हूं। आप क्या और जानना चाहते हैं?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Default responses in Hindi
        const defaultResponses = [
            "यह दिलचस्प है! मुझे बताएं कि आप क्या सोच रहे हैं।",
            "मैं समझ गया। मैं आपकी उसमें कैसे मदद कर सकता हूं?",
            "यह एक अच्छा बिंदु है। आप क्या और जानना चाहते हैं?",
            "मैं देख रहा हूं। क्या आप उसके बारे में कुछ विशिष्ट जानना चाहते हैं?",
            "दिलचस्प! मैं आपकी उसमें मदद करना चाहूंगा। आपका अगला सवाल क्या है?",
            "यह आकर्षक लगता है! क्या आप मुझे उसके बारे में और बता सकते हैं?",
            "मैं मदद के लिए यहां हूं! आप और क्या चर्चा करना चाहते हैं?",
            "यह जानने लायक है! आपको कौन सा पहलू सबसे ज्यादा रुचिकर लगता है?"
        ];
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    detectLanguage(text) {
        // Simple language detection based on Devanagari script
        const devanagariRegex = /[\u0900-\u097F]/;
        return devanagariRegex.test(text) ? 'hi' : 'en';
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            // Stop any current speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Detect language and set appropriate voice
            const detectedLang = this.detectLanguage(text);
            
            if (detectedLang === 'hi') {
                // Try to find a Hindi voice
                const voices = speechSynthesis.getVoices();
                const hindiVoice = voices.find(voice => 
                    voice.lang.includes('hi') || 
                    voice.lang.includes('IN') ||
                    voice.name.toLowerCase().includes('hindi')
                );
                
                if (hindiVoice) {
                    utterance.voice = hindiVoice;
                } else {
                    utterance.lang = 'hi-IN'; // Hindi India
                }
            } else {
                utterance.lang = 'en-US'; // English US
            }
            
            // Set speech parameters
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Speak the text
            speechSynthesis.speak(utterance);
            
            // Update button icon while speaking
            const speakBtn = event.target.closest('.speak-btn');
            if (speakBtn) {
                const icon = speakBtn.querySelector('i');
                icon.className = 'fas fa-volume-mute';
                
                utterance.onend = () => {
                    icon.className = 'fas fa-volume-up';
                };
            }
        } else {
            console.log('Speech synthesis not supported');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const avatar = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        // Add speaker button for assistant messages
        const speakerButton = sender === 'assistant' 
            ? `<button class="speak-btn" onclick="toggleSpeech(this)" title="Read aloud" data-text="${content.replace(/"/g, '&quot;')}">
                   <i class="fas fa-volume-up"></i>
               </button>`
            : '';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-actions">${speakerButton}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to chat history
        this.chatHistory.push({content, sender, time});
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
        this.sendButton.disabled = true;
        this.micButton.disabled = true;
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
        this.sendButton.disabled = false;
        this.micButton.disabled = false;
    }
}

// Initialize the assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CerevynAssistant();
});

// Handle page visibility changes to stop recording when tab is not active
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.cerevyn && window.cerevyn.isRecording) {
        window.cerevyn.stopRecording();
    }
});

// Data management functions
function toggleDataPanel() {
    const panel = document.getElementById('dataPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function addTextData() {
    const text = document.getElementById('textInput').value;
    if (!text.trim()) {
        alert('Please enter some text to add.');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/add_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                metadata: {
                    source: 'manual_input',
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ Text added successfully! Cerevyn can now answer questions about this information.');
            document.getElementById('textInput').value = '';
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error adding text: ' + error.message + '\n\nMake sure the RAG server is running on port 5000.');
    }
}

async function addFileData() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('http://localhost:5000/add_file', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ File uploaded successfully! Cerevyn can now answer questions about this document.');
            clearFileSelection();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error uploading file: ' + error.message + '\n\nMake sure the RAG server is running on port 5000.');
    }
}

// Function to show file preview when file is selected
function showFilePreview(input) {
    const file = input.files[0];
    const preview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (file) {
        // Show preview
        preview.style.display = 'block';
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        // Enable upload button
        uploadBtn.disabled = false;
        
        // Update file icon based on file type
        const fileIcon = preview.querySelector('.file-info i');
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'pdf':
                fileIcon.className = 'fas fa-file-pdf';
                fileIcon.style.color = '#ef4444';
                break;
            case 'docx':
            case 'doc':
                fileIcon.className = 'fas fa-file-word';
                fileIcon.style.color = '#2563eb';
                break;
            case 'txt':
                fileIcon.className = 'fas fa-file-alt';
                fileIcon.style.color = '#64748b';
                break;
            case 'csv':
                fileIcon.className = 'fas fa-file-csv';
                fileIcon.style.color = '#059669';
                break;
            case 'json':
                fileIcon.className = 'fas fa-file-code';
                fileIcon.style.color = '#f59e0b';
                break;
            case 'xlsx':
            case 'xls':
                fileIcon.className = 'fas fa-file-excel';
                fileIcon.style.color = '#059669';
                break;
            default:
                fileIcon.className = 'fas fa-file';
                fileIcon.style.color = '#667eea';
        }
    } else {
        preview.style.display = 'none';
        uploadBtn.disabled = true;
    }
}

// Function to clear file selection
function clearFileSelection() {
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('filePreview');
    const uploadBtn = document.getElementById('uploadBtn');
    
    fileInput.value = '';
    preview.style.display = 'none';
    uploadBtn.disabled = true;
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Global variables for speech management
let isSpeaking = false;
let currentSpeechChunks = [];
let currentSpeechIndex = 0;

// Global function for toggle speech (start/stop)
function toggleSpeech(button) {
    const text = button.getAttribute('data-text');
    if (isSpeaking) {
        stopSpeech();
    } else {
        startSpeech(text);
    }
}

// Function to start speech
function startSpeech(text) {
    console.log('Starting speech for text length:', text.length);
    
    if ('speechSynthesis' in window) {
        // Stop any current speech
        speechSynthesis.cancel();
        
        // Clean text for better speech synthesis
        const cleanedText = cleanTextForSpeech(text);
        
        // Split long text into chunks for better TTS handling
        currentSpeechChunks = splitTextIntoChunks(cleanedText, 150); // Smaller chunks
        currentSpeechIndex = 0;
        isSpeaking = true;
        
        console.log('Speech chunks:', currentSpeechChunks.length);
        
        // If text is too long, use a simpler approach
        if (cleanedText.length > 1000 && currentSpeechChunks.length > 10) {
            console.log('Text too long, using simplified approach');
            currentSpeechChunks = [cleanedText.substring(0, 500) + '... (text truncated for speech)'];
        }
        
        // Detect language and set appropriate voice
        const devanagariRegex = /[\u0900-\u097F]/;
        const detectedLang = devanagariRegex.test(text) ? 'hi' : 'en';
        
        // Get voice settings
        const voices = speechSynthesis.getVoices();
        let selectedVoice = null;
        
        if (detectedLang === 'hi') {
            selectedVoice = voices.find(voice => 
                voice.lang.includes('hi') || 
                voice.lang.includes('IN') ||
                voice.name.toLowerCase().includes('hindi')
            );
        }
        
        // Update button icon while speaking
        const speakBtn = event.target.closest('.speak-btn');
        const icon = speakBtn ? speakBtn.querySelector('i') : null;
        
        if (icon) {
            icon.className = 'fas fa-stop';
            speakBtn.title = 'Stop reading';
        }
        
        // Speak chunks sequentially
        speakChunksSequentially(currentSpeechChunks, selectedVoice, detectedLang, icon);
        
    } else {
        console.log('Speech synthesis not supported');
    }
}

// Function to stop speech
function stopSpeech() {
    speechSynthesis.cancel();
    isSpeaking = false;
    currentSpeechChunks = [];
    currentSpeechIndex = 0;
    
    // Reset all speaker buttons
    const speakBtns = document.querySelectorAll('.speak-btn');
    speakBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-volume-up';
        btn.title = 'Read aloud';
    });
}

// Legacy function for backward compatibility
function speakText(text) {
    startSpeech(text);
}

// Function to split text into manageable chunks
function splitTextIntoChunks(text, maxLength) {
    console.log('Splitting text:', text.substring(0, 100) + '...');
    
    const chunks = [];
    
    // First try to split by sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 1) {
        let currentChunk = '';
        
        for (let sentence of sentences) {
            sentence = sentence.trim();
            if (!sentence) continue;
            
            // If adding this sentence would exceed max length, start a new chunk
            if (currentChunk.length + sentence.length + 1 > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
            }
        }
        
        // Add the last chunk if it has content
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
    }
    
    // If no sentences were found or chunks are still too long, split by words
    if (chunks.length === 0 || chunks.some(chunk => chunk.length > maxLength * 2)) {
        chunks.length = 0; // Clear existing chunks
        const words = text.split(/\s+/).filter(w => w.trim().length > 0);
        
        for (let i = 0; i < words.length; i += 15) {
            const chunk = words.slice(i, i + 15).join(' ');
            if (chunk.trim()) {
                chunks.push(chunk.trim());
            }
        }
    }
    
    console.log('Created', chunks.length, 'chunks');
    return chunks;
}

// Function to speak chunks sequentially
function speakChunksSequentially(chunks, voice, lang, icon) {
    console.log('Speaking chunks:', chunks.length);
    
    function speakNextChunk() {
        console.log('Speaking chunk', currentSpeechIndex + 1, 'of', chunks.length);
        
        if (!isSpeaking || currentSpeechIndex >= chunks.length) {
            // All chunks spoken or stopped, reset icon
            isSpeaking = false;
            if (icon) {
                icon.className = 'fas fa-volume-up';
                icon.parentElement.title = 'Read aloud';
            }
            console.log('Speech finished');
            return;
        }
        
        const chunkText = chunks[currentSpeechIndex];
        console.log('Chunk text:', chunkText.substring(0, 50) + '...');
        
        const utterance = new SpeechSynthesisUtterance(chunkText);
        
        // Set voice and language
        if (voice) {
            utterance.voice = voice;
        } else {
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        }
        
        // Set speech parameters
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // When this chunk finishes, speak the next one
        utterance.onend = () => {
            console.log('Chunk', currentSpeechIndex + 1, 'finished');
            if (isSpeaking) {
                currentSpeechIndex++;
                setTimeout(speakNextChunk, 200); // Small delay between chunks
            }
        };
        
        // Handle errors
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            if (isSpeaking) {
                currentSpeechIndex++;
                setTimeout(speakNextChunk, 200);
            }
        };
        
        // Speak the current chunk
        speechSynthesis.speak(utterance);
    }
    
    // Start speaking
    speakNextChunk();
}

// Test function for debugging TTS
function testTTS() {
    const testText = "To calculate GST: GST Amount equals Original Cost times GST Rate divided by 100. For example, if original cost is rupees 1000 and GST rate is 18 percent, then GST Amount equals 1000 times 18 divided by 100 equals rupees 180.";
    console.log('Testing TTS with text:', testText);
    startSpeech(testText);
}

// Test function for mathematical text
function testMathTTS() {
    const mathText = "To determine the Goods and Services Tax (GST), I need more information about the specific scenario you are referring to. However, I can provide some general guidance. If you have the base price of a product or service and need to add the tax, use the first method: GST Amount equals Original Cost times GST Rate divided by 100. Final Price equals Original Cost plus GST Amount. For example, suppose the original cost of a product is rupees 1,000 and the GST rate is 18 percent. GST Amount equals 1,000 times 18 divided by 100 equals rupees 180. Final Price equals 1,000 plus 180 equals rupees 1,180.";
    console.log('Testing TTS with mathematical text:', mathText);
    startSpeech(mathText);
}

// Make test functions available globally
window.testTTS = testTTS;
window.testMathTTS = testMathTTS;

// Function to clean text for better speech synthesis
function cleanTextForSpeech(text) {
    let cleaned = text;
    
    // Remove LaTeX math notation
    cleaned = cleaned.replace(/\\[a-zA-Z]+/g, ''); // Remove \command
    cleaned = cleaned.replace(/\\\(/g, ''); // Remove \(
    cleaned = cleaned.replace(/\\\)/g, ''); // Remove \)
    cleaned = cleaned.replace(/\\\[/g, ''); // Remove \[
    cleaned = cleaned.replace(/\\\]/g, ''); // Remove \]
    cleaned = cleaned.replace(/\\times/g, ' times '); // Replace \times with "times"
    cleaned = cleaned.replace(/\\div/g, ' divided by '); // Replace \div with "divided by"
    cleaned = cleaned.replace(/\\rupee/g, 'rupees '); // Replace \rupee with "rupees"
    
    // Remove extra backslashes
    cleaned = cleaned.replace(/\\/g, '');
    
    // Clean up mathematical expressions
    cleaned = cleaned.replace(/\(([^)]+)\)/g, '($1)'); // Ensure proper parentheses
    cleaned = cleaned.replace(/\s+/g, ' '); // Remove extra spaces
    cleaned = cleaned.replace(/\s*=\s*/g, ' equals '); // Replace = with "equals"
    cleaned = cleaned.replace(/\s*\+\s*/g, ' plus '); // Replace + with "plus"
    cleaned = cleaned.replace(/\s*-\s*/g, ' minus '); // Replace - with "minus"
    cleaned = cleaned.replace(/\s*\*\s*/g, ' times '); // Replace * with "times"
    cleaned = cleaned.replace(/\s*\/\s*/g, ' divided by '); // Replace / with "divided by"
    
    // Clean up currency symbols
    cleaned = cleaned.replace(/₹/g, 'rupees ');
    cleaned = cleaned.replace(/\$/g, 'dollars ');
    
    // Clean up percentages
    cleaned = cleaned.replace(/(\d+)%/g, '$1 percent');
    
    // Remove any remaining special characters that might cause issues
    cleaned = cleaned.replace(/[{}]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' '); // Clean up multiple spaces
    
    return cleaned.trim();
}
