// State management
let retroData = {
    sprintName: '',
    sprintDate: '',
    items: {
        well: [],
        improve: [],
        action: []
    },
    teamMembers: []
};

let currentEditingItem = null;

// Timer state
let timerState = {
    duration: 30, // minutes
    remaining: 30 * 60, // seconds
    isRunning: false,
    isPaused: false,
    interval: null
};

// Reveal state
let isTextHidden = false;

// Collaboration state
let collaborationState = {
    isConnected: false,
    currentSessionId: null,
    database: null,
    userId: generateUserId(),
    onlineUsers: {},
    isHost: false
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadRetroData();
    updateAllCounts();
    
    // Set today's date as default
    document.getElementById('sprintDate').value = new Date().toISOString().split('T')[0];
    
    // Initialize timer
    initializeTimer();
    
    // Add event listeners for sprint info
    document.getElementById('sprintName').addEventListener('input', function() {
        retroData.sprintName = this.value;
        saveRetroData();
    });
    
    document.getElementById('sprintDate').addEventListener('change', function() {
        retroData.sprintDate = this.value;
        saveRetroData();
    });
    
    // Add enter key support for inputs
    setupEnterKeySupport();
});

// Setup enter key support for all input fields
function setupEnterKeySupport() {
    document.getElementById('wellInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem('well');
    });
    
    document.getElementById('improveInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem('improve');
    });
    
    document.getElementById('actionInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem('action');
    });
    
    document.getElementById('memberInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTeamMember();
    });
}

