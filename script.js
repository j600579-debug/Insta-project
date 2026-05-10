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
        submitToGoogleForms();
        chatInput.disabled = true;
        chatSend.disabled = true;
        setTimeout(() => {
            chatEndScreen.classList.remove('hidden-ui');
            chatEndScreen.innerHTML = `
                <h2 class="glow-text" style="text-align:center;">Your answers have been sent ❤️</h2>
                <button id="chat-reset-btn" class="cta-button" style="margin-top: 30px; transform: scale(0.8);">
                    <span class="btn-text">Send Another ❤️</span>
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
        }, 1000);
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

function submitToGoogleForms() {
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfVNefmgfV4JD1g5XFfJxwuebJM8KkmbzmJB_0C6gIRNlkqAg/formResponse';

    // Create hidden iframe for completely invisible and caching-free submission across all platforms
    let iframe = document.getElementById('hidden_iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formUrl;
    form.target = 'hidden_iframe';

    // Map userAnswers to Google Form entry IDs
    const mappings = {
        'entry.410506505': userAnswers[1],
        'entry.1095566401': userAnswers[2],
        'entry.1902765972': userAnswers[3],
        'entry.966538598': userAnswers[4],
        'entry.699195259': userAnswers[5],
        'entry.63854159': userAnswers[6],
        'entry.292160866': userAnswers[7],
        'entry.1277309211': userAnswers[8],
        'entry.211960386': userAnswers[9]
    };

    for (const [key, value] of Object.entries(mappings)) {
        if (value !== undefined && value !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
    }

    // Append unique dummy param to force no caching
    const tsInput = document.createElement('input');
    tsInput.type = 'hidden';
    tsInput.name = 'submit_time';
    tsInput.value = Date.now();
    form.appendChild(tsInput);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
        if (form.parentNode) form.parentNode.removeChild(form);
    }, 1500);
}

// =========================================
// SECTION 2: LOVE QUIZ LOGIC
// =========================================
const quizQuestions = [
    { q: "En favorite color enna? 🎨", opts: ["Black 🖤", "Blue 💙", "Pink 💖", "Red ❤️"], ans: 0 },
    { q: "Enakku romba pidicha food enna? 🍕", opts: ["Biryani 🍗", "Pizza 🍕", "Noodles 🍜", "Ice Cream 🍦"], ans: 0 },
    { q: "Naan most ah use panra word enna? 😅", opts: ["Seri 🤷‍♀️", "Achoo 🥺", "Poda 😂", "Miss you ❤️"], ans: 2 },
    { q: "Namma first chat enga start aachu? 💬", opts: ["Instagram 📸", "WhatsApp 💚", "Snapchat 👻", "Facebook 💙"], ans: 0 },
    { q: "En favorite time to talk? 🌙", opts: ["Morning ☀️", "Afternoon 🕛", "Evening 🌆", "Late Night 🌙"], ans: 3 },
    { q: "Naan kovama irundha enna pannuva? 😏", opts: ["Ignore panven", "Fight panven", "Silent aagiduven", "Cry panven"], ans: 2 },
    { q: "En dream place ethu? ✈️", opts: ["Paris 🗼", "Maldives 🏖️", "Switzerland 🏔️", "Bali 🌴"], ans: 1 },
    { q: "Enakku romba pidicha song type? 🎵", opts: ["Melody 🎶", "Kuthu 🥁", "Rap 🎤", "Sad 💔"], ans: 0 },
    { q: "Enna pathi unakku first pidichadhu enna? ❤️", opts: ["Smile 😊", "Eyes 👀", "Character 💖", "Voice 🗣️"], ans: 0 },
    { q: "Namma relationship la cutest moment ethu? 🌸", opts: ["First Meet 🤝", "First Text 💬", "First Call 📞", "Every Second ♾️"], ans: 3 }
];

let quizIndex = 0;
let quizScore = 0;

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
