(function () {
  "use strict";

  const TITLE_BEFORE = "Oct 20 · Find the Perspective";
  const TITLE_AFTER = "Happy Birthday Yihan Lu! — Oct 20 · rbtree";
  document.title = TITLE_BEFORE;

  const START_POS = new THREE.Vector3(90, 2, 120);
  const START_LON = 196;
  const WIN_POS = new THREE.Vector3(0, 2, 0);
  const WIN_LON = 90;
  const CLOUD_CENTER = new THREE.Vector3(0, 2, 92);

  const SKY_COLOR = 0xe5e5e5;
  const GROUND_COLOR = 0x656567;

  const container = document.getElementById("game_area");
  const celebrationCanvas = document.getElementById("celebration-canvas");
  const celebrationCtx = celebrationCanvas ? celebrationCanvas.getContext("2d") : null;
  const alignmentIndicatorEl = document.getElementById("alignment-indicator");
  const alignmentPctEl = document.getElementById("alignment-pct");
  const alignmentFillEl = document.getElementById("alignment-line-fill");
  const blessingEl = document.getElementById("blessing-message");
  const envelopeOverlay = document.getElementById("envelope-overlay");
  const envelopeWrapper = document.getElementById("envelope-wrapper");

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.5, 1000);
  camera.position.copy(START_POS);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(SKY_COLOR, 1);
  container.appendChild(renderer.domElement);

  // Ground (dynamically positioned in handleResize so "Yihan Lu!" always has generous breathing space above the dividing line)
  const groundMaterial = new THREE.MeshBasicMaterial({ color: GROUND_COLOR });
  const groundGeometry = new THREE.BoxGeometry(800, 1, 200);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(10, -9.0, 80);
  scene.add(ground);

  // 4 Tetrahedron Face Materials (exact original hex palette)
  const matFront = new THREE.MeshBasicMaterial({
    color: 0xbd0045,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const matSide1 = new THREE.MeshBasicMaterial({ color: 0xe84f77, side: THREE.DoubleSide });
  const matSide2 = new THREE.MeshBasicMaterial({ color: 0xffc30c, side: THREE.DoubleSide });
  const matSide3 = new THREE.MeshBasicMaterial({ color: 0xffd762, side: THREE.DoubleSide });

  // Build 3D Tetrahedrons into 4 batched BufferGeometries
  function buildPolyhedra() {
    const polyData = window.POLYHEDRON_DATA || [];
    const posFront = [];
    const posSide1 = [];
    const posSide2 = [];
    const posSide3 = [];

    const pushTri = (arr, a, b, c) => {
      arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    };

    const rayEps = 0.00022;
    const sideRecess = 0.0025;

    for (let i = 0; i < polyData.length; i++) {
      const vlist = polyData[i];
      const v0 = vlist[0];
      const v1 = vlist[1];
      const v2 = vlist[2];
      const v3 = vlist[3];

      const u0 = v0[0] / v0[2], w0 = (v0[1] - 2.0) / v0[2];
      const u1 = v1[0] / v1[2], w1 = (v1[1] - 2.0) / v1[2];
      const u2 = v2[0] / v2[2], w2 = (v2[1] - 2.0) / v2[2];
      const uc = (u0 + u1 + u2) / 3.0;
      const wc = (w0 + w1 + w2) / 3.0;

      const dilateVertex = (v, u, w) => {
        const du = u - uc;
        const dw = w - wc;
        const len = Math.hypot(du, dw) || 1;
        const uNew = u + (du / len) * rayEps;
        const wNew = w + (dw / len) * rayEps;
        return [uNew * v[2], 2.0 + wNew * v[2], v[2]];
      };

      const f0 = dilateVertex(v0, u0, w0);
      const f1 = dilateVertex(v1, u1, w1);
      const f2 = dilateVertex(v2, u2, w2);

      const recessVertex = (v) => [
        v[0] + sideRecess * (v3[0] - v[0]),
        v[1] + sideRecess * (v3[1] - v[1]),
        v[2] + sideRecess * (v3[2] - v[2]),
      ];

      const s0 = recessVertex(v0);
      const s1 = recessVertex(v1);
      const s2 = recessVertex(v2);

      pushTri(posFront, f2, f1, f0);
      pushTri(posSide1, s0, v3, s2);
      pushTri(posSide2, s1, v3, s0);
      pushTri(posSide3, s2, v3, s1);
    }

    const addBatchMesh = (positions, material) => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mesh = new THREE.Mesh(geom, material);
      scene.add(mesh);
    };

    addBatchMesh(posFront, matFront);
    addBatchMesh(posSide1, matSide1);
    addBatchMesh(posSide2, matSide2);
    addBatchMesh(posSide3, matSide3);
  }

  buildPolyhedra();

  // Build 3D Ground Signature Mesh ("Oct 20 · rbtree")
  const signatureColorStart = new THREE.Color(GROUND_COLOR);
  const signatureColorEnd = new THREE.Color(0xf5f5f5);
  const signatureMaterial = new THREE.MeshBasicMaterial({
    color: GROUND_COLOR,
    side: THREE.DoubleSide,
  });
  let signatureMesh = null;

  function buildSignatureMesh() {
    const sigTris = window.SIGNATURE_TRIS || [];
    const positions = [];
    const pivotX = -9.96;
    const pivotY = 1.4417;
    for (let i = 0; i < sigTris.length; i++) {
      const t = sigTris[i];
      positions.push(
        t[0][0] - pivotX, t[0][1] - pivotY, t[0][2],
        t[1][0] - pivotX, t[1][1] - pivotY, t[1][2],
        t[2][0] - pivotX, t[2][1] - pivotY, t[2][2]
      );
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    signatureMesh = new THREE.Mesh(geom, signatureMaterial);
    signatureMesh.position.set(pivotX, 0.52, 0);
    signatureMesh.visible = false;
    scene.add(signatureMesh);
  }

  buildSignatureMesh();

  // 100% Alignment Celebration System (Gold Dust & Geometric Confetti Ribbons)
  const celebrationState = {
    active: false,
    flashAlpha: 0,
    particles: [],
  };

  const CELEBRATION_PALETTE = [
    "#ffd762", // Light Gold
    "#ffc30c", // Warm Gold
    "#fff4cf", // Champagne Gold
    "#e84f77", // Rose Pink
    "#ff6b93", // Soft Coral Rose
    "#bd0045", // Crimson
  ];

  function clearCelebration() {
    celebrationState.active = false;
    celebrationState.flashAlpha = 0;
    celebrationState.particles.length = 0;
    if (celebrationCtx && celebrationCanvas) {
      celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
    }
  }

  function triggerCelebrationBurst() {
    if (!celebrationCtx || !celebrationCanvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    celebrationState.active = true;
    celebrationState.flashAlpha = 0.26;
    celebrationState.particles.length = 0;

    // 1. Confetti ribbons & geometric facets bursting from left/right arcs and center banner
    const ribbonCount = 105;
    for (let i = 0; i < ribbonCount; i++) {
      const fromCenter = i < 45;
      const originX = fromCenter
        ? w * (0.24 + Math.random() * 0.52)
        : (i % 2 === 0 ? w * 0.14 : w * 0.86) + (Math.random() - 0.5) * 60;
      const originY = fromCenter
        ? h * (0.28 + Math.random() * 0.24)
        : h * (0.48 + (Math.random() - 0.5) * 0.12);

      const baseAngle = fromCenter
        ? -Math.PI / 2 + (Math.random() - 0.5) * 1.65
        : i % 2 === 0
        ? -Math.PI * 0.34 + (Math.random() - 0.5) * 0.55
        : -Math.PI * 0.66 + (Math.random() - 0.5) * 0.55;

      const speed = (fromCenter ? 260 : 520) + Math.random() * 440;
      const shapeRoll = Math.random();
      const shape = shapeRoll < 0.52 ? "ribbon" : shapeRoll < 0.85 ? "triangle" : "diamond";

      celebrationState.particles.push({
        type: shape,
        x: originX,
        y: originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed - 60,
        gravity: 340 + Math.random() * 160,
        drag: 0.962 + Math.random() * 0.018,
        size: shape === "ribbon" ? 9 + Math.random() * 6 : 8 + Math.random() * 5.5,
        aspect: shape === "ribbon" ? 0.36 + Math.random() * 0.22 : 1,
        color: CELEBRATION_PALETTE[Math.floor(Math.random() * CELEBRATION_PALETTE.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 5.5,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 3.5 + Math.random() * 5.5,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 2.2 + Math.random() * 2.2,
        swayAmp: 22 + Math.random() * 34,
        age: 0,
        life: 3.2 + Math.random() * 1.6,
      });
    }

    // 2. Shimmering gold dust particles floating around the letters
    const dustCount = 65;
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 260;
      celebrationState.particles.push({
        type: "dust",
        x: w * (0.2 + Math.random() * 0.6),
        y: h * (0.18 + Math.random() * 0.38),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        gravity: 48 + Math.random() * 55,
        drag: 0.955,
        size: 1.8 + Math.random() * 2.8,
        color: i % 3 === 0 ? "#ffffff" : "#ffe285",
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 6 + Math.random() * 7,
        age: 0,
        life: 2.6 + Math.random() * 1.8,
      });
    }
  }

  function updateAndRenderCelebration(delta) {
    if (!celebrationState.active || !celebrationCtx || !celebrationCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = celebrationCanvas.width / dpr;
    const h = celebrationCanvas.height / dpr;

    celebrationCtx.save();
    celebrationCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    celebrationCtx.clearRect(0, 0, w, h);

    // Subtle warm golden highlight flash on 100% lock-in
    if (celebrationState.flashAlpha > 0.002) {
      const grad = celebrationCtx.createRadialGradient(
        w * 0.5,
        h * 0.36,
        10,
        w * 0.5,
        h * 0.36,
        Math.max(w, h) * 0.65
      );
      grad.addColorStop(0, `rgba(255, 232, 160, ${celebrationState.flashAlpha})`);
      grad.addColorStop(0.55, `rgba(255, 215, 98, ${celebrationState.flashAlpha * 0.45})`);
      grad.addColorStop(1, "rgba(255, 215, 98, 0)");
      celebrationCtx.fillStyle = grad;
      celebrationCtx.fillRect(0, 0, w, h);
      celebrationState.flashAlpha *= Math.exp(-3.8 * delta);
    } else {
      celebrationState.flashAlpha = 0;
    }

    let aliveCount = 0;
    const stepScale = Math.min(delta * 60, 2.5);

    for (let i = 0; i < celebrationState.particles.length; i++) {
      const p = celebrationState.particles[i];
      p.age += delta;
      if (p.age >= p.life) continue;
      aliveCount++;

      const dragFactor = Math.pow(p.drag, stepScale);
      p.vx *= dragFactor;
      p.vy = p.vy * dragFactor + p.gravity * delta;

      const lifeRatio = p.age / p.life;
      const fadeAlpha = lifeRatio > 0.68 ? Math.max(0, 1 - (lifeRatio - 0.68) / 0.32) : 1;

      if (p.type === "dust") {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        const twinkle = 0.45 + 0.55 * Math.sin(p.twinklePhase + p.age * p.twinkleSpeed);
        const alpha = fadeAlpha * twinkle;
        if (alpha <= 0.01) continue;

        celebrationCtx.save();
        celebrationCtx.globalAlpha = alpha;
        const glow = celebrationCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2);
        glow.addColorStop(0, p.color);
        glow.addColorStop(0.4, "rgba(255, 215, 98, 0.55)");
        glow.addColorStop(1, "rgba(255, 215, 98, 0)");
        celebrationCtx.fillStyle = glow;
        celebrationCtx.beginPath();
        celebrationCtx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
        celebrationCtx.fill();
        celebrationCtx.restore();
      } else {
        const swayVel = Math.cos(p.swayPhase + p.age * p.swayFreq) * p.swayAmp;
        p.x += (p.vx + swayVel) * delta;
        p.y += p.vy * delta;
        p.rotation += p.rotSpeed * delta;
        p.tilt += p.tiltSpeed * delta;

        const scaleY = Math.max(0.14, Math.abs(Math.cos(p.tilt)));
        celebrationCtx.save();
        celebrationCtx.globalAlpha = fadeAlpha * 0.94;
        celebrationCtx.translate(p.x, p.y);
        celebrationCtx.rotate(p.rotation);
        celebrationCtx.scale(1, scaleY);
        celebrationCtx.fillStyle = p.color;

        const s = p.size;
        if (p.type === "ribbon") {
          celebrationCtx.fillRect(-s, -s * p.aspect, s * 2, s * 2 * p.aspect);
        } else if (p.type === "triangle") {
          celebrationCtx.beginPath();
          celebrationCtx.moveTo(0, -s);
          celebrationCtx.lineTo(s * 0.9, s * 0.75);
          celebrationCtx.lineTo(-s * 0.9, s * 0.75);
          celebrationCtx.closePath();
          celebrationCtx.fill();
        } else {
          celebrationCtx.beginPath();
          celebrationCtx.moveTo(0, -s);
          celebrationCtx.lineTo(s * 0.75, 0);
          celebrationCtx.lineTo(0, s);
          celebrationCtx.lineTo(-s * 0.75, 0);
          celebrationCtx.closePath();
          celebrationCtx.fill();
        }
        celebrationCtx.restore();
      }
    }

    celebrationCtx.restore();

    if (aliveCount === 0 && celebrationState.flashAlpha === 0) {
      celebrationState.active = false;
      celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
    }
  }

  // Camera state & controls
  const state = {
    envelopeOpen: false,
    envelopeAnimating: false,
    passedTen: false,
    lon: START_LON,
    lat: 0,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    lookLon: 0,
    velForward: 0,
    velStrafe: 0,
    velLon: 0,
    movementSpeed: 22.0,
    lookSpeed: 48.0,
    mode: "explore", // "explore" | "autopilot" | "locked"
    autopilot: {
      elapsed: 0,
      duration: 4.0,
      startR: 94.25,
      startAlpha: 0,
      startLon: START_LON,
      endR: 92.0,
      endAlpha: -Math.PI / 2,
      endLon: WIN_LON,
    },
    lockIn: {
      elapsed: 0,
      duration: 1.15,
      startX: 0,
      startZ: 0,
      startLon: START_LON,
      lonDelta: 0,
      titleUpdated: false,
      blessingShown: false,
    },
    timers: [],
  };

  function clearAllTimers() {
    while (state.timers.length > 0) {
      clearTimeout(state.timers.pop());
    }
  }

  // Opening Envelope Animation
  function openEnvelope(instant) {
    if (state.envelopeOpen) return;
    if (instant) {
      state.envelopeOpen = true;
      state.envelopeAnimating = false;
      document.body.classList.remove("envelope-active");
      if (envelopeOverlay) {
        envelopeOverlay.classList.add("is-hidden");
      }
      return;
    }
    if (state.envelopeAnimating) return;
    state.envelopeAnimating = true;

    if (envelopeWrapper) {
      envelopeWrapper.classList.add("is-opening");
    }

    setTimeout(() => {
      document.body.classList.remove("envelope-active");
      if (envelopeOverlay) {
        envelopeOverlay.classList.add("is-fading");
      }
      state.envelopeOpen = true;
      state.envelopeAnimating = false;
    }, 1450);

    setTimeout(() => {
      if (envelopeOverlay) {
        envelopeOverlay.classList.add("is-hidden");
      }
    }, 2450);
  }

  if (envelopeOverlay) {
    envelopeOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      openEnvelope(false);
    });
  }

  function normalizeLon(lon) {
    return ((lon % 360) + 360) % 360;
  }

  function shortestAngleDiff(fromDeg, toDeg) {
    return ((((toDeg - fromDeg) % 360) + 540) % 360) - 180;
  }

  function updateCameraLook() {
    state.lat = Math.max(-85, Math.min(85, state.lat));
    const phi = THREE.MathUtils.degToRad(90 - state.lat);
    const theta = THREE.MathUtils.degToRad(state.lon);

    const targetX = camera.position.x + 100 * Math.sin(phi) * Math.cos(theta);
    const targetY = camera.position.y + 100 * Math.cos(phi);
    const targetZ = camera.position.z + 100 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(targetX, targetY, targetZ);
  }

  function clampCameraBounds() {
    if (camera.position.x > 110) camera.position.x = 110;
    if (camera.position.x < -90) camera.position.x = -90;
    if (camera.position.z > 180) camera.position.z = 180;
    if (camera.position.z < -20) camera.position.z = -20;
    camera.position.y = 2;
  }

  function updateAlignmentIndicator() {
    const dist = camera.position.distanceTo(WIN_POS);
    const lonMod = normalizeLon(state.lon);
    const angErr = Math.abs(shortestAngleDiff(lonMod, WIN_LON));

    const posScore = Math.max(0, 1 - dist / 150);
    const angScore = Math.max(0, 1 - angErr / 106);
    let pct = Math.round((posScore * 0.72 + angScore * 0.28) * 100);
    if (state.mode === "locked" || (dist < 0.05 && angErr < 0.2)) {
      pct = 100;
    } else {
      pct = Math.min(99, Math.max(0, pct));
    }

    if (alignmentPctEl) alignmentPctEl.textContent = pct + "%";
    if (alignmentFillEl) alignmentFillEl.style.width = pct + "%";
    if (alignmentIndicatorEl) {
      alignmentIndicatorEl.classList.toggle("near-lock", pct >= 82);
      if (pct > 10 && !state.passedTen) {
        state.passedTen = true;
        alignmentIndicatorEl.classList.add("past-10");
      }
    }
  }

  // Trigger high-framerate lock-in, tab title change, signature fade-in, and blessing reveal
  function triggerWinLockIn() {
    if (state.mode === "locked") return;
    clearAllTimers();
    state.mode = "locked";
    state.moveForward = false;
    state.moveBackward = false;
    state.moveLeft = false;
    state.moveRight = false;
    state.lookLon = 0;
    state.velForward = 0;
    state.velStrafe = 0;
    state.velLon = 0;
    document.body.classList.add("locked-in");

    const startLon = normalizeLon(state.lon);
    state.lockIn.elapsed = 0;
    state.lockIn.duration = 1.15;
    state.lockIn.startX = camera.position.x;
    state.lockIn.startZ = camera.position.z;
    state.lockIn.startLon = startLon;
    state.lockIn.lonDelta = shortestAngleDiff(startLon, WIN_LON);
    state.lockIn.titleUpdated = false;
    state.lockIn.blessingShown = false;

    signatureMaterial.color.copy(signatureColorStart);
    if (signatureMesh) {
      signatureMesh.visible = true;
    }
  }

  // Konami Code Autopilot ("↑ ↑ ↓ ↓ ← → ← → B A")
  function startCheatAutopilot() {
    openEnvelope(true);
    clearAllTimers();
    clearCelebration();

    state.moveForward = false;
    state.moveBackward = false;
    state.moveLeft = false;
    state.moveRight = false;
    state.lookLon = 0;
    state.velForward = 0;
    state.velStrafe = 0;
    state.velLon = 0;

    // If already near (0, 2, 0), reset to start first so full animation can be inspected
    if (camera.position.distanceTo(WIN_POS) < 8) {
      camera.position.copy(START_POS);
      state.lon = START_LON;
      state.lat = 0;
      updateCameraLook();
    }

    document.title = TITLE_BEFORE;
    document.body.classList.remove("locked-in", "show-blessing");
    if (signatureMesh) {
      signatureMesh.visible = false;
    }
    signatureMaterial.color.copy(signatureColorStart);

    const dx = camera.position.x - CLOUD_CENTER.x;
    const dz = camera.position.z - CLOUD_CENTER.z;
    const r0 = Math.max(10, Math.hypot(dx, dz));
    const alpha0 = Math.atan2(dz, dx);
    const lon0 = normalizeLon(state.lon);

    let targetAlpha = -Math.PI / 2;
    while (targetAlpha - alpha0 > Math.PI) targetAlpha -= 2 * Math.PI;
    while (targetAlpha - alpha0 < -Math.PI) targetAlpha += 2 * Math.PI;

    state.autopilot.elapsed = 0;
    state.autopilot.duration = 4.0;
    state.autopilot.startR = r0;
    state.autopilot.startAlpha = alpha0;
    state.autopilot.endR = 92.0;
    state.autopilot.endAlpha = targetAlpha;
    state.autopilot.startLon = lon0;
    state.autopilot.endLon = lon0 + shortestAngleDiff(lon0, WIN_LON);

    state.mode = "autopilot";
  }

  const KONAMI_SEQUENCE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "KeyB",
    "KeyA",
  ];
  let konamiBuffer = [];

  // Keyboard listeners
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // Track Konami Code sequence at all times
    konamiBuffer.push(event.code);
    if (konamiBuffer.length > KONAMI_SEQUENCE.length) {
      konamiBuffer.shift();
    }
    if (
      konamiBuffer.length === KONAMI_SEQUENCE.length &&
      konamiBuffer.every((code, idx) => code === KONAMI_SEQUENCE[idx])
    ) {
      konamiBuffer = [];
      event.preventDefault();
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      startCheatAutopilot();
      return;
    }

    // Allow Enter or Space to open envelope if still on the intro screen
    if (!state.envelopeOpen) {
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        openEnvelope(false);
      }
      return;
    }

    if (state.mode !== "explore") return;

    let handled = true;
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        state.moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        state.moveBackward = true;
        break;
      case "KeyA":
        state.moveLeft = true;
        break;
      case "KeyD":
        state.moveRight = true;
        break;
      case "ArrowLeft":
      case "KeyQ":
        state.lookLon = -1;
        break;
      case "ArrowRight":
      case "KeyE":
        state.lookLon = 1;
        break;
      default:
        handled = false;
        break;
    }

    if (handled) {
      event.preventDefault();
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        state.moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        state.moveBackward = false;
        break;
      case "KeyA":
        state.moveLeft = false;
        break;
      case "KeyD":
        state.moveRight = false;
        break;
      case "ArrowLeft":
      case "KeyQ":
        if (state.lookLon < 0) state.lookLon = 0;
        break;
      case "ArrowRight":
      case "KeyE":
        if (state.lookLon > 0) state.lookLon = 0;
        break;
    }
  });

  // Mouse & Touch Drag on Canvas
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragButton = 0;

  container.addEventListener("contextmenu", (e) => e.preventDefault());

  container.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    if (!state.envelopeOpen || state.mode !== "explore") return;
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    dragButton = e.button;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener("pointermove", (e) => {
    if (!isDragging || !state.envelopeOpen || state.mode !== "explore") return;
    const dx = e.clientX - prevPointerX;
    const dy = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;

    const dist = camera.position.distanceTo(WIN_POS);
    const precisionScale = Math.max(0.45, Math.min(1.0, dist / 24.0));
    const touchBoost = e.pointerType === "touch" ? 1.45 : 1.0;

    if (dragButton === 2 || e.shiftKey) {
      camera.translateX(-dx * 0.16 * precisionScale * touchBoost);
      camera.translateZ(dy * 0.16 * precisionScale * touchBoost);
    } else {
      state.lon += dx * 0.17 * Math.max(0.55, precisionScale) * touchBoost;
      camera.translateZ(dy * 0.18 * precisionScale * touchBoost);
    }
    clampCameraBounds();
    updateCameraLook();
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      container.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };
  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);

  container.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (!state.envelopeOpen || state.mode !== "explore") return;
      const dist = camera.position.distanceTo(WIN_POS);
      const precisionScale = Math.max(0.45, Math.min(1.0, dist / 24.0));
      camera.translateZ(e.deltaY * 0.04 * precisionScale);
      clampCameraBounds();
      updateCameraLook();
    },
    { passive: false }
  );

  // Responsive Resize (unified vertical proportion system for 3D title, horizon line, signature & blessing)
  function handleResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const aspect = w / Math.max(1, h);
    const baseAspect = 1.50;
    const baseTan = Math.tan(THREE.MathUtils.degToRad(45 / 2));
    const tanHalfFov = aspect < baseAspect ? baseTan * (baseAspect / aspect) : baseTan;

    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanHalfFov));
    camera.aspect = aspect;

    // Vertical pixel scale (CSS pixels per unit of 3D slope (y - 2) / z)
    const Sy = (h * 0.5) / tanHalfFov;
    const portraitFactor = Math.max(0, Math.min(1, (1.15 - aspect) / 0.57));

    // 1. Position ground dividing line with generous breathing room below "Yihan Lu!"
    const wTitleMax = 0.30168;
    const wTitleMin = -0.00718;
    const titleHeightPx = (wTitleMax - wTitleMin) * Sy;
    const groundGapW = 0.048 + 0.082 * portraitFactor;
    const wGround = wTitleMin - groundGapW;
    ground.position.y = 1.5 + 180.0 * wGround;

    // 2. Position "Oct 20 · rbtree" cleanly below the dividing line (and enlarge on mobile for legibility)
    const sigGapW = 0.018 + 0.030 * portraitFactor;
    const sigScale = 1.0 + 0.65 * portraitFactor;
    const wSigTop = wGround - sigGapW;
    if (signatureMesh) {
      signatureMesh.scale.set(sigScale, sigScale, 1);
      signatureMesh.position.set(-9.96, 2.0 + 20.0 * wSigTop, 0);
    }

    // 3. Coordinate vertical placement of 3D scene and 6-line Chinese blessing
    const groundGapPx = groundGapW * Sy;
    const sigGapPx = sigGapW * Sy;
    const sigHeightPx = 0.022715 * sigScale * Sy;
    const blessingHeightPx =
      blessingEl && blessingEl.offsetHeight > 0
        ? blessingEl.offsetHeight
        : portraitFactor > 0.5
        ? 215
        : 195;

    const upper3DHeightPx = titleHeightPx + groundGapPx + sigGapPx + sigHeightPx;
    const totalContentHeightPx = upper3DHeightPx + blessingHeightPx;
    const totalFreeSpacePx = Math.max(36, h - totalContentHeightPx);

    // Allocate top margin above "Happy Birthday" (~29% of free space on desktop, ~47% on mobile)
    const topShare = 0.29 + 0.18 * portraitFactor;
    const titleTopY = totalFreeSpacePx * topShare;
    const sigBottomY = titleTopY + upper3DHeightPx;

    const yOffset = Math.round(h * 0.5 - titleTopY - wTitleMax * Sy);
    if (Math.abs(yOffset) > 1) {
      camera.setViewOffset(w, h, 0, yOffset, w, h);
    } else {
      camera.clearViewOffset();
    }

    // Place the 6-line blessing inside the dark-gray area below "Oct 20 · rbtree" (42% above, 58% below)
    if (blessingEl) {
      const freeBelowSigPx = Math.max(24, h - sigBottomY - blessingHeightPx);
      const blessingGapPx = freeBelowSigPx * 0.42;
      const blessingTopY = Math.round(sigBottomY + blessingGapPx);
      blessingEl.style.top = blessingTopY + "px";
      blessingEl.style.bottom = "auto";
    }

    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);

    if (celebrationCanvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      celebrationCanvas.width = Math.floor(window.innerWidth * dpr);
      celebrationCanvas.height = Math.floor(window.innerHeight * dpr);
    }
  }

  window.addEventListener("resize", handleResize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(handleResize);
  }
  handleResize();
  updateCameraLook();
  updateAlignmentIndicator();

  // Main Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);

    if (state.envelopeOpen && state.mode === "explore") {
      const distToWinNow = camera.position.distanceTo(WIN_POS);
      // Smoothly scale down speed near the sweet spot for effortless fine alignment
      const speedScale = Math.max(0.42, Math.min(1.0, distToWinNow / 24.0));

      const targetForward = (state.moveForward ? 1 : 0) - (state.moveBackward ? 1 : 0);
      const targetStrafe = (state.moveRight ? 1 : 0) - (state.moveLeft ? 1 : 0);
      const damping = 1 - Math.exp(-11.0 * delta);

      state.velForward += (targetForward * state.movementSpeed * speedScale - state.velForward) * damping;
      state.velStrafe += (targetStrafe * state.movementSpeed * speedScale - state.velStrafe) * damping;
      state.velLon += (state.lookLon * state.lookSpeed * Math.max(0.55, speedScale) - state.velLon) * damping;

      if (Math.abs(state.velForward) > 0.001) {
        camera.translateZ(-state.velForward * delta);
      }
      if (Math.abs(state.velStrafe) > 0.001) {
        camera.translateX(state.velStrafe * delta);
      }
      if (Math.abs(state.velLon) > 0.001) {
        state.lon += state.velLon * delta;
      }

      clampCameraBounds();
      updateCameraLook();
      updateAlignmentIndicator();

      const distToWin = camera.position.distanceTo(WIN_POS);
      const lonMod360 = normalizeLon(state.lon);
      const angErr = Math.abs(shortestAngleDiff(lonMod360, WIN_LON));
      if (distToWin < 3.4 && angErr < 4.2) {
        triggerWinLockIn();
      }
    } else if (state.mode === "autopilot") {
      state.autopilot.elapsed += delta;
      const rawT = Math.min(1, state.autopilot.elapsed / state.autopilot.duration);
      const ease = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      const r = state.autopilot.startR + (state.autopilot.endR - state.autopilot.startR) * ease;
      const alpha =
        state.autopilot.startAlpha + (state.autopilot.endAlpha - state.autopilot.startAlpha) * ease;

      camera.position.x = CLOUD_CENTER.x + r * Math.cos(alpha);
      camera.position.z = CLOUD_CENTER.z + r * Math.sin(alpha);
      camera.position.y = 2;

      state.lon = state.autopilot.startLon + (state.autopilot.endLon - state.autopilot.startLon) * ease;
      state.lat = 0;
      updateCameraLook();
      updateAlignmentIndicator();

      if (rawT >= 0.96) {
        triggerWinLockIn();
      }
    } else if (state.mode === "locked") {
      state.lockIn.elapsed += delta;
      const tCam = Math.min(1, state.lockIn.elapsed / state.lockIn.duration);
      const easeCam = 1 - Math.pow(1 - tCam, 3);

      camera.position.set(
        state.lockIn.startX * (1 - easeCam),
        2,
        state.lockIn.startZ * (1 - easeCam)
      );
      state.lon = state.lockIn.startLon + state.lockIn.lonDelta * easeCam;
      state.lat = 0;
      updateCameraLook();
      updateAlignmentIndicator();

      if (tCam >= 1 && !state.lockIn.titleUpdated) {
        camera.position.copy(WIN_POS);
        state.lon = WIN_LON;
        updateCameraLook();
        document.title = TITLE_AFTER;
        state.lockIn.titleUpdated = true;
        triggerCelebrationBurst();
      }

      // Smoothly fade in the 3D ground inscription ("Oct 20 · rbtree") between 2.2s and 4.8s
      if (state.lockIn.elapsed >= 2.2) {
        const tSig = Math.min(1, (state.lockIn.elapsed - 2.2) / 2.6);
        const easeSig = tSig < 0.5 ? 2 * tSig * tSig : 1 - Math.pow(-2 * tSig + 2, 2) / 2;
        signatureMaterial.color.copy(signatureColorStart).lerp(signatureColorEnd, easeSig);
      }

      // Reveal the two-line poetic Chinese blessing at 3.4s
      if (state.lockIn.elapsed >= 3.4 && !state.lockIn.blessingShown) {
        document.body.classList.add("show-blessing");
        state.lockIn.blessingShown = true;
      }
    }

    renderer.render(scene, camera);
    updateAndRenderCelebration(delta);
  }

  animate();
})();