// Add item to a specific category
function addItem(category) {
    const input = document.getElementById(category + 'Input');
    const text = input.value.trim();
    
    if (text === '') {
        showNotification('Please enter some text', 'error');
        return;
    }
    
    const item = {
        id: generateId(),
        text: text,
        timestamp: new Date().toLocaleString(),
        votes: 0
    };
    
    retroData.items[category].push(item);
    input.value = '';
    
    renderItems(category);
    updateCount(category);
    saveRetroData();
    showNotification('Item added successfully!', 'success');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Render items for a specific category
function renderItems(category) {
    const container = document.getElementById(category + 'Items');
    container.innerHTML = '';
    
    retroData.items[category].forEach(item => {
        const itemElement = createItemElement(item, category);
        container.appendChild(itemElement);
    });
}

// Create item element
function createItemElement(item, category) {
    const div = document.createElement('div');
    div.className = 'item';
    div.onclick = () => editItem(item.id, category);
    
    div.innerHTML = `
        <div class="item-text">${escapeHtml(item.text)}</div>
        <div class="item-meta">
            <span class="timestamp">${item.timestamp}</span>
            <div class="item-actions">
                <button class="item-btn vote-btn" onclick="event.stopPropagation(); voteItem('${item.id}', '${category}')" title="Vote">
                    <i class="fas fa-heart"></i> ${item.votes}
                </button>
                <button class="item-btn edit-btn" onclick="event.stopPropagation(); editItem('${item.id}', '${category}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="item-btn delete-btn" onclick="event.stopPropagation(); deleteItem('${item.id}', '${category}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Vote for an item
function voteItem(itemId, category) {
    const item = retroData.items[category].find(item => item.id === itemId);
    if (item) {
        item.votes++;
        renderItems(category);
        saveRetroData();
        showNotification('Vote added!', 'success');
    }
}

// Edit item
function editItem(itemId, category) {
    const item = retroData.items[category].find(item => item.id === itemId);
    if (item) {
        currentEditingItem = { itemId, category };
        document.getElementById('modalText').value = item.text;
        document.getElementById('itemModal').style.display = 'block';
    }
}

// Save item edit
function saveItemEdit() {
    if (currentEditingItem) {
        const { itemId, category } = currentEditingItem;
        const item = retroData.items[category].find(item => item.id === itemId);
        const newText = document.getElementById('modalText').value.trim();
        
        if (newText === '') {
            showNotification('Item text cannot be empty', 'error');
            return;
        }
        
        if (item) {
            item.text = newText;
            renderItems(category);
            saveRetroData();
            closeModal();
            showNotification('Item updated successfully!', 'success');
        }
    }
}

// Delete item
function deleteItem(itemId, category) {
    if (confirm('Are you sure you want to delete this item?')) {
        retroData.items[category] = retroData.items[category].filter(item => item.id !== itemId);
        renderItems(category);
        updateCount(category);
        saveRetroData();
        showNotification('Item deleted', 'info');
    }
}

// Close modal
function closeModal() {
    document.getElementById('itemModal').style.display = 'none';
    currentEditingItem = null;
}

// Update count for a specific category
function updateCount(category) {
    const count = retroData.items[category].length;
    document.getElementById(category + 'Count').textContent = count;
}

// Update all counts
function updateAllCounts() {
    updateCount('well');
    updateCount('improve');
    updateCount('action');
}

// Add team member
function addTeamMember() {
    const input = document.getElementById('memberInput');
    const name = input.value.trim();
    
    if (name === '') {
        showNotification('Please enter a team member name', 'error');
        return;
    }
    
    if (retroData.teamMembers.includes(name)) {
        showNotification('Team member already exists', 'error');
        return;
    }
    
    retroData.teamMembers.push(name);
    input.value = '';
    renderTeamMembers();
    saveRetroData();
    showNotification('Team member added!', 'success');
}

// Remove team member
function removeTeamMember(name) {
    retroData.teamMembers = retroData.teamMembers.filter(member => member !== name);
    renderTeamMembers();
    saveRetroData();
    showNotification('Team member removed', 'info');
}

// Render team members
function renderTeamMembers() {
    const container = document.getElementById('teamMembers');
    container.innerHTML = '';
    
    retroData.teamMembers.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
            <span>${escapeHtml(member)}</span>
            <button class="remove-member" onclick="removeTeamMember('${escapeHtml(member)}')" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(memberElement);
    });
}

// Clear all data
function clearAll() {
    if (confirm('Are you sure you want to clear all retrospective data? This action cannot be undone.')) {
        retroData = {
            sprintName: '',
            sprintDate: '',
            items: {
                well: [],
                improve: [],
                action: []
            },
            teamMembers: []
        };
        
        // Clear UI
        document.getElementById('sprintName').value = '';
        document.getElementById('sprintDate').value = new Date().toISOString().split('T')[0];
        
        renderItems('well');
        renderItems('improve');
        renderItems('action');
        renderTeamMembers();
        updateAllCounts();
        saveRetroData();
        
        showNotification('All data cleared', 'info');
    }
}

// Export retrospective summary
function exportRetro() {
    const sprintName = retroData.sprintName || 'Unnamed Sprint';
    const sprintDate = retroData.sprintDate || 'No date set';
    
    let summary = `# Sprint Retrospective: ${sprintName}\n`;
    summary += `**Date:** ${sprintDate}\n\n`;
    
    if (retroData.teamMembers.length > 0) {
        summary += `**Team Members:** ${retroData.teamMembers.join(', ')}\n\n`;
    }
    
    summary += `## What Went Well (${retroData.items.well.length} items)\n`;
    retroData.items.well.forEach((item, index) => {
        summary += `${index + 1}. ${item.text}`;
        if (item.votes > 0) summary += ` ❤️ ${item.votes}`;
        summary += `\n`;
    });
    
    summary += `\n## What Could Be Improved (${retroData.items.improve.length} items)\n`;
    retroData.items.improve.forEach((item, index) => {
        summary += `${index + 1}. ${item.text}`;
        if (item.votes > 0) summary += ` ❤️ ${item.votes}`;
        summary += `\n`;
    });
    
    summary += `\n## Action Items (${retroData.items.action.length} items)\n`;
    retroData.items.action.forEach((item, index) => {
        summary += `${index + 1}. ${item.text}`;
        if (item.votes > 0) summary += ` ❤️ ${item.votes}`;
        summary += `\n`;
    });
    
    summary += `\n---\n*Generated on ${new Date().toLocaleString()}*`;
    
    // Download as text file
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retrospective-${sprintName.replace(/\s+/g, '-').toLowerCase()}-${sprintDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Retrospective exported successfully!', 'success');
}

// Save retrospective data to localStorage
function saveRetroData() {
    localStorage.setItem('retroData', JSON.stringify(retroData));
}

// Load retrospective data from localStorage
function loadRetroData() {
    const savedData = localStorage.getItem('retroData');
    if (savedData) {
        retroData = JSON.parse(savedData);
        
        // Update UI with loaded data
        document.getElementById('sprintName').value = retroData.sprintName || '';
        document.getElementById('sprintDate').value = retroData.sprintDate || new Date().toISOString().split('T')[0];
        
        renderItems('well');
        renderItems('improve');
        renderItems('action');
        renderTeamMembers();
        updateAllCounts();
    }
}

// Save retrospective (explicit save with notification)
function saveRetro() {
    saveRetroData();
    showNotification('Retrospective saved successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#48bb78',
        error: '#e53e3e',
        info: '#4299e1',
        warning: '#ed8936'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationCSS = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Inject notification CSS
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('itemModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveRetro();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportRetro();
    }
    
    // Spacebar to start/pause timer
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (timerState.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
});

// Timer Functions
function startTimer() {
    const minutesInput = document.getElementById('timerMinutes');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const statusElement = document.getElementById('timerStatus');
    
    if (!timerState.isRunning && !timerState.isPaused) {
        // Starting fresh timer
        timerState.duration = parseInt(minutesInput.value) || 30;
        timerState.remaining = timerState.duration * 60;
    }
    
    timerState.isRunning = true;
    timerState.isPaused = false;
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    minutesInput.disabled = true;
    
    statusElement.textContent = 'Timer running...';
    
    timerState.interval = setInterval(() => {
        timerState.remaining--;
        updateTimerDisplay();
        
        if (timerState.remaining <= 0) {
            timerEnded();
        }
    }, 1000);
    
    showNotification('Timer started!', 'success');
}

function pauseTimer() {
    if (!timerState.isRunning) return;
    
    timerState.isRunning = false;
    timerState.isPaused = true;
    
    clearInterval(timerState.interval);
    
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const statusElement = document.getElementById('timerStatus');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    statusElement.textContent = 'Timer paused';
    
    showNotification('Timer paused', 'info');
}

function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    clearInterval(timerState.interval);
    
    const minutesInput = document.getElementById('timerMinutes');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const statusElement = document.getElementById('timerStatus');
    
    timerState.duration = parseInt(minutesInput.value) || 30;
    timerState.remaining = timerState.duration * 60;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    minutesInput.disabled = false;
    statusElement.textContent = 'Ready to start';
    
    updateTimerDisplay();
    showNotification('Timer reset', 'info');
}

function updateTimerDisplay() {
    const timeElement = document.getElementById('timeRemaining');
    const minutes = Math.floor(timerState.remaining / 60);
    const seconds = timerState.remaining % 60;
    
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeElement.textContent = timeString;
    
    // Add warning classes based on remaining time
    timeElement.classList.remove('warning', 'danger');
    
    if (timerState.remaining <= 60) { // Last minute
        timeElement.classList.add('danger');
    } else if (timerState.remaining <= 300) { // Last 5 minutes
        timeElement.classList.add('warning');
    }
}

function timerEnded() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    clearInterval(timerState.interval);
    
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const minutesInput = document.getElementById('timerMinutes');
    const statusElement = document.getElementById('timerStatus');
    const timeElement = document.getElementById('timeRemaining');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    minutesInput.disabled = false;
    statusElement.textContent = 'Time\'s up!';
    timeElement.textContent = '00:00';
    timeElement.classList.add('danger');
    
    // Play sound notification (if supported)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjeCz/LNeSsFJnbG8N2QQAoUXrTp66hVFApGn+DyvmQdBjeCz/LNeSsFJnbG8N2QQAoUXrTp66hVFApGn+DyvmQdBjeCz/LNeSsFJnbG8N2QQAoUXrTp66hVFApGn+DyvmQdBg==');
        audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (e) {}
    
    showNotification('⏰ Time\'s up! Retrospective meeting time has ended.', 'warning');
}

// Reveal/Hide Functions
function toggleReveal() {
    isTextHidden = !isTextHidden;
    const toggleBtn = document.getElementById('revealToggle');
    const columns = document.querySelectorAll('.column');
    
    if (isTextHidden) {
        columns.forEach(column => column.classList.add('text-hidden'));
        columns.forEach(column => column.classList.remove('text-revealed'));
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal All Text';
        showNotification('All text is now hidden', 'info');
    } else {
        columns.forEach(column => column.classList.add('text-revealed'));
        columns.forEach(column => column.classList.remove('text-hidden'));
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide All Text';
        showNotification('All text is now revealed', 'info');
    }
}

// Initialize timer display
function initializeTimer() {
    const minutesInput = document.getElementById('timerMinutes');
    
    // Update timer when minutes input changes
    minutesInput.addEventListener('input', function() {
        if (!timerState.isRunning && !timerState.isPaused) {
            timerState.duration = parseInt(this.value) || 30;
            timerState.remaining = timerState.duration * 60;
            updateTimerDisplay();
        }
    });
    
    // Initialize display
    updateTimerDisplay();
}

// Auto-save every 30 seconds
setInterval(saveRetroData, 30000);

// Load data when page loads
window.addEventListener('load', function() {
    // Add a subtle loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Initialize collaboration
    initializeCollaboration();
});

// ===== COLLABORATION FUNCTIONS =====

// Generate unique user ID
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Initialize collaboration features
function initializeCollaboration() {
    try {
        collaborationState.database = initializeFirebase();
        if (collaborationState.database) {
            console.log('Collaboration features enabled');
        } else {
            console.log('Running in offline mode');
        }
    } catch (error) {
        console.warn('Collaboration initialization failed:', error);
    }
    
    // Add session input event listener
    document.getElementById('sessionId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') joinSession();
    });
}

