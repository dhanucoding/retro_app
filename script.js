// Generate unique user ID
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Get color for current user's items (only current user gets special coloring)
function getCurrentUserColor() {
    // Special color scheme for the current user's items
    return {
        bg: '#E8F4FD',     // Light blue background
        border: '#2196F3',  // Blue border
        text: '#1565C0'     // Dark blue text
    };
}

// Get neutral color for other users' items
function getOtherUsersColor() {
    // Neutral color scheme for all other users
    return {
        bg: '#f7fafc',      // Light gray background (same as default)
        border: '#e2e8f0',  // Light gray border (same as default)
        text: '#2d3748'     // Dark gray text (same as default)
    };
}

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
let hideMode = 'all'; // 'all', 'others', or 'none'

// Collaboration state
let collaborationState = {
    isConnected: false,
    currentSessionId: null,
    database: null,
    userId: generateUserId(),
    onlineUsers: {},
    isHost: false,
    timerRef: null,
    serverTimeOffset: 0,
    revealRef: null,
    userColors: {} // Store color assignments for users
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
    
    // Add button event listeners as backup
    setupButtonEventListeners();
    
    // Initialize all add buttons as disabled
    initializeButtonStates();
});

// Initialize all add button states
function initializeButtonStates() {
    const buttons = [
        { selector: '.went-well .add-btn', inputId: 'wellInput' },
        { selector: '.could-improve .add-btn', inputId: 'improveInput' },
        { selector: '.action-items .add-btn', inputId: 'actionInput' }
    ];
    
    buttons.forEach(({ selector, inputId }) => {
        const button = document.querySelector(selector);
        const input = document.getElementById(inputId);
        
        if (button && input) {
            const hasText = input.value.trim().length > 0;
            button.disabled = !hasText;
            
            if (hasText) {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.title = '';
            } else {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.title = 'Enter some text first';
            }
        }
    });
}

// Setup enter key support for all input fields
function setupEnterKeySupport() {
    // Setup input fields with both keypress and input monitoring
    setupInputField('wellInput', 'well', addItem);
    setupInputField('improveInput', 'improve', addItem);
    setupInputField('actionInput', 'action', addItem);
    
    document.getElementById('memberInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTeamMember();
        }
    });
}

// Setup individual input field with button state management
function setupInputField(inputId, category, actionFunction) {
    const input = document.getElementById(inputId);
    const button = document.querySelector(`.${category === 'well' ? 'went-well' : category === 'improve' ? 'could-improve' : 'action-items'} .add-btn`);
    
    if (!input || !button) {
        console.warn(`Input or button not found for ${category}`);
        return;
    }
    
    // Function to update button state
    function updateButtonState() {
        const hasText = input.value.trim().length > 0;
        button.disabled = !hasText;
        
        // Update button styling
        if (hasText) {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.title = '';
        } else {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.title = 'Enter some text first';
        }
    }
    
    // Monitor input changes
    input.addEventListener('input', updateButtonState);
    input.addEventListener('keyup', updateButtonState);
    input.addEventListener('paste', () => setTimeout(updateButtonState, 0));
    
    // Handle Enter key
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const hasText = this.value.trim().length > 0;
            if (hasText) {
                actionFunction(category, e);
            }
        }
    });
    
    // Initialize button state
    updateButtonState();
}

// Setup button event listeners as backup to onclick handlers
function setupButtonEventListeners() {
    // Add event listeners for add buttons
    const addButtons = [
        { selector: '.went-well .add-btn', category: 'well' },
        { selector: '.could-improve .add-btn', category: 'improve' },
        { selector: '.action-items .add-btn', category: 'action' }
    ];
    
    addButtons.forEach(({ selector, category }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                // Only proceed if button is not disabled
                if (!this.disabled) {
                    addItem(category, event);
                }
                return false;
            });
        }
    });
}

