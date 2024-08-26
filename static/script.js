document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const userPrompt = document.getElementById('userPrompt');
    const chatContainer = document.getElementById('chatContainer');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistoryContainer = document.getElementById('chatHistory');

    let currentChatId = null;
    let chats = JSON.parse(localStorage.getItem('chats')) || {};

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun text-yellow-300"></i>';
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDarkMode = document.body.classList.contains('dark');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun text-yellow-300"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Load chat history
    function loadChatHistory() {
        chatHistoryContainer.innerHTML = '';
        const chatIds = Object.keys(chats).sort((a, b) => b - a); // Sort by latest chat first
        chatIds.forEach((chatId, index) => {
            const chatButton = document.createElement('div');
            chatButton.className = 'chat-history-item text-gray-800 dark:text-gray-200 cursor-pointer';
            
            // Get the first message of the chat for preview
            const firstMessage = chats[chatId][0] ? chats[chatId][0].content : 'New Chat';
            const preview = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
            
            // Create a more user-friendly chat name
            const chatName = `Chat ${chatId}`;
            
            chatButton.innerHTML = `
                <div class="flex-1">
                    <i class="fas fa-comment chat-icon"></i>
                    <div>
                        <div class="font-semibold">${preview}</div>
                    </div>
                </div>
                <button class="delete-chat-btn text-red-500 hover:text-red-700" data-chat-id="${chatId}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            chatButton.querySelector('.flex-1').onclick = () => loadChat(chatId);
            chatButton.querySelector('.delete-chat-btn').onclick = deleteChat;
            chatHistoryContainer.appendChild(chatButton);
        });
    }

    // Load a specific chat
    function loadChat(chatId) {
        currentChatId = chatId;
        chatContainer.innerHTML = '';
        chats[chatId].forEach(message => appendMessage(message.role, message.content));
    }

    // Delete chat function
    function deleteChat(event) {
        event.stopPropagation(); // Prevent the click event from bubbling up to the parent
        const chatId = event.currentTarget.getAttribute('data-chat-id');
        delete chats[chatId];
        saveChats();
        loadChatHistory();

        // Automatically switch to the latest chat or start a new chat if none exists
        const chatIds = Object.keys(chats);
        if (chatIds.length > 0) {
            loadChat(chatIds[0]);
        } else {
            newChatBtn.click();
        }
    }

    // New chat button
    newChatBtn.addEventListener('click', () => {
        currentChatId = Date.now().toString();
        chats[currentChatId] = [];
        chatContainer.innerHTML = '';
        saveChats();
        loadChatHistory();
    });

    // Initialize with a new chat if none exists
    if (Object.keys(chats).length === 0) {
        newChatBtn.click();
    } else {
        loadChatHistory();
        loadChat(Object.keys(chats)[0]);
    }

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = userPrompt.value.trim();
        if (message) {
            appendMessage('user', message);
            sendMessage(message);
            userPrompt.value = '';
        }
    });

    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-4 ${role === 'user' ? 'text-right' : 'text-left'}`;
        messageDiv.innerHTML = `
            <div class="inline-block p-2 rounded-lg ${role === 'user' ? 'bg-blue-500 dark:bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}">
                ${content}
            </div>
        `;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Save to chat history
        if (!chats[currentChatId]) {
            chats[currentChatId] = [];
        }
        chats[currentChatId].push({ role, content });
        saveChats();
    }

    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
        loadChatHistory();
    }

    function sendMessage(message) {
        fetch('/run_query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ UserPrompt: message }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                appendMessage('assistant', `Error: ${data.error}`);
            } else {
                appendMessage('assistant', data.summary);
                if (data.rowData && data.rowData.length > 0) {
                    const tableHtml = generateTableHtml(data.rowData);
                    appendMessage('assistant', tableHtml);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            appendMessage('assistant', `Error: ${error.message}`);
        });
    }

    function generateTableHtml(rowData) {
        const headers = Object.keys(rowData[0]);
        let tableHtml = '<table class="w-full border-collapse border border-gray-300 dark:border-gray-600">';
        
        // Table headers
        tableHtml += '<tr>';
        headers.forEach(header => {
            tableHtml += `<th class="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-purple-200">${header}</th>`;
        });
        tableHtml += '</tr>';

        // Table rows
        rowData.forEach(row => {
            tableHtml += '<tr>';
            headers.forEach(header => {
                tableHtml += `<td class="border border-gray-300 dark:border-gray-600 p-2 text-gray-800 dark:text-gray-200">${row[header] !== null ? row[header] : 'N/A'}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</table>';
        return tableHtml;
    }
});