// Create new session
function createSession() {
    if (!collaborationState.database) {
        showNotification('Collaboration not available - running offline', 'warning');
        return;
    }
    
    const sessionId = generateSessionId();
    collaborationState.currentSessionId = sessionId;
    collaborationState.isHost = true;
    
    setupSession(sessionId);
    showNotification('Session created! Share ID: ' + sessionId, 'success');
}

// Join existing session
function joinSession() {
    if (!collaborationState.database) {
        showNotification('Collaboration not available - running offline', 'warning');
        return;
    }
    
    const sessionId = document.getElementById('sessionId').value.trim();
    if (!sessionId) {
        showNotification('Please enter a session ID', 'error');
        return;
    }
    
    collaborationState.currentSessionId = sessionId;
    collaborationState.isHost = false;
    
    // Check if session exists
    collaborationState.database.ref(`sessions/${sessionId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                setupSession(sessionId);
                loadSharedData();
                showNotification('Joined session successfully!', 'success');
            } else {
                showNotification('Session not found', 'error');
            }
        })
        .catch(error => {
            showNotification('Failed to join session', 'error');
            console.error(error);
        });
}

// Setup session listeners
function setupSession(sessionId) {
    collaborationState.isConnected = true;
    
    // Update UI
    document.getElementById('sessionInfo').style.display = 'flex';
    document.getElementById('currentSessionId').textContent = sessionId;
    
    // Setup real-time listeners
    setupDataSynchronization();
    setupUserPresence();
    
    // Save session data
    if (collaborationState.isHost) {
        saveSharedData();
    }
}

// Setup real-time data synchronization
function setupDataSynchronization() {
    const sessionRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/data`);
    
    // Listen for data changes
    sessionRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const sharedData = snapshot.val();
            updateFromSharedData(sharedData);
        }
    });
    
    // Override save function to sync to Firebase
    const originalSaveRetroData = saveRetroData;
    saveRetroData = function() {
        originalSaveRetroData();
        if (collaborationState.isConnected) {
            saveSharedData();
        }
    };
}