// Add item to a specific category
function addItem(category, event) {
    // Prevent any form submission or page refresh
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const input = document.getElementById(category + 'Input');
    if (!input) {
        console.error('Input element not found for category:', category);
        return false;
    }
    
    const text = input.value.trim();
    
    // Only proceed if there's text - silent return without error message
    if (!text || text === '') {
        return false;
    }
    
    try {
        const item = {
            id: generateId(),
            text: text,
            timestamp: new Date().toLocaleString(),
            votes: 0,
            createdBy: {
                userId: collaborationState.userId,
                sessionId: collaborationState.currentSessionId,
                isHost: collaborationState.isHost
            }
        };

        retroData.items[category].push(item);
        input.value = '';
        
        // Update button state after clearing input
        const button = document.querySelector(`.${category === 'well' ? 'went-well' : category === 'improve' ? 'could-improve' : 'action-items'} .add-btn`);
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.title = 'Enter some text first';
        }
        
        renderItems(category);
        updateCount(category);
        // Ensure reveal state is maintained after adding new items
        updateRevealUI();
        saveRetroData();
        showNotification('Item added successfully!', 'success');
        
        return true; // Indicate success
        
    } catch (error) {
        console.error('Error adding item:', error);
        showNotification('Error adding item', 'error');
        return false;
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if current user can edit an item
function canEditItem(item) {
    // If not in collaborative mode, user can edit all items
    if (!collaborationState.isConnected) {
        return true;
    }
    
    // If item doesn't have creator info (legacy items), allow editing
    if (!item.createdBy) {
        return true;
    }
    
    // User can edit their own items
    if (item.createdBy.userId === collaborationState.userId) {
        return true;
    }
    
    // Host can edit all items (optional - you might want to disable this)
    if (collaborationState.isHost) {
        return true;
    }
    
    return false;
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
    
    const canEdit = canEditItem(item);
    
    // Add class to identify items created by current user
    if (collaborationState.isConnected && item.createdBy && item.createdBy.userId === collaborationState.userId) {
        div.classList.add('my-item');
    }
    
    // Apply color scheme in collaborative mode
    if (collaborationState.isConnected && item.createdBy && item.createdBy.userId) {
        if (item.createdBy.userId === collaborationState.userId) {
            // Current user's items get special highlighting
            const userColor = getCurrentUserColor();
            div.style.backgroundColor = userColor.bg;
            div.style.borderColor = userColor.border;
            div.style.borderWidth = '2px';
            div.style.borderStyle = 'solid';
            div.setAttribute('data-user-type', 'current-user');
            div.setAttribute('title', 'Your item');
        } else {
            // Other users' items get neutral styling
            const neutralColor = getOtherUsersColor();
            div.style.backgroundColor = neutralColor.bg;
            div.style.borderColor = neutralColor.border;
            div.style.borderWidth = '1px';
            div.style.borderStyle = 'solid';
            div.setAttribute('data-user-type', 'other-user');
            div.setAttribute('title', `Item by another user`);
        }
    }
    
    // Only make item clickable for editing if user can edit it
    if (canEdit) {
        div.onclick = () => editItem(item.id, category);
        div.style.cursor = 'pointer';
    }
    
    // Create edit and delete buttons only if user can edit
    const editButton = canEdit ? 
        `<button class="item-btn edit-btn" onclick="event.stopPropagation(); editItem('${item.id}', '${category}')" title="Edit">
            <i class="fas fa-edit"></i>
        </button>` : '';
    
    const deleteButton = canEdit ? 
        `<button class="item-btn delete-btn" onclick="event.stopPropagation(); deleteItem('${item.id}', '${category}')" title="Delete">
            <i class="fas fa-trash"></i>
        </button>` : '';
    
    // Add visual indicator for items created by current user (enhanced for collaborative mode)
    const ownershipIndicator = canEdit && collaborationState.isConnected ? 
        `<span class="ownership-indicator" title="Your item">
            <i class="fas fa-user"></i>
        </span>` : 
        (collaborationState.isConnected && item.createdBy && item.createdBy.userId !== collaborationState.userId ?
        `<span class="user-indicator" title="Item by another user">
            <i class="fas fa-user-friends"></i>
        </span>` : '');
    
    div.innerHTML = `
        <div class="item-text">${escapeHtml(item.text)}</div>
        <div class="item-meta">
            <span class="timestamp">${item.timestamp}</span>
            ${ownershipIndicator}
            <div class="item-actions">
                <button class="item-btn vote-btn" onclick="event.stopPropagation(); voteItem('${item.id}', '${category}')" title="Vote">
                    <i class="fas fa-heart"></i> ${item.votes}
                </button>
                ${editButton}
                ${deleteButton}
            </div>
        </div>
    `;
    
    // Add visual styling for non-editable items
    if (!canEdit && collaborationState.isConnected) {
        div.classList.add('item-readonly');
    }
    
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
        // Ensure reveal state is maintained after voting
        updateRevealUI();
        saveRetroData();
        showNotification('Vote added!', 'success');
    }
}

