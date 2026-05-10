// --- 1. SCENE SETUP ---
const canvasContainer = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030305, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
canvasContainer.appendChild(renderer.domElement);

// --- 2. LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x111122, 1);
scene.add(ambientLight);

const pinkLight = new THREE.PointLight(0xff007f, 5, 50);
pinkLight.position.set(5, 5, 5);
scene.add(pinkLight);

const purpleLight = new THREE.PointLight(0x8a2be2, 5, 50);
purpleLight.position.set(-5, -5, 5);
scene.add(purpleLight);

const blueLight = new THREE.PointLight(0x00d2ff, 2, 50);
blueLight.position.set(0, -10, -5);
scene.add(blueLight);

// --- 3. 3D HEART MODEL ---
const heartShape = new THREE.Shape();
const x = 0, y = 0;
heartShape.moveTo(x + 5, y + 5);
heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

const extrudeSettings = { depth: 3, bevelEnabled: true, bevelSegments: 10, steps: 2, bevelSize: 1.5, bevelThickness: 1.5 };
const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

geometry.computeBoundingBox();
const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
geometry.translate(centerOffset, -10, -1.5);
geometry.rotateX(Math.PI);

const material = new THREE.MeshStandardMaterial({
    color: 0xff007f,
    emissive: 0x330011,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.9,
});

const heart = new THREE.Mesh(geometry, material);
const isMobile = window.innerWidth <= 768;
let targetHeartX = isMobile ? 0 : 8;
heart.position.set(targetHeartX, 0, 0);
heart.scale.set(0.6, 0.6, 0.6);
scene.add(heart);

const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x8a2be2, wireframe: true, transparent: true, opacity: 0.15 });
const wireframeHeart = new THREE.Mesh(geometry, wireframeMaterial);
wireframeHeart.scale.set(0.65, 0.65, 0.65);
heart.add(wireframeHeart);

// --- 4. PARTICLES (GALAXY & STARS) ---
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const posArray = new Float32Array(particlesCount * 3);
const colorsArray = new Float32Array(particlesCount * 3);

const color1 = new THREE.Color(0xff007f);
const color2 = new THREE.Color(0x8a2be2);
const color3 = new THREE.Color(0xffffff);

for (let i = 0; i < particlesCount * 3; i += 3) {
    const radius = Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i + 2] = radius * Math.cos(phi);

    const mixedColor = color1.clone();
    const rand = Math.random();
    if (rand > 0.66) mixedColor.lerp(color2, Math.random());
    else if (rand > 0.33) mixedColor.lerp(color3, Math.random());

    colorsArray[i] = mixedColor.r;
    colorsArray[i + 1] = mixedColor.g;
    colorsArray[i + 2] = mixedColor.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

const particlesMaterial = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- 5. FLOATING ORBS ---
const orbsGroup = new THREE.Group();
const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const orbColors = [0xff007f, 0x8a2be2, 0x00d2ff];

