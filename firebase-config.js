// Firebase connection and classroom synchronization.
// The public web config identifies this Firebase project; access is protected by
// Anonymous Authentication and Firestore Security Rules.

const DEFAULT_FIREBASE_CONFIG = Object.freeze({
    apiKey: 'AIzaSyAl-bFkcpPvR3MLYwFP9980ArCX7mFvntY',
    authDomain: 'dream-money-road.firebaseapp.com',
    projectId: 'dream-money-road',
    storageBucket: 'dream-money-road.firebasestorage.app',
    messagingSenderId: '95702638523',
    appId: '1:95702638523:web:ea8cbc1bee1c63d6fa6e9e'
});

const SESSION_STORAGE_KEY = 'life_balance_current_session';
const OFFLINE_BROADCAST_NAME = 'life_balance_offline_sync';

let db = null;
let auth = null;
let authReadyPromise = null;
let isOfflineMode = true;
let broadcastChannel = null;

if ('BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(OFFLINE_BROADCAST_NAME);
}

function getSavedFirebaseConfig() {
    return { ...DEFAULT_FIREBASE_CONFIG };
}

// Kept as a no-op-compatible interface for older cached pages.
function saveFirebaseConfig() {
    return true;
}

function initializeFirebase() {
    if (!window.firebase?.firestore || !window.firebase?.auth) {
        console.warn('Firebase SDK를 불러오지 못해 이 기기에서만 작동하는 체험 모드로 실행합니다.');
        isOfflineMode = true;
        return;
    }

    try {
        if (window.firebase.apps.length === 0) {
            window.firebase.initializeApp(DEFAULT_FIREBASE_CONFIG);
        }
        db = window.firebase.firestore();
        auth = window.firebase.auth();
        isOfflineMode = false;
    } catch (error) {
        console.error('Firebase 초기화 실패', error);
        db = null;
        auth = null;
        isOfflineMode = true;
    }
}

async function ensureAnonymousUser() {
    if (isOfflineMode || !auth) return null;
    if (auth.currentUser) return auth.currentUser;

    if (!authReadyPromise) {
        authReadyPromise = auth.signInAnonymously()
            .then((credential) => credential.user)
            .catch((error) => {
                authReadyPromise = null;
                throw new Error(`온라인 수업 연결에 실패했습니다. (${error.code || error.message})`);
            });
    }
    return authReadyPromise;
}

function generateSessionId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createSession(sessionId, expenseCosts = null) {
    if (!isOfflineMode && db) {
        const user = await ensureAnonymousUser();
        const sessionRef = db.collection('sessions').doc(sessionId);
        const existing = await sessionRef.get();
        if (existing.exists) {
            throw new Error('같은 세션 번호가 이미 사용 중입니다. 다시 시도해 주세요.');
        }

        await sessionRef.set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            teacherUid: user.uid,
            status: 'active',
            expenseCosts
        });
        return true;
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        sessionId,
        role: 'teacher',
        createdAt: Date.now(),
        expenseCosts
    }));
    if (expenseCosts) {
        localStorage.setItem(`offline_session_costs_${sessionId}`, JSON.stringify(expenseCosts));
    }
    return true;
}

async function closeSession(sessionId) {
    if (!sessionId) return true;
    if (!isOfflineMode && db) {
        await ensureAnonymousUser();
        await db.collection('sessions').doc(sessionId).update({
            status: 'ended',
            endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    return true;
}

async function joinSession(sessionId, fallbackStudentId, studentName) {
    const baseStudentData = {
        name: studentName,
        stage: 1,
        updatedAt: Date.now(),
        bucketList: [],
        realityCheck: { income: 3000000, expenses: 0, selections: ['meal_home', 'house_rent', 'trans_public', 'hobby_basic'] },
        investment: { targetRate: 5, savingsEnd: 0, portfolioEnd: 0, bucketListCount: 0, achievedCount: 0 }
    };

    if (!isOfflineMode && db) {
        const user = await ensureAnonymousUser();
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists || sessionDoc.data().status !== 'active') {
            throw new Error('존재하지 않거나 종료된 세션 번호입니다.');
        }

        const studentId = user.uid;
        const studentRef = sessionRef.collection('students').doc(studentId);
        const existing = await studentRef.get();
        if (existing.exists) {
            await studentRef.update({
                name: studentName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await studentRef.set({
                ...baseStudentData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        return {
            expenseCosts: sessionDoc.data().expenseCosts || null,
            studentId
        };
    }

    const studentId = fallbackStudentId;
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'student_join',
            sessionId,
            studentId,
            studentName,
            data: baseStudentData
        });
    }

    try {
        const cachedCosts = localStorage.getItem(`offline_session_costs_${sessionId}`);
        return {
            expenseCosts: cachedCosts ? JSON.parse(cachedCosts) : null,
            studentId
        };
    } catch (error) {
        return { expenseCosts: null, studentId };
    }
}

async function updateStudentData(sessionId, studentId, stage, fields) {
    if (!isOfflineMode && db) {
        await ensureAnonymousUser();
        await db.collection('sessions').doc(sessionId)
            .collection('students').doc(studentId).update({
                stage,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...fields
            });
        return true;
    }

    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'student_update', sessionId, studentId, stage, fields });
    }

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

function listenToSession(sessionId, onUpdate) {
    if (!isOfflineMode && db) {
        return db.collection('sessions').doc(sessionId)
            .collection('students').onSnapshot((snapshot) => {
                const students = {};
                snapshot.forEach((doc) => {
                    students[doc.id] = doc.data();
                });
                onUpdate(students);
            }, (error) => {
                console.error('학생 현황 동기화 실패', error);
            });
    }

    const localStudents = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`offline_student_${sessionId}_`)) {
            const studentId = key.replace(`offline_student_${sessionId}_`, '');
            try {
                localStudents[studentId] = JSON.parse(localStorage.getItem(key));
            } catch (error) {
                console.warn('로컬 학생 데이터를 읽지 못했습니다.', error);
            }
        }
    }
    onUpdate(localStudents);

    const handleBroadcast = (event) => {
        const msg = event.data;
        if (msg.sessionId !== sessionId) return;

        if (msg.type === 'student_join') {
            localStudents[msg.studentId] = msg.data;
        } else if (msg.type === 'student_update') {
            localStudents[msg.studentId] = {
                ...(localStudents[msg.studentId] || {}),
                stage: msg.stage,
                ...msg.fields,
                updatedAt: Date.now()
            };
        } else {
            return;
        }
        onUpdate({ ...localStudents });
    };

    broadcastChannel?.addEventListener('message', handleBroadcast);
    return () => broadcastChannel?.removeEventListener('message', handleBroadcast);
}

initializeFirebase();

window.FirebaseSync = {
    getSavedFirebaseConfig,
    saveFirebaseConfig,
    initializeFirebase,
    isOfflineMode: () => isOfflineMode,
    generateSessionId,
    createSession,
    closeSession,
    joinSession,
    updateStudentData,
    listenToSession
};