// Edit item
function editItem(itemId, category) {
    const item = retroData.items[category].find(item => item.id === itemId);
    if (item) {
        // Check if user has permission to edit this item
        if (!canEditItem(item)) {
            showNotification('You can only edit items you created', 'error');
            return;
        }
        
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
            // Double-check permission before saving
            if (!canEditItem(item)) {
                showNotification('You can only edit items you created', 'error');
                closeModal();
                return;
            }
            
            item.text = newText;
            renderItems(category);
            // Ensure reveal state is maintained after editing
            updateRevealUI();
            saveRetroData();
            closeModal();
            showNotification('Item updated successfully!', 'success');
        }
    }
}

// Delete item
function deleteItem(itemId, category) {
    const item = retroData.items[category].find(item => item.id === itemId);
    if (item) {
        // Check if user has permission to delete this item
        if (!canEditItem(item)) {
            showNotification('You can only delete items you created', 'error');
            return;
        }
    }
    
    if (confirm('Are you sure you want to delete this item?')) {
        retroData.items[category] = retroData.items[category].filter(item => item.id !== itemId);
        renderItems(category);
        updateCount(category);
        // Ensure reveal state is maintained after deleting
        updateRevealUI();
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

// Start fresh retrospective
function startFresh() {
    const confirmMessage = collaborationState.isConnected && collaborationState.isHost 
        ? 'Are you sure you want to start a completely fresh retrospective? This will clear ALL data for ALL users in the collaborative session and cannot be undone.'
        : collaborationState.isConnected && !collaborationState.isHost
        ? 'Only the session host can start fresh for all users. This will only clear your local data and disconnect you from the session.'
        : 'Are you sure you want to start a completely fresh retrospective? This will clear all local data and cannot be undone.';
    
    if (confirm(confirmMessage)) {
        // Clear localStorage
        localStorage.removeItem('retroData');
        
        // If connected to collaborative session, clear it for all users
        if (collaborationState.isConnected) {
            // Only host can clear collaborative session
            if (collaborationState.isHost) {
                // Clear the entire session data for all users
                const sessionRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}`);
                sessionRef.remove()
                    .then(() => {
                        showNotification('Collaborative session cleared for all users', 'info');
                    })
                    .catch(error => {
                        console.error('Failed to clear collaborative session:', error);
                        showNotification('Warning: Could not clear collaborative session', 'warning');
                    });
            } else {
                showNotification('Only the session host can start fresh for all users. You have been disconnected.', 'warning');
                // Non-host users just disconnect but keep their local data
            }
            
            // Disconnect locally
            collaborationState.isConnected = false;
            collaborationState.currentSessionId = null;
            collaborationState.isHost = false;
            document.getElementById('sessionInfo').style.display = 'none';
            document.getElementById('sessionId').value = '';
        }
        
        // Reset data
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
        
        // Reset reveal state
        isTextHidden = false;
        hideMode = 'none';
        
        // Clear UI
        document.getElementById('sprintName').value = '';
        document.getElementById('sprintDate').value = new Date().toISOString().split('T')[0];
        
        renderItems('well');
        renderItems('improve');
        renderItems('action');
        renderTeamMembers();
        updateAllCounts();
        updateRevealUI();
        
        showNotification('Started fresh retrospective', 'success');
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
        
        // Show notification that previous data was loaded
        if (retroData.sprintName || retroData.items.well.length > 0 || retroData.items.improve.length > 0 || retroData.items.action.length > 0) {
            showNotification('Previous retrospective data loaded. Click "Start Fresh" to begin anew.', 'info');
        }
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
    // In collaborative sessions, only host can control timer
    if (collaborationState.isConnected && !collaborationState.isHost) {
        showNotification('Only the session host can control the timer', 'warning');
        return;
    }
    
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
    
    // For collaborative sessions, sync timer start with server timestamp
    if (collaborationState.isConnected) {
        syncTimerStart();
        // Also start local timer for immediate host feedback
        startLocalTimer();
    } else {
        // Local timer
        startLocalTimer();
    }
    
    showNotification('Timer started!', 'success');
}

function pauseTimer() {
    // In collaborative sessions, only host can control timer
    if (collaborationState.isConnected && !collaborationState.isHost) {
        showNotification('Only the session host can control the timer', 'warning');
        return;
    }
    
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
    
    // Sync timer pause
    if (collaborationState.isConnected) {
        syncTimerPause();
    }
    
    showNotification('Timer paused', 'info');
}

function resetTimer() {
    // In collaborative sessions, only host can control timer
    if (collaborationState.isConnected && !collaborationState.isHost) {
        showNotification('Only the session host can control the timer', 'warning');
        return;
    }
    
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
    
    // Sync timer reset
    if (collaborationState.isConnected) {
        syncTimerReset();
    }
    
    showNotification('Timer reset', 'info');
}

// Local timer for non-collaborative sessions
function startLocalTimer() {
    timerState.interval = setInterval(() => {
        timerState.remaining--;
        updateTimerDisplay();
        
        if (timerState.remaining <= 0) {
            timerEnded();
        }
    }, 1000);
}

// Sync timer start with server timestamp
function syncTimerStart() {
    if (!collaborationState.isConnected) return;
    
    const timerRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/timer`);
    const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
    
    timerRef.set({
        isRunning: true,
        isPaused: false,
        duration: timerState.duration,
        remaining: timerState.remaining,
        startTime: serverTimestamp,
        lastUpdateTime: serverTimestamp,
        endTime: null
    });
}

// Sync timer pause
function syncTimerPause() {
    if (!collaborationState.isConnected) return;
    
    const timerRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/timer`);
    timerRef.update({
        isRunning: false,
        isPaused: true,
        remaining: timerState.remaining,
        lastUpdateTime: firebase.database.ServerValue.TIMESTAMP
    });
}

// Sync timer reset
function syncTimerReset() {
    if (!collaborationState.isConnected) return;
    
    const timerRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/timer`);
    timerRef.set({
        isRunning: false,
        isPaused: false,
        duration: timerState.duration,
        remaining: timerState.remaining,
        startTime: null,
        lastUpdateTime: firebase.database.ServerValue.TIMESTAMP,
        endTime: null
    });
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
    
    // Sync timer end to collaborative session
    if (collaborationState.isConnected) {
        const timerRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/timer`);
        timerRef.update({
            isRunning: false,
            isPaused: false,
            remaining: 0,
            endTime: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    // Play sound notification (if supported)
    try {
        const audio = new Audio('notification.mp3');
        audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    } catch (error) {
        console.log('Audio notification not supported');
    }
    
    showNotification('Time\'s up!', 'warning');
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
    
    // Check if user has existing data
    const hasExistingData = retroData.sprintName || 
                           retroData.items.well.length > 0 || 
                           retroData.items.improve.length > 0 || 
                           retroData.items.action.length > 0 ||
                           retroData.teamMembers.length > 0;
    
    if (hasExistingData) {
        // Show custom dialog for data handling choice
        showCreateSessionDialog();
    } else {
        // No existing data, just create the session
        proceedWithSessionCreation(false);
    }
}

// Show dialog for creating session with existing data
function showCreateSessionDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'createSessionModal'; // Add unique ID
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-users"></i> Create Collaborative Session</h3>
            <p>You have existing retrospective data. What would you like to do?</p>
            
            <div style="margin: 20px 0;">
                <div style="padding: 15px; border: 2px solid #48bb78; border-radius: 10px; margin-bottom: 15px; background: #f0fff4;">
                    <h4 style="margin: 0 0 10px 0; color: #2f855a;"><i class="fas fa-sparkles"></i> Start Fresh Session</h4>
                    <p style="margin: 0; color: #2f855a;">Clear all current data and begin with a clean retrospective. Perfect for a new sprint or team meeting.</p>
                </div>
                
                <div style="padding: 15px; border: 2px solid #667eea; border-radius: 10px; background: #f7faff;">
                    <h4 style="margin: 0 0 10px 0; color: #553c9a;"><i class="fas fa-share"></i> Share Current Data</h4>
                    <p style="margin: 0; color: #553c9a;">Keep current data and share it with team members who join the session.</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button id="startFreshBtn" class="btn btn-success" style="margin-right: 10px;">
                    <i class="fas fa-sparkles"></i> Start Fresh
                </button>
                <button id="shareDataBtn" class="btn btn-primary" style="margin-right: 10px;">
                    <i class="fas fa-share"></i> Share Current Data
                </button>
                <button id="cancelBtn" class="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add proper event listeners
    const startFreshBtn = modal.querySelector('#startFreshBtn');
    const shareDataBtn = modal.querySelector('#shareDataBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    
    startFreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCreateSessionChoice(true);
    });
    
    shareDataBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCreateSessionChoice(false);
    });
    
    cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCreateSessionDialog();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeCreateSessionDialog();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function escapeHandler(event) {
        if (event.key === 'Escape') {
            closeCreateSessionDialog();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Handle create session choice
function handleCreateSessionChoice(startFresh) {
    closeCreateSessionDialog();
    proceedWithSessionCreation(startFresh);
}

// Close create session dialog
function closeCreateSessionDialog() {
    const modal = document.getElementById('createSessionModal');
    if (modal) {
        // Add a smooth fade-out animation before removing
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        modal.style.transition = 'all 0.3s ease';
        
        // Remove the modal after animation completes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }
}

// Proceed with session creation
function proceedWithSessionCreation(shouldClearData) {
    // Clear data if user chose to start fresh
    if (shouldClearData) {
        clearDataForNewSession();
    }
    
    const sessionId = generateSessionId();
    collaborationState.currentSessionId = sessionId;
    collaborationState.isHost = true;
    
    setupSession(sessionId);
    
    if (shouldClearData) {
        showNotification(`Fresh session created! Share ID: ${sessionId}`, 'success');
    } else {
        showNotification(`Session created with current data! Share ID: ${sessionId}`, 'success');
    }
}

// Clear data for new session (similar to startFresh but without session clearing)
function clearDataForNewSession() {
    // Clear localStorage
    localStorage.removeItem('retroData');
    
    // Reset data
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
    
    // Reset reveal state
    isTextHidden = false;
    hideMode = 'none';
    
    // Clear UI
    document.getElementById('sprintName').value = '';
    document.getElementById('sprintDate').value = new Date().toISOString().split('T')[0];
    
    renderItems('well');
    renderItems('improve');
    renderItems('action');
    renderTeamMembers();
    updateAllCounts();
    updateRevealUI();
    
    // Update button states after clearing
    if (typeof initializeButtonStates === 'function') {
        initializeButtonStates();
    }
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
    setupUserColorSynchronization();
    
    // Update UI for host permissions
    updateRevealUI();
    
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
        } else if (collaborationState.isConnected && !collaborationState.isHost) {
            // Session was deleted by host (start fresh) - disconnect gracefully
            handleSessionEnded();
        }
    });

    // Setup real-time timer synchronization
    setupTimerSynchronization();
    
    // Setup real-time reveal synchronization
    setupRevealSynchronization();
}

// Handle session ended (when host starts fresh)
function handleSessionEnded() {
    if (!collaborationState.isConnected) return;
    
    // Disconnect from session
    collaborationState.isConnected = false;
    collaborationState.currentSessionId = null;
    collaborationState.isHost = false;
    
    // Update UI
    document.getElementById('sessionInfo').style.display = 'none';
    
    // Clear session input
    document.getElementById('sessionId').value = '';
    
    // Show notification to user
    showNotification('Session ended by host. You have been disconnected.', 'warning');
    
    // Keep current local data - don't clear it
    // This allows users to continue working locally or join a new session
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

// Setup real-time timer synchronization
function setupTimerSynchronization() {
    const timerRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/timer`);
    collaborationState.timerRef = timerRef;
    
    // Calculate server time offset
    const offsetRef = collaborationState.database.ref('.info/serverTimeOffset');
    offsetRef.on('value', snapshot => {
        collaborationState.serverTimeOffset = snapshot.val() || 0;
    });
    
    // Listen for timer changes
    timerRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const timerData = snapshot.val();
            updateTimerFromSharedData(timerData);
        } else if (collaborationState.isConnected && !collaborationState.isHost) {
            // Timer data was deleted (session ended) - reset timer UI
            resetTimerForSessionEnd();
        }
    });
}