for (let i = 0; i < 20; i++) {
    const orbMat = new THREE.MeshBasicMaterial({ color: orbColors[Math.floor(Math.random() * orbColors.length)], transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const orb = new THREE.Mesh(orbGeometry, orbMat);

    orb.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50);
    orb.userData = { speed: Math.random() * 0.01 + 0.005, radius: Math.random() * 15 + 5, angle: Math.random() * Math.PI * 2, yOffset: orb.position.y, ySpeed: Math.random() * 0.5 + 0.5 };
    orbsGroup.add(orb);
}
scene.add(orbsGroup);

// --- 6. INTERACTION & RESPONSIVE ---
let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
const windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

window.addEventListener('resize', () => {
    const isMobileNow = window.innerWidth <= 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (currentView === 'home') {
        targetHeartX = isMobileNow ? 0 : 8;
        gsap.to(heart.position, { x: targetHeartX, duration: 1 });
    }
});

// --- 7. UI STATE MANAGEMENT & GSAP ANIMATIONS ---
const homeUI = document.querySelectorAll('.home-ui');
const menuContainer = document.getElementById('menu-container');
const sectionsContainer = document.getElementById('sections-container');
const hologramCards = document.querySelectorAll('.hologram-card');
const igniteBtn = document.getElementById('ignite-btn');
const backBtn = document.getElementById('back-to-menu');
const allSections = document.querySelectorAll('.section-panel');

let currentView = 'home';

gsap.set('.hero-title', { opacity: 0, y: 50 });
gsap.set('.hero-subtitle', { opacity: 0, y: 30 });
gsap.set('.cta-button', { opacity: 0, y: 20, scale: 0.9 });
gsap.set('.header', { opacity: 0, y: -20 });
gsap.set('.footer', { opacity: 0, y: 20 });
heart.scale.set(0, 0, 0);

const introTl = gsap.timeline();
introTl.to(camera.position, { z: 22, duration: 3.5, ease: "power3.out" })
    .to(heart.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 2, ease: "elastic.out(1, 0.5)" }, "-=2.5")
    .to('.header', { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=2")
    .to('.hero-title', { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, "-=1.5")
    .to('.hero-subtitle', { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=1")
    .to('.cta-button', { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, "-=0.8")
    .to('.footer', { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.5");

igniteBtn.addEventListener('click', () => {
    if (currentView !== 'home') return;
    currentView = 'menu';

    // Start background music
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        bgAudio.volume = 0.4;
        bgAudio.play().catch(e => console.log("Autoplay prevented:", e));
    }

    gsap.to(homeUI, {
        opacity: 0, y: -30, duration: 0.8, stagger: 0.1, ease: "power2.in",
        onComplete: () => homeUI.forEach(el => el.classList.add('hidden-ui'))
    });

    gsap.to(camera.position, { x: 0, y: 0, z: 35, duration: 2.5, ease: "power3.inOut" });
    gsap.to(heart.position, { x: 0, y: 2, z: -10, duration: 2.5, ease: "power3.inOut" });

    menuContainer.classList.remove('hidden-ui');
    gsap.fromTo(menuContainer, { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.8 });
    gsap.fromTo('.menu-title', { opacity: 0, y: -50, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.5)", delay: 1.2 });
    gsap.fromTo(hologramCards, { opacity: 0, scale: 0.5, y: 100, rotationX: 45 }, { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)", delay: 1.5 });
});

hologramCards.forEach(card => {
    card.addEventListener('click', () => {
        if (currentView !== 'menu') return;
        const targetId = card.getAttribute('data-target');
        currentView = 'section';

        gsap.to(menuContainer, { opacity: 0, scale: 1.1, duration: 0.6, ease: "power2.in", onComplete: () => menuContainer.classList.add('hidden-ui') });
        gsap.to(camera.position, { x: -8, y: -2, z: 15, duration: 2, ease: "power3.inOut" });
        gsap.to(heart.position, { x: 12, y: 0, z: -20, duration: 2, ease: "power3.inOut" });

        sectionsContainer.classList.remove('hidden-ui');
        gsap.fromTo(sectionsContainer, { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.5 });

        allSections.forEach(sec => sec.classList.add('hidden-section'));
        const targetSection = document.getElementById(targetId);
        targetSection.classList.remove('hidden-section');

        gsap.fromTo(targetSection, { opacity: 0, y: 50, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 1, ease: "back.out(1.2)" });
        gsap.fromTo(backBtn, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, delay: 1.5, ease: "power2.out" });

        // Initialize specific section logic
        if (targetId === 'section-chat') {
            if (chatIndex === 0 && chatMessages.innerHTML.trim() === '') {
                setTimeout(nextChatQuestion, 1500); // start chat after transition
            }
        } else if (targetId === 'section-quiz') {
            if (quizIndex === 0) {
                loadQuizQuestion();
            }
        } else if (targetId === 'section-photo') {
            setTimeout(initPhotoGalaxy, 1000); // Wait for transition before loading images
        } else if (targetId === 'section-quotes') {
            setTimeout(startQuotesSlideshow, 1000);
        } else if (targetId === 'section-proposal') {
            setTimeout(startProposalScene, 1000);
        } else if (targetId === 'section-forever') {
            setTimeout(startForeverScene, 1000);
        } else if (targetId === 'section-timeline') {
            setTimeout(startTimelineScene, 1000);
        } else if (targetId === 'section-feedback') {
            setTimeout(startFeedbackScene, 1000);
        }
    });
});

backBtn.addEventListener('click', () => {
    if (currentView !== 'section') return;
    currentView = 'menu';

    gsap.to(sectionsContainer, { opacity: 0, duration: 0.6, ease: "power2.in", onComplete: () => sectionsContainer.classList.add('hidden-ui') });
    gsap.to(camera.position, { x: 0, y: 0, z: 35, duration: 2, ease: "power3.inOut" });
    gsap.to(heart.position, { x: 0, y: 2, z: -10, duration: 2, ease: "power3.inOut" });

    menuContainer.classList.remove('hidden-ui');
    gsap.fromTo(menuContainer, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, delay: 0.8, ease: "power2.out" });
    gsap.fromTo(hologramCards, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, delay: 1, ease: "power2.out" });
});


// =========================================
// SECTION 1: LOVE CHAT LOGIC
// =========================================
const chatQuestions = [
    "First msg nyabagam irukka? ❤️",
    "First time enna paatha aprm enna feel pannenga?",
    "Yaaru first fall aana? 😏",
    "En kitte unakku romba pidicha vishayam enna?",
    "Late night calls ah illa texts ah?",
    "Namma cutest memory ethu? 🌸",
    "En nickname unakku pidikuma? 😅",
    "Enna miss panna enna pannuva? ❤️",
    "One word la namma relationship ah describe pannunga ✨",
    "Forever kooda irupeengala? ♾️❤️"
];

let chatIndex = 0;
let userAnswers = [];
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatStatus = document.getElementById('chat-status');
const chatEndScreen = document.getElementById('chat-end-screen');

function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'msg received typing-msg';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    return div;
}

function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    gsap.from(div, { opacity: 0, y: 20, duration: 0.5, ease: "back.out(1.5)" });
    return div;
}

function nextChatQuestion() {
    if (chatIndex >= chatQuestions.length) {
        // Build mailto body
        let emailBody = "Here are my answers to your love questions! ❤️\n\n";
        chatQuestions.forEach((q, idx) => {
            emailBody += `Q: ${q}\nA: ${userAnswers[idx] || 'No Answer'}\n\n`;
        });
        
        const mailtoLink = `mailto:j600579@gmail.com?subject=${encodeURIComponent("New Love Universe Submission ❤️")}&body=${encodeURIComponent(emailBody)}`;
        
        // Automatically open the user's mail client
        window.location.href = mailtoLink;

        chatInput.disabled = true;
        chatSend.disabled = true;
        chatStatus.innerText = 'Online in Universe';

        chatEndScreen.classList.remove('hidden-ui');
        chatEndScreen.innerHTML = `
            <h2 class="glow-text" style="text-align:center;">Your answers have been prepared! ❤️<br><span style="font-size: 0.5em; opacity: 0.8;">(Check your mail app)</span></h2>
            <button type="button" id="chat-reset-btn" class="cta-button" style="margin-top: 30px; transform: scale(0.8);">
                <span class="btn-text">Play Again ❤️</span>
                <div class="btn-glow"></div>
            </button>
        `;
        gsap.fromTo(chatEndScreen, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.5, ease: "back.out(1.2)" });

        const resetBtn = document.getElementById('chat-reset-btn');
        resetBtn.addEventListener('click', resetChat);
        resetBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resetChat();
        }, { passive: false });

        return;
    }

    chatStatus.innerText = 'typing...';
    const typing = createTypingIndicator();
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        typing.remove();
        appendMessage(chatQuestions[chatIndex], 'received');
        chatStatus.innerText = 'Online in Universe';
    }, 1800);
}

