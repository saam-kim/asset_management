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
        recommendedSaving: 0,
        incomeGrowth: 2.0,
        customExpenses: []
    },
    investment: {
        targetRate: 6.0,
        savingsEnd: 0,
        portfolioEnd: 0,
        isSimulating: false
    },
    retirement: {
        age: 60,
        monthlySpend: 2000000
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

// Preset Keywords for Dream Board - Categorized by Age Group
const PRESET_KEYWORDS = {
    '20s': {
        travel: [
            { text: "유럽 배낭여행 2주", costRange: [400, 550], tip: "유레일 패스 할인 혜택과 유스호스텔을 미리 예약하면 경비를 크게 줄일 수 있습니다! 🇪🇺" },
            { text: "제주도 자전거 일주", costRange: [50, 80], tip: "게스트하우스와 맛있는 로컬 국수집 위주로 탐방하면 아주 알차고 저렴한 도전이 돼요! 🚲" },
            { text: "동남아 3개국 배낭여행", costRange: [150, 250], tip: "저가 항공 프로모션과 현지 길거리 맛집 위주로 기획해 가성비를 챙겨보세요! 🌏" },
            { text: "국내 캠핑 로드트립", costRange: [80, 130], tip: "기본 텐트 장비만 챙겨서 국립 야영장 위주로 예약하면 매우 알뜰합니다! ⛺" }
        ],
        tech: [
            { text: "아이패드 프로 풀세트", costRange: [150, 250], tip: "애플 교육할인 스토어를 이용해 구매하고, 펜슬은 할인 기간을 노려보세요! 📱" },
            { text: "최신형 게이밍 조립 PC", costRange: [200, 300], tip: "그래픽카드 시세를 꾸준히 모니터링하며 부품을 직접 조립하면 가성비 최고! 🖥️" },
            { text: "입문용 카메라 세트", costRange: [100, 180], tip: "번들 렌즈가 포함된 보급형 크롭 바디 중고 기종으로 입문해 보세요. 📷" },
            { text: "블루투스 헤드폰 플렉스", costRange: [30, 50], tip: "음질과 디자인을 겸비한 유명 모델의 이월 할인 시즌을 공략해 봐요. 🎧" }
        ],
        housing: [
            { text: "자취방 보증금 모으기", costRange: [500, 1000], tip: "청년 전월세 보증금 이자 지원 등 지자체 지원 정책을 적극 알아보세요! 🏢" },
            { text: "게이밍 룸 셀프 인테리어", costRange: [100, 200], tip: "오늘의집이나 이케아의 DIY 조립식 가구들을 쓰면 가성비 최고입니다. 🛋️" }
        ],
        experience: [
            { text: "바디 프로필 촬영 도전", costRange: [80, 150], tip: "헬스장 PT 비용과 스튜디오 촬영 예약비를 합산한 금액이에요. 꾸준함이 무기! 💪" },
            { text: "스쿠버 다이빙 오픈워터", costRange: [80, 120], tip: "이론 교육, 수영장 실습, 그리고 제주도 바다 실습까지 포함된 평균 금액입니다. 🤿" },
            { text: "운전면허 빠른 합격", costRange: [70, 100], tip: "자체 면허 시험장을 갖춘 전문 학원의 표준 수강료 기준입니다. 🚗" }
        ],
        car: [
            { text: "첫 중고 경차 구매", costRange: [600, 1000], tip: "취등록세 감면 혜택과 저렴한 자동차세 덕분에 첫 차로 가장 실속 있어요! 🚗" },
            { text: "로드 바이크 자전거", costRange: [100, 200], tip: "안전 헬멧과 전용 의류, 클릿슈즈 비용까지 꼭 예산에 포함해야 합니다. 🚴" }
        ],
        hobby: [
            { text: "헬스장 PT 30회 이용권", costRange: [150, 210], tip: "보통 회당 5~7만 원 수준입니다. 배운 루틴을 평생 써먹는 가치가 있어요. 🏋️" },
            { text: "코딩 부트캠프 웹 개발", costRange: [100, 300], tip: "K-Digital Training 국비 지원을 받으면 무료로 수강할 수 있는 기회도 많아요! 💻" }
        ],
        health: [
            { text: "바디 프로필 촬영", costRange: [80, 150], tip: "PT 비용과 촬영 비용을 포함한 평균 예산입니다. 건강한 습관을 만들어가세요! 💪" },
            { text: "하프 마라톤 완주 연습", costRange: [20, 40], tip: "러닝화와 마라톤 대회 참가비, 보조 영양제 등을 포함한 예산입니다. 🏃" }
        ],
        contribution: [
            { text: "유기 동물 보호소 정기 기부", costRange: [30, 60], tip: "매달 적은 금액이라도 꾸준히 후원하면 유기동물들에게 큰 힘이 됩니다. 🐶" },
            { text: "부모님 커플 감사 링 선물", costRange: [50, 80], tip: "첫 월급이나 알바비로 부모님께 뜻깊은 감사 선물을 드리는 보람찬 계획입니다! 💝" }
        ]
    },
    '30s': {
        travel: [
            { text: "하와이 휴양 1주일", costRange: [600, 850], tip: "비수기 특가 항공권과 주방이 있는 리조트 콘도를 구하면 식비를 아낄 수 있습니다! 🌺" },
            { text: "일본 도쿄 미식 투어", costRange: [120, 180], tip: "평일 3박 4일 일정으로 LCC 항공과 가성비 비즈니스 호텔을 믹스해 보세요! 🍣" },
            { text: "전국 감성 풀빌라 투어", costRange: [100, 180], tip: "성수기 금/토를 피해 평일 일요일~목요일 숙박을 잡으면 가격이 절반! 🏊" }
        ],
        tech: [
            { text: "맥북 프로 노트북", costRange: [300, 420], tip: "중고 보상 판매(Trade-in)나 신학기 이벤트를 적극 활용해 보세요. 💻" },
            { text: "명품 데일리 백 구매", costRange: [250, 450], tip: "클래식하고 유행을 타지 않는 디자인을 고르는 것이 장기적으로 가장 좋습니다! 👜" },
            { text: "고성능 로봇청소기 패키지", costRange: [100, 180], tip: "가사 노동 시간을 획기적으로 줄여주므로 30대 필수 투자 템! 🧹" }
        ],
        housing: [
            { text: "오피스텔 전세 보증금", costRange: [3000, 6000], tip: "버팀목 청년전세자금대출 등 정부 지원 저금리 상품 정보를 잘 살펴보세요. 🏦" },
            { text: "신혼집 가전 패키지", costRange: [1000, 1800], tip: "백화점 신혼 가전 동시 구매 시 캐시백 및 세일 혜택이 가장 큽니다. 📺" }
        ],
        experience: [
            { text: "영어 회화 1년 마스터", costRange: [150, 240], tip: "직장인 환급 제도나 청년 배움카드를 통해 국비 지원을 받을 수 있는지 확인하세요. 🗣️" },
            { text: "바리스타 자격증 취득", costRange: [50, 90], tip: "실기 재료비가 포함된 학원 수강 비용이에요. 직장인 야간반 활용! ☕" }
        ],
        car: [
            { text: "패밀리 SUV 세단 신차", costRange: [3500, 4800], tip: "취등록세 7%와 초기 세금, 첫 보험료(약 120만원)를 추가 산정해야 합니다! 🚘" },
            { text: "하이브리드 도심용 세단", costRange: [3000, 4000], tip: "하이브리드 친환경 차량 취등록세 감면 한도를 꼼꼼히 확인해 보세요. 🚙" }
        ],
        hobby: [
            { text: "필라테스 60회 패키지", costRange: [180, 250], tip: "주 2~3회 꾸준한 체형 교정 운동 비용입니다. 기초 체력은 국력! 🧘" },
            { text: "원데이 위스키 테이스팅", costRange: [40, 80], tip: "전문 아카데미나 보틀숍 교육 프로그램을 이수해 위스키 교양을 넓힙니다. 🥃" }
        ],
        health: [
            { text: "필라테스 60회 패키지", costRange: [180, 250], tip: "자세 교정과 코어 강화에 최적화된 운동입니다. 회당 약 3~4만원 수준이에요! 🧘" },
            { text: "크로스핏 1년 회원권", costRange: [150, 220], tip: "강도 높은 전신 운동으로 강인한 체력을 기르는 실속형 피트니스 계획입니다. 🏋️" }
        ],
        contribution: [
            { text: "신혼집 효도 가전 보조", costRange: [200, 400], tip: "부모님 댁의 낡은 냉장고나 TV를 최신형으로 바꿔드리는 최고의 효도 선물! 📺" },
            { text: "보육원 자립 청년 후원", costRange: [100, 200], tip: "사회에 첫 발을 내딛는 청년들의 디딤돌이 되어주는 따뜻한 나눔입니다. 🤝" }
        ]
    },
    '40s': {
        travel: [
            { text: "지중해 크루즈 여행", costRange: [1200, 1800], tip: "조기 예약(Early Bird) 프로모션 시 요금 할인이 가장 크므로 1년 전 계획하세요! 🚢" },
            { text: "가족 전원 괌 리조트 5일", costRange: [800, 1200], tip: "아이 동반 시 골드카드 패키지로 리조트 내 식비를 모두 해결하는 게 이득! 🏖️" },
            { text: "부모님 온천 료칸 패키지", costRange: [300, 450], tip: "일본 큐슈 지역 료칸 전용 힐링 패키지로 부모님께 평생 추억을 선물하세요. ♨️" }
        ],
        tech: [
            { text: "최고급 시네마 빔프로젝터", costRange: [250, 400], tip: "전용 암막 커튼과 120인치 스크린, 스피커 예산을 함께 반영한 금액입니다. 🎬" },
            { text: "고성능 마사지 안마의자", costRange: [300, 550], tip: "브랜드별 렌탈 계약 조건과 일시불 혜택을 정밀 비교해 보세요. 🛋️" }
        ],
        housing: [
            { text: "내 집 마련 최종 계약금", costRange: [7000, 15000], tip: "주택담보대출 LTV 및 DSR 규제를 확인하여 자부담 비율을 설정하세요. 🏠" },
            { text: "도심 외곽 주말 세컨하우스", costRange: [5000, 9000], tip: "소형 모듈러 홈이나 농막 설치 보조금 혜택을 꼼꼼히 체크하세요. 🏡" }
        ],
        experience: [
            { text: "대학원 경영 석사 MBA", costRange: [2000, 4000], tip: "회사 지원 연수 프로그램이나 장학 제도 수혜 자격이 되는지 탐색해 보세요. 🎓" },
            { text: "해외 명문 어학연수 3개월", costRange: [1000, 1500], tip: "어학원 학비와 현지 홈스테이/쉐어하우스 체재비가 포함된 예산입니다. 🗺️" }
        ],
        car: [
            { text: "독일 명품 세단 신차", costRange: [6500, 8500], tip: "수입 차량은 워런티 보증 연장 상품을 함께 결합해 두는 것이 유리합니다. 🇩🇪" },
            { text: "대형 프리미엄 SUV", costRange: [7000, 9500], tip: "차박 캠핑 장비 세팅 및 패밀리 아웃도어용 종합 레저 차량입니다. 🚙" }
        ],
        hobby: [
            { text: "명문 골프 회원권/라운딩", costRange: [400, 800], tip: "그린피, 카트비, 캐디피 및 장비 세트 가격이 종합 포함된 연간 예산입니다. ⛳" },
            { text: "프리미엄 요가/웰니스 멤버십", costRange: [200, 350], tip: "마인드 케어 명상원 정기 회원권과 퍼스널 웰니스 가이딩 비용입니다. 🧘" }
        ],
        health: [
            { text: "명문 골프 라운딩 회원권", costRange: [400, 800], tip: "비즈니스 친목과 야외 레저를 동시에 즐길 수 있는 프리미엄 웰니스 활동입니다. ⛳" },
            { text: "프리미엄 종합 정밀 검진", costRange: [150, 300], tip: "40대 이후 건강 위험 요소를 조기에 차단하는 인생 필수 건강 투자입니다. 🩺" }
        ],
        contribution: [
            { text: "부모님 칠순 료칸 패키지", costRange: [300, 450], tip: "부모님께 최고의 힐링과 휴식을 안겨드리는 효도 여행 패키지입니다. ♨️" },
            { text: "모교 장학 재단 설립 기부", costRange: [1000, 2500], tip: "자신의 성공을 사회에 환원하여 후배들이 꿈을 이룰 수 있게 돕는 큰 가치입니다. 💝" }
        ]
    }
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
            renderPresets(); // Refresh keywords to align with selected age group
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
    const agePresets = PRESET_KEYWORDS[STATE.activeAgeGroup] || {};
    const items = agePresets[STATE.activeCategory] || [];
    
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
    } else if (category === 'health') {
        const item1 = Math.round((avg * 0.60) / 10000) * 10000;
        const item2 = Math.round((avg * 0.25) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "🏃 전문 센터/PT 등록 및 이용료", cost: item1 },
            { name: "👟 필수 운동 장비 및 전문 의류", cost: item2 },
            { name: "🥤 건강 식단 관리 및 보조 영양제", cost: item3 }
        ];
    } else if (category === 'contribution') {
        const item1 = Math.round((avg * 0.70) / 10000) * 10000;
        const item2 = Math.round((avg * 0.15) / 10000) * 10000;
        const item3 = Math.max(10000, avg - item1 - item2);
        items = [
            { name: "💝 감사의 선물 또는 본 기부금", cost: item1 },
            { name: "💐 기념 이벤트 및 데코레이션", cost: item2 },
            { name: "🍽️ 동반 식사 및 축하 행사 부대비용", cost: item3 }
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
        // Search presets first for perfect/partial matching across all ages
        let matched = null;
        for (const age in PRESET_KEYWORDS) {
            const agePresets = PRESET_KEYWORDS[age];
            for (const cat in agePresets) {
                const found = agePresets[cat].find(item => kw === item.text || (kw.length > 4 && item.text.length > 4 && (kw.includes(item.text) || item.text.includes(kw))));
                if (found) {
                    matched = found;
                    break;
                }
            }
            if (matched) break;
        }

        if (matched) {
            finalMin = matched.costRange[0] * 10000;
            finalMax = matched.costRange[1] * 10000;
            finalTip = matched.tip;
            return;
        }

        // Advanced Heuristic Cost Engine
        const cleanKw = kw.replace(/\s+/g, '').toLowerCase();

        // 0. Keyword-based Category Override Classifier
        // Overrides selected category context if obvious keywords match (prevents UX issue in "자동차/취미" card)
        let detectedCategory = STATE.activeCategory;
        if (cleanKw.includes('콘서트') || cleanKw.includes('공연') || cleanKw.includes('티켓') || cleanKw.includes('페스티벌') || cleanKw.includes('뮤지컬') || cleanKw.includes('연극') || cleanKw.includes('가수') || cleanKw.includes('아이유') || cleanKw.includes('음악회') || cleanKw.includes('팬미팅')) {
            detectedCategory = 'hobby';
        } else if (cleanKw.includes('여행') || cleanKw.includes('제주') || cleanKw.includes('살기') || cleanKw.includes('휴가') || cleanKw.includes('투어') || cleanKw.includes('캠핑') || cleanKw.includes('다이빙')) {
            detectedCategory = 'travel';
        } else if (cleanKw.includes('아이패드') || cleanKw.includes('노트북') || cleanKw.includes('컴퓨터') || cleanKw.includes('pc') || cleanKw.includes('맥북') || cleanKw.includes('폰') || cleanKw.includes('태블릿') || cleanKw.includes('카메라') || cleanKw.includes('갤럭시')) {
            detectedCategory = 'tech';
        } else if (cleanKw.includes('집') || cleanKw.includes('보증금') || cleanKw.includes('전세') || cleanKw.includes('월세') || cleanKw.includes('자취') || cleanKw.includes('아파트') || cleanKw.includes('오피스텔')) {
            detectedCategory = 'housing';
        } else if (cleanKw.includes('차') || cleanKw.includes('자동차') || cleanKw.includes('오토바이') || cleanKw.includes('경차') || cleanKw.includes('중고차') || cleanKw.includes('포르쉐') || cleanKw.includes('벤츠') || cleanKw.includes('bmw') || cleanKw.includes('테슬라')) {
            detectedCategory = 'car';
        } else if (cleanKw.includes('헬스') || cleanKw.includes('필라테스') || cleanKw.includes('바디프로필') || cleanKw.includes('런닝') || cleanKw.includes('마라톤') || cleanKw.includes('운동') || cleanKw.includes('피트니스') || cleanKw.includes('요가') || cleanKw.includes('검진') || cleanKw.includes('골프') || cleanKw.includes('스포')) {
            detectedCategory = 'health';
        } else if (cleanKw.includes('기부') || cleanKw.includes('효도') || cleanKw.includes('선물') || cleanKw.includes('부모님') || cleanKw.includes('나눔') || cleanKw.includes('후원') || cleanKw.includes('기여') || cleanKw.includes('보답') || cleanKw.includes('칠순') || cleanKw.includes('환원')) {
            detectedCategory = 'contribution';
        }

        // 1. Travel heuristics
        if (detectedCategory === 'travel') {
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
        if (detectedCategory === 'tech') {
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
        if (detectedCategory === 'car') {
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
        if (detectedCategory === 'housing') {
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

        // 5. Health
        if (detectedCategory === 'health') {
            if (cleanKw.includes('골프') || cleanKw.includes('검진') || cleanKw.includes('회원권')) {
                finalMin = 1500000;
                finalMax = 3000000;
                finalTip = "정밀 종합 건강검진이나 연간 피트니스 회원권을 포함한 예산입니다. 건강에 미리 투자하는 것이 가장 높은 수익률을 보장합니다! 🩺";
            } else if (cleanKw.includes('바디') || cleanKw.includes('프로필') || cleanKw.includes('필라테스') || cleanKw.includes('피티') || cleanKw.includes('pt')) {
                finalMin = 800000;
                finalMax = 1800000;
                finalTip = "스튜디오 촬영비와 수개월의 전문 강사 PT 비용이 합산된 지출입니다. 평생의 건강한 습관을 만드는 계기가 됩니다. 🏋️";
            } else {
                finalMin = 300000;
                finalMax = 800000;
                finalTip = "규칙적인 스포츠 활동 및 기본적인 건강 관리를 위한 비용입니다. 꾸준함이 핵심입니다! 🏃";
            }
            return;
        }

        // 6. Contribution
        if (detectedCategory === 'contribution') {
            if (cleanKw.includes('칠순') || cleanKw.includes('여행') || cleanKw.includes('가전') || cleanKw.includes('재단') || cleanKw.includes('대학') || cleanKw.includes('기부금')) {
                finalMin = 3000000;
                finalMax = 6000000;
                finalTip = "부모님을 위한 큰 효도 선물이나 단체 기부를 염두에 둔 넉넉한 설계입니다. 나눌수록 삶의 만족도가 올라갑니다! 💝";
            } else if (cleanKw.includes('부모님') || cleanKw.includes('선물') || cleanKw.includes('감사')) {
                finalMin = 500000;
                finalMax = 1200000;
                finalTip = "부모님을 위한 따뜻한 선물이나 감사 패키지 비용입니다. 정성이 담긴 선물이 가장 큰 기쁨을 줍니다. 🎁";
            } else {
                finalMin = 300000;
                finalMax = 600000;
                finalTip = "도움이 필요한 곳이나 사회 단체에 후원하는 든든한 나눔 예산입니다. 소외된 이들에게 큰 희망이 됩니다. 🤝";
            }
            return;
        }

        // 7. Hobby / Concert / Experience
        if (detectedCategory === 'hobby' || cleanKw.includes('콘서트') || cleanKw.includes('공연') || cleanKw.includes('티켓') || cleanKw.includes('페스티벌')) {
            if (cleanKw.includes('콘서트') || cleanKw.includes('공연') || cleanKw.includes('티켓') || cleanKw.includes('아이유') || cleanKw.includes('페스티벌') || cleanKw.includes('멜론') || cleanKw.includes('예매')) {
                finalMin = 150000;
                finalMax = 400000;
                finalTip = "티켓 예매 비용 및 공식 굿즈/응원봉 구매, 콘서트장 왕복 교통비가 포함된 평균 1회 관람 예산입니다. 🎤";
                const avg = Math.round((finalMin + finalMax) / 2);
                finalBreakdown = [
                    { name: "🎫 콘서트 티켓 예매비 (기본/VIP)", cost: Math.round(avg * 0.55) },
                    { name: "🛍️ 공식 굿즈 및 응원봉 구입비", cost: Math.round(avg * 0.25) },
                    { name: "🚌 콘서트장 왕복 교통 및 간단한 식비", cost: Math.max(10000, avg - Math.round(avg * 0.55) - Math.round(avg * 0.25)) }
                ];
            } else {
                finalMin = 300000;
                finalMax = 800000;
                finalTip = "정기적인 취미 학원 수강료와 활동 준비물 재료비 등을 감안한 건전한 여가 생활 자금 설계입니다. 🎨";
                const avg = Math.round((finalMin + finalMax) / 2);
                finalBreakdown = [
                    { name: "🎨 취미 공방/학원 수강료 (3개월)", cost: Math.round(avg * 0.65) },
                    { name: "👟 필수 소모 재료 및 활동 장비 구입", cost: Math.round(avg * 0.20) },
                    { name: "☕ 소모임 및 친목 네트워크 부대비용", cost: Math.max(10000, avg - Math.round(avg * 0.65) - Math.round(avg * 0.20)) }
                ];
            }
            return;
        }

        // 6. Luxury / High scale goals
        if (cleanKw.includes('람보르기니') || cleanKw.includes('페라리') || cleanKw.includes('슈퍼카') || cleanKw.includes('빌딩') || cleanKw.includes('건물') || cleanKw.includes('우주') || cleanKw.includes('강남아파트') || cleanKw.includes('100억') || cleanKw.includes('10억')) {
            finalMin = 350000000;
            finalMax = 500000000;
            finalTip = "엄청난 자금이 필요한 슈퍼 드림 목표군요! 일반 은행 저축(연 2%)만으로는 한계가 크며, 자산 투자 및 적극적 포트폴리오 관리가 요구됩니다! 🚀";
            return;
        }

        // Generic hashing fallback within realistic boundaries (50만 원 to 600만 원)
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
    
    // Bind age options dynamically
    const ageSelect = document.getElementById('ai-result-target-age');
    ageSelect.innerHTML = '';
    let startAge = 20, endAge = 29, defaultAge = 25;
    if (STATE.activeAgeGroup === '30s') {
        startAge = 30; endAge = 39; defaultAge = 35;
    } else if (STATE.activeAgeGroup === '40s') {
        startAge = 40; endAge = 60; defaultAge = 45;
    }
    for (let a = startAge; a <= endAge; a++) {
        const opt = document.createElement('option');
        opt.value = a;
        opt.innerText = a;
        if (a === defaultAge) opt.selected = true;
        ageSelect.appendChild(opt);
    }

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

        const selectedAge = parseInt(document.getElementById('ai-result-target-age').value) || defaultAge;

        // Add item to state
        const newItem = {
            id: Date.now().toString(),
            category: STATE.activeCategory,
            text: finalTitle,
            cost: Math.round((customMin + customMax) / 2), // store average of customized costs
            ageGroup: STATE.activeAgeGroup,
            targetAge: selectedAge
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
    
    // Sort bucket lists by ageGroup or targetAge
    STATE.bucketList.sort((a, b) => (a.targetAge || 0) - (b.targetAge || 0));
    
    STATE.bucketList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bucket-item';
        
        const catIcons = { travel: '✈️', tech: '💻', housing: '🏠', experience: '🎓', car: '🚗', hobby: '🎨', health: '🏃', contribution: '💝' };
        const icon = catIcons[item.category] || '✨';
        const formattedCost = (item.cost / 10000).toLocaleString('ko-KR') + '만 원';
        
        const displayAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
        
        div.innerHTML = `
            <div class="bucket-info">
                <span class="bucket-category-badge">${icon}</span>
                <div>
                    <span class="bucket-name">${item.text}</span>
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">(${displayAge}세 목표)</span>
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

    // 소득 상승률 슬라이더 초기화
    const growthRange = document.getElementById('salary-growth-range');
    const cleanGrowthRange = growthRange.cloneNode(true);
    growthRange.parentNode.replaceChild(cleanGrowthRange, growthRange);

    cleanGrowthRange.value = STATE.realityCheck.incomeGrowth;
    document.getElementById('salary-growth-display-val').innerText = `연 ${STATE.realityCheck.incomeGrowth.toFixed(1)}%`;

    cleanGrowthRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        STATE.realityCheck.incomeGrowth = val;
        document.getElementById('salary-growth-display-val').innerText = `연 ${val.toFixed(1)}%`;
        Sound.playTick();
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

    // 커스텀 지출 추가 이벤트 바인딩
    const addBtn = document.getElementById('btn-add-custom-expense');
    const nameInput = document.getElementById('input-custom-expense-name');
    const costInput = document.getElementById('input-custom-expense-cost');
    const startAgeInput = document.getElementById('input-custom-expense-start');
    const endAgeInput = document.getElementById('input-custom-expense-end');

    const cleanAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(cleanAddBtn, addBtn);

    cleanAddBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const cost = parseInt(costInput.value);
        let startAge = startAgeInput ? parseInt(startAgeInput.value) : 20;
        let endAge = endAgeInput ? parseInt(endAgeInput.value) : 80;

        if (!name || isNaN(cost) || cost <= 0) {
            alert("지출 항목 이름과 올바른 금액(만 원 단위)을 입력해 주세요!");
            return;
        }

        if (isNaN(startAge) || startAge < 20 || startAge > 80) startAge = 20;
        if (isNaN(endAge) || endAge < 20 || endAge > 80) endAge = 80;

        if (startAge > endAge) {
            alert("시작 나이가 종료 나이보다 클 수 없습니다!");
            return;
        }

        Sound.playSuccess();
        const newItem = {
            id: 'custom_' + Date.now(),
            name: name,
            cost: cost * 10000,
            startAge: startAge,
            endAge: endAge
        };

        if (!STATE.realityCheck.customExpenses) {
            STATE.realityCheck.customExpenses = [];
        }
        STATE.realityCheck.customExpenses.push(newItem);

        // Reset Inputs
        nameInput.value = '';
        costInput.value = '';
        if (startAgeInput) startAgeInput.value = '20';
        if (endAgeInput) endAgeInput.value = '80';

        renderCustomExpenses();
        recalculateCashFlow();
    });

    // 커스텀 지출 리스트 렌더링 함수
    window.renderCustomExpenses = function() {
        const listDiv = document.getElementById('custom-expenses-list');
        listDiv.innerHTML = '';

        const list = STATE.realityCheck.customExpenses || [];
        list.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'custom-expense-item';
            
            const costMan = Math.round(item.cost / 10000).toLocaleString('ko-KR');
            const startAge = item.startAge !== undefined ? item.startAge : 20;
            const endAge = item.endAge !== undefined ? item.endAge : 80;
            
            itemDiv.innerHTML = `
                <span>🏷️ ${item.name} (${costMan}만 원) <span style="font-size: 11px; opacity: 0.8; margin-left: 6px;">| ${startAge}세~${endAge}세</span></span>
                <button class="delete-custom-expense" data-id="${item.id}">✕</button>
            `;

            // 삭제 버튼 바인딩
            itemDiv.querySelector('.delete-custom-expense').addEventListener('click', (e) => {
                Sound.playWarning();
                const idToDelete = e.target.dataset.id;
                STATE.realityCheck.customExpenses = STATE.realityCheck.customExpenses.filter(x => x.id !== idToDelete);
                renderCustomExpenses();
                recalculateCashFlow();
            });

            listDiv.appendChild(itemDiv);
        });
    };

    // 최초 1회 렌더링
    renderCustomExpenses();

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
    // Add custom expenses active at age 20
    if (STATE.realityCheck.customExpenses && Array.isArray(STATE.realityCheck.customExpenses)) {
        STATE.realityCheck.customExpenses.forEach(item => {
            const start = item.startAge !== undefined ? item.startAge : 20;
            const end = item.endAge !== undefined ? item.endAge : 80;
            if (start <= 20 && end >= 20) {
                essentialSum += item.cost;
            }
        });
    }
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
    const cleanRateRange = rateRange.cloneNode(true);
    rateRange.parentNode.replaceChild(cleanRateRange, rateRange);

    cleanRateRange.value = STATE.investment.targetRate;
    document.getElementById('investment-rate-val').innerText = `연 ${STATE.investment.targetRate.toFixed(1)}%`;
    
    cleanRateRange.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        STATE.investment.targetRate = rate;
        document.getElementById('investment-rate-val').innerText = `연 ${rate.toFixed(1)}%`;
        Sound.playTick();
        drawRacingArena(0);
    });

    // 은퇴 예정 나이 슬라이더 초기화
    const retAgeRange = document.getElementById('retirement-age-range');
    const cleanRetAgeRange = retAgeRange.cloneNode(true);
    retAgeRange.parentNode.replaceChild(cleanRetAgeRange, retAgeRange);

    cleanRetAgeRange.value = STATE.retirement.age;
    document.getElementById('retirement-age-val').innerText = `${STATE.retirement.age}세`;

    cleanRetAgeRange.addEventListener('input', (e) => {
        const age = parseInt(e.target.value);
        STATE.retirement.age = age;
        document.getElementById('retirement-age-val').innerText = `${age}세`;
        Sound.playTick();
        drawRacingArena(0);
        syncStudentDataToBackend();
    });

    // 은퇴 후 월 소비액 슬라이더 초기화
    const retSpendRange = document.getElementById('retirement-spend-range');
    const cleanRetSpendRange = retSpendRange.cloneNode(true);
    retSpendRange.parentNode.replaceChild(cleanRetSpendRange, retSpendRange);

    cleanRetSpendRange.value = STATE.retirement.monthlySpend;
    document.getElementById('retirement-spend-val').innerText = `${(STATE.retirement.monthlySpend / 10000).toLocaleString('ko-KR')}만 원`;

    cleanRetSpendRange.addEventListener('input', (e) => {
        const spend = parseInt(e.target.value);
        STATE.retirement.monthlySpend = spend;
        document.getElementById('retirement-spend-val').innerText = `${(spend / 10000).toLocaleString('ko-KR')}만 원`;
        Sound.playTick();
        drawRacingArena(0);
        syncStudentDataToBackend();
    });

    // Start racing simulation button click
    const startBtn = document.getElementById('btn-start-simulation');
    const cleanStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(cleanStartBtn, startBtn);
    cleanStartBtn.addEventListener('click', startRacingSimulation);

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

    // Axis Labels (20세 ~ 80세 등분하여 표기)
    racingCtx.fillStyle = '#94A3B8';
    racingCtx.font = '11px Outfit, sans-serif';
    racingCtx.fillText('20세', 40, height - 20);
    racingCtx.fillText('40세', 50 + (20 / 60) * (width - 100) - 12, height - 20);
    racingCtx.fillText('60세', 50 + (40 / 60) * (width - 100) - 12, height - 20);
    racingCtx.fillText('80세', width - 50, height - 20);

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

    const years = 60; // 60년 시뮬레이션
    const pointsSavings = [];
    const pointsPortfolio = [];

    let currentSavings = 0;
    let currentPortfolio = 0;

    const rateSavings = 0.02; // Fixed 2%
    const ratePortfolio = STATE.investment.targetRate / 100;
    const rateGrowth = STATE.realityCheck.incomeGrowth / 100;

    // Create deep copies to track independent achievements
    const savingsBucket = STATE.bucketList.map(x => ({ ...x, achieved: false }));
    const portfolioBucket = STATE.bucketList.map(x => ({ ...x, achieved: false }));

    let savingsDepletedAge = null;
    let portfolioDepletedAge = null;

    // Create points lists year by year
    for (let yr = 0; yr <= years; yr++) {
        const age = 20 + yr;
        const activeSavingsMonthly = baseSavingsMonthly * Math.pow(1 + rateGrowth, yr);

        // Calculate custom expenses active at current age
        let activeCustomExpensesCost = 0;
        if (STATE.realityCheck.customExpenses && Array.isArray(STATE.realityCheck.customExpenses)) {
            STATE.realityCheck.customExpenses.forEach(item => {
                const start = item.startAge !== undefined ? item.startAge : 20;
                const end = item.endAge !== undefined ? item.endAge : 80;
                if (age >= start && age <= end) {
                    activeCustomExpensesCost += item.cost;
                }
            });
        }

        // 1. Savings Compounding (yearly deposit + interest or decumulation)
        if (yr > 0) {
            // Savings Track
            if (age <= STATE.retirement.age) {
                currentSavings = (currentSavings + (activeSavingsMonthly - activeCustomExpensesCost) * 12) * (1 + rateSavings);
            } else {
                const netRetirementSpend = Math.max(0, STATE.retirement.monthlySpend - 800000);
                currentSavings = currentSavings * (1 + rateSavings) - (netRetirementSpend + activeCustomExpensesCost) * 12;
            }

            // Portfolio Track
            if (age <= STATE.retirement.age) {
                currentPortfolio = (currentPortfolio + (activeSavingsMonthly - activeCustomExpensesCost) * 12) * (1 + ratePortfolio);
            } else {
                const netRetirementSpend = Math.max(0, STATE.retirement.monthlySpend - 800000);
                currentPortfolio = currentPortfolio * (1 + ratePortfolio) - (netRetirementSpend + activeCustomExpensesCost) * 12;
            }
        } else {
            // yr === 0 (20세 시점)
            if (age <= STATE.retirement.age) {
                currentSavings = (activeSavingsMonthly - activeCustomExpensesCost) * 12;
                currentPortfolio = (activeSavingsMonthly - activeCustomExpensesCost) * 12;
            } else {
                currentSavings = 0;
                currentPortfolio = 0;
            }
        }

        // 잔액이 0 이하가 되면 0원으로 고정하고 고갈 나이 기록
        if (currentSavings <= 0) {
            currentSavings = 0;
            if (savingsDepletedAge === null && age > STATE.retirement.age) {
                savingsDepletedAge = age;
            }
        }
        if (currentPortfolio <= 0) {
            currentPortfolio = 0;
            if (portfolioDepletedAge === null && age > STATE.retirement.age) {
                portfolioDepletedAge = age;
            }
        }

        // 2. Check and Withdraw for Target Age items
        const savingsWithdrawn = [];
        const portfolioWithdrawn = [];

        // Evaluate Savings track
        savingsBucket.forEach(item => {
            const itemAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
            if (itemAge === age && !item.achieved) {
                if (currentSavings >= item.cost) {
                    currentSavings -= item.cost;
                    item.achieved = true;
                    savingsWithdrawn.push(item);
                }
            }
        });

        // Evaluate Portfolio track
        portfolioBucket.forEach(item => {
            const itemAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
            if (itemAge === age && !item.achieved) {
                if (currentPortfolio >= item.cost) {
                    currentPortfolio -= item.cost;
                    item.achieved = true;
                    portfolioWithdrawn.push(item);
                }
            }
        });
        
        const xPos = 50 + (yr / years) * (width - 100);
        pointsSavings.push({ 
            x: xPos, 
            y: currentSavings, 
            val: currentSavings, 
            withdrawn: savingsWithdrawn,
            allAchieved: savingsBucket.map(x => ({...x})),
            depletedAge: savingsDepletedAge
        });
        pointsPortfolio.push({ 
            x: xPos, 
            y: currentPortfolio, 
            val: currentPortfolio, 
            withdrawn: portfolioWithdrawn,
            allAchieved: portfolioBucket.map(x => ({...x})),
            depletedAge: portfolioDepletedAge
        });
    }

    // Determine scale based on maximum historical peak value across either track
    let maxVal = 10000000;
    pointsSavings.forEach(p => { if (p.y > maxVal) maxVal = p.y; });
    pointsPortfolio.forEach(p => { if (p.y > maxVal) maxVal = p.y; });
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

    // Cache points globally for step event tickers to read
    window.pointsSavingsGlobal = pointsSavings;
    window.pointsPortfolioGlobal = pointsPortfolio;

    // 4.5 Draw Retirement Dash Line
    if (STATE.retirement.age >= 50 && STATE.retirement.age <= 70) {
        const retYr = STATE.retirement.age - 20;
        const retX = 50 + (retYr / 60) * (width - 100);
        
        racingCtx.save();
        racingCtx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Red dash line
        racingCtx.lineWidth = 1.5;
        racingCtx.setLineDash([5, 5]);
        
        racingCtx.beginPath();
        racingCtx.moveTo(retX, 20);
        racingCtx.lineTo(retX, height - 40);
        racingCtx.stroke();
        
        // 은퇴 텍스트 레이블 그리기
        racingCtx.fillStyle = '#EF4444';
        racingCtx.font = 'bold 11px Noto Sans KR, sans-serif';
        racingCtx.textAlign = 'center';
        racingCtx.fillText(`🚪 은퇴 (${STATE.retirement.age}세)`, retX, 15);
        racingCtx.restore();
    }

    // 5. Draw intermediate withdrawal markers (emojis) on the lines
    const limit = Math.ceil(progress * years);
    for (let i = 1; i <= limit; i++) {
        // Draw marker on Savings line if withdrawn
        if (pointsSavings[i] && pointsSavings[i].withdrawn && pointsSavings[i].withdrawn.length > 0) {
            const sX = pointsSavings[i].x;
            const sY = height - 40 - pointsSavings[i].y * scaleY;
            
            // Draw small marker point
            racingCtx.fillStyle = '#EF4444';
            racingCtx.beginPath();
            racingCtx.arc(sX, sY, 4, 0, Math.PI * 2);
            racingCtx.fill();
            
            // Draw first item's emoji label
            const item = pointsSavings[i].withdrawn[0];
            const catIcons = { travel: '✈️', tech: '💻', housing: '🏠', experience: '🎓', car: '🚗', hobby: '🎨', health: '🏃', contribution: '💝' };
            const emoji = catIcons[item.category] || '✨';
            
            racingCtx.fillStyle = '#FFFFFF';
            racingCtx.font = '12px Apple Color Emoji, Segoe UI Emoji, sans-serif';
            racingCtx.fillText(emoji, sX - 6, sY - 8);
        }
        
        // Draw marker on Portfolio line if withdrawn
        if (pointsPortfolio[i] && pointsPortfolio[i].withdrawn && pointsPortfolio[i].withdrawn.length > 0) {
            const pX = pointsPortfolio[i].x;
            const pY = height - 40 - pointsPortfolio[i].y * scaleY;
            
            // Draw small marker point
            racingCtx.fillStyle = '#10B981';
            racingCtx.beginPath();
            racingCtx.arc(pX, pY, 5, 0, Math.PI * 2);
            racingCtx.fill();
            
            // Draw first item's emoji label
            const item = pointsPortfolio[i].withdrawn[0];
            const catIcons = { travel: '✈️', tech: '💻', housing: '🏠', experience: '🎓', car: '🚗', hobby: '🎨', health: '🏃', contribution: '💝' };
            const emoji = catIcons[item.category] || '✨';
            
            racingCtx.fillStyle = '#FFFFFF';
            racingCtx.font = '12px Apple Color Emoji, Segoe UI Emoji, sans-serif';
            racingCtx.fillText(emoji, pX - 6, pY - 10);
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

    const years = 60; // 60년 시뮬레이션
    
    // Reset ticker styling on start
    const ticker = document.getElementById('racing-event-ticker-text');
    const tickerContainer = document.getElementById('racing-event-ticker');
    ticker.innerText = "⏱️ 시뮬레이션을 준비 중입니다...";
    ticker.style.color = '#E2E8F0';
    tickerContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
    tickerContainer.style.background = 'rgba(15, 23, 42, 0.6)';

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        racingProgress = Math.min(elapsed / duration, 1);
        
        drawRacingArena(racingProgress);

        // Update live ticker message based on intermediate events
        const activeIdx = Math.floor(racingProgress * years);
        const age = 20 + activeIdx;
        
        const savingsWithdrawn = window.pointsSavingsGlobal?.[activeIdx]?.withdrawn || [];
        const portfolioWithdrawn = window.pointsPortfolioGlobal?.[activeIdx]?.withdrawn || [];
        
        const prevIdx = Math.max(0, activeIdx - 1);
        const savingsDepletedNow = (window.pointsSavingsGlobal?.[activeIdx]?.val === 0 && window.pointsSavingsGlobal?.[prevIdx]?.val > 0);
        const portfolioDepletedNow = (window.pointsPortfolioGlobal?.[activeIdx]?.val === 0 && window.pointsPortfolioGlobal?.[prevIdx]?.val > 0);

        if (age === STATE.retirement.age) {
            ticker.innerText = `🚪 [${age}세] 직장에서 은퇴했습니다! 이제 노후 자산과 퇴직금으로 생활을 시작합니다.`;
            ticker.style.color = '#EF4444';
            tickerContainer.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            tickerContainer.style.background = 'rgba(239, 68, 68, 0.15)';
        } else if (savingsDepletedNow || portfolioDepletedNow) {
            let msg = `⚠️ [${age}세] `;
            if (savingsDepletedNow && portfolioDepletedNow) {
                msg += `예적금 및 포트폴리오 자산이 모두 고갈되었습니다! 노후 파산 발생.`;
            } else if (savingsDepletedNow) {
                msg += `예적금 자산이 고갈되었습니다! (포트폴리오는 유지 중)`;
            } else {
                msg += `포트폴리오 자산이 고갈되었습니다! (예적금은 유지 중)`;
            }
            ticker.innerText = msg;
            ticker.style.color = '#F59E0B';
            tickerContainer.style.borderColor = 'rgba(245, 158, 11, 0.6)';
            tickerContainer.style.background = 'rgba(245, 158, 11, 0.15)';
            Sound.playWarning();
        } else if (savingsWithdrawn.length > 0 || portfolioWithdrawn.length > 0) {
            let msg = `🎉 [${age}세] `;
            const items = [];
            if (savingsWithdrawn.length > 0) {
                items.push(`예적금: '${savingsWithdrawn[0].text}' 달성 (-${(savingsWithdrawn[0].cost/10000).toLocaleString('ko-KR')}만 원)`);
            }
            if (portfolioWithdrawn.length > 0) {
                items.push(`포트폴리오: '${portfolioWithdrawn[0].text}' 달성 (-${(portfolioWithdrawn[0].cost/10000).toLocaleString('ko-KR')}만 원)`);
            }
            msg += items.join(" / ");
            ticker.innerText = msg;
            ticker.style.color = '#38BDF8';
            tickerContainer.style.borderColor = 'rgba(56, 189, 248, 0.6)';
            tickerContainer.style.background = 'rgba(56, 189, 248, 0.15)';
        } else if (racingProgress < 1) {
            if (age > STATE.retirement.age) {
                ticker.innerText = `🚪 [${age}세] 은퇴 생활 중... 매달 ${Math.round(STATE.retirement.monthlySpend / 10000)}만 원씩 생활비 인출 중.`;
                ticker.style.color = '#EF4444';
                tickerContainer.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                tickerContainer.style.background = 'rgba(239, 68, 68, 0.05)';
            } else {
                ticker.innerText = `⏱️ 현재 ${age}세 지나가는 중... 차근차근 복리로 돈을 모으고 있습니다.`;
                ticker.style.color = '#E2E8F0';
                tickerContainer.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                tickerContainer.style.background = 'rgba(15, 23, 42, 0.6)';
            }
        }
        
        if (racingProgress < 1) {
            racingAnimationId = requestAnimationFrame(step);
        } else {
            STATE.investment.isSimulating = false;
            document.getElementById('btn-start-simulation').disabled = false;
            document.getElementById('sim-speed-indicator').innerText = "";
            ticker.innerText = "🏁 80세 생애 자산 시뮬레이션 완료! 아래 결과 리포트에서 노후 자금 안전성을 확인해 보세요.";
            ticker.style.color = '#10B981';
            tickerContainer.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            tickerContainer.style.background = 'rgba(16, 185, 129, 0.08)';
            finishRacingSimulation();
        }
    }
    
    Sound.playCheer();
    racingAnimationId = requestAnimationFrame(step);
}

function finishRacingSimulation() {
    const years = 60;
    
    // 1. Retrieve compiled final values from global point tables
    const finalSavingsPoint = window.pointsSavingsGlobal?.[years] || { val: 0, allAchieved: [], depletedAge: null };
    const finalPortfolioPoint = window.pointsPortfolioGlobal?.[years] || { val: 0, allAchieved: [], depletedAge: null };

    STATE.investment.savingsEnd = Math.round(finalSavingsPoint.val);
    STATE.investment.portfolioEnd = Math.round(finalPortfolioPoint.val);

    // 2. Count achievements
    const savingsList = finalSavingsPoint.allAchieved || [];
    const portfolioList = finalPortfolioPoint.allAchieved || [];

    const achievedSavingsCount = savingsList.filter(x => x.achieved).length;
    const achievedPortfolioCount = portfolioList.filter(x => x.achieved).length;

    // 3. Render Modal Content
    const gap = STATE.investment.portfolioEnd - STATE.investment.savingsEnd;
    document.getElementById('report-asset-gap').innerText = `약 +${formatKoreanCurrency(gap)}`;
    
    document.getElementById('report-savings-total').innerText = formatKoreanCurrency(STATE.investment.savingsEnd);
    document.getElementById('report-savings-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 중 ${achievedSavingsCount}개 달성`;
    
    document.getElementById('report-portfolio-total').innerText = formatKoreanCurrency(STATE.investment.portfolioEnd);
    document.getElementById('report-portfolio-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 중 ${achievedPortfolioCount}개 달성`;

    // 4. Render detailed success/failure lists
    const sListContainer = document.getElementById('report-savings-achieved-list');
    const pListContainer = document.getElementById('report-portfolio-achieved-list');

    sListContainer.innerHTML = '';
    pListContainer.innerHTML = '';

    // Render Savings details
    savingsList.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        const displayAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
        if (item.achieved) {
            li.innerHTML = `✅ <strong style="color: #CBD5E1;">${displayAge}세</strong>: ${item.text} <span style="color: #94A3B8; font-size: 11px;">(${(item.cost/10000).toLocaleString('ko-KR')}만)</span>`;
        } else {
            li.innerHTML = `❌ <span style="text-decoration: line-through; color: #64748B;">${displayAge}세: ${item.text}</span> <span style="color: #EF4444; font-size: 11px;">(자본 부족)</span>`;
        }
        sListContainer.appendChild(li);
    });

    // Render Portfolio details
    portfolioList.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        const displayAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
        if (item.achieved) {
            li.innerHTML = `✅ <strong style="color: #38BDF8;">${displayAge}세</strong>: ${item.text} <span style="color: #38BDF8; font-size: 11px;">(${(item.cost/10000).toLocaleString('ko-KR')}만)</span>`;
        } else {
            li.innerHTML = `❌ <span style="text-decoration: line-through; color: #64748B;">${displayAge}세: ${item.text}</span> <span style="color: #EF4444; font-size: 11px;">(자본 부족)</span>`;
        }
        pListContainer.appendChild(li);
    });

    // 4.5 Render Retirement Stability Diagnosis
    const statusCard = document.getElementById('report-retirement-stability-card');
    const statusEmoji = document.getElementById('report-retirement-status-emoji');
    const statusText = document.getElementById('report-retirement-status-text');

    const sDep = finalSavingsPoint.depletedAge;
    const pDep = finalPortfolioPoint.depletedAge;

    if (!sDep && !pDep) {
        statusEmoji.innerText = '🛡️';
        statusText.innerHTML = `<strong>노후 자금 안전성: 아주 우수 (생존 성공)</strong><br>은행 예적금과 투자 포트폴리오 모두 만 80세까지 안정적으로 노후 자금을 유지했습니다. 포트폴리오 투자는 복리 효과 덕분에 은퇴 시점에 훨씬 큰 자산을 축적하여 노후 생활이 더욱 풍요롭습니다!`;
        statusCard.style.borderLeft = '4px solid var(--success)';
        statusCard.style.background = 'rgba(16, 185, 129, 0.05)';
    } else if (sDep && !pDep) {
        statusEmoji.innerText = '⚠️';
        statusText.innerHTML = `<strong>노후 자금 안전성: 포트폴리오 생존 (예적금 파산)</strong><br>은행 예적금은 만 <strong>${sDep}세</strong>에 잔액이 고갈되어 노후 파산이 발생했습니다. 반면, 투자 포트폴리오는 연평균 수익률 덕분에 만 80세까지 자산이 고갈되지 않고 안정적으로 유지되었습니다! 복리 투자의 노후 자금 방어 효과를 직접 체감해 보세요.`;
        statusCard.style.borderLeft = '4px solid var(--warning)';
        statusCard.style.background = 'rgba(245, 158, 11, 0.05)';
    } else if (!sDep && pDep) {
        statusEmoji.innerText = '⚠️';
        statusText.innerHTML = `<strong>노후 자금 안전성: 예적금 생존 (포트폴리오 파산)</strong><br>투자 포트폴리오는 설정된 기대 수익률이 너무 낮거나 자산 배분이 부적절하여 만 <strong>${pDep}세</strong>에 잔액이 조기 고갈되었습니다. 반면 예적금은 원금이 서서히 줄어들면서 80세까지 살아남았습니다. 투자 설계와 은퇴 자금 조절이 필요합니다.`;
        statusCard.style.borderLeft = '4px solid var(--warning)';
        statusCard.style.background = 'rgba(245, 158, 11, 0.05)';
    } else {
        statusEmoji.innerText = '🚨';
        statusText.innerHTML = `<strong>노후 자금 안전성: 위험 (양대 자산 모두 조기 고갈)</strong><br>은행 예적금(만 <strong>${sDep}세</strong> 고갈)과 투자 포트폴리오(만 <strong>${pDep}세</strong> 고갈) 모두 만 80세 이전에 노후 자금이 바닥나 파산했습니다. 은퇴 시기를 늦추거나, 은퇴 후 소비를 줄이거나, 은퇴 전 월 드림 저축액을 늘려서 노후 계획을 재조정해야 합니다!`;
        statusCard.style.borderLeft = '4px solid var(--danger)';
        statusCard.style.background = 'rgba(239, 68, 68, 0.05)';
    }

    // Visual configurations for subtext summary
    if (achievedPortfolioCount === STATE.bucketList.length) {
        document.getElementById('report-portfolio-achieved').innerText = `버킷리스트 ${STATE.bucketList.length}개 모두 달성 완료! 🎉`;
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
        syncStudentDataToBackend(true); // set completed status
    };
    
    document.getElementById('btn-report-restart').onclick = () => {
        reportModal.style.display = 'none';
        startRacingSimulation();
    };

    document.getElementById('btn-report-print').onclick = () => {
        Sound.playSuccess();
        downloadFinancialReport();
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
            dreamSaving: STATE.realityCheck.dreamSaving,
            incomeGrowth: STATE.realityCheck.incomeGrowth,
            customExpenses: STATE.realityCheck.customExpenses || []
        },
        retirement: {
            age: STATE.retirement.age,
            monthlySpend: STATE.retirement.monthlySpend
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
    // Automatically save Gemini API Key from URL query parameter for easy testing
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key') || urlParams.get('gemini_key');
    if (urlKey) {
        localStorage.setItem('gemini_api_key', urlKey.trim());
        // Clean URL parameter from address bar
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("Gemini API Key successfully registered from URL parameter!");
        alert("Gemini AI API 키가 성공적으로 자동 연동 등록되었습니다! 🚀");
    }

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

function downloadFinancialReport() {
    const sEnd = STATE.investment.savingsEnd || 0;
    const pEnd = STATE.investment.portfolioEnd || 0;
    const bTotal = STATE.bucketList.length;
    const pAchieved = STATE.investment.achievedPortfolioCount || 0;
    const sAchieved = STATE.investment.achievedSavingsCount || 0;

    const listHtml = STATE.bucketList.map((item, idx) => {
        const costMan = (item.cost / 10000).toLocaleString('ko-KR') + '만 원';
        const displayAge = item.targetAge || (item.ageGroup === '20s' ? 25 : item.ageGroup === '30s' ? 35 : 45);
        return `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.category === 'travel' ? '✈️ 여행' : item.category === 'tech' ? '💻 쇼핑/IT' : item.category === 'housing' ? '🏠 주거' : item.category === 'experience' ? '🎓 경험' : item.category === 'car' ? '🚗 자동차' : item.category === 'health' ? '🏃 건강' : item.category === 'contribution' ? '💝 가족/기부' : '🎨 자기개발'}</td>
                <td style="text-align: left;"><strong>${item.text}</strong></td>
                <td>${displayAge}세</td>
                <td style="text-align: right; font-weight: bold;">${costMan}</td>
            </tr>
        `;
    }).join('');

    const customListHtml = (STATE.realityCheck.customExpenses && STATE.realityCheck.customExpenses.length > 0)
        ? STATE.realityCheck.customExpenses.map((item, idx) => {
            const costMan = (item.cost / 10000).toLocaleString('ko-KR') + '만 원';
            const startAge = item.startAge !== undefined ? item.startAge : 20;
            const endAge = item.endAge !== undefined ? item.endAge : 80;
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align: left;"><strong>${item.name}</strong></td>
                    <td>${startAge}세 ~ ${endAge}세</td>
                    <td style="text-align: right; font-weight: bold;">${costMan}</td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="4" style="color: #64748B; padding: 15px;">추가된 기타 고정 지출이 없습니다.</td></tr>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${STATE.studentName} 학생의 생애 주기 재무 설계 보고서</title>
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; color: #1E293B; line-height: 1.6; padding: 40px; background: #F8FAFC; }
        .report-card { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .header { text-align: center; border-bottom: 3px double #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 28px; color: #1D4ED8; margin: 0; }
        .header p { font-size: 14px; color: #64748B; margin: 5px 0 0 0; }
        .section-title { font-size: 18px; font-weight: 800; border-left: 5px solid #3B82F6; padding-left: 10px; margin: 30px 0 15px 0; color: #0F172A; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #F1F5F9; padding: 15px; border-radius: 8px; font-size: 14px; }
        .info-item strong { display: block; font-size: 16px; color: #1E293B; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th, td { border: 1px solid #CBD5E1; padding: 10px; text-align: center; }
        th { background: #F8FAFC; font-weight: bold; }
        .result-box { background: #EFF6FF; border: 1px dashed #3B82F6; border-radius: 8px; padding: 20px; margin-top: 20px; font-size: 14.5px; }
        .result-title { font-size: 16px; font-weight: 700; color: #1D4ED8; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 20px; }
        @media print {
            body { background: white; padding: 0; }
            .report-card { border: none; box-shadow: none; padding: 0; }
            .btn-print-trigger { display: none; }
        }
        .btn-print-trigger { display: inline-block; background: #3B82F6; color: white; border: none; padding: 12px 24px; font-size: 15px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-bottom: 20px; transition: background 0.2s; }
        .btn-print-trigger:hover { background: #1D4ED8; }
    </style>
</head>
<body>
    <div style="text-align: center;">
        <button class="btn-print-trigger" onclick="window.print()">🖨️ PDF 저장 및 보고서 인쇄하기</button>
    </div>
    <div class="report-card">
        <div class="header">
            <h1>생애 재무설계 & 자산관리 보고서</h1>
            <p>Life-Balance Simulator - 청소년 금융교육 솔루션</p>
        </div>

        <div class="info-grid">
            <div class="info-item">학생 본인 이름: <strong>${STATE.studentName}</strong></div>
            <div class="info-item">접속 세션 번호: <strong>${STATE.sessionId}</strong></div>
        </div>

        <div class="section-title">1. 생애 재무 설계 설정 값</div>
        <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="info-item">미래 예상 월 수입<strong>${(STATE.realityCheck.income / 10000).toLocaleString('ko-KR')}만 원</strong></div>
            <div class="info-item">연평균 소득 상승률<strong>연 ${STATE.realityCheck.incomeGrowth.toFixed(1)}%</strong></div>
            <div class="info-item">월 드림 저축액<strong>${(STATE.realityCheck.dreamSaving / 10000).toLocaleString('ko-KR')}만 원</strong></div>
        </div>
        <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="info-item">포트폴리오 목표 수익률<strong>연 ${STATE.investment.targetRate.toFixed(1)}%</strong></div>
            <div class="info-item">🚪 은퇴 계획 나이<strong>${STATE.retirement.age}세</strong></div>
            <div class="info-item">💸 은퇴 후 월 소비액<strong>${(STATE.retirement.monthlySpend / 10000).toLocaleString('ko-KR')}만 원</strong></div>
        </div>
        <div style="font-size: 12px; color: #64748B; margin-top: -10px; margin-bottom: 20px;">
            * 은퇴 후 국가 복지 혜택으로 <strong>월 80만 원</strong>의 국민연금 연계 하한선 유입 혜택이 적용된 재무 설계안입니다.
        </div>

        <div class="section-title">1-2. 추가 고정 지출 (기타 고정 지출)</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">번호</th>
                    <th>지출 항목명</th>
                    <th style="width: 180px;">지출 대상 연령</th>
                    <th style="width: 150px;">월 지출액</th>
                </tr>
            </thead>
            <tbody>
                ${customListHtml}
            </tbody>
        </table>

        <div class="section-title">2. 미래 꿈 설계 목록 (버킷리스트)</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">번호</th>
                    <th style="width: 130px;">카테고리</th>
                    <th>목표 꿈의 내용</th>
                    <th style="width: 100px;">목표 나이</th>
                    <th style="width: 140px;">예상 필요 자금</th>
                </tr>
            </thead>
            <tbody>
                ${listHtml}
            </tbody>
        </table>

        <div class="section-title">3. 60년 시뮬레이션 최종 실행 결과 (20세 ~ 80세)</div>
        <div class="info-grid">
            <div class="info-item" style="border-left: 4px solid #94A3B8;">
                🅰️ 은행 예적금 결과 (연 2.0% 고정)
                <strong>만 80세 최종 자산: ${formatKoreanCurrency(sEnd)}</strong>
                <span style="font-size: 13px; color: #64748B;">버킷리스트 달성율: ${sAchieved} / ${bTotal}개</span>
            </div>
            <div class="info-item" style="border-left: 4px solid #3B82F6;">
                🅱️ 투자 포트폴리오 결과 (연 ${STATE.investment.targetRate}% 목표)
                <strong>만 80세 최종 자산: ${formatKoreanCurrency(pEnd)}</strong>
                <span style="font-size: 13px; color: #64748B;">버킷리스트 달성율: ${pAchieved} / ${bTotal}개</span>
            </div>
        </div>

        <div class="result-box">
            <div class="result-title">💡 종합 재무 진단 및 피드백</div>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                ${document.getElementById('report-retirement-status-text').innerText}
            </p>
        </div>

        <div class="footer">
            본 시뮬레이션 결과는 가상의 시나리오를 바탕으로 산출된 모의 데이터이며 실제 금융 상품의 수익률을 보장하지 않습니다.<br>
            Edu Life-Balance Simulator | 청소년 금융 교육 솔루션
        </div>
    </div>
    
    <script>
        // 자동으로 인쇄 창 띄우기
        window.onload = () => {
            setTimeout(() => { window.print(); }, 600);
        };
    </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${STATE.studentName}_생애재무설계_보고서.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Start application loading
window.addEventListener('DOMContentLoaded', initApp);