// Reset timer UI when session ends
function resetTimerForSessionEnd() {
    // Reset timer state to default
    timerState.isRunning = false;
    timerState.isPaused = false;
    timerState.duration = 30;
    timerState.remaining = 30 * 60;
    clearInterval(timerState.interval);
    
    // Reset timer UI
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const minutesInput = document.getElementById('timerMinutes');
    const statusElement = document.getElementById('timerStatus');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    minutesInput.disabled = false;
    minutesInput.value = timerState.duration;
    statusElement.textContent = 'Ready to start';
    
    updateTimerDisplay();
    updateTimerUI();
}

// Update timer from shared data
function updateTimerFromSharedData(timerData) {
    if (!timerData) return;
    
    const wasRunning = timerState.isRunning;
    
    // Update timer state
    timerState.duration = timerData.duration;
    timerState.isRunning = timerData.isRunning;
    timerState.isPaused = timerData.isPaused;
    
    // Calculate real-time remaining time if timer is running
    if (timerData.isRunning && timerData.startTime) {
        const serverNow = Date.now() + collaborationState.serverTimeOffset;
        const elapsed = Math.floor((serverNow - timerData.startTime) / 1000);
        timerState.remaining = Math.max(0, timerData.duration * 60 - elapsed);
        
        // Start local countdown if not already running
        if (!wasRunning) {
            startRealTimeTimer();
        }
    } else {
        // Timer is paused or stopped
        timerState.remaining = timerData.remaining || timerData.duration * 60;
        clearInterval(timerState.interval);
    }
    
    // Update UI
    updateTimerUI();
    updateTimerDisplay();
    
    // Check if timer ended
    if (timerState.remaining <= 0 && timerState.isRunning) {
        timerEnded();
    }
}

