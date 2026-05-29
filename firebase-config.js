// Firebase Configuration and Real-time Synchronization Manager
// This file handles both Firebase Firestore connections and a robust Local Offline Demo fallback.

const CONFIG_KEY = 'life_balance_firebase_config';
const SESSION_STORAGE_KEY = 'life_balance_current_session';
const OFFLINE_BROADCAST_NAME = 'life_balance_offline_sync';

let db = null;
let isOfflineMode = true;
let broadcastChannel = null;

// Initialize Web BroadcastChannel for Offline Demo Sync
if ('BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(OFFLINE_BROADCAST_NAME);
}

// Retrieve saved configuration
function getSavedFirebaseConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Failed to read localStorage config", e);
        return null;
    }
}

// Save Firebase configuration and reload
function saveFirebaseConfig(config) {
    try {
        if (!config) {
            localStorage.removeItem(CONFIG_KEY);
        } else {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        }
        return true;
    } catch (e) {
        console.error("Failed to save config to localStorage", e);
        return false;
    }
}

// Initialize Firebase SDK if config is present
function initializeFirebase() {
    const config = getSavedFirebaseConfig();
    if (config && window.firebase) {
        try {
            // Prevent duplicate initialization
            if (window.firebase.apps.length === 0) {
                window.firebase.initializeApp(config);
            }
            db = window.firebase.firestore();
            isOfflineMode = false;
            console.log("Firebase initialized successfully in Firestore mode.");
        } catch (e) {
            console.error("Firebase initialization failed. Falling back to Demo Mode.", e);
            db = null;
            isOfflineMode = true;
        }
    } else {
        db = null;
        isOfflineMode = true;
        console.log("No Firebase config found. Running in Offline Demo Mode.");
    }
}

// Helper to generate a unique 6-digit random PIN
function generateSessionId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a session (Teacher)
async function createSession(sessionId, expenseCosts = null) {
    if (!isOfflineMode && db) {
        try {
            await db.collection('sessions').doc(sessionId).set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                expenseCosts: expenseCosts
            });
            return true;
        } catch (e) {
            console.error("Failed to create Firestore session", e);
        }
    }
    
    // Offline / Fallback local tracking
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        sessionId,
        role: 'teacher',
        createdAt: Date.now(),
        expenseCosts: expenseCosts
    }));
    if (expenseCosts) {
        localStorage.setItem(`offline_session_costs_${sessionId}`, JSON.stringify(expenseCosts));
    }
    return true;
}

// Join a session (Student)
async function joinSession(sessionId, studentId, studentName) {
    const studentData = {
        name: studentName,
        stage: 1,
        updatedAt: Date.now(),
        bucketList: [],
        realityCheck: { income: 3000000, expenses: 0, selections: ['meal_home', 'house_rent', 'trans_public', 'hobby_basic'] },
        investment: { targetRate: 5, savingsEnd: 0, portfolioEnd: 0, bucketListCount: 0, achievedCount: 0 }
    };

    if (!isOfflineMode && db) {
        try {
            const sessionDoc = await db.collection('sessions').doc(sessionId).get();
            if (!sessionDoc.exists) {
                throw new Error("존재하지 않는 세션 번호입니다.");
            }
            const sessionData = sessionDoc.data();
            
            await db.collection('sessions').doc(sessionId)
                .collection('students').doc(studentId).set(studentData);
                
            return sessionData.expenseCosts || null;
        } catch (e) {
            console.error("Failed to join Firestore session", e);
            throw e;
        }
    }

    // Offline / Fallback local tracking
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'student_join',
            sessionId,
            studentId,
            studentName,
            data: studentData
        });
    }
    
    // Fetch offline costs
    try {
        const cachedCosts = localStorage.getItem(`offline_session_costs_${sessionId}`);
        return cachedCosts ? JSON.parse(cachedCosts) : null;
    } catch (e) {
        return null;
    }
}

// Update student data (Student)
async function updateStudentData(sessionId, studentId, stage, fields) {
    if (!isOfflineMode && db) {
        try {
            const updates = {
                stage: stage,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...fields
            };
            await db.collection('sessions').doc(sessionId)
                .collection('students').doc(studentId).update(updates);
            return true;
        } catch (e) {
            console.error("Failed to update Firestore student data", e);
        }
    }

    // Offline / Fallback local tracking
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'student_update',
            sessionId,
            studentId,
            stage,
            fields
        });
    }
    
    // Save to local storage for double safety
    const localKey = `offline_student_${sessionId}_${studentId}`;
    const current = localStorage.getItem(localKey);
    const existing = current ? JSON.parse(current) : { name: 'Unknown', stage: 1 };
    localStorage.setItem(localKey, JSON.stringify({
        ...existing,
        stage,
        updatedAt: Date.now(),
        ...fields
    }));

    return true;
}

// Listen to a session (Teacher Dashboard)
function listenToSession(sessionId, onUpdate) {
    if (!isOfflineMode && db) {
        // Return unsubscribe function
        return db.collection('sessions').doc(sessionId)
            .collection('students').onSnapshot((snapshot) => {
                const students = {};
                snapshot.forEach((doc) => {
                    students[doc.id] = doc.data();
                });
                onUpdate(students);
            }, (error) => {
                console.error("Firestore snapshot error", error);
            });
    }

    // Local Storage & Broadcast Channel Offline Listening
    const localStudents = {};
    
    // Load existing items from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`offline_student_${sessionId}_`)) {
            const studentId = key.replace(`offline_student_${sessionId}_`, '');
            try {
                localStudents[studentId] = JSON.parse(localStorage.getItem(key));
            } catch (e) {}
        }
    }
    
    // Trigger initial render
    onUpdate(localStudents);

    // Listen to live broadcast events
    const handleBroadcast = (event) => {
        const msg = event.data;
        if (msg.sessionId !== sessionId) return;

        if (msg.type === 'student_join') {
            localStudents[msg.studentId] = msg.data;
            onUpdate({ ...localStudents });
        } else if (msg.type === 'student_update') {
            const current = localStudents[msg.studentId] || {};
            localStudents[msg.studentId] = {
                ...current,
                stage: msg.stage,
                ...msg.fields,
                updatedAt: Date.now()
            };
            onUpdate({ ...localStudents });
        }
    };

    if (broadcastChannel) {
        broadcastChannel.addEventListener('message', handleBroadcast);
    }

    // Subscriptions cleanup
    return () => {
        if (broadcastChannel) {
            broadcastChannel.removeEventListener('message', handleBroadcast);
        }
    };
}

// Run initial configurations
initializeFirebase();

// Export interfaces globally
window.FirebaseSync = {
    getSavedFirebaseConfig,
    saveFirebaseConfig,
    initializeFirebase,
    isOfflineMode: () => isOfflineMode,
    generateSessionId,
    createSession,
    joinSession,
    updateStudentData,
    listenToSession
};
