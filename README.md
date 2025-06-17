# 🔄 Sprint Retrospective Web App

A modern, interactive web application for conducting agile sprint retrospectives with your team. Built with HTML, CSS, and JavaScript for a seamless meeting experience.

![Sprint Retrospective App](https://img.shields.io/badge/Status-Ready-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Features

### 📋 **Core Retrospective Functionality**
- **Three Column Layout**: What Went Well, What Could Be Improved, Action Items
- **Add/Edit/Delete Items**: Click items to edit, add votes, or remove them
- **Voting System**: Team members can vote on important items with heart icons
- **Real-time Counters**: Track the number of items in each category

### ⏰ **Meeting Timer**
- **Customizable Duration**: Set meeting time from 1-180 minutes (default: 30 min)
- **Visual Countdown**: Large, easy-to-read timer display
- **Audio Alert**: Sound notification when time expires
- **Warning System**: Color-coded alerts (orange at 5 min, red pulsing at 1 min)
- **Full Controls**: Start, pause, and reset functionality

### 👁️ **Privacy Controls**
- **Hide/Reveal Text**: Blur all retrospective items for privacy during presentations
- **Hover Preview**: Partially reveal hidden text on hover
- **Toggle Button**: Easy switch between hidden and revealed states

### 👥 **Team Management**
- **Add Team Members**: Track who participated in the retrospective
- **Remove Members**: Easy member management with one-click removal
- **Export Integration**: Team members included in exported summaries

### 💾 **Data Management**
- **Auto-save**: Automatic saving every 30 seconds to localStorage
- **Manual Save**: Explicit save option with confirmation
- **Export Summary**: Download retrospective as Markdown file
- **Persistent Storage**: Data survives browser sessions

### 🎨 **Modern Design**
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Glass Morphism**: Beautiful translucent design elements
- **Smooth Animations**: Elegant transitions and micro-interactions
- **Dark Mode Support**: Adapts to system preferences
- **Professional UI**: Clean, modern interface suitable for corporate environments

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required

### 🌐 Live Demo
Visit the live app at: [Your deployed URL will go here]

### 👥 **Multi-User Collaboration**
This app supports real-time collaboration! Multiple team members can work on the same retrospective simultaneously.

**Setup Firebase (Optional - for real-time collaboration):**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Copy your config values to `firebase-config.js`
5. Set database rules to allow read/write access

**Using Collaboration:**
- **Create Session:** Click "Create New" to start a collaborative session
- **Join Session:** Enter a session ID and click "Join Session"
- **Share:** Copy the session ID and share with team members
- **Real-time Updates:** All changes sync automatically across all users

### Running the App Locally

#### Option 1: Direct File Opening
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start your retrospective meeting!

#### Option 2: VS Code Task (Recommended for Development)
1. Open the project in VS Code
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Tasks: Run Task"
4. Select "Run Retrospective App"

#### Option 3: Local Server (Optional)
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## 📖 How to Use

### 1. **Setup Your Retrospective**
- Enter your sprint name (e.g., "Sprint 23")
- Set the sprint date
- Add team members who participated
- Set your meeting duration and start the timer

### 2. **Conduct the Meeting**
- **Gather Items**: Team members add items to each column
- **Discuss & Vote**: Click heart icons to vote on important items
- **Take Notes**: Click any item to edit and add more details
- **Monitor Time**: Keep track of remaining meeting time

### 3. **Privacy Mode**
- Use "Hide All Text" when presenting to stakeholders
- Reveal items progressively during discussion
- Hover over hidden items for partial preview

### 4. **Wrap Up**
- Export your retrospective as a Markdown file
- Save the session for future reference
- Clear data when starting a new retrospective

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Add item (when typing in input fields) |
| `Spacebar` | Start/pause timer (when not typing) |
| `Cmd/Ctrl + S` | Save retrospective |
| `Cmd/Ctrl + E` | Export retrospective |
| `Escape` | Close modal |

## 🗂️ File Structure

```
Retro_app/
├── index.html              # Main HTML structure
├── styles.css              # CSS styling and responsive design
├── script.js               # JavaScript functionality
├── firebase-config.js      # Firebase configuration for collaboration
├── README.md               # This documentation
├── FIREBASE_SETUP.md       # Detailed Firebase setup guide
├── connect-github.sh       # GitHub deployment helper
├── deploy-help.sh          # Deployment options guide
└── .vscode/
    └── tasks.json          # VS Code task configuration
```

## 🎯 Best Practices for Retrospectives

### Before the Meeting
- [ ] Set a clear time limit (30-60 minutes recommended)
- [ ] Ensure all team members can access the app
- [ ] Prepare the sprint information (name, date, participants)

### During the Meeting
- [ ] Start with a brief explanation of the process
- [ ] Give team members time to add items silently first
- [ ] Discuss each category systematically
- [ ] Use voting to prioritize important items
- [ ] Focus on actionable improvements

### After the Meeting
- [ ] Export the summary for documentation
- [ ] Assign owners to action items
- [ ] Schedule follow-up for action items
- [ ] Share the exported summary with stakeholders

## 🔧 Customization

### Modifying Timer Settings
Edit the default timer duration in `script.js`:
```javascript
let timerState = {
    duration: 30, // Change default minutes here
    remaining: 30 * 60,
    // ...
};
```

### Changing Colors/Themes
Modify the CSS variables in `styles.css`:
```css
.went-well {
    border-top: 5px solid #48bb78; /* Green theme */
}

.could-improve {
    border-top: 5px solid #ed8936; /* Orange theme */
}

.action-items {
    border-top: 5px solid #4299e1; /* Blue theme */
}
```

## 🌟 Advanced Features

### Export Format
The app exports retrospectives in Markdown format including:
- Sprint name and date
- Team members list
- All items organized by category
- Vote counts for each item
- Generation timestamp

### Data Persistence
- Uses browser localStorage for data persistence
- Automatically saves every 30 seconds
- Data survives browser restarts
- Clear all data option available

### Mobile Optimization
- Touch-friendly interface
- Responsive grid layout
- Optimized button sizes
- Swipe gestures support

## 🚀 Deployment

This app can be deployed for free using several platforms:

### GitHub Pages (Recommended)
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → main branch
4. Your app will be live at `https://yourusername.github.io/repository-name`

### Netlify
1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop your project folder
3. Get instant deployment with custom domain support

### Vercel
1. Go to [vercel.com](https://vercel.com) and connect your GitHub
2. Import your repository
3. One-click deployment with performance optimization

### Surge.sh
```bash
npm install -g surge
cd your-project-folder
surge
```

## 🤝 Contributing

Feel free to contribute to this project by:
- Reporting bugs or issues
- Suggesting new features
- Submitting pull requests
- Improving documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♀️ Support

If you encounter any issues or have questions:
1. Check this README for common solutions
2. Review the browser console for error messages
3. Ensure you're using a modern web browser
4. Try clearing browser cache and localStorage

---

**Happy Retrospecting! 🎉**

*Built with ❤️ for agile teams everywhere*