function handleChatSend() {
    if (chatSend.disabled) return;
    const text = chatInput.value.trim();
    if (!text) return;

    chatSend.disabled = true;
    chatInput.disabled = true;

    appendMessage(text, 'sent');
    userAnswers.push(text);
    chatInput.value = '';

    // Floating heart reaction
    createFloatingHeartReaction(chatInput);

    chatIndex++;
    setTimeout(() => {
        if (chatIndex < chatQuestions.length) {
            chatSend.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
        nextChatQuestion();
    }, 800);
}

function resetChat() {
    chatIndex = 0;
    userAnswers = [];
    chatMessages.innerHTML = '';
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatEndScreen.classList.add('hidden-ui');
    chatEndScreen.style.opacity = 0;
    setTimeout(nextChatQuestion, 500);
}

chatSend.addEventListener('click', handleChatSend);
chatSend.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleChatSend();
}, { passive: false });
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSend();
});

function createFloatingHeartReaction(referenceEl) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerText = '💖';

    const rect = referenceEl.getBoundingClientRect();
    heart.style.left = (rect.right - 40) + 'px';
    heart.style.top = (rect.top - 20) + 'px';

    document.body.appendChild(heart);

    gsap.to(heart, {
        y: -150,
        opacity: 0,
        scale: 1.5,
        duration: 2,
        ease: "power2.out",
        onComplete: () => heart.remove()
    });
}



// =========================================
// SECTION 2: LOVE QUIZ LOGIC
// =========================================
const quizQuestions = [
    { q: "En favorite food enna? 🍕", opts: ["Pizza", "Burger", "Biryani", "Shawarma"], ans: 2 },
    { q: "Naan romba use panra word enna? 😅", opts: ["Seri", "Mm", "Dei", "Hello"], ans: 1 },
    { q: "Namma first chat enga start aachu? 💬", opts: ["WhatsApp", "Snapchat", "Instagram", "Telegram"], ans: 2 },
    { q: "Enakku romba pidicha color enna? 🎨", opts: ["Red", "Black", "Blue", "White"], ans: 2 },
    { q: "Namma first meet date nyabagam irukka? ❤️", opts: ["21.04", "10.08", "14.02", "01.01"], ans: 0 },
    { q: "Enakku pidicha late night activity enna? 🌙", opts: ["Gaming", "Sleeping", "Calling", "Watching reels"], ans: 1 },
    { q: "Naan kovama irundha usually enna pannuva? 😶", opts: ["Silent ah irupen", "Fight pannuven", "“mm” nu solve", "Offline poiduven"], ans: 2 },
    { q: "En favorite song type enna? 🎵", opts: ["Arabic Kuthu", "Vellicha Poove", "Rowdy Baby", "Nee Kavithaigala"], ans: 1 },
    { q: "Namma relationship la cutest memory ethu? 🥹", opts: ["Caring", "Fight", "First Block", "Ignore"], ans: 1 },
    { q: "Naan unakku vachiruka nickname enna? 😄", opts: ["Kutty", "Baby", "Pappa", "Nickname vekkave illa"], ans: 3 }
];

let quizIndex = 0;
let quizScore = 0;
let userQuizAnswers = [];