// Setup user presence tracking
function setupUserPresence() {
    const userRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/users/${collaborationState.userId}`);
    const presenceRef = collaborationState.database.ref('.info/connected');
    
    presenceRef.on('value', snapshot => {
        if (snapshot.val() === true) {
            // User is online
            userRef.set({
                id: collaborationState.userId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Remove user when they disconnect
            userRef.onDisconnect().remove();
        }
    });
    
    // Listen for online users
    const usersRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/users`);
    usersRef.on('value', snapshot => {
        const users = snapshot.val() || {};
        collaborationState.onlineUsers = users;
        updateOnlineCount(Object.keys(users).length);
    });
}

// Generate session ID
function generateSessionId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Save data to Firebase
function saveSharedData() {
    if (!collaborationState.isConnected) return;
    
    const dataRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/data`);
    dataRef.set({
        retroData: retroData,
        timerState: {
            duration: timerState.duration,
            remaining: timerState.remaining,
            isRunning: timerState.isRunning,
            isPaused: timerState.isPaused
        },
        isTextHidden: isTextHidden,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
    });
}

// Load shared data from Firebase
function loadSharedData() {
    if (!collaborationState.isConnected) return;
    
    const dataRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/data`);
    dataRef.once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const sharedData = snapshot.val();
                updateFromSharedData(sharedData);
            }
        })
        .catch(error => {
            console.error('Failed to load shared data:', error);
        });
}

