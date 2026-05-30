// Teacher Dashboard Logic - Life-Balance Simulator
// Manages teacher authorization, session hosting, real-time rosters, and dynamic word clouds.

let currentSessionId = '';
let unsubscribeSession = null;
let currentStudents = {};
let activeExpenseCosts = null; // Caches teacher-configured costs for demo student calculations
let activeVisualizationMode = 'wall'; // 'wall' or 'cloud'

// Stop words filter for Korean keyword extraction
const STOP_WORDS = new Set([
    '하기', '사기', '사고', '가기', '구매', '받기', '마련', '벌기', '자취', '일주', '한달', '살기',
    '여행', '취득', '촬영', '배우기', '하기', '합격', '사고싶다', '하고싶다', '준비', '구입', '등록',
    '을', '를', '이', '가', '은', '는', '에', '에서'
]);

// ----------------------------------------------------
// 1. TEACHER AUTH & SESSION INITS
// ----------------------------------------------------
function initTeacher() {
    const loginForm = document.getElementById('teacher-login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const pin = document.getElementById('input-teacher-pin').value;
        if (pin === '1234') {
            Sound.playSuccess();
            // Redirect to setup view first
            showView('teacher-setup-view');
        } else {
            Sound.playWarning();
            alert("잘못된 PIN 번호입니다! 다시 시도해 주세요.");
        }
    });

    // Setup back button
    document.getElementById('btn-setup-back').addEventListener('click', () => {
        showView('teacher-login-view');
    });

    // Setup complete button - generates session code and registers costs
    document.getElementById('btn-setup-complete').addEventListener('click', async () => {
        Sound.playSuccess();

        // 1. Gather all edited values from inputs (and convert to KRW)
        const customCosts = {
            meal_home: (parseFloat(document.getElementById('setup-cost-meal_home').value) || 30) * 10000,
            meal_out: (parseFloat(document.getElementById('setup-cost-meal_out').value) || 60) * 10000,
            meal_gourmet: (parseFloat(document.getElementById('setup-cost-meal_gourmet').value) || 120) * 10000,
            
            house_rent: (parseFloat(document.getElementById('setup-cost-house_rent').value) || 80) * 10000,
            house_loan: (parseFloat(document.getElementById('setup-cost-house_loan').value) || 50) * 10000,
            house_own: (parseFloat(document.getElementById('setup-cost-house_own').value) || 15) * 10000,
            
            trans_public: (parseFloat(document.getElementById('setup-cost-trans_public').value) || 10) * 10000,
            trans_car: (parseFloat(document.getElementById('setup-cost-trans_car').value) || 50) * 10000,
            trans_super: (parseFloat(document.getElementById('setup-cost-trans_super').value) || 150) * 10000,
            
            hobby_basic: (parseFloat(document.getElementById('setup-cost-hobby_basic').value) || 20) * 10000,
            hobby_medium: (parseFloat(document.getElementById('setup-cost-hobby_medium').value) || 50) * 10000,
            hobby_vip: (parseFloat(document.getElementById('setup-cost-hobby_vip').value) || 100) * 10000
        };

        // Cache custom costs globally
        activeExpenseCosts = customCosts;

        // 2. Generate session
        currentSessionId = FirebaseSync.generateSessionId();
        document.getElementById('teacher-session-id').innerText = currentSessionId;
        
        // 3. Register session
        await FirebaseSync.createSession(currentSessionId, customCosts);
        
        // 4. Switch view to dashboard
        showView('teacher-dashboard-view');
        startListeningToSession();
    });

    // Logout
    document.getElementById('teacher-logout-btn').addEventListener('click', () => {
        if (confirm("로그아웃 하시겠습니까? 세션 동기화가 중단됩니다.")) {
            if (unsubscribeSession) unsubscribeSession();
            location.reload();
        }
    });

    // Config Panel Setup
    initConfigurationPanel();

    // Mock students generator
    document.getElementById('btn-add-demo-students').addEventListener('click', addDemoStudents);

    // 시각화 토글 이벤트 등록
    const btnWall = document.getElementById('btn-toggle-visual-wall');
    const btnCloud = document.getElementById('btn-toggle-visual-cloud');
    const visualTitle = document.getElementById('teacher-visual-title');
    const visualDesc = document.getElementById('teacher-visual-desc');
    const wallContainer = document.getElementById('dream-wall-container');
    const cloudCanvas = document.getElementById('word-cloud-canvas');

    if (btnWall && btnCloud) {
        btnWall.addEventListener('click', () => {
            Sound.playSelect();
            activeVisualizationMode = 'wall';
            btnWall.classList.add('active');
            btnWall.style.background = 'var(--primary)';
            btnWall.style.color = 'white';
            btnCloud.classList.remove('active');
            btnCloud.style.background = 'transparent';
            btnCloud.style.color = 'var(--text-muted)';
            
            visualTitle.innerText = "실시간 우리 반 드림 월 (Live Dream Wall)";
            visualDesc.innerText = "반 학생들이 추가한 구체적인 꿈과 목표 자금 카드가 실시간으로 공유됩니다.";
            wallContainer.style.display = 'grid';
            cloudCanvas.style.display = 'none';
            updateVisualizer();
        });

        btnCloud.addEventListener('click', () => {
            Sound.playSelect();
            activeVisualizationMode = 'cloud';
            btnCloud.classList.add('active');
            btnCloud.style.background = 'var(--primary)';
            btnCloud.style.color = 'white';
            btnWall.classList.remove('active');
            btnWall.style.background = 'transparent';
            btnWall.style.color = 'var(--text-muted)';
            
            visualTitle.innerText = "실시간 학생 드림 키워드 (Word Cloud)";
            visualDesc.innerText = "반 학생들이 가장 많이 버킷리스트에 추가한 목표들을 시각화합니다.";
            wallContainer.style.display = 'none';
            cloudCanvas.style.display = 'block';
            updateVisualizer();
        });
    }
}

