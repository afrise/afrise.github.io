const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const endpointInput = document.getElementById('endpoint-input');
const modelSelect = document.getElementById('model-select');
const chatSelect = document.getElementById('chats');
const settingsContent = document.getElementById('settings-content');
const chatTitle = document.getElementById('chat-title')
let currentEndpoint = '';
let currentModel = '';
let currentChat = 'default';

let chats = []

function loadSettings() {
    currentEndpoint = localStorage.getItem('endpoint') || '';
    currentModel = localStorage.getItem('model') || '';
    currentChat = localStorage.getItem('currentChat');
    chats = JSON.parse(localStorage.getItem('chats'))
    chatTitle.value = currentChat
    endpointInput.value = currentEndpoint;
    if (currentEndpoint) checkModels();
    loadChatHistory();

    if (chats.find(chat => chat.name = currentChat) == null){
        currentChat = chats[0].name;
    }
    populateChats(chats);
}

function renameChat() {
    let newName = chatTitle.value;
    chats.find(chat => chat.name==currentChat).name = newName
    currentChat = newName
    localStorage.setItem("chats", JSON.stringify(chats))
    populateChats(chats);
}

function addChat() {
    chats.push({name: "default", messages: []} );
    populateChats(chats);
}

function selectChat(){
    currentChat = chatSelect.value
    chatTitle.value = currentChat

    chatContainer.innerHTML="";
}

function saveSettings() {
    currentEndpoint = endpointInput.value.trim();
    currentModel = modelSelect.value;
    localStorage.setItem('endpoint', currentEndpoint);
    localStorage.setItem('model', currentModel);
    toggleSettings();
}

function toggleSettings() { settingsContent.style.display = settingsContent.style.display === 'none' ? 'block' : 'none'; }

function checkModels() {
    currentEndpoint = endpointInput.value.trim();
    if (!currentEndpoint) return;

    fetch(`${currentEndpoint}/v1/models`)
        .then(response => response.json())
        .then(data => { populateModelSelect(data.data); })
        .catch(error => console.error('Error:', error));
}

function populateModelSelect(models) {
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        modelSelect.appendChild(option);
    });
    modelSelect.value = currentModel;
}

function populateChats(chats){
    chatSelect.innerHTML= ""
    chats.forEach(chat => {
        const option = document.createElement('option');
        option.value = chat.name;
        option.textContent = chat.name;
        chatSelect.appendChild(option);
    });
    chatSelect.value=currentChat;
    chatSelect.size = chats.length;
}
function sendMessage() {
    const message = userInput.value.trim();
    if (!message || !currentEndpoint || !currentModel) return;

    appendMessage('You', message, 'user-message');
    
    chats.find((c)=>c.name==currentChat).messages.push({role: "user", content: message})

    fetch(`${currentEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: currentModel,
            messages: chats.find((c)=>c.name==currentChat).messages
        })
    })
    .then(response => response.json())
    .then(data => {
        const reply = data.choices[0].message;
        appendMessage('AI', reply.content, 'ai-message');
        
        chats.find((c)=>c.name==currentChat).messages.push(reply)
        localStorage.setItem('chats', JSON.stringify(chats))
    })
    .catch(error => console.error('Error:', error));
    
    userInput.value = '';
    localStorage.setItem('chats', JSON.stringify(chats))
}

function appendMessage(sender, message, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.innerHTML = `<strong>${sender}:</strong> ${renderMarkup(message)}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    saveChatHistory();
}

function renderMarkup(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(\w+)?\n([\s\S]+?)```/g, function(match, lang, code) { return `<pre><code class="${lang || ''}">${code.trim()}</code></pre>`; })
            .replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', chatContainer.innerHTML);
}

function loadChatHistory() {
    //currently storing chat history as xml. this should be build from the json
    const history = localStorage.getItem('chatHistory');
    if (history) { chatContainer.innerHTML = history; }
    
    
    if (chats == null){
        chats = [{name: 'default', messages:[]}]
        currentChat = 'default'
        console.warn("did not load chat from memory. default chat created.")
    }
}

userInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { sendMessage(); } });
function handleViewportChange() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);

handleViewportChange();
loadSettings();