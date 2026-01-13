(function() {
    const vscode = acquireVsCodeApi();
    
    // DOM elements
    const queryInput = document.getElementById('queryInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const rebuildBtn = document.getElementById('rebuildBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    
    // State
    let isLoading = false;
    let conversationHistory = [];
    
    // Initialize
    function init() {
        // Request initial settings
        vscode.postMessage({ type: 'getSettings' });
        
        // Request connection status
        vscode.postMessage({ type: 'testConnection' });
        
        // Setup event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Send button
        sendBtn.addEventListener('click', handleSend);
        
        // Enter key handling
        queryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        
        // Quick action buttons
        testConnectionBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'testConnection' });
        });
        
        rebuildBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'rebuildAnalysis' });
        });
        
        settingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Settings
        saveSettingsBtn.addEventListener('click', handleSaveSettings);
        cancelSettingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = 'none';
            loadSettings();
        });
    }
    
    function handleSend() {
        const query = queryInput.value.trim();
        if (!query || isLoading) {
            return;
        }
        
        // Clear input
        queryInput.value = '';
        queryInput.style.height = 'auto';
        
        // Send query
        vscode.postMessage({ type: 'query', data: query });
    }
    
    function handleSaveSettings() {
        const settings = {
            serverUrl: document.getElementById('serverUrl').value,
            requestTimeoutMs: parseInt(document.getElementById('requestTimeout').value),
            maxFiles: parseInt(document.getElementById('maxFiles').value),
            maxBytesPerFile: parseInt(document.getElementById('maxBytesPerFile').value)
        };
        
        vscode.postMessage({ type: 'updateSettings', data: settings });
        settingsPanel.style.display = 'none';
    }
    
    function loadSettings(settings) {
        if (settings) {
            document.getElementById('serverUrl').value = settings.serverUrl || '';
            document.getElementById('requestTimeout').value = settings.requestTimeoutMs || '';
            document.getElementById('maxFiles').value = settings.maxFiles || '';
            document.getElementById('maxBytesPerFile').value = settings.maxBytesPerFile || '';
        }
    }
    
    function updateConnectionStatus(status) {
        statusDot.className = 'status-dot ' + status;
        switch(status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                break;
            case 'checking':
                statusText.textContent = 'Checking...';
                break;
        }
    }
    
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (role === 'assistant') {
            // Render markdown-like content
            contentDiv.innerHTML = renderMarkdown(content);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Remove welcome message if exists
        const welcomeMsg = chatMessages.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function renderMarkdown(text) {
        // Simple markdown rendering
        let html = text;
        
        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showLoading() {
        isLoading = true;
        sendBtn.disabled = true;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <span>Processing...</span>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideLoading() {
        isLoading = false;
        sendBtn.disabled = false;
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    function renderConversationHistory(history) {
        chatMessages.innerHTML = '';
        
        if (history.length === 0) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-message';
            welcomeDiv.innerHTML = `
                <h3>Welcome to AI Code Snippet RAG</h3>
                <p>Ask questions about your codebase to get intelligent answers with code snippets.</p>
                <p>Make sure your backend is running and connected.</p>
            `;
            chatMessages.appendChild(welcomeDiv);
            return;
        }
        
        history.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
    }
    
    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch(message.type) {
            case 'queryResponse':
                hideLoading();
                break;
                
            case 'queryLoading':
                if (message.data) {
                    showLoading();
                } else {
                    hideLoading();
                }
                break;
                
            case 'connectionStatus':
                updateConnectionStatus(message.data);
                break;
                
            case 'settings':
                loadSettings(message.data);
                break;
                
            case 'conversationHistory':
                conversationHistory = message.data || [];
                renderConversationHistory(conversationHistory);
                break;
                
            case 'error':
                hideLoading();
                addMessage('assistant', `**Error:** ${message.data}`);
                break;
                
            case 'analysisRebuilt':
                addMessage('assistant', 'Workspace analysis has been rebuilt successfully.');
                break;
        }
    });
    
    // Auto-resize textarea
    queryInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Initialize on load
    init();
})();