// ----------------------------------------------------
// 2. REAL-TIME DATA LISTENER
// ----------------------------------------------------
function startListeningToSession() {
    if (unsubscribeSession) unsubscribeSession();

    unsubscribeSession = FirebaseSync.listenToSession(currentSessionId, (students) => {
        currentStudents = students;
        renderStudentRoster();
        updateVisualizer();
    });
}

function updateVisualizer() {
    if (activeVisualizationMode === 'wall') {
        renderDreamWall();
    } else {
        generateWordCloud();
    }
}

function renderDreamWall() {
    const container = document.getElementById('dream-wall-container');
    if (!container) return;

    // Extract all bucket list items from students
    let allDreams = [];
    for (const key in currentStudents) {
        const std = currentStudents[key];
        if (std.bucketList && Array.isArray(std.bucketList)) {
            std.bucketList.forEach(item => {
                allDreams.push({
                    studentName: std.name,
                    category: item.category,
                    text: item.text,
                    cost: item.cost,
                    targetAge: item.targetAge || 25,
                    timestamp: item.id ? parseInt(item.id) : Date.now()
                });
            });
        }
    }

    if (allDreams.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder" style="margin: auto; grid-column: 1 / -1;">
                <div class="icon">✨</div>
                <p style="color: var(--text-muted); text-align: center;">학생들이 버킷리스트를 등록하면<br>여기에 실시간 포스트잇 카드로 공유됩니다.</p>
            </div>
        `;
        return;
    }

    // Sort by timestamp descending (newest first)
    allDreams.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to latest 16 items for clean grid visibility on blackboard
    const displayDreams = allDreams.slice(0, 16);

    container.innerHTML = '';
    
    const catIcons = { travel: '✈️', tech: '💻', housing: '🏠', experience: '🎓', car: '🚗', hobby: '🎨', health: '🏃', contribution: '💝' };

    displayDreams.forEach(dream => {
        const card = document.createElement('div');
        card.className = `dream-wall-card dream-card-${dream.category}`;
        
        const icon = catIcons[dream.category] || '✨';
        const formattedCost = (dream.cost / 10000).toLocaleString('ko-KR') + '만 원';
        
        card.innerHTML = `
            <div class="dream-card-header">
                <span class="dream-card-student">👤 ${dream.studentName}</span>
                <span class="dream-card-age">${dream.targetAge}세 목표</span>
            </div>
            <div class="dream-card-body">
                ${icon} ${dream.text}
            </div>
            <div class="dream-card-footer">
                <span>예상 필요 자금</span>
                <span>${formattedCost}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderStudentRoster() {
    const container = document.getElementById('student-list-container');
    const countDisplay = document.getElementById('student-count');
    
    const studentKeys = Object.keys(currentStudents);
    countDisplay.innerText = studentKeys.length;

    if (studentKeys.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder" style="margin: auto;">
                <div class="icon">👥</div>
                <p>아직 입장한 학생이 없습니다.<br>세션 번호 <strong>${currentSessionId}</strong>를 학생들에게 공유해 주세요!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    // Sort students by name
    const sortedKeys = studentKeys.sort((a, b) => {
        return currentStudents[a].name.localeCompare(currentStudents[b].name);
    });

    sortedKeys.forEach(key => {
        const std = currentStudents[key];
        const card = document.createElement('div');
        card.className = 'teacher-student-card';

        // Stage labels
        const stages = ['드림 보드 작성', '리얼리티 체크', '자산 시뮬레이션'];
        const activeStage = stages[std.stage - 1] || '체험 완료';
        const activeClass = std.stage === 1 ? 'stage-1' : std.stage === 2 ? 'stage-2' : 'stage-3';

        // Calculate goals details
        let detailsText = "목표를 추가하는 중...";
        if (std.bucketList && std.bucketList.length > 0) {
            const sumCost = std.bucketList.reduce((acc, item) => acc + item.cost, 0);
            const sumCostMan = Math.round(sumCost / 10000).toLocaleString('ko-KR');
            detailsText = `버킷 목표 ${std.bucketList.length}개 (${sumCostMan}만 원)`;
        }

        if (std.stage >= 3 && std.investment && std.investment.portfolioEnd > 0) {
            const profit = std.investment.portfolioEnd - std.investment.savingsEnd;
            const profitMan = Math.round(profit / 10000).toLocaleString('ko-KR');
            detailsText += ` | 투자 차익: +${profitMan}만 원 (달성: ${std.investment.achievedCount}/${std.investment.bucketListCount})`;
        }

        card.innerHTML = `
            <div class="student-card-left">
                <div class="student-status-indicator ${activeClass}"></div>
                <div>
                    <div class="student-card-name">${std.name}</div>
                    <div class="student-card-details">${detailsText}</div>
                </div>
            </div>
            <div class="student-card-right">
                <span class="student-stage-badge stage-badge-${std.stage}">${activeStage}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// ----------------------------------------------------
// 3. WORD CLOUD CANVAS RENDERING
// ----------------------------------------------------
function generateWordCloud() {
    const canvas = document.getElementById('word-cloud-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Size adjustment
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 400;
    canvas.width = width;
    canvas.height = height;

    // 1. Process keyword frequencies
    const wordCounts = {};
    
    for (const key in currentStudents) {
        const std = currentStudents[key];
        if (std.bucketList && Array.isArray(std.bucketList)) {
            std.bucketList.forEach(item => {
                // Break text into words
                const words = item.text.split(/\s+/);
                words.forEach(w => {
                    // Extract clean noun-like terms
                    const cleanWord = w.replace(/[^\w\sㄱ-힣]/g, '').trim();
                    if (cleanWord.length >= 2 && !STOP_WORDS.has(cleanWord)) {
                        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                    }
                });
            });
        }
    }

    const wordsArray = Object.keys(wordCounts).map(word => {
        return { text: word, weight: wordCounts[word] };
    });

    // Check if empty
    if (wordsArray.length === 0) {
        ctx.fillStyle = '#64748B';
        ctx.font = '14px Noto Sans KR, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('학생들이 등록한 버킷리스트 키워드가 여기에 실시간으로 표시됩니다.', width / 2, height / 2);
        return;
    }

    // Sort words by weight descending
    wordsArray.sort((a, b) => b.weight - a.weight);

    // Color ranges
    const colors = ['#0066FF', '#0052CC', '#3B82F6', '#1D4ED8', '#10B981', '#059669', '#8B5CF6', '#7C3AED', '#38BDF8'];

    // 2. Compute Layout & Placement (Collision Detection)
    const placedWords = [];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWeight = wordsArray[0].weight;
    
    wordsArray.forEach((item, idx) => {
        // Font sizing ranges from 16px to 54px
        const fontSize = 16 + (item.weight / maxWeight) * 38;
        ctx.font = `bold ${fontSize}px Noto Sans KR, Outfit, sans-serif`;
        
        const metrics = ctx.measureText(item.text);
        const w = metrics.width + 16;
        const h = fontSize + 8;
        
        let placed = false;
        
        // Spiral path search coords
        let angle = 0;
        let radius = 0;
        const maxAttempts = 150;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // spiral coordinates from center
            const x = width / 2 + Math.cos(angle) * radius;
            const y = height / 2 + Math.sin(angle) * radius;
            
            // Check boundary
            if (x - w/2 > 0 && x + w/2 < width && y - h/2 > 0 && y + h/2 < height) {
                // Check overlaps
                let overlap = false;
                for (let i = 0; i < placedWords.length; i++) {
                    const p = placedWords[i];
                    if (x - w/2 < p.x + p.w/2 && x + w/2 > p.x - p.w/2 &&
                        y - h/2 < p.y + p.h/2 && y + h/2 > p.y - p.h/2) {
                        overlap = true;
                        break;
                    }
                }
                
                if (!overlap) {
                    // Draw word
                    ctx.save();
                    ctx.translate(x, y);
                    
                    // Assign random color based on weight/indices
                    ctx.fillStyle = colors[(idx + Math.floor(radius)) % colors.length];
                    ctx.fillText(item.text, 0, 0);
                    ctx.restore();
                    
                    placedWords.push({ x, y, w, h });
                    placed = true;
                    break;
                }
            }
            
            // Advance spiral
            angle += 0.2 + (attempt * 0.01);
            radius += 1.8;
        }
    });
}

// ----------------------------------------------------
// 4. CONFIGURATION PANEL SETTINGS
// ----------------------------------------------------
function initConfigurationPanel() {
    const modal = document.getElementById('config-modal');
    const openBtn = document.getElementById('btn-open-config');
    const saveBtn = document.getElementById('btn-config-save');
    const demoBtn = document.getElementById('btn-config-demo-mode');
    
    // Read current config
    const current = FirebaseSync.getSavedFirebaseConfig();
    if (current) {
        document.getElementById('config-firebase-json').value = JSON.stringify(current, null, 2);
    }
    
    const geminiKey = localStorage.getItem('gemini_api_key') || '';
    document.getElementById('config-gemini-key').value = geminiKey;

    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Close on click outside card
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const jsonVal = document.getElementById('config-firebase-json').value.trim();
        const gemKey = document.getElementById('config-gemini-key').value.trim();
        
        let configObj = null;
        if (jsonVal) {
            try {
                configObj = JSON.parse(jsonVal);
            } catch (e) {
                alert("Firebase JSON 형식이 올바르지 않습니다: " + e.message);
                return;
            }
        }

        FirebaseSync.saveFirebaseConfig(configObj);
        
        if (gemKey) {
            localStorage.setItem('gemini_api_key', gemKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }

        alert("설정이 저장되었습니다. 앱을 다시 로드하여 연결합니다.");
        modal.style.display = 'none';
        location.reload();
    });

    demoBtn.addEventListener('click', () => {
        FirebaseSync.saveFirebaseConfig(null);
        localStorage.removeItem('gemini_api_key');
        alert("Firebase 연결을 해제하고 Offline 데모 모드로 전환합니다.");
        modal.style.display = 'none';
        location.reload();
    });
}

// ----------------------------------------------------
// 5. DEMO STUDENTS INJECTOR (OFFLINE DEMO ENHANCEMENT)
// ----------------------------------------------------
function addDemoStudents() {
    if (!currentSessionId) return;

    const names = ["김영희", "이민수", "박지선", "최우재", "정은우"];
    const presetsStage1 = [
        [{ category: "travel", text: "스위스 한 달 살기", cost: 8000000, ageGroup: "20s", targetAge: 24 }, { category: "tech", text: "아이패드 프로", cost: 1800000, ageGroup: "20s", targetAge: 21 }],
        [{ category: "housing", text: "내 집 마련 계약금", cost: 80000000, ageGroup: "30s", targetAge: 38 }, { category: "car", text: "첫 중고 경차", cost: 8000000, ageGroup: "20s", targetAge: 27 }],
        [{ category: "experience", text: "바디 프로필 촬영", cost: 1000000, ageGroup: "20s", targetAge: 23 }, { category: "travel", text: "유럽 배낭여행 2주", cost: 5000000, ageGroup: "20s", targetAge: 26 }, { category: "hobby", text: "미술 아틀리에 수강", cost: 800000, ageGroup: "30s", targetAge: 32 }],
        [{ category: "car", text: "최신 하이브리드 세단", cost: 40000000, ageGroup: "30s", targetAge: 35 }, { category: "tech", text: "맥북 프로 노트북", cost: 3500000, ageGroup: "20s", targetAge: 22 }],
        [{ category: "experience", text: "스쿠버 다이빙 자격증", cost: 1000000, ageGroup: "20s", targetAge: 25 }, { category: "housing", text: "감성 게이밍 룸", cost: 3000000, ageGroup: "20s", targetAge: 23 }]
    ];

    const defaultCosts = activeExpenseCosts || {
        meal_home: 300000, meal_out: 600000, meal_gourmet: 1200000,
        house_rent: 800000, house_loan: 500000, house_own: 150000,
        trans_public: 100000, trans_car: 500000, trans_super: 1500000,
        hobby_basic: 200000, hobby_medium: 500000, hobby_vip: 1000000
    };

    names.forEach((name, idx) => {
        const studentId = `demo_std_${idx}_${Math.floor(Math.random()*1000)}`;
        
        // Calculate fixed expenses sum
        const selections = ["meal_out", "house_rent", "trans_public", "hobby_basic"];
        let expensesSum = 0;
        selections.forEach(selId => {
            expensesSum += defaultCosts[selId] || 0;
        });

        // Calculate dream savings based on their bucket lists
        let recommendedSaving = 0;
        presetsStage1[idx].forEach(item => {
            let months = 60;
            if (item.ageGroup === '30s') months = 180;
            else if (item.ageGroup === '40s') months = 360;
            recommendedSaving += (item.cost / months);
        });
        const dreamSaving = Math.max(200000, Math.round(recommendedSaving / 50000) * 50000);

        const studentData = {
            name: name,
            stage: 1,
            updatedAt: Date.now(),
            bucketList: presetsStage1[idx],
            realityCheck: { 
                income: 2500000 + idx * 500000, 
                expenses: expensesSum, 
                selections: selections,
                dreamSaving: dreamSaving,
                incomeGrowth: 1.0 + (idx % 3) * 1.5 // 1.0%, 2.5%, 4.0%
            },
            retirement: {
                age: 55 + (idx % 3) * 5, // 55, 60, 65
                monthlySpend: 1500000 + (idx % 4) * 500000 // 150만, 200만, 250만, 300만
            },
            investment: { targetRate: 5 + idx * 1.5, savingsEnd: 0, portfolioEnd: 0, bucketListCount: 0, achievedCount: 0 }
        };

        // Inject to local synchronization
        if (window.FirebaseSync.isOfflineMode()) {
            const localKey = `offline_student_${currentSessionId}_${studentId}`;
            localStorage.setItem(localKey, JSON.stringify(studentData));
            
            // Post fake broadcast join
            if ('BroadcastChannel' in window) {
                const bc = new BroadcastChannel('life_balance_offline_sync');
                bc.postMessage({
                    type: 'student_join',
                    sessionId: currentSessionId,
                    studentId,
                    data: studentData
                });
            }
        } else {
            // Firestore collection write
            firebase.firestore().collection('sessions').doc(currentSessionId)
                .collection('students').doc(studentId).set(studentData);
        }
    });

    Sound.playSuccess();
    alert("데모 학생 5명이 대시보드에 정상 추가되었습니다. 학생들의 진행도와 단어 구름이 실시간 업데이트됩니다!");

    // Set timers to simulate active student progress over time!
    let timeStep = 0;
    const progressTimer = setInterval(() => {
        timeStep++;
        names.forEach((name, idx) => {
            const studentId = `demo_std_${idx}`;
            // Randomly update stages of demo students
            let targetStage = 1;
            if (timeStep === 1) targetStage = 2; // move to stage 2
            else if (timeStep === 2) targetStage = 3; // move to stage 3
            
            const stdDataKey = `offline_student_${currentSessionId}_${studentId}`;
            const stdStr = localStorage.getItem(stdDataKey);
            if (!stdStr) return;
            
            const std = JSON.parse(stdStr);
            std.stage = targetStage;
            
            if (targetStage === 3) {
                // compute fake simulation values using dreamSaving and withdrawals
                const baseSavings = std.realityCheck.dreamSaving;
                const years = 60; // 60년 시뮬레이션
                let savings = 0;
                let portfolio = 0;
                
                const savingsBucket = std.bucketList.map(x => ({ ...x, achieved: false }));
                const portfolioBucket = std.bucketList.map(x => ({ ...x, achieved: false }));

                const retAge = std.retirement?.age || 60;
                const retSpend = std.retirement?.monthlySpend || 2000000;
                const rateGrowth = std.realityCheck.incomeGrowth ? (std.realityCheck.incomeGrowth / 100) : 0.02;
                
                for(let y=0; y<=years; y++) {
                    const age = 20 + y;
                    const activeSavingsMonthly = baseSavings * Math.pow(1 + rateGrowth, y);

                    if (y > 0) {
                        // Savings Track
                        if (age <= retAge) {
                            savings = (savings + activeSavingsMonthly * 12) * 1.02;
                        } else {
                            const netSpend = Math.max(0, retSpend - 800000);
                            savings = savings * 1.02 - netSpend * 12;
                        }
                        
                        // Portfolio Track
                        if (age <= retAge) {
                            portfolio = (portfolio + activeSavingsMonthly * 12) * (1 + (std.investment.targetRate/100));
                        } else {
                            const netSpend = Math.max(0, retSpend - 800000);
                            portfolio = portfolio * (1 + (std.investment.targetRate/100)) - netSpend * 12;
                        }
                    } else {
                        if (age <= retAge) {
                            savings = activeSavingsMonthly * 12;
                            portfolio = activeSavingsMonthly * 12;
                        } else {
                            savings = 0;
                            portfolio = 0;
                        }
                    }
                    
                    if (savings < 0) savings = 0;
                    if (portfolio < 0) portfolio = 0;
                    
                    // Evaluate and withdraw
                    savingsBucket.forEach(item => {
                        const itemAge = item.targetAge || 25;
                        if (itemAge === age && !item.achieved) {
                            if (savings >= item.cost) {
                                savings -= item.cost;
                                item.achieved = true;
                            }
                        }
                    });
                    
                    portfolioBucket.forEach(item => {
                        const itemAge = item.targetAge || 25;
                        if (itemAge === age && !item.achieved) {
                            if (portfolio >= item.cost) {
                                portfolio -= item.cost;
                                item.achieved = true;
                            }
                        }
                    });
                }
                
                std.investment.savingsEnd = Math.round(savings);
                std.investment.portfolioEnd = Math.round(portfolio);
                std.investment.bucketListCount = std.bucketList.length;
                std.investment.achievedCount = portfolioBucket.filter(x => x.achieved).length;
            }

            localStorage.setItem(stdDataKey, JSON.stringify(std));

            if ('BroadcastChannel' in window) {
                const bc = new BroadcastChannel('life_balance_offline_sync');
                bc.postMessage({
                    type: 'student_update',
                    sessionId: currentSessionId,
                    studentId,
                    stage: targetStage,
                    fields: {
                        realityCheck: std.realityCheck,
                        retirement: std.retirement,
                        investment: std.investment
                    }
                });
            }
        });

        if (timeStep >= 2) {
            clearInterval(progressTimer);
        }
    }, 15000); // Progress demo students every 15 seconds
}

// Start teacher configurations
window.addEventListener('DOMContentLoaded', initTeacher);