// Start real-time timer countdown
function startRealTimeTimer() {
    clearInterval(timerState.interval);
    
    timerState.interval = setInterval(() => {
        if (timerState.isRunning && timerState.remaining > 0) {
            timerState.remaining--;
            updateTimerDisplay();
            
            if (timerState.remaining <= 0) {
                timerEnded();
            }
        }
    }, 1000);
}

// Update timer UI elements
function updateTimerUI() {
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const minutesInput = document.getElementById('timerMinutes');
    const statusElement = document.getElementById('timerStatus');
    
    minutesInput.value = timerState.duration;
    
    // Check if user can control timer (only host in collaborative sessions)
    const canControlTimer = !collaborationState.isConnected || collaborationState.isHost;
    
    if (timerState.isRunning) {
        startBtn.disabled = true;
        pauseBtn.disabled = !canControlTimer;
        minutesInput.disabled = true;
        statusElement.textContent = collaborationState.isHost ? 'Timer running...' : 
                                   collaborationState.isConnected ? 'Timer running (Host controlled)...' : 'Timer running...';
    } else if (timerState.isPaused) {
        startBtn.disabled = !canControlTimer;
        pauseBtn.disabled = true;
        minutesInput.disabled = true;
        statusElement.textContent = collaborationState.isHost ? 'Timer paused' : 
                                   collaborationState.isConnected ? 'Timer paused (Host controlled)' : 'Timer paused';
    } else {
        startBtn.disabled = !canControlTimer;
        pauseBtn.disabled = true;
        minutesInput.disabled = !canControlTimer;
        statusElement.textContent = collaborationState.isHost ? 'Ready to start' : 
                                   collaborationState.isConnected ? 'Ready to start (Host controls timer)' : 'Ready to start';
    }
    
    // Add visual indicator for non-host users
    if (collaborationState.isConnected && !collaborationState.isHost) {
        [startBtn, pauseBtn].forEach(btn => {
            if (!btn.disabled) {
                btn.style.opacity = '0.6';
                btn.title = 'Only the session host can control the timer';
            }
        });
        if (!minutesInput.disabled) {
            minutesInput.style.opacity = '0.6';
            minutesInput.title = 'Only the session host can change timer duration';
        }
    } else {
        [startBtn, pauseBtn, minutesInput].forEach(element => {
            element.style.opacity = '1';
            element.title = '';
        });
    }
}