const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsEl = document.getElementById('quiz-options');
const quizProgressEl = document.getElementById('quiz-progress');
const quizActiveScreen = document.getElementById('quiz-active-screen');
const quizResultScreen = document.getElementById('quiz-result-screen');
const quizPercentageEl = document.getElementById('quiz-percentage');
const quizResultMsgEl = document.getElementById('quiz-result-msg');

function loadQuizQuestion() {
    if (quizIndex >= quizQuestions.length) {
        showQuizResult();
        return;
    }

    const q = quizQuestions[quizIndex];
    quizQuestionEl.innerText = q.q;
    quizOptionsEl.innerHTML = '';

    // Update progress bar
    const progress = ((quizIndex) / quizQuestions.length) * 100;
    quizProgressEl.style.width = `${progress}%`;

    q.opts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.innerText = opt;
        btn.onclick = () => handleQuizAnswer(idx, q.ans);
        quizOptionsEl.appendChild(btn);
    });

    gsap.from(quizQuestionEl, { opacity: 0, y: -10, duration: 0.4 });
    gsap.from('.quiz-btn', { opacity: 0, y: 15, duration: 0.4, stagger: 0.05 });
}

function handleQuizAnswer(selected, correct) {
    userQuizAnswers.push(quizQuestions[quizIndex].opts[selected]);
    if (selected === correct) quizScore++;
    quizIndex++;
    loadQuizQuestion();
}

