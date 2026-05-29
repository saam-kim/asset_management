// Student Application Logic - Life-Balance Simulator
// Manages routing, audio synthesis, particle effects, UI events, AI calculations, and simulator loops.

// ----------------------------------------------------
// 1. STATE MANAGEMENT
// ----------------------------------------------------
const STATE = {
    sessionId: '',
    studentId: '',
    studentName: '',
    currentStage: 1, // 1: Dream Board, 2: Reality Check, 3: Simulation
    bucketList: [],
    realityCheck: {
        income: 3000000,
        expenses: 0,
        selections: ['meal_home', 'house_rent', 'trans_public', 'hobby_basic'],
        dreamSaving: 1000000,
        recommendedSaving: 0
    },
    investment: {
        targetRate: 6.0,
        savingsEnd: 0,
        portfolioEnd: 0,
        isSimulating: false
    },
    activeAgeGroup: '20s',
    activeCategory: 'travel'
};

// Map card IDs to costs
const EXPENSE_COSTS = {
    // Meals
    meal_home: 300000,
    meal_out: 600000,
    meal_gourmet: 1200000,
    // Housing
    house_rent: 800000,
    house_loan: 500000,
    house_own: 150000,
    // Transport
    trans_public: 100000,
    trans_car: 500000,
    trans_super: 1500000,
    // Hobby
    hobby_basic: 200000,
    hobby_medium: 500000,
    hobby_vip: 1000000
};

// Preset Keywords for Dream Board
const PRESET_KEYWORDS = {
    travel: [
        { text: "스위스 한 달 살기", costRange: [700, 900], tip: "유럽 물가가 높지만 한식 요리를 직접 해먹고 저가 항공을 이용하면 예산을 아낄 수 있어요! 🇨🇭" },
        { text: "유럽 배낭여행 2주", costRange: [400, 550], tip: "유레일 패스 할인 혜택과 유스호스텔을 미리 예약하면 경비를 크게 줄일 수 있습니다! 🇪🇺" },
        { text: "제주도 자전거 일주", costRange: [50, 80], tip: "게스트하우스와 맛있는 로컬 국수집 위주로 탐방하면 아주 알차고 저렴한 도전이 돼요! 🚲" },
        { text: "미국 디즈니월드 방문", costRange: [500, 700], tip: "디즈니 공식 리조트보다 근처 에어비앤비를 잡는 게 꿀팁입니다! 🎢" }
    ],
    tech: [
        { text: "아이패드 프로 풀세트", costRange: [150, 250], tip: "애플 교육할인 스토어를 이용해 구매하고, 펜슬은 할인 기간을 노려보세요! 📱" },
        { text: "최신형 게이밍 조립 PC", costRange: [200, 300], tip: "그래픽카드 시세를 꾸준히 모니터링하며 부품을 직접 조립하면 가성비 최고! 🖥️" },
        { text: "맥북 프로 노트북", costRange: [300, 420], tip: "중고 보상 판매(Trade-in)나 신학기 이벤트를 적극 활용해 보세요. 💻" },
        { text: "입문용 명품 백 구매", costRange: [200, 400], tip: "클래식하고 유행을 타지 않는 디자인을 고르는 것이 장기적으로 가장 좋습니다! 👜" }
    ],
    housing: [
        { text: "내 집 마련 계약금", costRange: [6000, 10000], tip: "청년 주택청약 통장은 하루라도 빨리 가입해서 납입 횟수를 채우는 것이 기본! 🏠" },
        { text: "오피스텔 전세 보증금", costRange: [3000, 6000], tip: "버팀목 청년전세자금대출 등 정부 지원 저금리 상품 정보를 잘 살펴보세요. 🏦" },
        { text: "감성 게이밍 룸 인테리어", costRange: [200, 400], tip: "오늘의집이나 이케아의 DIY 가구들을 적극 활용하여 가성비 있게 꾸며봐요. 🛏️" },
        { text: "자취방 자가 격리 가구 세트", costRange: [100, 200], tip: "가장 필요한 침대와 매트리스에 가장 많이 투자하고 나머지는 가성비로! 🛋️" }
    ],
    experience: [
        { text: "바디 프로필 촬영 도전", costRange: [80, 150], tip: "헬스장 PT 비용과 스튜디오 촬영 예약비를 합산한 금액이에요. 꾸준함이 무기! 💪" },
        { text: "영어 회화 학원 1년 코스", costRange: [150, 240], tip: "직장인 환급 제도나 청년 배움카드를 통해 국비 지원을 받을 수 있는지 확인하세요. 🗣️" },
        { text: "바리스타 전문 자격증", costRange: [50, 90], tip: "실기 재료비가 포함된 학원 수강 비용이에요. 카페 알바 프리패스권! ☕" },
        { text: "스쿠버 다이빙 오픈워터", costRange: [80, 120], tip: "이론 교육, 수영장 실습, 그리고 제주도 바다 실습까지 포함된 평균 금액입니다. 🤿" }
    ],
    car: [
        { text: "첫 중고 경차 구매", costRange: [600, 1000], tip: "취등록세 감면 혜택과 저렴한 자동차세 덕분에 첫 차로 가장 실속 있어요! 🚗" },
        { text: "최신 하이브리드 세단", costRange: [3500, 4500], tip: "연비가 좋지만 초기 차값이 높으니 연간 주행거리가 1.5만km 이상일 때 유리해요. 🚘" },
        { text: "카본 로드 바이크 자전거", costRange: [150, 300], tip: "안전 헬멧과 전용 의류, 클릿슈즈 비용까지 꼭 예산에 포함해야 합니다. 🚴" },
        { text: "일본 록 페스티벌 투어", costRange: [120, 200], tip: "항공권과 3일 패스권, 에어비앤비 숙소 예약을 6개월 전 미리 끝내두세요! 🎸" }
    ],
    hobby: [
        { text: "헬스장 PT 30회 이용권", costRange: [150, 210], tip: "보통 회당 5~7만 원 수준입니다. 배운 루틴을 평생 써먹는 가치가 있어요. 🏋️" },
        { text: "취미 미술 아틀리에 6개월", costRange: [60, 100], tip: "기본 캔버스와 유화 물감 재료비가 모두 포함된 공방 수강료입니다. 🎨" },
        { text: "코딩 부트캠프 웹 개발", costRange: [100, 300], tip: "K-Digital Training 국비 지원을 받으면 무료로 수강할 수 있는 기회도 많아요! 💻" },
        { text: "유튜브 크리에이터 촬영 장비", costRange: [100, 200], tip: "스마트폰용 마이크와 조명, 미러리스 카메라 삼각대부터 가볍게 시작해요! 📹" }
    ]
};

// ----------------------------------------------------
// 2. PROGRAMMATIC AUDIO SYNTHESIZER
// ----------------------------------------------------
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

const Sound = {
    playTick: () => {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    },
    playSelect: () => {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    },
    playSuccess: () => {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
            gain.gain.linearRampToValueAtTime(0, now + idx * 0.08 + 0.25);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
        });
    },
    playWarning: () => {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    },
    playCheer: () => {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            
            gain.gain.setValueAtTime(0.0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
            gain.gain.linearRampToValueAtTime(0, now + idx * 0.06 + 0.4);
            
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.5);
        });
    }
};