// ===== REVEAL SYNCHRONIZATION FUNCTIONS =====

// Setup reveal synchronization
function setupRevealSynchronization() {
    const revealRef = collaborationState.database.ref(`sessions/${collaborationState.currentSessionId}/reveal`);
    collaborationState.revealRef = revealRef;
    
    // Listen for reveal state changes
    revealRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const revealData = snapshot.val();
            updateRevealFromSharedData(revealData);
        } else if (collaborationState.isConnected && !collaborationState.isHost) {
            // Reveal data was deleted (session ended) - reset to default state
            isTextHidden = false;
            hideMode = 'none';
            updateRevealUI();
        }
    });
    
    // Initialize reveal state for new sessions or update for existing ones
    if (collaborationState.isHost) {
        // Check if reveal data already exists before overwriting
        revealRef.once('value').then(snapshot => {
            if (!snapshot.exists()) {
                // No existing reveal data, set defaults
                revealRef.set({
                    isTextHidden: isTextHidden,
                    hideMode: hideMode,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                });
            }
            // If data exists, the listener above will handle it
        });
    } else {
        // For participants, force update UI to match current state
        updateRevealUI();
    }
}

// Setup user color synchronization (simplified for current user highlighting only)
function setupUserColorSynchronization() {
    // No need for complex synchronization since we only highlight current user
    // All users will see their own items highlighted in blue, others in neutral gray
    console.log('User color highlighting initialized - current user items will be highlighted');
}

