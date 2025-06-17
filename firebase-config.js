// Firebase Configuration
// Replace these values with your own Firebase project credentials
const firebaseConfig = {
    // You'll need to create a Firebase project and get these values
    // Instructions are in the README.md
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase (this will be called from script.js)
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');
            return firebase.database();
        } else {
            console.warn('Firebase not loaded, using local storage only');
            return null;
        }
    } catch (error) {
        console.warn('Firebase initialization failed, using local storage only:', error);
        return null;
    }
}

// Demo configuration for testing (uses Firebase demo project)
const demoFirebaseConfig = {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Use demo config if main config is not set up
function getFirebaseConfig() {
    return firebaseConfig.apiKey === "your-api-key-here" ? demoFirebaseConfig : firebaseConfig;
}