// Update local data from shared data
function updateFromSharedData(sharedData) {
    if (!sharedData) return;
    
    // Update retrospective data
    if (sharedData.retroData) {
        retroData = { ...retroData, ...sharedData.retroData };
        
        // Update UI
        document.getElementById('sprintName').value = retroData.sprintName || '';
        document.getElementById('sprintDate').value = retroData.sprintDate || '';
        
        renderItems('well');
        renderItems('improve');
        renderItems('action');
        renderTeamMembers();
        updateAllCounts();
    }
    
    // Update timer state
    if (sharedData.timerState) {
        timerState.duration = sharedData.timerState.duration;
        timerState.remaining = sharedData.timerState.remaining;
        document.getElementById('timerMinutes').value = timerState.duration;
        updateTimerDisplay();
    }
    
    // Update reveal state
    if (typeof sharedData.isTextHidden === 'boolean') {
        isTextHidden = sharedData.isTextHidden;
        updateRevealUI();
    }
    
    // Save to local storage
    localStorage.setItem('retroData', JSON.stringify(retroData));
}

// Update online user count
function updateOnlineCount(count) {
    document.getElementById('onlineCount').textContent = count;
}

// Copy session ID to clipboard
function copySessionId() {
    if (!collaborationState.currentSessionId) return;
    
    navigator.clipboard.writeText(collaborationState.currentSessionId)
        .then(() => {
            showNotification('Session ID copied to clipboard!', 'success');
        })
        .catch(() => {
            showNotification('Failed to copy session ID', 'error');
        });
}

// Update reveal UI based on state
function updateRevealUI() {
    const toggleBtn = document.getElementById('revealToggle');
    const columns = document.querySelectorAll('.column');
    
    if (isTextHidden) {
        columns.forEach(column => column.classList.add('text-hidden'));
        columns.forEach(column => column.classList.remove('text-revealed'));
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal All Text';
    } else {
        columns.forEach(column => column.classList.add('text-revealed'));
        columns.forEach(column => column.classList.remove('text-hidden'));
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide All Text';
    }
}

// Override existing functions to include collaboration
const originalAddItem = addItem;
addItem = function(category) {
    originalAddItem(category);
    if (collaborationState.isConnected) {
        saveSharedData();
    }
};

const originalVoteItem = voteItem;
voteItem = function(itemId, category) {
    originalVoteItem(itemId, category);
    if (collaborationState.isConnected) {
        saveSharedData();
    }
};

const originalDeleteItem = deleteItem;
deleteItem = function(itemId, category) {
    originalDeleteItem(itemId, category);
    if (collaborationState.isConnected) {
        saveSharedData();
    }
};

const originalToggleReveal = toggleReveal;
toggleReveal = function() {
    originalToggleReveal();
    if (collaborationState.isConnected) {
        saveSharedData();
    }
};