// Ensure current user has a color assignment (simplified)
function ensureUserColorAssignment() {
    // No Firebase storage needed since colors are determined locally
    // Current user always gets blue, others always get neutral
}

// Update reveal state from shared data
function updateRevealFromSharedData(revealData) {
    if (!revealData) return;
    
    const wasHidden = isTextHidden;
    const wasHideMode = hideMode;
    
    isTextHidden = revealData.isTextHidden;
    hideMode = revealData.hideMode || 'all'; // Default to 'all' for backward compatibility
    
    // Always update UI to ensure synchronization
    updateRevealUI();
    
    // Only show notification if state actually changed and user is not host
    if ((wasHidden !== isTextHidden || wasHideMode !== hideMode) && !collaborationState.isHost) {
        let message;
        if (hideMode === 'others') {
            message = 'Host set: Others\' text hidden';
        } else {
            message = isTextHidden ? 'Text hidden by host' : 'Text revealed by host';
        }
        showNotification(message, 'info');
    }
}

// Sync reveal state to Firebase
function syncRevealState() {
    if (!collaborationState.isConnected || !collaborationState.revealRef) return;
    
    collaborationState.revealRef.update({
        isTextHidden: isTextHidden,
        hideMode: hideMode,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
    });
}

// Update reveal UI elements
function updateRevealUI() {
    const toggleBtn = document.getElementById('revealToggle');
    const columns = document.querySelectorAll('.column');
    
    // Clear all reveal/hide classes first
    columns.forEach(column => {
        column.classList.remove('text-hidden', 'text-revealed', 'hide-others-only');
    });
    
    // Apply appropriate classes based on hide mode
    if (hideMode === 'all' && isTextHidden) {
        columns.forEach(column => column.classList.add('text-hidden'));
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal All Text';
    } else if (hideMode === 'others') {
        columns.forEach(column => column.classList.add('hide-others-only'));
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal Others\' Text';
    } else {
        columns.forEach(column => column.classList.add('text-revealed'));
        // Update button text based on current context
        if (collaborationState.isConnected) {
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Text <span style="font-size: 12px;">▼</span>';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide All Text';
        }
    }
    
    // Update button permissions for collaborative sessions
    const canControlReveal = !collaborationState.isConnected || collaborationState.isHost;
    toggleBtn.disabled = !canControlReveal;
    
    // Add visual indicator for non-host users
    if (collaborationState.isConnected && !collaborationState.isHost) {
        toggleBtn.style.opacity = '0.6';
        toggleBtn.title = 'Only the session host can control text visibility';
    } else {
        toggleBtn.style.opacity = '1';
        toggleBtn.title = '';
    }
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
    
    // Update retrospective data - completely replace local data with shared data
    if (sharedData.retroData) {
        const hasExistingData = retroData.sprintName || 
                               retroData.items.well.length > 0 || 
                               retroData.items.improve.length > 0 || 
                               retroData.items.action.length > 0 ||
                               retroData.teamMembers.length > 0;
        
        retroData = {
            sprintName: sharedData.retroData.sprintName || '',
            sprintDate: sharedData.retroData.sprintDate || '',
            items: {
                well: sharedData.retroData.items?.well || [],
                improve: sharedData.retroData.items?.improve || [],
                action: sharedData.retroData.items?.action || []
            },
            teamMembers: sharedData.retroData.teamMembers || []
        };
        
        // Update UI
        document.getElementById('sprintName').value = retroData.sprintName || '';
        document.getElementById('sprintDate').value = retroData.sprintDate || '';
        
        renderItems('well');
        renderItems('improve');
        renderItems('action');
        renderTeamMembers();
        updateAllCounts();
        
        // Reapply reveal state after rendering items
        updateRevealUI();
        
        // Only show notification if this is the initial load and there's actually data
        const hasNewData = retroData.sprintName || 
                          retroData.items.well.length > 0 || 
                          retroData.items.improve.length > 0 || 
                          retroData.items.action.length > 0 ||
                          retroData.teamMembers.length > 0;
                          
        if (hasNewData && !hasExistingData) {
            showNotification('Loaded collaborative session data', 'info');
        }
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

// Toggle reveal/hide all text
function toggleReveal() {
    // In collaborative sessions, only host can control reveal
    if (collaborationState.isConnected && !collaborationState.isHost) {
        showNotification('Only the session host can control text visibility', 'warning');
        return;
    }
    
    // In collaborative sessions, show options menu
    if (collaborationState.isConnected) {
        showHideOptionsMenu();
        return;
    }
    
    // For single-user mode, toggle between hide all and reveal all
    if (hideMode === 'all' && isTextHidden) {
        hideMode = 'none';
        isTextHidden = false;
    } else {
        hideMode = 'all';
        isTextHidden = true;
    }
    
    updateRevealUI();
    showNotification(
        isTextHidden ? 'All text hidden' : 'All text revealed', 
        'info'
    );
}

// Show hide options menu for collaborative sessions
function showHideOptionsMenu() {
    const existingMenu = document.getElementById('hideOptionsMenu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const toggleBtn = document.getElementById('revealToggle');
    const menu = document.createElement('div');
    menu.id = 'hideOptionsMenu';
    menu.className = 'hide-options-menu';
    menu.innerHTML = `
        <div class="hide-option" onclick="setHideMode('none')">
            <i class="fas fa-eye"></i> Show All Text
        </div>
        <div class="hide-option" onclick="setHideMode('others')">
            <i class="fas fa-eye-slash"></i> Hide Others' Text Only
        </div>
        <div class="hide-option" onclick="setHideMode('all')">
            <i class="fas fa-eye-slash"></i> Hide All Text
        </div>
    `;
    
    // Position menu near the button
    const rect = toggleBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== toggleBtn) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Set hide mode for collaborative sessions
function setHideMode(mode) {
    hideMode = mode;
    
    if (mode === 'all') {
        isTextHidden = true;
    } else {
        isTextHidden = false;
    }
    
    updateRevealUI();
    
    // Sync to Firebase if in collaborative session
    if (collaborationState.isConnected) {
        syncRevealState();
    }
    
    // Remove menu
    const menu = document.getElementById('hideOptionsMenu');
    if (menu) menu.remove();
    
    // Show notification
    let message;
    switch (mode) {
        case 'none':
            message = 'All text revealed';
            break;
        case 'others':
            message = 'Others\' text hidden - your text remains visible';
            break;
        case 'all':
            message = 'All text hidden';
            break;
    }
    showNotification(message, 'info');
}

// Override existing functions to include collaboration - SIMPLIFIED APPROACH
const originalSaveRetroData = saveRetroData;
saveRetroData = function() {
    originalSaveRetroData();
    // Sync to collaborative session after any data save
    if (collaborationState.isConnected) {
        saveSharedData();
    }
};
