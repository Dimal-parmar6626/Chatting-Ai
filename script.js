const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const sendIcon = document.getElementById('send-icon');
const loadingSpinner = document.getElementById('loading-spinner');

// --- API CONFIG ---
const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
const API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const apiKey = "AIzaSyCI_otqE6hRWQQzhxhIGHBg7nmiCr9XGSw"; // Api key
const apiUrl = `${API_URL_BASE}?key=${apiKey}`;

const systemPrompt = "You are a friendly, concise, and helpful assistant. your name is jarvis. and your owner is Dimal Parmar. your trainer is Dimal parmar.Respond accurately to the user's query, prioritizing information that is current and relevant. Format your response clearly using Markdown (bolding key terms).";


async function exponentialBackoffFetch(url, options, maxRetries = 5) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      else if (response.status === 429 || response.status >= 500)
        lastError = new Error(`HTTP Error Status: ${response.status}`);
      else return response;
    } catch (error) {
      lastError = error;
    }
    if (i < maxRetries - 1)
      await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Failed to fetch after ${maxRetries} retries. ${lastError?.message || 'Unknown error'}`);
}


function addMessage(text, isUser, isError = false) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('flex', isUser ? 'justify-end' : 'justify-start');
  
  const messageBubble = document.createElement('div');
  messageBubble.classList.add('p-4', 'rounded-xl', 'max-w-lg', 'text-sm', 'shadow-md', isUser ? 'font-medium' : 'prose');
  
  if (isError) {
    messageBubble.classList.add('bg-red-100', 'text-red-700', 'font-bold');
    messageBubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
  } else if (isUser) {
    messageBubble.classList.add('bg-indigo-600', 'text-white');
    messageBubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
  } else {
    messageBubble.classList.add('bg-white', 'border', 'border-gray-200', 'text-gray-800');

    let htmlText = escapeHtml(text);
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    htmlText = htmlText.replace(/\n/g, '<br>');
    messageBubble.innerHTML = htmlText;
  }
  
  messageWrapper.appendChild(messageBubble);
  chatWindow.appendChild(messageWrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

if (true) {
  
}
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function showTypingIndicator() {
  if (document.getElementById('typing-indicator')) return;
  
  const typingWrapper = document.createElement('div');
  typingWrapper.classList.add('flex', 'justify-start');
  typingWrapper.id = 'typing-indicator';
  
  const bubble = document.createElement('div');
  bubble.classList.add(
    'bg-white', 'border', 'border-gray-200',
    'rounded-xl', 'p-3', 'shadow-md',
    'text-gray-800', 'flex', 'items-center', 'gap-2'
  );
  

  bubble.innerHTML = `
    <span class="typing-dot" aria-hidden="true"></span>
    <span class="typing-dot" aria-hidden="true"></span>
    <span class="typing-dot" aria-hidden="true"></span>
  `;
  
  typingWrapper.appendChild(bubble);
  chatWindow.appendChild(typingWrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

async function fetchGeminiResponse(userQuery) {
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
  
  try {
    const response = await exponentialBackoffFetch(apiUrl, options);
    if (!response.ok) throw new Error(`API failed: ${response.status}`);
    const result = await response.json();
    const candidate = result.candidates?.[0];
    return candidate?.content?.parts?.[0]?.text || "No valid response received.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `[Error] ${error.message}`;
  }
}


async function sendMessage() {
  const text = userInput.value.trim();
  if (text === '') return;
  

  addMessage(text, true);
  userInput.value = '';
  
  sendButton.disabled = true;
  userInput.disabled = true;
  sendIcon.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');
  
  showTypingIndicator();
  
  try {
    const botResponse = await fetchGeminiResponse(text);
    removeTypingIndicator();
    addMessage(botResponse, false);
  } catch (error) {
    removeTypingIndicator();
    addMessage(error.message || 'Unknown error', false, true);
  } finally {
    sendButton.disabled = false;
    userInput.disabled = false;
    sendIcon.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
    userInput.focus();
  }
}
''
userInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (!sendButton.disabled) sendMessage();
  }
});

userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

document.addEventListener('DOMContentLoaded', () => {
  userInput.style.height = userInput.scrollHeight + 'px';
  sendButton.addEventListener('click', sendMessage);
});