// ----------------------------------------------------
// 3. CONFETTI PARTICLE SYSTEM
// ----------------------------------------------------
const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    active: false,
    
    init: () => {
        Confetti.canvas = document.getElementById('confetti-canvas');
        Confetti.ctx = Confetti.canvas.getContext('2d');
        Confetti.resize();
        window.addEventListener('resize', Confetti.resize);
    },
    
    resize: () => {
        if (Confetti.canvas) {
            Confetti.canvas.width = window.innerWidth;
            Confetti.canvas.height = window.innerHeight;
        }
    },
    
    trigger: (count = 120) => {
        Confetti.init();
        Confetti.particles = [];
        const colors = ['#0066FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
        
        for (let i = 0; i < count; i++) {
            Confetti.particles.push({
                x: Math.random() * Confetti.canvas.width,
                y: Confetti.canvas.height + Math.random() * 50,
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 20 - 10,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1
            });
        }
        
        if (!Confetti.active) {
            Confetti.active = true;
            Confetti.loop();
        }
    },
    
    loop: () => {
        if (!Confetti.active) return;
        Confetti.ctx.clearRect(0, 0, Confetti.canvas.width, Confetti.canvas.height);
        let living = false;
        
        Confetti.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.4; // gravity
            p.vx *= 0.98; // drag
            p.rotation += p.rotationSpeed;
            
            if (p.y > Confetti.canvas.height && p.vy > 0) {
                p.opacity = 0;
            } else if (p.y < Confetti.canvas.height) {
                living = true;
            }
            
            if (p.opacity > 0) {
                Confetti.ctx.save();
                Confetti.ctx.translate(p.x, p.y);
                Confetti.ctx.rotate(p.rotation);
                Confetti.ctx.fillStyle = p.color;
                Confetti.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                Confetti.ctx.restore();
            }
        });
        
        if (living) {
            Confetti.animationId = requestAnimationFrame(Confetti.loop);
        } else {
            Confetti.active = false;
            Confetti.ctx.clearRect(0, 0, Confetti.canvas.width, Confetti.canvas.height);
        }
    }
};

// Helper function to format currency into Korean units
function formatKoreanCurrency(amount) {
    if (amount === 0) return '0원';
    
    const hundredMillion = Math.floor(amount / 100000000);
    const tenThousand = Math.floor((amount % 100000000) / 10000);
    
    let parts = [];
    if (hundredMillion > 0) {
        parts.push(`${hundredMillion}억`);
    }
    if (tenThousand > 0) {
        // format numbers with comma
        const tenThousandStr = tenThousand.toLocaleString('ko-KR');
        parts.push(`${tenThousandStr}만`);
    }
    
    return parts.join(' ') + ' 원';
}

// ----------------------------------------------------
// 4. VIEW ROUTING / TRANSITIONS
// ----------------------------------------------------
function showView(viewId) {
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(p => {
        p.classList.remove('active');
    });
    
    const activePanel = document.getElementById(viewId);
    if (activePanel) {
        activePanel.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Toggle header steps visible
    const stepsBar = document.getElementById('progress-steps');
    if (viewId.startsWith('student-stage')) {
        stepsBar.style.display = 'flex';
        // Highlight correct indicators
        const stageNum = parseInt(viewId.replace('student-stage', '').replace('-view', ''));
        STATE.currentStage = stageNum;
        
        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById(`step-${i}-indicator`);
            if (i < stageNum) {
                ind.className = 'step-item completed';
            } else if (i === stageNum) {
                ind.className = 'step-item active';
            } else {
                ind.className = 'step-item';
            }
        }
    } else {
        stepsBar.style.display = 'none';
    }
}

// ----------------------------------------------------
// 5. STAGE 1: DREAM BOARD CONTROLS
// ----------------------------------------------------
function initStage1() {
    renderPresets();
    
    // Tab switching (Age Group)
    const tabs = document.querySelectorAll('.age-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            Sound.playSelect();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            STATE.activeAgeGroup = tab.dataset.age;
        });
    });

    // Category button clicks
    const catBtns = document.querySelectorAll('.category-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            Sound.playSelect();
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.activeCategory = btn.dataset.category;
            renderPresets();
        });
    });

    // AI estimate button
    document.getElementById('btn-estimate-cost').addEventListener('click', runAIEstimation);
    
    // Stage transition button
    document.getElementById('btn-go-stage2').addEventListener('click', () => {
        Sound.playSelect();
        showView('student-stage2-view');
        initStage2();
    });
}

function renderPresets() {
    const suggestions = document.getElementById('keyword-suggestions');
    suggestions.innerHTML = '';
    const items = PRESET_KEYWORDS[STATE.activeCategory] || [];
    
    items.forEach(item => {
        const span = document.createElement('span');
        span.className = 'badge';
        span.style.cursor = 'pointer';
        span.style.background = '#FFFFFF';
        span.style.border = '1px solid var(--border)';
        span.style.fontWeight = '500';
        span.innerHTML = item.text;
        
        span.addEventListener('click', () => {
            Sound.playSelect();
            document.getElementById('input-bucket-text').value = item.text;
        });
        
        suggestions.appendChild(span);
    });
}

// Cost breakdown helper based on category
function getCostBreakdown(category, avg) {
    let items = [];
    if (category === 'travel') {
        const item1 = Math.round((avg * 0.45) / 10000) * 10000;
        const item2 = Math.round((avg * 0.35) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "✈️ 왕복 항공권 및 교통비", cost: item1 },
            { name: "🏨 숙박비 (호텔/에어비앤비)", cost: item2 },
            { name: "🍽️ 식비 및 체험 액티비티 비용", cost: item3 }
        ];
    } else if (category === 'tech') {
        const item1 = Math.round((avg * 0.80) / 10000) * 10000;
        const item2 = Math.round((avg * 0.15) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "💻 디지털 기기 본체 순수 가액", cost: item1 },
            { name: "🔌 정품 액세서리 및 추가 부품", cost: item2 },
            { name: "🛡️ 보험 등록 및 품질 보증(Care)", cost: item3 }
        ];
    } else if (category === 'housing') {
        const item1 = Math.round((avg * 0.85) / 10000) * 10000;
        const item2 = Math.round((avg * 0.10) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "🏠 임차 보증금 및 기본 계약금", cost: item1 },
            { name: "🛋️ 필수 가구 구입 및 홈데코", cost: item2 },
            { name: "📦 부동산 중개수수료 및 이사비", cost: item3 }
        ];
    } else if (category === 'experience') {
        const item1 = Math.round((avg * 0.70) / 10000) * 10000;
        const item2 = Math.round((avg * 0.20) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "🎓 교육 수강료 및 전문 교육비", cost: item1 },
            { name: "📘 교육용 교재 및 기자재 구입비", cost: item2 },
            { name: "🏅 자격 검정 응시 및 면허 발급비", cost: item3 }
        ];
    } else if (category === 'car') {
        const item1 = Math.round((avg * 0.85) / 10000) * 10000;
        const item2 = Math.round((avg * 0.08) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "🚗 차량 본체 순수 구입 자금", cost: item1 },
            { name: "🧾 법정 취등록세 및 번호판 세금", cost: item2 },
            { name: "🛡️ 초기 종합 자동차 보험 등록비", cost: item3 }
        ];
    } else {
        const item1 = Math.round((avg * 0.65) / 10000) * 10000;
        const item2 = Math.round((avg * 0.25) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "🎨 정기 수강료 및 멤버십 이용권", cost: item1 },
            { name: "👟 전문 활동 장비 및 운동 의류", cost: item2 },
            { name: "☕ 소모임 네트워킹 및 부대 비용", cost: item3 }
        ];
    }
    return items;
}

