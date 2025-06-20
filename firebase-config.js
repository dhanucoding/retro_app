// Firebase Configuration
// SECURITY: Use environment variables or separate config file for production
// For development, create a .env file or use firebase-config-local.js

// Check if we're in a development environment with process.env (Node.js/build tools)
const isNode = typeof process !== 'undefined' && process.env;

// Configuration from environment variables (for build tools/Node.js environments)
const envConfig = isNode ? {
     apiKey: "AIzaSyBL-lypxxjynzLzH01eFX3nX9_yKKtiRRM",
     authDomain: "retro-app-fire-db.firebaseapp.com",
     databaseURL: "https://retro-app-fire-db-default-rtdb.firebaseio.com",
     projectId: "retro-app-fire-db",
     storageBucket: "retro-app-fire-db.firebasestorage.app",
     messagingSenderId: "842943406260",
     appId: "1:842943406260:web:d67ea9aa7be3c47066b7e1"
} : null;

// Fallback configuration (for production, replaced by CI/CD)
const fallbackConfig = {
    apiKey: "AIzaSyBL-lypxxjynzLzH01eFX3nX9_yKKtiRRM",
    authDomain: "retro-app-fire-db.firebaseapp.com",
    databaseURL: "https://retro-app-fire-db-default-rtdb.firebaseio.com",
    projectId: "retro-app-fire-db",
    storageBucket: "retro-app-fire-db.firebasestorage.app",
    messagingSenderId: "842943406260",
    appId: "1:842943406260:web:d67ea9aa7be3c47066b7e1"
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

// Use environment config first, then local config, then fallback
const firebaseConfig =  localConfig || fallbackConfig;

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