function showQuizResult() {
    quizProgressEl.style.width = `100%`;

    setTimeout(() => {
        quizActiveScreen.style.display = 'none';
        quizResultScreen.classList.remove('hidden-ui');

        const percentage = Math.round((quizScore / quizQuestions.length) * 100);
        quizPercentageEl.innerText = `${percentage}%`;

        let msg = "";
        if (percentage >= 90) msg = "Soulmate Level Connection ❤️";
        else if (percentage >= 70) msg = "True Love Energy ✨";
        else if (percentage >= 50) msg = "Cute Couple Vibes 🌸";
        else msg = "Still Learning About Each Other 😅❤️";

        quizResultMsgEl.innerText = msg;

        gsap.fromTo(quizResultScreen, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.2)" });

        createHeartExplosion();

        // Build mailto string and automatically open mail app after animation
        setTimeout(() => {
            let emailBody = `Here are my Love Quiz results! ❤️\n\nFinal Score: ${percentage}%\n\n`;
            quizQuestions.forEach((q, idx) => {
                emailBody += `Q: ${q.q}\nMy Answer: ${userQuizAnswers[idx]}\nCorrect Answer: ${q.opts[q.ans]}\n\n`;
            });

            const mailtoLink = `mailto:j600579@gmail.com?subject=${encodeURIComponent("My Love Score Quiz Results ❤️")}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = mailtoLink;
        }, 3500);

    }, 500);
}

function createHeartExplosion() {
    const emojis = ['💖', '✨', '🌸', '🔥', '💍', '🚀'];
    for (let i = 0; i < 40; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        heart.style.left = `50%`;
        heart.style.top = `50%`;

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * window.innerWidth * 0.6;
        const tx = Math.cos(angle) * radius;
        const ty = Math.sin(angle) * radius;

        document.body.appendChild(heart);

        gsap.to(heart, {
            x: tx,
            y: ty,
            opacity: 0,
            rotation: Math.random() * 360,
            scale: Math.random() * 1.5 + 0.5,
            duration: Math.random() * 2 + 1.5,
            ease: "power3.out",
            onComplete: () => heart.remove()
        });
    }
}


// =========================================
// SECTION 3: PHOTO GALAXY LOGIC
// =========================================
const photoCarousel = document.getElementById('photo-carousel');
const photoLightbox = document.getElementById('photo-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxOverlay = document.getElementById('lightbox-overlay');

const photos = [
    'assets/photo1.jpeg',
    'assets/photo2.jpeg',
    'assets/photo3.jpeg',
    'assets/photo4.jpeg',
    'assets/photo5.jpeg',
    'assets/photo6.jpeg',
    'assets/photo7.jpeg'
];

function initPhotoGalaxy() {
    if (photoCarousel.children.length > 0) return; // already loaded

    const totalPhotos = photos.length;
    const radius = window.innerWidth <= 768 ? 200 : 350; // Dynamic radius for mobile

    photos.forEach((src, idx) => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        // Arrange photos in a 3D cylinder
        const angle = (360 / totalPhotos) * idx;
        card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Memory ${idx + 1}`;
        
        card.appendChild(img);
        photoCarousel.appendChild(card);

        // Lightbox trigger
        card.addEventListener('click', () => {
            lightboxImg.src = src;
            photoLightbox.classList.remove('hidden-ui');
            gsap.fromTo(photoLightbox, { opacity: 0 }, { opacity: 1, duration: 0.5 });
            gsap.fromTo(lightboxImg, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)", delay: 0.1 });
        });
    });
}

function closeLightbox() {
    gsap.to(lightboxImg, { scale: 0.8, opacity: 0, duration: 0.4, ease: "power2.in" });
    gsap.to(photoLightbox, { opacity: 0, duration: 0.4, delay: 0.2, onComplete: () => {
        photoLightbox.classList.add('hidden-ui');
        lightboxImg.src = '';
    }});
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', closeLightbox);


// --- 8. ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.002;
    targetY = mouseY * 0.002;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    heart.rotation.y = elapsedTime * 0.3;
    heart.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
    heart.position.y += Math.sin(elapsedTime * 1.5) * 0.01;

    particlesMesh.rotation.y = elapsedTime * 0.03;
    particlesMesh.rotation.x = elapsedTime * 0.01;

    orbsGroup.children.forEach(orb => {
        orb.userData.angle += orb.userData.speed;
        orb.position.x = Math.cos(orb.userData.angle) * orb.userData.radius;
        orb.position.z = Math.sin(orb.userData.angle) * orb.userData.radius;
        orb.position.y = orb.userData.yOffset + Math.sin(elapsedTime * orb.userData.ySpeed) * 2;
    });

    pinkLight.intensity = 4 + Math.sin(elapsedTime * 2) * 1.5;
    purpleLight.intensity = 4 + Math.cos(elapsedTime * 1.5) * 1.5;

    wireframeHeart.material.opacity = 0.15 + Math.sin(elapsedTime * 4) * 0.1;

    renderer.render(scene, camera);
}

animate();

// =========================================
// SECTION 4: MUSIC & VOICE LOGIC
// =========================================
const bgAudio = document.getElementById('bg-audio');
const musicPlayPauseBtn = document.getElementById('music-play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const vinylRecord = document.getElementById('vinyl-record');
const musicVisualizer = document.getElementById('music-visualizer');

if (musicPlayPauseBtn && bgAudio) {
    // Robust mobile looping fallback
    bgAudio.addEventListener('ended', () => {
        bgAudio.currentTime = 0;
        bgAudio.play().catch(e => console.log("Loop replay prevented:", e));
    });

    musicPlayPauseBtn.addEventListener('click', () => {
        if (bgAudio.paused) {
            bgAudio.play();
            iconPlay.style.display = 'none';
            iconPause.style.display = 'block';
            vinylRecord.classList.remove('paused');
            musicVisualizer.classList.remove('paused');
            
            // Add a little floating pulse effect to the button when played
            gsap.fromTo(musicPlayPauseBtn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
        } else {
            bgAudio.pause();
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
            vinylRecord.classList.add('paused');
            musicVisualizer.classList.add('paused');
            
            gsap.fromTo(musicPlayPauseBtn, { scale: 1.1 }, { scale: 1, duration: 0.4, ease: "power2.out" });
        }
    });

    // Check actual audio state initially in case autoplay was blocked
    bgAudio.addEventListener('play', () => {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        vinylRecord.classList.remove('paused');
        musicVisualizer.classList.remove('paused');
    });

    bgAudio.addEventListener('pause', () => {
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
        vinylRecord.classList.add('paused');
        musicVisualizer.classList.add('paused');
    });
}

// =========================================
// SECTION 5: LOVE QUOTES LOGIC
// =========================================
const loveQuotes = [
    "“Nee irukura varaikum dhaan life ku meaning iruku ❤️”",
    "“Namma memories ellam enakku favourite universe 🌌”",
    "“Love na nee dhaan 😮💨❤️”",
    "“Un kooda pesama oru naalum complete ah feel aagadhu 🥹”",
    "“Namma relationship enakku safest place ❤️”",
    "“Un smile patha aprm ellame calm ah aagidum ✨”",
    "“Forever nu sonna first ah nyabagam varadhu nee dhaan ♾️❤️”",
    "“Namma chats la dhaan en happiest moments iruku 💬✨”",
    "“Distance irundhalum feel eppovum close dhaan ❤️”",
    "“Nee vandhadhuku aprm dhaan life colourful ah maariduchu 🌸”"
];

let currentQuoteIndex = 0;
let quoteInterval;
const quoteTextEl = document.getElementById('quote-text');
const quoteCardEl = document.getElementById('quote-card');

function showNextQuote() {
    gsap.to(quoteTextEl, {
        opacity: 0,
        y: -10,
        duration: 0.5,
        onComplete: () => {
            currentQuoteIndex = (currentQuoteIndex + 1) % loveQuotes.length;
            quoteTextEl.innerText = loveQuotes[currentQuoteIndex];
            
            // Randomize card glow color for variety
            const colors = ['rgba(255,0,127,0.2)', 'rgba(138,43,226,0.2)', 'rgba(0,210,255,0.2)'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            gsap.to(quoteCardEl, { boxShadow: `0 15px 35px rgba(255, 0, 127, 0.15), inset 0 0 20px ${randomColor}`, duration: 1 });

            gsap.fromTo(quoteTextEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        }
    });
}

function startQuotesSlideshow() {
    if (quoteTextEl.innerText === 'Loading...') {
        quoteTextEl.innerText = loveQuotes[0];
        gsap.fromTo(quoteTextEl, { opacity: 0 }, { opacity: 1, duration: 1 });
        
        quoteInterval = setInterval(showNextQuote, 5000); // Change quote every 5 seconds
    }
}

// =========================================
// SECTION 6: PROPOSAL SCENE LOGIC
// =========================================
function startProposalScene() {
    const pStep1 = document.getElementById('prop-step-1');
    const pStep2 = document.getElementById('prop-step-2');
    const pStep3 = document.getElementById('prop-step-3');
    const pStep4 = document.getElementById('prop-step-4');
    const yesBtn = document.getElementById('proposal-yes-btn');
    
    // Ensure music is playing globally
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio && bgAudio.paused) bgAudio.play().catch(e => console.log(e));

    const tl = gsap.timeline();
    
    // Step 1: Glowing text
    pStep1.classList.remove('hidden-ui');
    tl.fromTo(pStep1, { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 2.5, ease: "power2.out" })
      .to(pStep1, { opacity: 0, y: -30, scale: 1.1, filter: 'blur(10px)', duration: 1.5, delay: 3, ease: "power2.in" });
      
    // Step 2: Floating Photos
    tl.add(() => {
        pStep1.classList.add('hidden-ui');
        pStep2.classList.remove('hidden-ui');
    });
    tl.fromTo('.prop-photo.p1', { opacity: 0, x: -100, rotation: -30 }, { opacity: 1, x: 0, rotation: -10, duration: 1.5, ease: "back.out(1.2)" })
      .fromTo('.prop-photo.p2', { opacity: 0, x: 100, rotation: 30 }, { opacity: 1, x: 0, rotation: 15, duration: 1.5, ease: "back.out(1.2)" }, "-=1.2")
      .fromTo('.prop-photo.p3', { opacity: 0, y: 100, rotation: 0 }, { opacity: 1, y: 0, rotation: 5, duration: 1.5, ease: "back.out(1.2)" }, "-=1.2")
      .to(pStep2, { opacity: 0, scale: 1.2, duration: 1.5, delay: 3.5, ease: "power2.in" });

    // Step 3: Emotional Text
    tl.add(() => {
        pStep2.classList.add('hidden-ui');
        pStep3.classList.remove('hidden-ui');
    });
    tl.fromTo(pStep3, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 2.5, ease: "power2.out" })
      .to(pStep3, { opacity: 0, filter: 'blur(10px)', duration: 1.5, delay: 3, ease: "power2.in" });

    // Step 4: Final Question & Button
    tl.add(() => {
        pStep3.classList.add('hidden-ui');
        pStep4.classList.remove('hidden-ui');
        // Slowly bring the 3D heart closer in the background
        gsap.to(heart.position, { z: -5, y: 2, duration: 5, ease: "power2.inOut" });
        gsap.to(heart.scale, { x: 1, y: 1, z: 1, duration: 5, ease: "power2.inOut" });
    });
    tl.fromTo(pStep4, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 2, ease: "back.out(1.2)" });

    yesBtn.addEventListener('click', () => {
        gsap.to(pStep4, { opacity: 0, scale: 1.5, duration: 1, ease: "power2.in", onComplete: () => pStep4.classList.add('hidden-ui') });
        
        // Emotional Ending Transition
        createHeartExplosion();
        createHeartExplosion(); // Double explosion for finale
        
        // Final screen
        setTimeout(() => {
            const finalScreen = document.createElement('div');
            finalScreen.innerHTML = '<h1 class="glow-text text-center" style="font-size: 4rem; text-shadow: 0 0 50px var(--neon-pink);">She said YES ❤️♾️</h1><p style="color:var(--text-muted); font-size:1.5rem; letter-spacing:0.2em; text-transform:uppercase;">The Universe is Complete</p>';
            finalScreen.style.position = 'absolute';
            finalScreen.style.top = '0';
            finalScreen.style.left = '0';
            finalScreen.style.width = '100%';
            finalScreen.style.height = '100%';
            finalScreen.style.display = 'flex';
            finalScreen.style.flexDirection = 'column';
            finalScreen.style.justifyContent = 'center';
            finalScreen.style.alignItems = 'center';
            finalScreen.style.zIndex = '1000';
            finalScreen.style.background = 'rgba(2,2,5,0.8)';
            finalScreen.style.backdropFilter = 'blur(10px)';
            
            document.getElementById('section-proposal').appendChild(finalScreen);
            
            gsap.fromTo(finalScreen, { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.inOut" });
            
            // Send email notification silently
            fetch('https://formsubmit.co/ajax/j600579@gmail.com', {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: "PROPOSAL ACCEPTED ❤️💍",
                    Message: "She just clicked YES in the Love Universe! ♾️❤️"
                })
            }).catch(e => console.log(e));
        }, 1500);
    });
}

// =========================================
// SECTION 7: FOREVER ENDING LOGIC
// =========================================
function startForeverScene() {
    const fPhotos = document.getElementById('forever-photos');
    const fText1 = document.getElementById('forever-text-1');
    const fChats = document.getElementById('forever-chats');
    const fText2 = document.getElementById('forever-text-2');
    const fInfinity = document.getElementById('forever-infinity');
    const fTextFinal = document.getElementById('forever-text-final');

    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        if (bgAudio.paused) bgAudio.play().catch(e => console.log(e));
        gsap.to(bgAudio, { volume: 0.8, duration: 5 }); // Increase volume emotionally
    }

    const tl = gsap.timeline();

    // 1. Dark glowing universe
    tl.to(scene.background || document.body, { backgroundColor: '#020005', duration: 2 });
    gsap.to(heart.position, { z: -30, duration: 15, ease: "linear" }); // push heart deep into background

    // 2. Floating Photos
    fPhotos.classList.remove('hidden-ui');
    tl.fromTo('.f-photo', { opacity: 0, scale: 0.8, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(2px)', duration: 3, stagger: 0.5, ease: "power2.out" })
      .to('.f-photo', { opacity: 0, filter: 'blur(15px)', duration: 2, delay: 2, ease: "power2.in" });

    // 3. Text 1
    tl.add(() => {
        fPhotos.classList.add('hidden-ui');
        fText1.classList.remove('hidden-ui');
    });
    tl.fromTo(fText1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2.5, ease: "power2.out" })
      .to(fText1, { opacity: 0, y: -20, duration: 2, delay: 3, ease: "power2.in" });

    // 4. Floating Chats
    tl.add(() => {
        fText1.classList.add('hidden-ui');
        fChats.classList.remove('hidden-ui');
    });
    tl.fromTo('.f-chat', { opacity: 0, scale: 0.5, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 2, stagger: 0.6, ease: "back.out(1.5)" })
      .to('.f-chat', { opacity: 0, scale: 1.2, duration: 1.5, delay: 2.5, ease: "power2.in" });

    // 5. Text 2
    tl.add(() => {
        fChats.classList.add('hidden-ui');
        fText2.classList.remove('hidden-ui');
    });
    tl.fromTo(fText2, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 3, ease: "power2.out" })
      .to(fText2, { opacity: 0, duration: 2, delay: 3.5, ease: "power2.in" });

    // 6. Infinity Symbol + Final Text
    tl.add(() => {
        fText2.classList.add('hidden-ui');
        fInfinity.classList.remove('hidden-ui');
        fTextFinal.classList.remove('hidden-ui');
        createHeartExplosion();
    });
    tl.fromTo(fInfinity, { opacity: 0, scale: 0, rotationY: 90 }, { opacity: 1, scale: 1, rotationY: 0, duration: 2.5, ease: "elastic.out(1, 0.5)" })
      .fromTo(fTextFinal, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, "-=1.5");

    // 7. Dramatic Fade Out & Email Trigger
    tl.to([fInfinity, fTextFinal], { opacity: 0, filter: 'blur(20px)', duration: 4, delay: 5, ease: "power3.in" })
      .add(() => {
          // Final soft music fade out
          if (bgAudio) gsap.to(bgAudio, { volume: 0, duration: 5, onComplete: () => bgAudio.pause() });

          // Cinematic Final Message
          const endingMsg = document.createElement('h1');
          endingMsg.className = 'glow-text text-center cinematic-text';
          endingMsg.innerHTML = "Your love story has been successfully completed ❤️";
          endingMsg.style.position = 'absolute';
          endingMsg.style.top = '50%';
          endingMsg.style.left = '50%';
          endingMsg.style.transform = 'translate(-50%, -50%)';
          endingMsg.style.width = '100%';
          endingMsg.style.fontSize = window.innerWidth <= 768 ? '1.8rem' : '3rem';
          endingMsg.style.zIndex = '1000';
          endingMsg.style.opacity = '0';
          document.getElementById('section-forever').appendChild(endingMsg);

          createHeartExplosion();

          gsap.to(endingMsg, { opacity: 1, duration: 2, ease: "power2.inOut", onComplete: () => {
              setTimeout(() => {
                  // Format Email Body
                  let scorePercent = Math.round((quizScore / quizQuestions.length) * 100);
                  if (isNaN(scorePercent)) scorePercent = 0; // Fallback if quiz wasn't taken

                  let emailBody = "Every memory, every moment, every feeling…\n";
                  emailBody += "finally became a beautiful universe ❤️🌌\n\n";
                  emailBody += "--- LOVE UNIVERSE REPORT ---\n\n";
                  emailBody += `Final Love Score: ${scorePercent}% ❤️\n\n`;

                  if (userQuizAnswers && userQuizAnswers.length > 0) {
                      emailBody += "Quiz Answers:\n";
                      quizQuestions.forEach((q, i) => {
                          const ans = userQuizAnswers[i] ? userQuizAnswers[i] : 'Skipped';
                          emailBody += `Q${i+1}: ${q.q}\nAns: ${ans}\n\n`;
                      });
                  }

                  emailBody += "Memories Explored:\n";
                  emailBody += "- First Chat ❤️\n- First Call 🌙\n- Favorite Song 🎵\n- Forever Promise ♾️\n\n";
                  emailBody += "Thank you for completing the universe! 🌌✨";

                  // Trigger Mail App
                  const subject = encodeURIComponent("Our Love Universe Completed! ❤️♾️");
                  const body = encodeURIComponent(emailBody);
                  const mailtoLink = `mailto:j600579@gmail.com?subject=${subject}&body=${body}`;
                  
                  window.location.href = mailtoLink;
              }, 4000); // Wait 4 seconds for them to read the message before opening email
          }});
      });
}

// =========================================
// SECTION 8: LOVE TIMELINE LOGIC
// =========================================
function startTimelineScene() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Create an intersection observer to trigger GSAP animations when scrolling
    const observerOptions = {
        root: document.querySelector('.timeline-container'),
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the item is visible
    };

    const timelineObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine direction based on class
                const isLeft = entry.target.classList.contains('left');
                const xOffset = isLeft ? -50 : 50;

                gsap.fromTo(entry.target, 
                    { opacity: 0, x: xOffset, y: 30 }, 
                    { opacity: 1, x: 0, y: 0, duration: 1, ease: "back.out(1.2)" }
                );
                
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initial state: hide them and observe
    timelineItems.forEach(item => {
        gsap.set(item, { opacity: 0 }); // ensure hidden before scroll
        timelineObserver.observe(item);
    });
}

// =========================================
// SECTION 9: FINAL FEEDBACK LOGIC
// =========================================
function startFeedbackScene() {
    const step1 = document.getElementById('fb-step-1');
    const step2 = document.getElementById('fb-step-2');
    const stepForm = document.getElementById('fb-step-form');
    const stepSuccess = document.getElementById('fb-step-success');
    const fbName = document.getElementById('fb-name');
    const fbMessage = document.getElementById('fb-message');
    const fbBtn = document.getElementById('fb-submit-btn');

    // Ensure music continues
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio && bgAudio.paused) bgAudio.play().catch(e => console.log(e));

    const tl = gsap.timeline();

    // 1. Darken background and float heart away
    tl.to(scene.background || document.body, { backgroundColor: '#020005', duration: 2 });
    gsap.to(heart.position, { z: -30, duration: 10, ease: "linear" }); 

    // 2. Intro Text 1
    step1.classList.remove('hidden-ui');
    tl.fromTo(step1, { opacity: 0, y: 30, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 3, ease: "power2.out" })
      .to(step1, { opacity: 0, y: -20, filter: 'blur(10px)', duration: 2, delay: 3, ease: "power2.in" });

    // 3. CTA Text 2
    tl.add(() => {
        step1.classList.add('hidden-ui');
        step2.classList.remove('hidden-ui');
    });
    tl.fromTo(step2, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 2.5, ease: "power2.out" })
      .to(step2, { opacity: 0, filter: 'blur(5px)', duration: 2, delay: 3, ease: "power2.in" });

    // 4. Show Form
    tl.add(() => {
        step2.classList.add('hidden-ui');
        stepForm.classList.remove('hidden-ui');
    });
    tl.fromTo(stepForm, { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 2, ease: "back.out(1.2)", onComplete: () => {
        // Auto-focus logic with typing effect placeholder
        fbName.focus();
    }});

    // Add glowing particle reaction when typing
    fbMessage.addEventListener('input', () => {
        gsap.to(particlesMesh.rotation, { y: "+=0.05", duration: 0.5 });
        gsap.to(pinkLight, { intensity: 6, duration: 0.5, yoyo: true, repeat: 1 });
    });

    // Form Submit
    fbBtn.addEventListener('click', () => {
        const nameVal = fbName.value.trim() || 'Anonymous Love';
        const msgVal = fbMessage.value.trim();

        if (!msgVal) {
            gsap.fromTo(fbMessage, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 5 });
            return;
        }

        // Change button state
        const btnText = fbBtn.querySelector('.btn-text');
        btnText.innerText = 'Sending to Universe... ✨';
        gsap.to(fbBtn, { scale: 0.95, duration: 0.2 });

        // Calculate final score
        let scorePercent = Math.round((quizScore / quizQuestions.length) * 100);
        if (isNaN(scorePercent)) scorePercent = 0;

        // Build Email Content
        let emailBody = `Feedback:\n${msgVal}\n\n`;
        emailBody += `--- Details ---\n`;
        emailBody += `Name: ${nameVal}\n`;
        emailBody += `Final Love Score: ${scorePercent}% ❤️\n`;

        const subject = encodeURIComponent("New Emotional Feedback ❤️");
        const body = encodeURIComponent(emailBody);
        const mailtoLink = `mailto:j600579@gmail.com?subject=${subject}&body=${body}`;

        // Trigger Mail App
        window.location.href = mailtoLink;

        // Trigger Success Scene
        gsap.to(stepForm, { opacity: 0, scale: 1.1, duration: 1, ease: "power2.in", onComplete: () => {
            stepForm.classList.add('hidden-ui');
            stepSuccess.classList.remove('hidden-ui');
            
            createHeartExplosion();
            createHeartExplosion();

            gsap.fromTo(stepSuccess, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2, ease: "power2.out" });
            
            // Slow fade out universe
            gsap.to(particlesMesh.material, { opacity: 0, duration: 10 });
            gsap.to([pinkLight, purpleLight], { intensity: 0, duration: 10 });
        }});
    });
}