// AI Cost Estimator Modal and Processing
async function runAIEstimation() {
    const input = document.getElementById('input-bucket-text');
    const keyword = input.value.trim();
    if (!keyword) {
        alert("이루고 싶은 꿈을 입력하거나 추천 키워드를 클릭해 주세요!");
        return;
    }

    // Show modal and reset loading state
    const modal = document.getElementById('ai-modal');
    const loadingView = document.getElementById('ai-loading-view');
    const resultView = document.getElementById('ai-result-view');
    
    modal.style.display = 'flex';
    loadingView.style.display = 'flex';
    resultView.style.display = 'none';

    // AI cost estimator result variables
    let finalTitle = keyword;
    let finalMin = 0;
    let finalMax = 0;
    let finalTip = "";
    let finalBreakdown = null;
    
    // Check if configuration exists
    const config = FirebaseSync.getSavedFirebaseConfig();
    const geminiKey = document.getElementById('config-gemini-key')?.value || localStorage.getItem('gemini_api_key');
    
    if (geminiKey) {
        try {
            const prompt = `너는 청소년 재무 설계 교육용 AI 비용 분석가야. 학생이 입력한 버킷리스트 키워드를 분석해서 한국 원화 기준으로 예상 필요 자금 범위(예: 700~900만 원)와, 그 비용이 발생하는 세부 내역 3가지(예: 항공료, 숙박비, 식비 등 각각의 금액), 그리고 절약/재무 조언 팁 한 줄을 JSON 형식으로 응답해줘.
너는 오직 JSON 형태만 응답해야해. 다른 말이나 마크다운 (\`\`\`json 같은 코드 블럭)을 쓰지마. 순수 JSON 문자열만 보내줘. 
형식:
{
  "title": "${keyword}",
  "minCost": 최소금액(숫자, 원단위),
  "maxCost": 최대금액(숫자, 원단위),
  "breakdown": [
     {"name": "세부항목1 이름", "cost": 금액(숫자, 원단위)},
     {"name": "세부항목2 이름", "cost": 금액(숫자, 원단위)},
     {"name": "세부항목3 이름", "cost": 금액(숫자, 원단위)}
  ],
  "tip": "친절하고 유쾌하게 조언하는 한 줄 조언(존댓말)"
}
키워드: ${keyword}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) throw new Error("Gemini API Error");
            const resultJson = await response.json();
            const textResponse = resultJson.candidates[0].content.parts[0].text.trim();
            // clean markdown indicators if the model output them despite prompt instructions
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            finalTitle = parsed.title || keyword;
            finalMin = Math.round(parsed.minCost / 10000) * 10000; // round to 10k
            finalMax = Math.round(parsed.maxCost / 10000) * 10000;
            finalTip = parsed.tip;
            if (parsed.breakdown && Array.isArray(parsed.breakdown)) {
                finalBreakdown = parsed.breakdown.map(x => ({
                    name: x.name,
                    cost: Math.round(x.cost / 10000) * 10000
                }));
            }
        } catch (e) {
            console.error("Gemini API call failed, falling back to smart client-side analyzer", e);
            runFallbackAnalyzer(keyword);
        }
    } else {
        // Simulate loading delay for funny immersion
        await new Promise(resolve => setTimeout(resolve, 1500));
        runFallbackAnalyzer(keyword);
    }

    function runFallbackAnalyzer(kw) {
        // Search presets first for perfect/partial matching
        let matched = null;
        for (const cat in PRESET_KEYWORDS) {
            const found = PRESET_KEYWORDS[cat].find(item => kw === item.text || (kw.length > 4 && item.text.length > 4 && (kw.includes(item.text) || item.text.includes(kw))));
            if (found) {
                matched = found;
                break;
            }
        }

        if (matched) {
            finalMin = matched.costRange[0] * 10000;
            finalMax = matched.costRange[1] * 10000;
            finalTip = matched.tip;
            return;
        }

        // Advanced Heuristic Cost Engine
        const cleanKw = kw.replace(/\s+/g, '').toLowerCase();

        // 1. Travel heuristics
        if (STATE.activeCategory === 'travel' || cleanKw.includes('여행') || cleanKw.includes('살기') || cleanKw.includes('휴가') || cleanKw.includes('투어') || cleanKw.includes('캠핑') || cleanKw.includes('다이빙')) {
            const isOverseas = cleanKw.includes('유럽') || cleanKw.includes('미국') || cleanKw.includes('세계') || cleanKw.includes('남미') || cleanKw.includes('스위스') || cleanKw.includes('영국') || cleanKw.includes('프랑스') || cleanKw.includes('이탈리아') || cleanKw.includes('파리') || cleanKw.includes('디즈니') || cleanKw.includes('해외') || cleanKw.includes('호주') || cleanKw.includes('뉴질랜드') || cleanKw.includes('캐나다');
            const isNearOverseas = cleanKw.includes('일본') || cleanKw.includes('동남아') || cleanKw.includes('태국') || cleanKw.includes('베트남') || cleanKw.includes('대만') || cleanKw.includes('중국') || cleanKw.includes('홍콩') || cleanKw.includes('도쿄') || cleanKw.includes('오사카') || cleanKw.includes('세부') || cleanKw.includes('보라카이') || cleanKw.includes('방콕');
            const isDomestic = cleanKw.includes('제주') || cleanKw.includes('국내') || cleanKw.includes('부산') || cleanKw.includes('강릉') || cleanKw.includes('여수') || cleanKw.includes('속초') || cleanKw.includes('경주') || cleanKw.includes('울릉도');

            let durationWeeks = 1;
            if (cleanKw.includes('2주') || cleanKw.includes('이주') || cleanKw.includes('14일') || cleanKw.includes('보름')) {
                durationWeeks = 2;
            } else if (cleanKw.includes('한달') || cleanKw.includes('1달') || cleanKw.includes('30일') || cleanKw.includes('4주')) {
                durationWeeks = 4;
            } else if (cleanKw.includes('3주') || cleanKw.includes('삼주') || cleanKw.includes('21일')) {
                durationWeeks = 3;
            }

            if (isOverseas || (!isNearOverseas && !isDomestic)) {
                // Far overseas (e.g. Europe, USA, default overseas)
                if (durationWeeks === 2) {
                    finalMin = 4000000;
                    finalMax = 5500000;
                    finalTip = "유럽/미국 2주 배낭여행은 항공권(150~200만 원)과 하루 15~20만 원 내외의 숙식/교통/활동비가 고르게 포함된 예산입니다. ✈️";
                } else if (durationWeeks >= 4) {
                    finalMin = 7000000;
                    finalMax = 9000000;
                    finalTip = "해외 한 달 살기는 현지 마트 식재료 장보기와 대중교통 이용을 적극 활용하여 식비와 고정 교통비를 아끼는 것이 비결입니다! 🏠";
                } else {
                    finalMin = 2500000;
                    finalMax = 3500000;
                    finalTip = "왕복 장거리 항공편 특가 시즌이나 프로모션을 조기 예매하고 한인 민박을 믹스해 보세요. 💡";
                }
            } else if (isNearOverseas) {
                // Near overseas (Japan, Southeast Asia)
                if (durationWeeks === 2) {
                    finalMin = 1800000;
                    finalMax = 2800000;
                    finalTip = "가까운 일본/동남아 2주 여행은 물가 대비 넉넉하게 먹고 즐길 수 있는 알뜰한 예산 설계입니다. 🍜";
                } else if (durationWeeks >= 4) {
                    finalMin = 3000000;
                    finalMax = 4500000;
                    finalTip = "물가가 다소 낮은 지역일 경우 한 달 동안 고정 숙소 렌트비를 절감하면 여유 자금이 대폭 증가합니다. 💆";
                } else {
                    finalMin = 1000000;
                    finalMax = 1500000;
                    finalTip = "저가 항공(LCC) 얼리버드 프로모션을 노리면 교통비 고정 경비를 절반까지 낮출 수 있어요! ✈️";
                }
            } else {
                // Domestic / Jeju
                if (durationWeeks >= 2) {
                    finalMin = 1000000;
                    finalMax = 1600000;
                    finalTip = "국내 2주 여행은 자전거 일주나 게스트하우스 숙박, 지역 맛집 탐방에 적합한 합리적인 예산입니다! 🚲";
                } else {
                    finalMin = 400000;
                    finalMax = 800000;
                    finalTip = "제주도나 국내 여행은 시즌 비수기 평일 출발을 노리면 숙박과 항공권을 가장 많이 절약할 수 있습니다! 🏝️";
                }
            }
            return;
        }

        // 2. Tech / Devices
        if (STATE.activeCategory === 'tech' || cleanKw.includes('컴퓨터') || cleanKw.includes('노트북') || cleanKw.includes('pc') || cleanKw.includes('맥북') || cleanKw.includes('패드') || cleanKw.includes('아이폰') || cleanKw.includes('갤럭시') || cleanKw.includes('폰') || cleanKw.includes('태블릿')) {
            if (cleanKw.includes('맥북') || cleanKw.includes('노트북') || cleanKw.includes('컴퓨터') || cleanKw.includes('pc')) {
                finalMin = 1800000;
                finalMax = 3200000;
                finalTip = "학생 할인(교육할인) 제도 및 리퍼비시 상품 혹은 시기별 그래픽카드 조립 PC 맞춤을 검토해 보세요. 💻";
            } else if (cleanKw.includes('패드') || cleanKw.includes('태블릿') || cleanKw.includes('아이패드')) {
                finalMin = 1000000;
                finalMax = 1800000;
                finalTip = "애플 펜슬 및 키보드 액세서리를 포함한 평균 예산입니다. 세일 기간 번들 할인을 활용해보세요. 📱";
            } else if (cleanKw.includes('폰') || cleanKw.includes('아이폰') || cleanKw.includes('갤럭시') || cleanKw.includes('휴대폰')) {
                finalMin = 1200000;
                finalMax = 1800000;
                finalTip = "최신 스마트폰 자급제 단말기 가격입니다. 저렴한 알뜰폰 요금제(LTE/5G)를 조합하는 것이 좋습니다! 📞";
            } else {
                finalMin = 800000;
                finalMax = 1500000;
                finalTip = "기기 파손에 대비하여 전용 스마트 보험(Care+) 서비스를 결합하는 예비 자금도 고려해 두는 것을 권장합니다. 🛡️";
            }
            return;
        }

        // 3. Cars
        if (STATE.activeCategory === 'car' || cleanKw.includes('차') || cleanKw.includes('자동차') || cleanKw.includes('오토바이') || cleanKw.includes('바이크') || cleanKw.includes('경차') || cleanKw.includes('중고차')) {
            if (cleanKw.includes('중고')) {
                finalMin = 6000000;
                finalMax = 12000000;
                finalTip = "초기 취등록세와 주행 거리 대비 중고 차량 정비 소모품 교체 예산(100만 원)을 반드시 추가 확보해 두어야 합니다! 🚗";
            } else if (cleanKw.includes('외제') || cleanKw.includes('수입') || cleanKw.includes('포르쉐') || cleanKw.includes('벤츠') || cleanKw.includes('bmw') || cleanKw.includes('테슬라')) {
                finalMin = 60000000;
                finalMax = 95000000;
                finalTip = "고성능 수입/전기 차량 구입 예산입니다. 연간 소모품 비용과 고액의 수입차 보험료를 충분히 감당할 수 있는지 재무 체크가 필요합니다. ⚠️";
            } else {
                finalMin = 25000000;
                finalMax = 42000000;
                finalTip = "신형 준중형~중형 차량 구입 예산입니다. 매매 금액 외에 법정 취등록세 7%와 초기 보험료가 부대비용으로 발생합니다. 🚘";
            }
            return;
        }

        // 4. Housing
        if (STATE.activeCategory === 'housing' || cleanKw.includes('집') || cleanKw.includes('아파트') || cleanKw.includes('방') || cleanKw.includes('원룸') || cleanKw.includes('전세') || cleanKw.includes('보증금')) {
            if (cleanKw.includes('자가') || cleanKw.includes('내집') || cleanKw.includes('아파트')) {
                finalMin = 70000000;
                finalMax = 120000000;
                finalTip = "미래 내 집 마련을 위한 최소 종잣돈(계약금 10% 및 디딤돌 대출 LTV 자부담 확보용) 목표치입니다. 주택청약 통장은 기본! 🏠";
            } else if (cleanKw.includes('전세')) {
                finalMin = 30000000;
                finalMax = 60000000;
                finalTip = "오피스텔/자취 전세대출(80~90% 대출 지원 적용 시) 이용 시 필요한 실자본 자부담 보증금 분입니다. 🏦";
            } else {
                finalMin = 5000000;
                finalMax = 12000000;
                finalTip = "원룸 월세 보증금 및 기초 인테리어/가구, 부동산 중개비 예산입니다. 저렴한 전월세 보증금 지원대출도 잘 살펴보세요! 🛋️";
            }
            return;
        }

        // 5. Luxury / High scale goals
        if (cleanKw.includes('람보르기니') || cleanKw.includes('페라리') || cleanKw.includes('슈퍼카') || cleanKw.includes('빌딩') || cleanKw.includes('건물') || cleanKw.includes('우주') || cleanKw.includes('강남아파트') || cleanKw.includes('100억') || cleanKw.includes('10억')) {
            finalMin = 350000000;
            finalMax = 500000000;
            finalTip = "엄청난 자금이 필요한 슈퍼 드림 목표군요! 일반 은행 저축(연 2%)만으로는 한계가 크며, 자산 투자 및 적극적 포트폴리오 관리가 절대적으로 요구됩니다! 🚀";
            return;
        }

        // 6. Generic hashing fallback within realistic boundaries (50만 원 to 600만 원)
        let hash = 0;
        for (let i = 0; i < kw.length; i++) {
            hash = kw.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        
        const scale = (hash % 100) / 100;
        const baseCost = 500000 + Math.round(scale * 5500000 / 100000) * 100000; 
        finalMin = baseCost;
        finalMax = baseCost + Math.round((200000 + (hash % 5) * 200000) / 50000) * 50000;
        
        const defaultTips = [
            "목표 달성을 위해 적립식 예적금 자동이체를 적극 활용하여 충동소비를 사전 예방하는 시스템을 만드세요! 💰",
            "가성비 브랜드 제품이나 렌탈, 중고 가구 등의 영리한 소비 옵션을 적용해 보기를 권장합니다! 🛒",
            "이 꿈을 가슴에 품고, 소액의 생활 간식이나 불필요한 고비용 지출을 하나씩 줄여가는 연습부터 시작해 봐요! ⭐",
            "목돈 예산인 만큼 단기 세제 혜택 통장이나 적립식 우대 금리를 꼼꼼히 탐색하고 활용해 보세요! 📈"
        ];
        finalTip = defaultTips[hash % defaultTips.length];
    }

    // Render results
    document.getElementById('ai-result-title').innerText = finalTitle;
    document.getElementById('ai-result-age').innerText = `${STATE.activeAgeGroup === '20s' ? '20대 청년기' : STATE.activeAgeGroup === '30s' ? '30대 정착기' : '40대+ 성숙기'} 드림 목표`;
    
    // Set modifiable input fields (in 만 원 units)
    document.getElementById('ai-result-cost-min').value = Math.round(finalMin / 10000);
    document.getElementById('ai-result-cost-max').value = Math.round(finalMax / 10000);
    document.getElementById('ai-result-tip-text').innerText = finalTip;

    // Render breakdown details
    const breakdownContainer = document.getElementById('ai-result-breakdown');
    breakdownContainer.innerHTML = '<div class="breakdown-title">📋 예상 자금 세부 내역</div>';
    
    if (!finalBreakdown || finalBreakdown.length === 0) {
        const avg = Math.round((finalMin + finalMax) / 2);
        finalBreakdown = getCostBreakdown(STATE.activeCategory, avg);
    }
    
    finalBreakdown.forEach(item => {
        const row = document.createElement('div');
        row.className = 'breakdown-item';
        row.innerHTML = `
            <span class="breakdown-item-name">${item.name}</span>
            <span class="breakdown-item-cost">${(item.cost / 10000).toLocaleString('ko-KR')}만 원</span>
        `;
        breakdownContainer.appendChild(row);
    });

    loadingView.style.display = 'none';
    resultView.style.display = 'flex';

    // Button event binds inside AI modal
    const confirmBtn = document.getElementById('ai-result-confirm');
    const cancelBtn = document.getElementById('ai-result-cancel');

    // Remove old event listeners
    const cleanConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(cleanConfirm, confirmBtn);
    const cleanCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(cleanCancel, cancelBtn);

    document.getElementById('ai-result-cancel').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('ai-result-confirm').addEventListener('click', () => {
        // Read custom modified inputs (and convert back to KRW)
        const customMin = (parseFloat(document.getElementById('ai-result-cost-min').value) || 0) * 10000;
        const customMax = (parseFloat(document.getElementById('ai-result-cost-max').value) || 0) * 10000;
        
        if (customMin < 0 || customMax < 0 || customMin > customMax) {
            alert("올바른 자금 범위를 입력해 주세요. (최소 금액은 최대 금액보다 클 수 없습니다.)");
            return;
        }

        // Add item to state
        const newItem = {
            id: Date.now().toString(),
            category: STATE.activeCategory,
            text: finalTitle,
            cost: Math.round((customMin + customMax) / 2), // store average of customized costs
            ageGroup: STATE.activeAgeGroup
        };
        
        STATE.bucketList.push(newItem);
        modal.style.display = 'none';
        input.value = '';
        
        // Effects & Render
        Sound.playSuccess();
        Confetti.trigger(40);
        renderStudentBucketList();
        
        // Sync to firebase
        syncStudentDataToBackend();
    });
}

function renderStudentBucketList() {
    const container = document.getElementById('student-bucket-panel');
    const countDisplay = document.getElementById('dream-list-count');
    
    if (STATE.bucketList.length === 0) {
        container.className = 'bucket-list-panel empty';
        container.innerHTML = `
            <div class="empty-placeholder">
                <div class="icon">✨</div>
                <p>버킷리스트를 추가해 주세요!<br>AI가 전 세계 데이터로 예상 필요 자금을 알려줍니다.</p>
            </div>
        `;
        countDisplay.innerText = '총 0개';
        document.getElementById('btn-go-stage2').disabled = true;
        return;
    }
    
    container.className = 'bucket-list-panel';
    container.innerHTML = '';
    countDisplay.innerText = `총 ${STATE.bucketList.length}개`;
    
    // Sort bucket lists by ageGroup
    const ageNames = { '20s': '20대', '30s': '30대', '40s': '40대+' };
    
    STATE.bucketList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bucket-item';
        
        const catIcons = { travel: '✈️', tech: '💻', housing: '🏠', experience: '🎓', car: '🚗', hobby: '🎨' };
        const icon = catIcons[item.category] || '✨';
        const formattedCost = (item.cost / 10000).toLocaleString('ko-KR') + '만 원';
        
        div.innerHTML = `
            <div class="bucket-info">
                <span class="bucket-category-badge">${icon}</span>
                <div>
                    <span class="bucket-name">${item.text}</span>
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">(${ageNames[item.ageGroup]})</span>
                    <div class="bucket-cost">평균 예상 자금: ${formattedCost}</div>
                </div>
            </div>
            <button class="delete-bucket" data-id="${item.id}">✕</button>
        `;
        
        div.querySelector('.delete-bucket').addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            STATE.bucketList = STATE.bucketList.filter(x => x.id !== id);
            Sound.playTick();
            renderStudentBucketList();
            syncStudentDataToBackend();
        });
        
        container.appendChild(div);
    });

    // Enable next stage if >= 2 items
    document.getElementById('btn-go-stage2').disabled = STATE.bucketList.length < 2;
}

// Dynamically update Reality Check card costs and text labels from EXPENSE_COSTS
function updateDOMCardCosts() {
    const cards = document.querySelectorAll('.expense-card');
    cards.forEach(card => {
        const cardId = card.dataset.id;
        if (EXPENSE_COSTS[cardId] !== undefined) {
            const costVal = EXPENSE_COSTS[cardId];
            card.dataset.cost = costVal;
            
            const costTextSpan = card.querySelector(`[data-cost-id="${cardId}"]`);
            if (costTextSpan) {
                costTextSpan.innerText = `${Math.round(costVal / 10000)}만 원`;
            }
        }
    });
}

// ----------------------------------------------------
// 6. STAGE 2: REALITY CHECK CONTROLS
// ----------------------------------------------------
let tankCanvas = null;
let tankCtx = null;
let tankAnimationId = null;
let waterHeight = 0.5; // current visual water height (0 to 1)
let targetWaterHeight = 0.5;
let waveOffset = 0;

function initStage2() {
    updateDOMCardCosts();
    
    tankCanvas = document.getElementById('water-tank-canvas');
    tankCtx = tankCanvas.getContext('2d');
    
    // Resize canvas
    tankCanvas.width = tankCanvas.clientWidth;
    tankCanvas.height = tankCanvas.clientHeight;

    // Remove old slider event listener
    const range = document.getElementById('salary-range');
    range.value = STATE.realityCheck.income;
    document.getElementById('salary-display-val').innerText = `${(STATE.realityCheck.income / 10000).toLocaleString('ko-KR')}만 원`;
    
    // Bind slider input with synthesized sound ticks
    let lastTickVal = STATE.realityCheck.income;
    range.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        STATE.realityCheck.income = val;
        document.getElementById('salary-display-val').innerText = `${(val / 10000).toLocaleString('ko-KR')}만 원`;
        
        if (Math.abs(val - lastTickVal) >= 200000) {
            Sound.playTick();
            lastTickVal = val;
        }
        
        recalculateCashFlow();
    });

    // 1. Calculate recommended monthly savings for dreams
    let monthlyBucketSaving = 0;
    STATE.bucketList.forEach(item => {
        let months = 60; // 20s
        if (item.ageGroup === '30s') months = 180;
        else if (item.ageGroup === '40s') months = 360;
        
        monthlyBucketSaving += (item.cost / months);
    });
    STATE.realityCheck.recommendedSaving = Math.round(monthlyBucketSaving);

    // 2. Set default dreamSaving to recommended savings (rounded to 50k KRW)
    const defaultSaving = Math.max(0, Math.round(STATE.realityCheck.recommendedSaving / 50000) * 50000);
    STATE.realityCheck.dreamSaving = defaultSaving;

    const dreamRange = document.getElementById('dream-saving-range');
    dreamRange.value = STATE.realityCheck.dreamSaving;
    document.getElementById('dream-saving-display-val').innerText = `${(STATE.realityCheck.dreamSaving / 10000).toLocaleString('ko-KR')}만 원`;

    const recommendText = document.getElementById('dream-saving-recommend-text');
    const recMan = Math.round(STATE.realityCheck.recommendedSaving / 10000);
    recommendText.innerText = `* 버킷리스트 달성을 위한 권장 최소 저축액: ${recMan.toLocaleString('ko-KR')}만 원 / 월`;

    // 3. Bind dream saving slider input
    let lastDreamTickVal = STATE.realityCheck.dreamSaving;
    dreamRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        STATE.realityCheck.dreamSaving = val;
        document.getElementById('dream-saving-display-val').innerText = `${(val / 10000).toLocaleString('ko-KR')}만 원`;
        
        if (Math.abs(val - lastDreamTickVal) >= 100000) {
            Sound.playTick();
            lastDreamTickVal = val;
        }
        
        recalculateCashFlow();
    });

    // Select expenses cards (Toggles & Multi-select across groups)
    const cards = document.querySelectorAll('.expense-card');
    cards.forEach(card => {
        // Remove clone to prevent duplicate events
        const cleanCard = card.cloneNode(true);
        card.parentNode.replaceChild(cleanCard, card);
        
        const cardId = cleanCard.dataset.id;
        
        // Sync initial state classes
        if (STATE.realityCheck.selections.includes(cardId)) {
            cleanCard.classList.add('active');
        } else {
            cleanCard.classList.remove('active');
        }

        cleanCard.addEventListener('click', () => {
            Sound.playSelect();
            
            const idx = STATE.realityCheck.selections.indexOf(cardId);
            if (idx > -1) {
                // Already active: deactivate (toggle off)
                STATE.realityCheck.selections.splice(idx, 1);
                cleanCard.classList.remove('active');
            } else {
                // Inactive: activate (toggle on)
                STATE.realityCheck.selections.push(cardId);
                cleanCard.classList.add('active');
            }
            
            recalculateCashFlow();
        });
    });

    // Run first calculation
    recalculateCashFlow();
    
    // Start animation loop
    if (tankAnimationId) cancelAnimationFrame(tankAnimationId);
    animateWaterTank();

    // Stage 3 action triggers
    document.getElementById('btn-go-stage3').addEventListener('click', () => {
        Sound.playSelect();
        showView('student-stage3-view');
        initStage3();
    });
}

function recalculateCashFlow() {
    // 1. Calculate essential expenses
    let essentialSum = 0;
    STATE.realityCheck.selections.forEach(cardId => {
        essentialSum += EXPENSE_COSTS[cardId] || 0;
    });
    STATE.realityCheck.expenses = essentialSum;

    // Total monthly outflow = Essential fixed consumption + Configured Dream Savings
    const totalOutflow = Math.round(essentialSum + STATE.realityCheck.dreamSaving);
    const netCashFlow = STATE.realityCheck.income - totalOutflow;

    // Render Metrics Text
    document.getElementById('metric-inflow-val').innerText = `+${STATE.realityCheck.income.toLocaleString('ko-KR')}원`;
    document.getElementById('metric-outflow-val').innerText = `-${totalOutflow.toLocaleString('ko-KR')}원`;
    
    const netValDiv = document.getElementById('metric-net-val');
    const netRow = document.getElementById('metric-net-row');
    
    if (netCashFlow >= 0) {
        netValDiv.innerText = `+${netCashFlow.toLocaleString('ko-KR')}원`;
        netValDiv.className = 'net-positive';
        netRow.style.borderColor = 'var(--success)';
        
        // Calculate target water height: from 0.4 (net=0) to 0.95 (net = 70% income)
        const ratio = STATE.realityCheck.income > 0 ? netCashFlow / STATE.realityCheck.income : 0;
        targetWaterHeight = 0.4 + Math.min(ratio, 0.7) * 0.75;
    } else {
        netValDiv.innerText = `${netCashFlow.toLocaleString('ko-KR')}원`;
        netValDiv.className = 'net-negative';
        netRow.style.borderColor = 'var(--danger)';
        
        // Warning sound triggers sometimes on negative shift
        if (targetWaterHeight >= 0.4) {
            Sound.playWarning();
        }
        
        // Height shifts low (5% to 20%)
        const ratio = Math.abs(netCashFlow) / STATE.realityCheck.income;
        targetWaterHeight = Math.max(0.25 - ratio * 0.25, 0.05);
    }

    // Sync state updates
    syncStudentDataToBackend();
}

function animateWaterTank() {
    waveOffset += 0.06;
    
    // Smoothly interpolate water level
    waterHeight += (targetWaterHeight - waterHeight) * 0.15;
    
    tankCtx.clearRect(0, 0, tankCanvas.width, tankCanvas.height);
    
    const width = tankCanvas.width;
    const height = tankCanvas.height;
    
    // Render back grid/ticks
    tankCtx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
    tankCtx.lineWidth = 1;
    for (let y = 40; y < height; y += 40) {
        tankCtx.beginPath();
        tankCtx.moveTo(0, y);
        tankCtx.lineTo(width, y);
        tankCtx.stroke();
    }

    const currentY = height - (waterHeight * height);

    // Color definitions based on level status
    let liquidColor = 'rgba(0, 102, 255, 0.6)'; // default water blue
    let foamColor = 'rgba(59, 130, 246, 0.75)';
    let emoji = '😀';

    if (waterHeight < 0.25) {
        liquidColor = 'rgba(239, 68, 68, 0.6)'; // warning red
        foamColor = 'rgba(220, 38, 38, 0.75)';
        emoji = '😨';
    } else if (waterHeight > 0.65) {
        liquidColor = 'rgba(16, 185, 129, 0.6)'; // safe green
        foamColor = 'rgba(4, 120, 87, 0.75)';
        emoji = '😎';
    } else if (waterHeight < 0.4) {
        liquidColor = 'rgba(245, 158, 11, 0.6)'; // warning yellow
        foamColor = 'rgba(217, 119, 6, 0.75)';
        emoji = '😐';
    }

    // Update floating emoji DOM position
    const floater = document.getElementById('tank-floater-emoji');
    if (floater) {
        floater.innerText = emoji;
        // set floater bottom distance
        floater.style.bottom = `${waterHeight * 100 - 8}%`;
    }

    // Draw first wave path (Back wave)
    tankCtx.fillStyle = liquidColor.replace('0.6', '0.45');
    tankCtx.beginPath();
    tankCtx.moveTo(0, currentY);
    for (let x = 0; x <= width; x += 10) {
        const yOffset = Math.sin((x * 0.02) + waveOffset) * 12;
        tankCtx.lineTo(x, currentY + yOffset);
    }
    tankCtx.lineTo(width, height);
    tankCtx.lineTo(0, height);
    tankCtx.closePath();
    tankCtx.fill();

    // Draw second wave path (Front wave)
    tankCtx.fillStyle = liquidColor;
    tankCtx.beginPath();
    tankCtx.moveTo(0, currentY);
    for (let x = 0; x <= width; x += 10) {
        const yOffset = Math.sin((x * 0.025) - waveOffset + Math.PI/2) * 8;
        tankCtx.lineTo(x, currentY + yOffset);
    }
    tankCtx.lineTo(width, height);
    tankCtx.lineTo(0, height);
    tankCtx.closePath();
    tankCtx.fill();

    // Draw Foam on front wave lip
    tankCtx.strokeStyle = foamColor;
    tankCtx.lineWidth = 4;
    tankCtx.beginPath();
    tankCtx.moveTo(0, currentY);
    for (let x = 0; x <= width; x += 10) {
        const yOffset = Math.sin((x * 0.025) - waveOffset + Math.PI/2) * 8;
        tankCtx.lineTo(x, currentY + yOffset);
    }
    tankCtx.stroke();
    
    tankAnimationId = requestAnimationFrame(animateWaterTank);
}

// ----------------------------------------------------
// 7. STAGE 3: THE POWER OF INVESTMENT (RACING SIMULATOR)
// ----------------------------------------------------
let racingCanvas = null;
let racingCtx = null;
let racingAnimationId = null;
let racingProgress = 0; // 0 to 1
let racingAge = 20;

function initStage3() {
    racingCanvas = document.getElementById('racing-graph-canvas');
    racingCtx = racingCanvas.getContext('2d');
    
    // Clear canvas sizing
    racingCanvas.width = racingCanvas.clientWidth * window.devicePixelRatio;
    racingCanvas.height = 320 * window.devicePixelRatio;
    racingCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set slider value
    const rateRange = document.getElementById('investment-rate-range');
    rateRange.value = STATE.investment.targetRate;
    document.getElementById('investment-rate-val').innerText = `연 ${STATE.investment.targetRate.toFixed(1)}%`;
    
    rateRange.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        STATE.investment.targetRate = rate;
        document.getElementById('investment-rate-val').innerText = `연 ${rate.toFixed(1)}%`;
        Sound.playTick();
    });

    // Start racing simulation button click
    const startBtn = document.getElementById('btn-start-simulation');
    startBtn.addEventListener('click', startRacingSimulation);

    // Initial reset render
    drawRacingArena(0);
}

function drawRacingArena(progress = 0) {
    const width = racingCanvas.width / window.devicePixelRatio;
    const height = 320;
    
    racingCtx.clearRect(0, 0, width, height);

    // Dark grid background
    racingCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    racingCtx.lineWidth = 1;
    for (let x = 50; x < width; x += 60) {
        racingCtx.beginPath();
        racingCtx.moveTo(x, 20);
        racingCtx.lineTo(x, height - 40);
        racingCtx.stroke();
    }
    for (let y = 30; y < height - 40; y += 50) {
        racingCtx.beginPath();
        racingCtx.moveTo(50, y);
        racingCtx.lineTo(width - 30, y);
        racingCtx.stroke();
    }

    // Axes lines
    racingCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    racingCtx.lineWidth = 2;
    // Y Axis
    racingCtx.beginPath();
    racingCtx.moveTo(50, 20);
    racingCtx.lineTo(50, height - 40);
    racingCtx.stroke();
    // X Axis
    racingCtx.beginPath();
    racingCtx.moveTo(50, height - 40);
    racingCtx.lineTo(width - 20, height - 40);
    racingCtx.stroke();

    // Axis Labels
    racingCtx.fillStyle = '#94A3B8';
    racingCtx.font = '11px Outfit, sans-serif';
    racingCtx.fillText('20세', 40, height - 20);
    racingCtx.fillText('40세', (width - 70) / 2 + 50, height - 20);
    racingCtx.fillText('60세', width - 50, height - 20);

    // Simulation computations
    // Simulation computations
    const baseSavingsMonthly = STATE.realityCheck.dreamSaving;
    const netCashFlow = STATE.realityCheck.income - STATE.realityCheck.expenses - STATE.realityCheck.dreamSaving;
    if (baseSavingsMonthly <= 0 || netCashFlow < 0) {
        // Draw empty lines indicating invalid state
        racingCtx.fillStyle = '#EF4444';
        racingCtx.font = '14px Noto Sans KR, sans-serif';
        if (baseSavingsMonthly <= 0) {
            racingCtx.fillText('⚠️ 설정된 월 드림 저축액이 0원입니다. 2단계로 돌아가 드림 저축액을 설정해 주세요!', 60, height / 2);
        } else {
            racingCtx.fillText('⚠️ 현재 월급 대비 고정지출과 드림 저축액의 합이 초과하여 적자 상태입니다!', 60, height / 2);
        }
        return;
    }

    const years = 40;
    const pointsSavings = [];
    const pointsPortfolio = [];

    let currentSavings = 0;
    let currentPortfolio = 0;

    const rateSavings = 0.02; // Fixed 2%
    const ratePortfolio = STATE.investment.targetRate / 100;

    // Create points lists year by year
    for (let yr = 0; yr <= years; yr++) {
        // Savings compounding
        if (yr > 0) {
            currentSavings = (currentSavings + baseSavingsMonthly * 12) * (1 + rateSavings);
            currentPortfolio = (currentPortfolio + baseSavingsMonthly * 12) * (1 + ratePortfolio);
        } else {
            currentSavings = baseSavingsMonthly * 12;
            currentPortfolio = baseSavingsMonthly * 12;
        }
        
        const xPos = 50 + (yr / years) * (width - 100);
        pointsSavings.push({ x: xPos, y: currentSavings, val: currentSavings });
        pointsPortfolio.push({ x: xPos, y: currentPortfolio, val: currentPortfolio });
    }

    // Determine scale based on maximum portfolio value at 60
    const maxVal = Math.max(10000000, pointsPortfolio[pointsPortfolio.length - 1].y);
    const scaleY = (height - 80) / maxVal;

    // Update real-time metric panel tags
    const activeIdx = Math.floor(progress * years);
    const activeSavingsVal = pointsSavings[activeIdx]?.val || 0;
    const activePortfolioVal = pointsPortfolio[activeIdx]?.val || 0;
    
    document.getElementById('racing-age-val').innerText = 20 + activeIdx;
    document.getElementById('racing-savings-val').innerText = `${Math.round(activeSavingsVal / 10000).toLocaleString('ko-KR')}만 원`;
    document.getElementById('racing-portfolio-val').innerText = `${Math.round(activePortfolioVal / 10000).toLocaleString('ko-KR')}만 원`;

    // 1. Draw glowing background gap gradient area
    if (progress > 0) {
        racingCtx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        racingCtx.beginPath();
        racingCtx.moveTo(pointsSavings[0].x, height - 40 - pointsSavings[0].y * scaleY);
        
        const endIdx = Math.min(pointsSavings.length - 1, Math.ceil(progress * years));
        
        for (let i = 0; i <= endIdx; i++) {
            racingCtx.lineTo(pointsPortfolio[i].x, height - 40 - pointsPortfolio[i].y * scaleY);
        }
        for (let i = endIdx; i >= 0; i--) {
            racingCtx.lineTo(pointsSavings[i].x, height - 40 - pointsSavings[i].y * scaleY);
        }
        racingCtx.closePath();
        racingCtx.fill();
    }

    // Helper to draw racing lines
    function drawRaceLine(points, color, glowColor, prog) {
        racingCtx.beginPath();
        racingCtx.strokeStyle = color;
        racingCtx.lineWidth = 3;
        
        if (glowColor) {
            racingCtx.shadowColor = glowColor;
            racingCtx.shadowBlur = 10;
        } else {
            racingCtx.shadowBlur = 0;
        }
        
        const limit = Math.ceil(prog * years);
        racingCtx.moveTo(points[0].x, height - 40 - points[0].y * scaleY);
        
        for (let i = 1; i <= limit; i++) {
            if (points[i]) {
                racingCtx.lineTo(points[i].x, height - 40 - points[i].y * scaleY);
            }
        }
        racingCtx.stroke();
        racingCtx.shadowBlur = 0; // Reset glow
    }

    // 2. Draw Savings Track (Grey Line)
    drawRaceLine(pointsSavings, '#94A3B8', null, progress);
    
    // 3. Draw Portfolio Track (Glow Blue Line)
    drawRaceLine(pointsPortfolio, '#38BDF8', 'rgba(56, 189, 248, 0.5)', progress);

    // 4. Draw Leading runners (Points)
    if (progress > 0) {
        const activeItemIdx = Math.min(pointsSavings.length - 1, Math.ceil(progress * years));
        
        const sX = pointsSavings[activeItemIdx].x;
        const sY = height - 40 - pointsSavings[activeItemIdx].y * scaleY;
        const pX = pointsPortfolio[activeItemIdx].x;
        const pY = height - 40 - pointsPortfolio[activeItemIdx].y * scaleY;

        // Draw savings runner dot
        racingCtx.fillStyle = '#CBD5E1';
        racingCtx.beginPath();
        racingCtx.arc(sX, sY, 6, 0, Math.PI * 2);
        racingCtx.fill();
        
        // Draw portfolio runner dot
        racingCtx.fillStyle = '#38BDF8';
        racingCtx.beginPath();
        racingCtx.arc(pX, pY, 8, 0, Math.PI * 2);
        racingCtx.fill();

        // Draw indicator labels at end of race
        if (progress >= 1) {
            racingCtx.fillStyle = '#94A3B8';
            racingCtx.font = '10px Noto Sans KR, sans-serif';
            racingCtx.fillText('예적금', sX - 45, sY - 8);
            
            racingCtx.fillStyle = '#38BDF8';
            racingCtx.font = 'bold 11px Noto Sans KR, sans-serif';
            racingCtx.fillText('포트폴리오', pX - 60, pY - 12);
        }
    }
}

function startRacingSimulation() {
    if (STATE.investment.isSimulating) return;
    
    // Check if savings is negative or zero
    const baseSavingsMonthly = STATE.realityCheck.dreamSaving;
    const netCashFlow = STATE.realityCheck.income - STATE.realityCheck.expenses - STATE.realityCheck.dreamSaving;
    
    if (baseSavingsMonthly <= 0) {
        alert("월 드림 저축액이 0원입니다! 2단계 현실 점검으로 돌아가 드림 저축액을 설정해 주세요.");
        return;
    }
    if (netCashFlow < 0) {
        alert("잔여 여유 자금이 부족합니다(적자 상태)! 2단계 현실 점검으로 돌아가 고정 지출을 줄이거나 드림 저축액을 낮춰주세요.");
        return;
    }

    STATE.investment.isSimulating = true;
    document.getElementById('btn-start-simulation').disabled = true;
    document.getElementById('sim-speed-indicator').innerText = "⏱️ 시뮬레이터 달리는 중...";
    racingProgress = 0;
    
    const duration = 5000; // 5 seconds
    const startTime = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        racingProgress = Math.min(elapsed / duration, 1);
        
        drawRacingArena(racingProgress);
        
        if (racingProgress < 1) {
            racingAnimationId = requestAnimationFrame(step);
        } else {
            STATE.investment.isSimulating = false;
            document.getElementById('btn-start-simulation').disabled = false;
            document.getElementById('sim-speed-indicator').innerText = "";
            finishRacingSimulation();
        }
    }
    
    Sound.playCheer();
    racingAnimationId = requestAnimationFrame(step);
}

function finishRacingSimulation() {
    // 1. Calculate totals at age 60
    const baseSavingsMonthly = STATE.realityCheck.dreamSaving;
    const years = 40;
    const rateSavings = 0.02;
    const ratePortfolio = STATE.investment.targetRate / 100;
    
    let endSavings = 0;
    let endPortfolio = 0;
    
    for (let yr = 1; yr <= years; yr++) {
        endSavings = (endSavings + baseSavingsMonthly * 12) * (1 + rateSavings);
        endPortfolio = (endPortfolio + baseSavingsMonthly * 12) * (1 + ratePortfolio);
    }

    STATE.investment.savingsEnd = Math.round(endSavings);
    STATE.investment.portfolioEnd = Math.round(endPortfolio);

    // 2. Evaluate bucket list goals met
    // Sum total cost of bucket list items
    let totalBucketCost = 0;
    STATE.bucketList.forEach(x => totalBucketCost += x.cost);

    // Sort items by cost (cheapest first) to simulate prioritisation
    const sortedBucketList = [...STATE.bucketList].sort((a, b) => a.cost - b.cost);
    
    let achievedSavingsCount = 0;
    let tempSavingsAcc = STATE.investment.savingsEnd;
    sortedBucketList.forEach(item => {
        if (tempSavingsAcc >= item.cost) {
            achievedSavingsCount++;
            tempSavingsAcc -= item.cost;
        }
    });

    let achievedPortfolioCount = 0;
    let tempPortfolioAcc = STATE.investment.portfolioEnd;
    sortedBucketList.forEach(item => {
        if (tempPortfolioAcc >= item.cost) {
            achievedPortfolioCount++;
            tempPortfolioAcc -= item.cost;
        }
    });

    // 3. Render Modal Content
    const gap = STATE.investment.portfolioEnd - STATE.investment.savingsEnd;
    document.getElementById('report-asset-gap').innerText = `약 +${formatKoreanCurrency(gap)}`;
    
    document.getElementById('report-savings-total').innerText = formatKoreanCurrency(STATE.investment.savingsEnd);
    document.getElementById('report-savings-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 중 ${achievedSavingsCount}개 달성 가능`;
    
    document.getElementById('report-portfolio-total').innerText = formatKoreanCurrency(STATE.investment.portfolioEnd);
    document.getElementById('report-portfolio-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 중 ${achievedPortfolioCount}개 모두 달성 가능! 🎉`;

    // Visual configurations
    if (achievedPortfolioCount < STATE.bucketList.length) {
        document.getElementById('report-portfolio-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 중 ${achievedPortfolioCount}개 달성 가능`;
    }

    // Trigger celebration effects
    Sound.playCheer();
    Confetti.trigger(150);

    // Show Report Modal
    const reportModal = document.getElementById('report-modal');
    reportModal.style.display = 'flex';

    // Binds modal action buttons
    document.getElementById('btn-report-close').onclick = () => {
        reportModal.style.display = 'none';
        // Go back or let teacher dashboard see completion
        syncStudentDataToBackend(true); // set completed status
    };
    
    document.getElementById('btn-report-restart').onclick = () => {
        reportModal.style.display = 'none';
        startRacingSimulation();
    };

    // Update synced results
    STATE.investment.bucketListCount = STATE.bucketList.length;
    STATE.investment.achievedSavingsCount = achievedSavingsCount;
    STATE.investment.achievedPortfolioCount = achievedPortfolioCount;
    syncStudentDataToBackend(true);
}

// ----------------------------------------------------
// 8. DATABASE / OFFLINE BACKEND SYNCHRONIZATION
// ----------------------------------------------------
function syncStudentDataToBackend(isCompleted = false) {
    if (!STATE.sessionId || !STATE.studentId) return;

    // Group database objects
    const updates = {
        bucketList: STATE.bucketList,
        realityCheck: {
            income: STATE.realityCheck.income,
            expenses: STATE.realityCheck.expenses,
            selections: STATE.realityCheck.selections,
            dreamSaving: STATE.realityCheck.dreamSaving
        },
        investment: {
            targetRate: STATE.investment.targetRate,
            savingsEnd: STATE.investment.savingsEnd || 0,
            portfolioEnd: STATE.investment.portfolioEnd || 0,
            bucketListCount: STATE.investment.bucketListCount || STATE.bucketList.length,
            achievedCount: STATE.investment.achievedPortfolioCount || 0
        }
    };

    const finalStage = isCompleted ? 3 : STATE.currentStage;
    FirebaseSync.updateStudentData(STATE.sessionId, STATE.studentId, finalStage, updates);
}

// ----------------------------------------------------
// 9. APP LANDING & ADMISSION CONTROLS
// ----------------------------------------------------
function initApp() {
    // Generate static elements first
    Confetti.init();
    
    // Bind logo to go back home safely
    document.getElementById('app-logo').addEventListener('click', () => {
        if (confirm("처음 화면으로 돌아가시겠습니까? 진행 중인 데이터는 초기화될 수 있습니다.")) {
            location.reload();
        }
    });

    // Form inputs submission
    document.getElementById('student-join-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const pinVal = document.getElementById('input-session-id').value;
        const nameVal = document.getElementById('input-student-name').value.trim();
        
        if (pinVal.length !== 6) {
            alert("세션 번호는 숫자 6자리여야 합니다.");
            return;
        }
        if (!nameVal) {
            alert("이름을 입력해 주세요.");
            return;
        }

        document.getElementById('student-join-submit').disabled = true;
        document.getElementById('student-join-submit').innerText = "접속 중...";

        try {
            const studentId = 'student_' + Math.random().toString(36).substr(2, 9);
            
            // Try connection
            const customCosts = await FirebaseSync.joinSession(pinVal, studentId, nameVal);
            
            if (customCosts) {
                // Override local EXPENSE_COSTS
                Object.assign(EXPENSE_COSTS, customCosts);
            }
            
            // Set states
            STATE.sessionId = pinVal;
            STATE.studentId = studentId;
            STATE.studentName = nameVal;

            document.getElementById('user-display').innerText = `👤 ${nameVal} 학생 (세션: ${pinVal})`;
            
            // Sync UI costs
            updateDOMCardCosts();
            
            // Start simulation Stage 1
            showView('student-stage1-view');
            initStage1();
            renderStudentBucketList(); // render empty list
        } catch (err) {
            alert("수업 세션 접속에 실패했습니다: " + err.message);
            document.getElementById('student-join-submit').disabled = false;
            document.getElementById('student-join-submit').innerText = "시뮬레이션 입장하기";
        }
    });

    // Binds Teacher login transitions
    document.getElementById('go-teacher-login-btn').addEventListener('click', () => {
        showView('teacher-login-view');
    });

    document.getElementById('teacher-login-back').addEventListener('click', () => {
        showView('landing-view');
    });
}

// Start application loading
window.addEventListener('DOMContentLoaded', initApp);
