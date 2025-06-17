# 🔥 Firebase Setup Guide for Real-time Collaboration

This guide will help you set up Firebase for real-time collaboration in your Sprint Retrospective app.

## 🚀 Quick Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., "sprint-retrospective")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Set up Realtime Database
1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users
5. Click "Done"

### Step 3: Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Register your app with a nickname
5. Copy the configuration object

### Step 4: Configure the App
1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

### Step 5: Set Database Rules (Optional - for production)
1. Go to Realtime Database → Rules
2. Replace the rules with:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['data']) || newData.hasChildren(['users'])"
      }
    }
  }
}
```

## 🎯 How It Works

### Session Management
- **Create Session**: Generates a unique 8-character session ID
- **Join Session**: Enter an existing session ID to collaborate
- **Real-time Sync**: All changes are instantly synchronized across all connected users

### Data Synchronization
- **Retrospective Items**: All items, votes, and edits sync in real-time
- **Timer State**: Timer status syncs across all users
- **Team Members**: Team member list is shared
- **Privacy Controls**: Hide/reveal state syncs

### User Presence
- **Online Indicators**: See how many users are currently online
- **Auto-cleanup**: Users are automatically removed when they disconnect

## 🔒 Security Considerations

### For Production Use:
1. **Secure Database Rules**: Implement proper authentication
2. **Environment Variables**: Don't commit API keys to version control
3. **Rate Limiting**: Implement rate limiting for API calls

### Sample Secure Rules:
```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "data": {
          ".validate": "newData.hasChildren(['retroData', 'lastUpdated'])"
        },
        "users": {
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        }
      }
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check your database rules
   - Ensure the database URL is correct

2. **Changes not syncing**
   - Check browser console for errors
   - Verify Firebase configuration
   - Check internet connectivity

3. **Session not found**
   - Verify the session ID is correct (case-sensitive)
   - Check if the session was created successfully

### Debugging:
- Open browser developer tools
- Check the Console tab for error messages
- Verify network requests in the Network tab

## 🌟 Advanced Features

### Custom Session IDs
You can modify the `generateSessionId()` function in `script.js` to create custom session ID formats.

### Data Persistence
Sessions persist in Firebase even after all users disconnect, allowing users to rejoin later.

### Offline Support
The app works offline and will sync changes when connectivity is restored.

## 📞 Need Help?

If you encounter issues:
1. Check the Firebase documentation
2. Verify your configuration matches the setup steps
3. Test with a simple Firebase example first
4. Check browser compatibility (modern browsers required)

## 🎉 You're Ready!

Once configured, your retrospective app will support real-time collaboration for distributed teams!

**Pro Tip**: Share the session ID via your team's chat platform for easy access.
