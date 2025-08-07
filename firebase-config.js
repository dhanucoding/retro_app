// Firebase Configuration
// SECURITY: Use environment variables or separate config file for production
// For development, create a .env file or use firebase-config-local.js

// Check if we're in a development environment with process.env (Node.js/build tools)
const isNode = typeof process !== 'undefined' && process.env;

// Configuration from environment variables (for build tools/Node.js environments)
const envConfig = isNode ? {
     apiKey: "__FIREBASE_API_KEY__",
     authDomain: "__FIREBASE_AUTH_DOMAIN__",
     databaseURL: "__FIREBASE_DATABASE_URL__",
     projectId: "__FIREBASE_PROJECT_ID__",
     storageBucket: "__FIREBASE_STORAGE_BUCKET__",
     messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
     appId: "__FIREBASE_APP_ID__"
} : null;

// Fallback configuration (for production, replaced by CI/CD)
const fallbackConfig = {
    apiKey: "__FIREBASE_API_KEY__",
    authDomain: "__FIREBASE_AUTH_DOMAIN__",
    databaseURL: "__FIREBASE_DATABASE_URL__",
    projectId: "__FIREBASE_PROJECT_ID__",
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__"
};

// Try to load local config file (git-ignored)
let localConfig = null;
try {
    // This will only work if firebase-config-local.js exists
    if (typeof loadLocalConfig === 'function') {
        localConfig = loadLocalConfig();
    }
} catch (error) {
    // Local config not available, will use fallback
}

// Use local config if available (localhost), otherwise fallback (production)
const firebaseConfig = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && localConfig
    ? localConfig
    : fallbackConfig;

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
