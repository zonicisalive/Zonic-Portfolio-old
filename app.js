// ============================================
// MATRIX RAIN BACKGROUND
// Customize: Adjust character set, speed, density in the MatrixRain class
// ============================================
class MatrixRain {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01';
    this.fontSize = 14;
    this.columns = 0;
    this.drops = [];
    this.animationId = null;
    this.isPaused = false;
    this.density = this.clamp(MATRIX_DENSITY, 0, 1);
    this.speedSetting = Math.max(1, MATRIX_SPEED);
    this.frameInterval = 1000 / this.speedSetting;
    this.lastDrawTime = 0;

    if (this.canvas && this.ctx) {
      this.init();
      this.setupEventListeners();
    }
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  init() {
    this.resize();
    if (!this.isPaused) {
      this.draw();
    }
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.columns = Math.floor(this.canvas.width / this.fontSize);
    const maxRows = Math.max(1, Math.ceil(this.canvas.height / this.fontSize));
    this.drops = Array.from({ length: this.columns }, () => Math.floor(Math.random() * maxRows));
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    // Semi-transparent black background for trail effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00FF8C'; // Matrix green color
    this.ctx.font = `${this.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;

      if (Math.random() <= this.density) {
        const char = this.chars[Math.floor(Math.random() * this.chars.length)];
        this.ctx.fillText(char, x, y);
      }

      // Reset drop to top with random chance (controls density)
      if (y > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }

      this.drops[i]++;
    }
  }

  animate(timestamp = 0) {
    if (!this.isPaused && (timestamp - this.lastDrawTime) >= this.frameInterval) {
      this.draw();
      this.lastDrawTime = timestamp;
    }
    this.animationId = requestAnimationFrame((nextTs) => this.animate(nextTs));
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastDrawTime = 0;
  }

  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setActive(shouldRun) {
    if (!this.canvas) return;
    if (shouldRun) {
      this.canvas.style.opacity = '';
      this.resize();
      this.resume();
    } else {
      this.pause();
      this.clearCanvas();
      this.canvas.style.opacity = '0';
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());

    // Pause when modal is open or user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.setActive(false);
    }
  }
}

// get speed/density from CSS variables
const css = getComputedStyle(document.documentElement);
const parseCssNumber = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const MATRIX_DENSITY = parseCssNumber(css.getPropertyValue('--matrix-density'), 0.5);
const MATRIX_SPEED = parseCssNumber(css.getPropertyValue('--matrix-speed'), 10);
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ============================================
// STELLAR FIELD (THREE.JS)
// ============================================
class StellarField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas || typeof THREE === 'undefined' || PREFERS_REDUCED_MOTION) {
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scrollTarget = 0;
    this.starCount = 1200;

    this.createStars();
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('scroll', () => this.handleScroll());
    this.handleScroll();
    this.animate();
  }

  createStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const tempColor = new THREE.Color();

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 18;
      positions[i3 + 1] = (Math.random() - 0.5) * 18;
      positions[i3 + 2] = (Math.random() - 0.5) * 18;

      tempColor.setHSL(0.36 + Math.random() * 0.1, 1, 0.5);
      colors[i3] = tempColor.r;
      colors[i3 + 1] = tempColor.g;
      colors[i3 + 2] = tempColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  handleScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollTarget = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }

  animate() {
    if (!this.points) return;

    this.points.rotation.y += 0.0008;
    const targetX = this.scrollTarget * 0.6 - 0.3;
    this.points.rotation.x += (targetX - this.points.rotation.x) * 0.015;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

// ============================================
// CUSTOM CURSOR
// ============================================
class CustomCursor {
  constructor() {
    this.cursor = document.querySelector('.cursor');
    this.cursorGlow = document.querySelector('.cursor-glow');
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.glowX = 0;
    this.glowY = 0;

    if (this.cursor && this.cursorGlow) {
      this.init();
    }
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      // Instant 1:1 cursor dot & glow positioning (0ms delay)
      if (this.cursor) {
        this.cursor.style.left = `${e.clientX}px`;
        this.cursor.style.top = `${e.clientY}px`;
      }
      if (this.cursorGlow) {
        this.cursorGlow.style.left = `${e.clientX}px`;
        this.cursorGlow.style.top = `${e.clientY}px`;
      }
    });

    // Global click ripple effect
    document.addEventListener('click', (e) => {
      this.createClickRipple(e);
    });

    // Scale cursor on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-card, input, select, textarea, .filter-btn, .social-link');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (this.cursor) this.cursor.classList.add('hovering');
        if (this.cursorGlow) this.cursorGlow.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        if (this.cursor) this.cursor.classList.remove('hovering');
        if (this.cursorGlow) this.cursorGlow.classList.remove('hovering');
      });
    });
  }

  createClickRipple(e) {
    const ripple = document.createElement('div');
    ripple.className = 'global-click-ripple';
    ripple.style.left = `${e.pageX}px`;
    ripple.style.top = `${e.pageY}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });

    // Fallback cleanup
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 1000);
  }
}

// ============================================
// NAVIGATION
// ============================================
class Navigation {
  constructor() {
    this.nav = document.querySelector('.nav');
    this.navToggle = document.querySelector('.nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.navOverlay = document.querySelector('.nav-overlay');

    this.init();
  }

  init() {
    // Toggle menu
    const toggleMenu = (forceState) => {
      const isOpen = this.navToggle.getAttribute('aria-expanded') === 'true';
      const show = (typeof forceState === 'boolean') ? forceState : !isOpen;

      this.navToggle.setAttribute('aria-expanded', show);
      this.navMenu.classList.toggle('active', show);
      if (this.navOverlay) this.navOverlay.classList.toggle('active', show);

      const header = this.nav.parentElement;
      if (header) header.classList.toggle('menu-active', show);

      // Prevent scrolling on body when menu is open
      document.body.style.overflow = show ? 'hidden' : '';
    };

    // Mobile menu toggle click
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => toggleMenu());
    }

    // Overlay click to close
    if (this.navOverlay) {
      this.navOverlay.addEventListener('click', () => toggleMenu(false));
    }

    // Close menu when clicking nav links
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        toggleMenu(false);

        // Smooth scroll for anchor links
        const targetId = link.getAttribute('href');
        if (targetId.startsWith('#')) {
          e.preventDefault();
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            const headerOffset = 70;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }
      });
    });

    // H6 FIX: Toggle .scrolled class instead of mutating inline styles
    // The .header.scrolled CSS rule in styles.css handles all visual changes
    window.addEventListener('scroll', () => {
      const header = this.nav.parentElement;
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
/* ---------------------------
   Matrix Text Scrambler / Decrypt Effect
   --------------------------- */
class TextScrambler {
  constructor(element) {
    this.element = element;
    this.chars = 'アイウエオカキクケコサシスセソタチツテト01<>-_\\/[]{}—=+*^?#%';
    this.update = this.update.bind(this);
  }

  scramble(text, duration = 800) {
    const length = text.length;
    const queue = [];
    for (let i = 0; i < length; i++) {
      const from = '';
      const to = text[i];
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      queue.push({ from, to, start, end, char: '' });
    }

    this.queue = queue;
    this.text = text;
    this.duration = duration;
    this.frame = 0;
    this.resolve = null;

    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });

    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += char;
      } else {
        output += from;
      }
    }

    this.element.textContent = output;
    this.element.setAttribute('data-text', output);

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frame++;
      requestAnimationFrame(this.update);
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

class ScrollAnimations {
  constructor() {
    this.observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    this.revealOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px 12% 0px'
    };

    this.prefersReducedMotion = PREFERS_REDUCED_MOTION;
    this.init();
  }

  init() {
    this.observeSkillBars();
    this.observeRadialSkills();
    this.observeRevealElements();
  }

  observeSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar');
    if (!skillBars.length) return;

    if (this.prefersReducedMotion) {
      skillBars.forEach(bar => bar.classList.add('animate'));
      return;
    }

    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, this.observerOptions);

    skillBars.forEach(bar => skillObserver.observe(bar));
  }

  observeRadialSkills() {
    const radialSkills = document.querySelectorAll('.radial-skill');
    if (!radialSkills.length) return;

    if (this.prefersReducedMotion) {
      radialSkills.forEach(skill => skill.classList.add('animate'));
      return;
    }

    const radialObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, this.observerOptions);

    radialSkills.forEach(skill => radialObserver.observe(skill));
  }

  observeRevealElements() {
    const allElements = Array.from(document.querySelectorAll('[data-animate]'));
    if (!allElements.length) return;

    const hero = document.querySelector('.hero');
    const revealElements = allElements.filter(el => !(hero && hero.contains(el)));

    if (!revealElements.length) return;

    if (this.prefersReducedMotion || typeof anime === 'undefined') {
      revealElements.forEach(el => {
        el.style.opacity = 1;
        el.style.transform = 'none';
        el.classList.add('is-visible');
      });
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, this.revealOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  animateElement(el) {
    el.classList.add('is-visible');

    const glitchText = el.classList.contains('glitch') ? el : el.querySelector('.glitch');
    if (glitchText && !this.prefersReducedMotion) {
      const scrambler = new TextScrambler(glitchText);
      const originalText = glitchText.getAttribute('data-text') || glitchText.textContent;
      scrambler.scramble(originalText, 900);
    }

    const effect = (el.dataset.animate || 'fade-up').toLowerCase();
    const distance = parseFloat(el.dataset.distance || 32);
    const delay = parseFloat(el.dataset.delay || 0);
    const duration = parseFloat(el.dataset.duration || 900);
    const easing = el.dataset.easing || 'easeOutExpo';

    const animationConfig = {
      targets: el,
      opacity: [0, 1],
      duration,
      delay,
      easing
    };

    switch (effect) {
      case 'fade-left':
        animationConfig.translateX = [distance, 0];
        break;
      case 'fade-right':
        animationConfig.translateX = [-distance, 0];
        break;
      case 'fade-down':
        animationConfig.translateY = [-distance, 0];
        break;
      case 'scale-in':
        animationConfig.scale = [0.9, 1];
        animationConfig.translateY = [distance * 0.5, 0];
        break;
      case 'rotate-up':
        animationConfig.rotateX = [-20, 0];
        animationConfig.translateY = [distance, 0];
        break;
      case 'blur-up':
        animationConfig.translateY = [distance, 0];
        animationConfig.filter = ['blur(16px)', 'blur(0px)'];
        break;
      default:
        animationConfig.translateY = [distance, 0];
        break;
    }

    anime(animationConfig);
  }
}

// ============================================
// HERO INTRO & PARALLAX
// ============================================
class HeroMotion {
  constructor() {
    this.hero = document.querySelector('.hero');
    if (!this.hero) return;

    this.heroVisual = this.hero.querySelector('.hero-visual');
    this.heroElements = this.hero.querySelectorAll('[data-animate]');
    this.prefersReducedMotion = PREFERS_REDUCED_MOTION;
    this.hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!this.heroElements.length) return;

    if (this.prefersReducedMotion || typeof anime === 'undefined') {
      this.heroElements.forEach(el => {
        el.style.opacity = 1;
        el.style.transform = 'none';
        el.classList.add('is-visible');
      });
      return;
    }

    this.playIntro();
    this.initParallax();
  }

  playIntro() {
    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const timeline = anime.timeline({ easing: 'easeOutExpo' });

    const labelStep = {
      targets: '.hero-label',
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 500
    };

    const titleStep = {
      targets: '.hero-title .glitch-title',
      opacity: [0, 1],
      translateY: ['1.2em', 0],
      duration: 900,
      delay: anime.stagger(120),
      offset: '-=200',
      begin: (anim) => {
        anim.animatables.forEach(item => {
          const el = item.target;
          const scrambler = new TextScrambler(el);
          scrambler.scramble(el.getAttribute('data-text') || el.textContent, 1000);
        });
      }
    };

    const textStep = {
      targets: '.hero-subtitle, .hero-description, .hero-cta',
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 700,
      offset: '-=600'
    };

    const visualStep = {
      targets: '.hero-visual',
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 900,
      offset: isMobileViewport ? '-=200' : '-=800'
    };

    const indicatorStep = {
      targets: '.scroll-indicator',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      offset: '-=600'
    };

    if (isMobileViewport) {
      timeline
        .add(labelStep)
        .add(visualStep)
        .add(titleStep)
        .add(textStep)
        .add(indicatorStep);
    } else {
      timeline
        .add(labelStep)
        .add(titleStep)
        .add(textStep)
        .add(visualStep)
        .add(indicatorStep);
    }

    this.heroElements.forEach(el => el.classList.add('is-visible'));
  }

  initParallax() {
    if (!this.heroVisual || !this.hasPointer || this.prefersReducedMotion) return;

    this.parallaxFrame = null;
    window.addEventListener('mousemove', (event) => {
      if (this.parallaxFrame) {
        cancelAnimationFrame(this.parallaxFrame);
      }

      this.parallaxFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 30;
        const y = (event.clientY / window.innerHeight - 0.5) * 20;
        this.heroVisual.style.setProperty('--hero-parallax-x', `${x}px`);
        this.heroVisual.style.setProperty('--hero-parallax-y', `${y}px`);
      });
    });
  }
}

// ============================================
// HERO RADAR CANVAS — Premium Interactive + Scroll-Driven 3D
// ============================================
class HeroRadarCanvas {
  constructor() {
    this.canvas = document.getElementById('hero-radar-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.W = 300; this.H = 300; this.CX = 150; this.CY = 150; this.R = 128;

    // Reduced-motion support
    if (PREFERS_REDUCED_MOTION) { this._drawStatic(); return; }

    // Sweep angle & speed
    this.sweepAngle = -Math.PI / 2;
    this.sweepSpeed = 0.022;

    // Blips
    this.blips = [];
    this.maxBlips = 5;
    this._seedBlips(3);

    // Click pings
    this.pings = [];

    // Mouse tilt (pointer interaction)
    this.tiltX = 0; this.tiltY = 0;
    this.targetTiltX = 0; this.targetTiltY = 0;
    this.container = document.getElementById('hero-hologram-wrap');

    // HUD DOM refs
    this.hudPing = document.getElementById('hud-ping');
    this.hudBlips = document.getElementById('hud-blips');
    this.hudChips = document.querySelectorAll('.radar-hud-chip');

    // ── Scroll-driven 3D state ────────────────────────────
    // scrollProgress: 0 = hero in full view, 1 = hero completely scrolled past
    this.scrollProgress = 0;
    this.scrollGlowShift = 0; // 0=green, 1=cyan color lerp
    this.prevScrollPhase = -1;
    this._initScrollListener();

    this._bindEvents();
    this._animate();
  }

  // ── Scroll listener ──────────────────────────────────────
  _initScrollListener() {
    const hero = document.getElementById('home');
    if (!hero) return;
    const onScroll = () => {
      const heroH = hero.offsetHeight || window.innerHeight;
      this.scrollProgress = Math.min(1, Math.max(0, window.scrollY / heroH));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  _seedBlips(count) {
    for (let i = 0; i < count; i++) this.blips.push(this._randomBlip());
  }

  _randomBlip() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * (this.R - 30);
    return {
      x: this.CX + Math.cos(angle) * dist,
      y: this.CY + Math.sin(angle) * dist,
      alpha: 0, fade: 0,
      size: 2 + Math.random() * 2.5,
      color: Math.random() < 0.25 ? '#00F0FF' : '#00FF8C',
    };
  }

  _bindEvents() {
    if (!this.container) return;

    // Mouse tilt
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      this.targetTiltX = ny * 22;
      this.targetTiltY = -nx * 22;
    });
    this.container.addEventListener('mouseleave', () => {
      this.targetTiltX = 0; this.targetTiltY = 0;
    });

    // Click ping + blip
    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (this.W / rect.width);
      const cy = (e.clientY - rect.top) * (this.H / rect.height);
      const dx = cx - this.CX, dy = cy - this.CY;
      if (Math.sqrt(dx * dx + dy * dy) < this.R) {
        this.pings.push({ x: cx, y: cy, r: 4, alpha: 1 });
        if (this.blips.length < this.maxBlips) {
          this.blips.push({ x: cx, y: cy, alpha: 1, fade: 220, size: 3, color: '#00F0FF' });
          this._updateHUD();
        }
      }
    });
  }

  _updateHUD() {
    if (this.hudBlips) this.hudBlips.textContent = String(this.blips.length).padStart(2, '0');
    if (this.hudPing) this.hudPing.textContent = (18 + Math.floor(Math.random() * 60)) + 'ms';
  }

  // Green (#00FF8C) → Cyan (#00F0FF) lerp
  _lerpColor(t) {
    const computedStyle = getComputedStyle(document.documentElement);
    const startHex = computedStyle.getPropertyValue('--color-matrix-green').trim() || '#00FF8C';
    const endHex = computedStyle.getPropertyValue('--color-cyan').trim() || '#00F0FF';

    const r1 = parseInt(startHex.substring(1, 3), 16) || 0;
    const g1 = parseInt(startHex.substring(3, 5), 16) || 255;
    const b1 = parseInt(startHex.substring(5, 7), 16) || 140;

    const r2 = parseInt(endHex.substring(1, 3), 16) || 0;
    const g2 = parseInt(endHex.substring(3, 5), 16) || 240;
    const b2 = parseInt(endHex.substring(5, 7), 16) || 255;

    return {
      r: Math.round(r1 + (r2 - r1) * t),
      g: Math.round(g1 + (g2 - g1) * t),
      b: Math.round(b1 + (b2 - b1) * t)
    };
  }

  _animate() {
    const ctx = this.ctx;
    const sp = this.scrollProgress; // 0..1

    // ── Scroll phase derivation ───────────────────────────
    // DIVE   0.00–0.35 : radar tilts forward (rotateX+ on container)
    // ORBIT  0.35–0.70 : rings compress, grid appears, sweep accelerates
    // VANISH 0.70–1.00 : core swells, everything fades, container scales up
    const diveProg = Math.min(1, sp / 0.35);
    const orbitProg = Math.min(1, Math.max(0, (sp - 0.35) / 0.35));
    const vanishProg = Math.min(1, Math.max(0, (sp - 0.70) / 0.30));

    // Dynamic sweep speed
    const targetSpeed = 0.022 - diveProg * 0.012 + orbitProg * 0.04 - vanishProg * 0.05;
    this.sweepSpeed += (Math.max(0.001, targetSpeed) - this.sweepSpeed) * 0.05;

    // Ring scale (compressed during orbit/vanish)
    const ringScale = Math.max(0.15, 1 - orbitProg * 0.30 - vanishProg * 0.55);
    const effectiveR = this.R * ringScale;

    // Color: green → cyan as orbit/vanish progress
    this.scrollGlowShift += (Math.min(1, orbitProg + vanishProg * 0.5) - this.scrollGlowShift) * 0.05;
    const col = this._lerpColor(this.scrollGlowShift);
    const mainRGBA = `rgba(${col.r},${col.g},${col.b},`;
    const glowRGB = `rgb(${col.r},${col.g},${col.b})`;

    // HUD phase label update
    const phase = sp < 0.35 ? 0 : sp < 0.70 ? 1 : 2;
    if (phase !== this.prevScrollPhase) {
      this.prevScrollPhase = phase;
      const scanVal = document.querySelector('.radar-hud-chip--tr .hud-chip-value');
      const scanLabel = document.querySelector('.radar-hud-chip--tr .hud-chip-label');
      if (scanVal) scanVal.textContent = ['LIVE', 'WARP', 'GONE'][phase];
      if (scanLabel) scanLabel.textContent = ['SCAN', 'ORBT', 'EXIT'][phase];
    }

    // ── Canvas clear + clip ───────────────────────────────
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.CX, this.CY, this.R, 0, Math.PI * 2);
    ctx.clip();

    // ── Background (dims on vanish) ───────────────────────
    const bgA = 1 - vanishProg * 0.85;
    const bgGrad = ctx.createRadialGradient(this.CX, this.CY, 0, this.CX, this.CY, this.R);
    bgGrad.addColorStop(0, `rgba(0,12,6,${0.95 * bgA})`);
    bgGrad.addColorStop(1, `rgba(0,0,0,${0.98 * bgA})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.W, this.H);

    // ── Perspective convergence grid (orbit phase) ────────
    if (orbitProg > 0.05) {
      ctx.save();
      ctx.globalAlpha = orbitProg * 0.35 * (1 - vanishProg);
      ctx.strokeStyle = glowRGB;
      ctx.lineWidth = 0.6;
      // Horizontal lines
      const hLines = 8;
      for (let i = 0; i <= hLines; i++) {
        const t = i / hLines;
        const y = this.CY - effectiveR + t * effectiveR * 2;
        ctx.beginPath();
        ctx.moveTo(this.CX - this.R, y);
        ctx.lineTo(this.CX + this.R, y);
        ctx.stroke();
      }
      // Vertical lines converging to vanishing point above centre
      const vpY = this.CY - effectiveR * 1.8;
      const vLines = 6;
      for (let i = 0; i <= vLines; i++) {
        const t = i / vLines;
        const bx = this.CX - this.R + t * this.R * 2;
        ctx.beginPath();
        ctx.moveTo(bx, this.CY + effectiveR * 0.9);
        ctx.lineTo(this.CX + (bx - this.CX) * 0.08, vpY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Concentric rings ─────────────────────────────────
    const rings = [
      { r: effectiveR, alpha: 0.80, dash: [], width: 2.0 },
      { r: effectiveR * 0.77, alpha: 0.55, dash: [8, 5], width: 1.5 },
      { r: effectiveR * 0.54, alpha: 0.38, dash: [], width: 1.2 },
      { r: effectiveR * 0.31, alpha: 0.28, dash: [3, 3], width: 1.0 },
    ];
    for (const ring of rings) {
      ctx.beginPath();
      ctx.arc(this.CX, this.CY, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = mainRGBA + ring.alpha + ')';
      ctx.lineWidth = ring.width;
      ctx.setLineDash(ring.dash);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Crosshair ────────────────────────────────────────
    ctx.strokeStyle = mainRGBA + '0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(this.CX, this.CY - effectiveR); ctx.lineTo(this.CX, this.CY + effectiveR); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.CX - effectiveR, this.CY); ctx.lineTo(this.CX + effectiveR, this.CY); ctx.stroke();
    const d45 = effectiveR * 0.7071;
    ctx.strokeStyle = mainRGBA + '0.10)';
    ctx.beginPath(); ctx.moveTo(this.CX - d45, this.CY - d45); ctx.lineTo(this.CX + d45, this.CY + d45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.CX + d45, this.CY - d45); ctx.lineTo(this.CX - d45, this.CY + d45); ctx.stroke();

    // ── Sweep beam ───────────────────────────────────────
    this.sweepAngle = (this.sweepAngle + this.sweepSpeed) % (Math.PI * 2);
    const sweepArcLen = Math.PI * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.CX, this.CY);
    ctx.arc(this.CX, this.CY, effectiveR, this.sweepAngle - sweepArcLen, this.sweepAngle, false);
    ctx.closePath();
    const secGrad = ctx.createRadialGradient(this.CX, this.CY, 0, this.CX, this.CY, effectiveR);
    secGrad.addColorStop(0, mainRGBA + '0.30)');
    secGrad.addColorStop(0.6, mainRGBA + '0.12)');
    secGrad.addColorStop(1, mainRGBA + '0.00)');
    ctx.fillStyle = secGrad;
    ctx.globalAlpha = 0.85 * (1 - vanishProg * 0.7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Bright leading edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.CX, this.CY);
    ctx.lineTo(this.CX + Math.cos(this.sweepAngle) * effectiveR,
      this.CY + Math.sin(this.sweepAngle) * effectiveR);
    ctx.strokeStyle = mainRGBA + `${0.9 * (1 - vanishProg * 0.8)})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowRGB;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();

    // ── Blips (pulled toward centre on orbit) ────────────
    for (const blip of this.blips) {
      const bAngle = Math.atan2(blip.y - this.CY, blip.x - this.CX);
      const angDiff = ((this.sweepAngle - bAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      if (angDiff < sweepArcLen * 1.2) { blip.alpha = 1; blip.fade = 200; }
      else if (blip.fade > 0) { blip.fade--; blip.alpha = blip.fade / 200; }

      if (blip.alpha > 0.02) {
        const bx = this.CX + (blip.x - this.CX) * ringScale;
        const by = this.CY + (blip.y - this.CY) * ringScale;
        ctx.save();
        ctx.globalAlpha = blip.alpha * (1 - vanishProg * 0.9);
        ctx.shadowColor = glowRGB; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
        ctx.fillStyle = glowRGB; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by, blip.size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = glowRGB; ctx.lineWidth = 0.8;
        ctx.globalAlpha = blip.alpha * 0.4 * (1 - vanishProg);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Centre core (swells on vanish — "flying at viewer") ─
    const corePulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.003);
    const coreR = 28 * (1 + vanishProg * 3.5);
    const coreGrad = ctx.createRadialGradient(this.CX, this.CY, 0, this.CX, this.CY, coreR);
    coreGrad.addColorStop(0, mainRGBA + `${corePulse * (1 - vanishProg * 0.2)})`);
    coreGrad.addColorStop(0.5, mainRGBA + `${corePulse * 0.6})`);
    coreGrad.addColorStop(1, mainRGBA + '0)');
    ctx.save();
    ctx.shadowColor = glowRGB; ctx.shadowBlur = 20 + vanishProg * 60;
    ctx.beginPath(); ctx.arc(this.CX, this.CY, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad; ctx.fill();
    ctx.beginPath(); ctx.arc(this.CX, this.CY, 5 * (1 - vanishProg * 0.9), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${corePulse * 0.6 * (1 - vanishProg)})`;
    ctx.shadowBlur = 8; ctx.shadowColor = '#fff'; ctx.fill();
    ctx.restore();

    // ── Orbiting dot (fades before vanish) ───────────────
    if (vanishProg < 0.85) {
      const orbX = this.CX + Math.cos(this.sweepAngle) * effectiveR;
      const orbY = this.CY + Math.sin(this.sweepAngle) * effectiveR;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - vanishProg * 1.2);
      ctx.shadowColor = glowRGB; ctx.shadowBlur = 16;
      const oGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 10);
      oGrad.addColorStop(0, mainRGBA + '1)');
      oGrad.addColorStop(1, mainRGBA + '0)');
      ctx.beginPath(); ctx.arc(orbX, orbY, 10, 0, Math.PI * 2);
      ctx.fillStyle = oGrad; ctx.fill();
      ctx.beginPath(); ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    }

    // ── Click pings ──────────────────────────────────────
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const p = this.pings[i];
      p.r += 1.8; p.alpha -= 0.025;
      if (p.alpha <= 0) { this.pings.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = '#00F0FF'; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end clip

    // ── CSS 3-D: mouse tilt + scroll transform ────────────
    this.tiltX += (this.targetTiltX - this.tiltX) * 0.08;
    this.tiltY += (this.targetTiltY - this.tiltY) * 0.08;

    // DIVE: tips forward (positive rotateX)
    // ORBIT: slight roll (rotateZ) + partial backward levelling
    // VANISH: scale up (approaching viewer) + fade out
    const scrollTiltX = diveProg * 32 - orbitProg * 16;
    const scrollTiltZ = orbitProg * 9;
    const scrollScale = 1 + vanishProg * 0.40;
    const scrollOpacity = Math.max(0, 1 - vanishProg * 0.90);

    if (this.container) {
      this.container.style.transform =
        `rotateX(${this.tiltX + scrollTiltX}deg) ` +
        `rotateY(${this.tiltY}deg) ` +
        `rotateZ(${scrollTiltZ}deg) ` +
        `scale(${scrollScale})`;
      this.container.style.opacity = scrollOpacity.toFixed(3);
    }

    // HUD chips fade out in late orbit / vanish phase
    if (this.hudChips.length) {
      const chipAlpha = Math.max(0, 1 - Math.max(0, (sp - 0.60) / 0.40));
      this.hudChips.forEach(c => { c.style.opacity = chipAlpha.toFixed(3); });
    }

    if (Math.random() < 0.005) this._updateHUD();
    requestAnimationFrame(() => this._animate());
  }

  _drawStatic() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-matrix-green').trim() || '#00FF8C';
    const r = parseInt(themeColor.substring(1, 3), 16) || 0;
    const g = parseInt(themeColor.substring(3, 5), 16) || 255;
    const b = parseInt(themeColor.substring(5, 7), 16) || 140;
    ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`; ctx.lineWidth = 1.5;
    [this.R, this.R * 0.77, this.R * 0.54, this.R * 0.31].forEach(r => {
      ctx.beginPath(); ctx.arc(this.CX, this.CY, r, 0, Math.PI * 2); ctx.stroke();
    });
  }
}


// ============================================
// SCROLL PROGRESS
// ============================================
class ScrollProgress {
  constructor() {
    this.bar = document.querySelector('.scroll-progress-bar');
    if (!this.bar) return;

    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleScroll);
    this.handleScroll();
  }

  handleScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    this.bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  }
}
// ============================================
// PROJECT FILTERING - SIMPLE (NO SAVE)
// ============================================
class ProjectFilter {
  constructor() {
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.projectCards = document.querySelectorAll('.project-card');

    this.init();
  }

  init() {
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Update active button (M5 FIX: role="radio" uses aria-checked)
        this.filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');

        // Filter projects
        this.filterProjects(filter);
      });
    });
  }

  filterProjects(filter) {
    this.projectCards.forEach(card => {
      const tags = card.getAttribute('data-tags').split(',');

      if (filter === 'all' || tags.includes(filter)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }
}

// ============================================
// PROJECT CARD 3D TILT EFFECT
// ============================================
class ProjectCardTilt {
  constructor() {
    this.cards = document.querySelectorAll('.project-card-inner');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.handleMove(e, card));
      card.addEventListener('mouseleave', () => this.handleLeave(card));
    });
  }

  handleMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  }

  handleLeave(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  }
}

// ============================================
// PROJECT MODAL
// Customize: Add/modify project data in projectData object
// ============================================
class ProjectModal {
  constructor() {
    this.modal = document.getElementById('project-modal');
    this.modalTitle = this.modal.querySelector('.modal-title');
    this.modalDescription = this.modal.querySelector('.modal-description');
    this.modalFeatures = this.modal.querySelector('.modal-features');
    this.modalTech = this.modal.querySelector('.modal-tech');
    this.modalCode = this.modal.querySelector('.modal-code');
    this.modalCodeSection = this.modal.querySelector('.modal-code-section');
    this.modalCodeToggle = this.modal.querySelector('.modal-code-toggle');
    this.modalDemo = this.modal.querySelector('.modal-demo');
    this.galleryImage = this.modal.querySelector('.gallery-image');
    this.galleryPrev = this.modal.querySelector('.gallery-prev');
    this.galleryNext = this.modal.querySelector('.gallery-next');
    this.galleryIndicators = this.modal.querySelector('.gallery-indicators');

    this.currentProject = null;
    this.currentImageIndex = 0;
    this.codeVisible = false;

    // Project data remains the same
    this.projectData = {
      '1': {
        title: 'QuizApp',
        description: 'Interactive multiple-choice quiz (CLI) with scoring and answer review. Easy to extend with file-backed questions or timed quizzes.',
        features: [
          'Multiple-choice questions',
          'Score calculation and review',
          'Extensible question list (in-code or file-backed)',
          'Simple CLI interaction'
        ],
        tech: ['Python', 'CLI', 'File I/O'],
        code: `#!/usr/bin/env python3
# quiz.py - simple CLI quiz

questions = [
    {
        "q": "What is the capital of France?",
        "choices": ["A) Paris", "B) London", "C) Berlin", "D) Madrid"],
        "answer": "A"
    },
    {
        "q": "Which language is primarily used for system programming?",
        "choices": ["A) Python", "B) C", "C) HTML", "D) JavaScript"],
        "answer": "B"
    },
    {
        "q": "What does RAM stand for?",
        "choices": ["A) Readily Available Memory", "B) Random Access Memory", "C) Rapid Action Module", "D) None"],
        "answer": "B"
    }
]

def run_quiz():
    score = 0
    for i, item in enumerate(questions, start=1):
        print(f"\\nQ{i}: {item['q']}")
        for c in item["choices"]:
            print("   " + c)
        ans = input("Your answer (A/B/C/D): ").strip().upper()
        if ans == item["answer"]:
            print("Correct!")
            score += 1
        else:
            print(f"Wrong. Correct answer: {item['answer']}")
    print(f"\\nQuiz finished. Score: {score}/{len(questions)}")

if __name__ == "__main__":
    run_quiz()`,
        images: ['assets/project1.svg'],
        demoUrl: '#'
      },
      // ... rest of your projectData remains the same
      '2': {
        title: 'ReportCard',
        description: 'Student report card system in C: enter marks for several subjects, compute total, percentage and grade, and save/view records from a file.',
        features: [
          'Store student records in a file',
          'Compute total, percentage and grade',
          'Use structs and basic file I/O',
          'View all saved records'
        ],
        tech: ['C', 'File I/O', 'Structs'],
        code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SUBJECTS 5
#define NAME_LEN 100
#define FILENAME "records.txt"

typedef struct {
    char name[NAME_LEN];
    int marks[SUBJECTS];
    int total;
    float percent;
    char grade;
} Student;

char compute_grade(float p) {
    if (p >= 90) return 'A';
    if (p >= 75) return 'B';
    if (p >= 60) return 'C';
    if (p >= 40) return 'D';
    return 'F';
}

void add_student() {
    Student s;
    s.total = 0;
    printf("Enter student name: ");
    fgets(s.name, NAME_LEN, stdin);
    s.name[strcspn(s.name, "\\n")] = '\\0';

    for (int i = 0; i < SUBJECTS; ++i) {
        printf("Marks for subject %d (0-100): ", i+1);
        if (scanf("%d", &s.marks[i]) != 1) { puts("Invalid input"); return; }
        if (s.marks[i] < 0) s.marks[i] = 0;
        if (s.marks[i] > 100) s.marks[i] = 100;
        s.total += s.marks[i];
    }
    while (getchar() != '\\n');
    s.percent = (float)s.total / (SUBJECTS);
    s.grade = compute_grade(s.percent);

    FILE *f = fopen(FILENAME, "a");
    if (!f) { perror("Unable to open file"); return; }
    fprintf(f, "%s,%d,%.2f,%c", s.name, s.total, s.percent, s.grade);
    for (int i=0;i<SUBJECTS;i++) fprintf(f, ",%d", s.marks[i]);
    fprintf(f, "\\n");
    fclose(f);
    printf("Saved record for %s (Total: %d, Percent: %.2f, Grade: %c)\\n", s.name, s.total, s.percent, s.grade);
}

void view_records() {
    FILE *f = fopen(FILENAME, "r");
    if (!f) { puts("No records yet."); return; }
    char line[512];
    puts("Name | Total | Percent | Grade | Marks");
    puts("-----------------------------------------------------");
    while (fgets(line, sizeof(line), f)) {
        printf("%s", line);
    }
    fclose(f);
}

int main() {
    int choice;
    do {
        puts("\\nStudent Report Card System");
        puts("1. Add student record");
        puts("2. View all records");
        puts("0. Exit");
        printf("Choice: ");
        if (scanf("%d", &choice) != 1) break;
        while (getchar() != '\\n');
        if (choice == 1) add_student();
        else if (choice == 2) view_records();
    } while (choice != 0);
    puts("Bye!");
    return 0;
}`,
        images: ['assets/project2.svg'],
        demoUrl: '#'
      },
      '3': {
        title: 'SysInfo',
        description: 'Bash system info dashboard that displays hostname, uptime, load, memory, disk usage and top CPU processes – a perfect beginner shell project.',
        features: [
          'Hostname and uptime',
          'Load averages and top CPU processes',
          'Memory and disk snapshots',
          'Simple, readable Bash script'
        ],
        tech: ['Bash', 'Linux', 'Shell'],
        code: `#!/usr/bin/env bash
# sys_info.sh - small system dashboard

echo "=== SYSTEM INFO DASHBOARD ==="
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo

echo "-- Load / CPU --"
awk -v OFS="" '{print "Load averages: ", $1, " ", $2, " ", $3}' /proc/loadavg
echo "Top 5 CPU-consuming processes:"
ps -eo pid,comm,%cpu --sort=-%cpu | head -n 6
echo

echo "-- Memory --"
free -h
echo

echo "-- Disk --"
df -h --output=source,fstype,size,used,avail,pcent,target | head -n 1
df -h | sed -n '1,6p'
echo

echo "-- Running Processes Count --"
ps -e --no-headers | wc -l
echo "=============================="`,
        images: ['assets/project3.svg'],
        demoUrl: '#',
      },
      '4': {
        title: 'BackupScript',
        description: 'Automated backup script in Bash – copies a source folder into a timestamped backup directory. Simple to schedule with cron for regular backups.',
        features: [
          'Timestamped backup folders',
          'Recursively copy source directory',
          'Easy to schedule with cron',
          'Basic error checking'
        ],
        tech: ['Bash', 'Cron', 'File Ops'],
        code: `#!/usr/bin/env bash
# backup.sh <source_dir> [backup_root]
# Example: ./backup.sh /home/student/myproject /home/student/backups

SOURCE="$1"
BACKUP_ROOT="\${2:-$HOME/backups}"

if [ -z "$SOURCE" ]; then
  echo "Usage: $0 <source_dir> [backup_root]"
  exit 1
fi

if [ ! -d "$SOURCE" ]; then
  echo "Source directory does not exist: $SOURCE"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEST="$BACKUP_ROOT/backup_$(basename "$SOURCE")_$TIMESTAMP"

mkdir -p "$DEST"
cp -r "$SOURCE" "$DEST"

if [ $? -eq 0 ]; then
  echo "Backup successful: $DEST"
else
  echo "Backup failed."
fi`,
        images: ['assets/project4.svg'],
        demoUrl: '#',
      },
      '5': {
        title: 'GuessGame',
        description: 'Classic number-guessing game in C where the computer picks a number between 1 and 100 and the player guesses until correct, with higher/lower hints.',
        features: [
          'Random number generation',
          'Input validation',
          'Higher / lower hints',
          'Attempt counter'
        ],
        tech: ['C', 'stdlib', 'Loops'],
        code: `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    int secret, guess, tries = 0;
    srand((unsigned)time(NULL));
    secret = rand() % 100 + 1; // 1..100

    printf("Guess the number (1 to 100). Enter 0 to quit.\\n");
    while (1) {
        printf("Your guess: ");
        if (scanf("%d", &guess) != 1) { puts("Invalid input"); break; }
        if (guess == 0) { printf("You quit. The number was %d.\\n", secret); break; }
        tries++;
        if (guess == secret) {
            printf("Correct! You took %d %s.\\n", tries, (tries==1)? "try" : "tries");
            break;
        } else if (guess < secret) {
            puts("Too low – try a higher number.");
        } else {
            puts("Too high – try a lower number.");
        }
    }
    return 0;
}`,
        images: ['assets/project5.svg'],
        demoUrl: '#'
      },
      '6': {
        title: 'ExpenseTracker',
        description: 'Simple CSV-based expense tracker in Python. Add expenses (date, amount, category, note) and view totals by category – useful for learning CSV handling and aggregation.',
        features: [
          'Add expense entries',
          'Save/read CSV file',
          'Aggregate totals by category',
          'Show recent entries'
        ],
        tech: ['Python', 'CSV', 'File I/O'],
        code: `#!/usr/bin/env python3
import csv
import os
from datetime import datetime
from collections import defaultdict

FNAME = "expenses.csv"
HEADERS = ["date","amount","category","note"]

def add_expense():
    date = input("Date (YYYY-MM-DD) [today]: ").strip()
    if not date:
        date = datetime.today().strftime("%Y-%m-%d")
    amount = input("Amount: ").strip()
    try:
        amount_val = float(amount)
    except:
        print("Invalid amount.")
        return
    category = input("Category (e.g., food, travel): ").strip() or "other"
    note = input("Note (optional): ").strip()
    new = [date, f"\${amount_val:.2f}", category, note]
    exists = os.path.exists(FNAME)
    with open(FNAME, "a", newline="") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(HEADERS);
        writer.writerow(new);
    print("Expense added.")

def show_summary():
    if not os.path.exists(FNAME):
        print("No expenses yet.")
        return
    totals = defaultdict(float);
    rows = [];
    with open(FNAME, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            amt = float(r["amount"])
            totals[r["category"]] += amt
            rows.append(r)
    print("\\nTotals by category:")
    for cat, t in totals.items():
        print(f" - {cat}: {t:.2f}")
    print(f"\\nTotal expenses: {sum(totals.values()):.2f}")
    print("\\nRecent entries:")
    for r in rows[-5:]:
        print(f"{r['date']} | {r['category']} | {r['amount']} | {r['note']}")

def main():
    while True:
        print("\\nExpense Tracker")
        print("1) Add expense")
        print("2) Show summary")
        print("0) Exit")
        c = input("Choice: ").strip()
        if c == "1": add_expense()
        elif c == "2": show_summary()
        elif c == "0": break
        else: print("Invalid choice.")

if __name__ == "__main__":
    main()`,
        images: ['assets/project6.svg'],
        demoUrl: '#'
      },
      '7': {
        title: 'wl-gammactl',
        description: 'A fast, feature-rich CLI tool to adjust contrast, brightness, gamma, saturation, color temperature, and RGB channels on Wayland outputs.',
        features: [
          'Adjust contrast, brightness, gamma & saturation',
          'Color temperature (Kelvin) & RGB channel control',
          'Wayland wlr-gamma-control-v1 protocol support',
          'Blazing fast execution written in Rust'
        ],
        tech: ['Rust', 'Wayland', 'CLI', 'System'],
        code: '',
        images: ['assets/project7.svg'],
        demoUrl: 'https://github.com/ZonicExists/wl-gammactl-rust'
      },
      '8': {
        title: 'Bit-Vault',
        description: 'Zero-Knowledge Password Manager & Encrypted File Vault featuring PBKDF2 key stretching, AES-256-GCM authenticated encryption, RFC 6238 TOTP 2FA generator, and k-Anonymity breach auditing.',
        features: [
          'Zero-Knowledge Architecture with PBKDF2 (100k iter) & AES-256-GCM encryption',
          'Live RFC 6238 2FA TOTP authenticator with 30s countdown progress',
          'Encrypted file & document hub with 1-click decrypted downloads',
          'k-Anonymity Pwned Password Breach Audit & Cryptographic Password Generator'
        ],
        tech: ['TypeScript', 'Security', 'AES-256', 'Crypto'],
        code: '',
        images: ['assets/project8.svg'],
        demoUrl: 'https://github.com/ZonicExists/Bit-Vault'
      }
    };

    this.init();
  }

  init() {
    // Open modal buttons
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const projectId = btn.getAttribute('data-project');
        this.openModal(projectId);
      });
    });

    // Close modal buttons
    const closeButtons = this.modal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Code toggle button
    if (this.modalCodeToggle) {
      this.modalCodeToggle.addEventListener('click', () => this.toggleCode());
    }
    this.setCodeVisibility(false);

    // Gallery navigation
    this.galleryPrev.addEventListener('click', () => this.previousImage());
    this.galleryNext.addEventListener('click', () => this.nextImage());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('active')) return;

      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'ArrowLeft') this.previousImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });

    // Trap focus in modal
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    });
  }

  toggleCode() {
    this.setCodeVisibility(!this.codeVisible);

    if (this.codeVisible && this.modalCodeSection) {
      // Smooth scroll to code section
      setTimeout(() => {
        this.modalCodeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  setCodeVisibility(isVisible) {
    this.codeVisible = isVisible;

    if (this.modalCodeSection) {
      this.modalCodeSection.classList.toggle('hidden', !isVisible);
      this.modalCodeSection.classList.toggle('visible', isVisible);
    }

    if (this.modalCodeToggle) {
      this.modalCodeToggle.classList.toggle('active', isVisible);
      this.modalCodeToggle.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
      const toggleText = this.modalCodeToggle.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = isVisible ? 'Hide' : 'View';
      }
    }
  }

  openModal(projectId) {
    this.currentProject = this.projectData[projectId];
    if (!this.currentProject) return;

    this.currentImageIndex = 0;
    this.setCodeVisibility(false);

    // Populate modal content
    this.modalTitle.textContent = this.currentProject.title;
    this.modalDescription.textContent = this.currentProject.description;

    // Features
    this.modalFeatures.innerHTML = '';
    this.currentProject.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      this.modalFeatures.appendChild(li);
    });

    // Tech stack
    this.modalTech.innerHTML = '';
    this.currentProject.tech.forEach(tech => {
      const badge = document.createElement('span');
      badge.className = 'tech-badge';
      badge.textContent = tech;
      this.modalTech.appendChild(badge);
    });

    // Code snippet (hidden by default)
    this.modalCode.textContent = this.currentProject.code || '';
    if (this.modalCodeToggle) {
      this.modalCodeToggle.style.display = this.currentProject.code ? '' : 'none';
    }

    // Links
    this.modalDemo.href = this.currentProject.demoUrl;

    // Gallery
    this.updateGallery();

    // Show modal
    this.modal.removeAttribute('hidden');
    setTimeout(() => {
      this.modal.classList.add('active');
    }, 10);

    // Store the element that triggered the modal so we can return focus on close (H4 FIX)
    this.lastFocusedElement = document.activeElement;

    // Pause matrix rain
    if (window.matrixRain) {
      window.matrixRain.pause();
    }

    // Focus first focusable element
    const firstFocusable = this.modal.querySelector('button, a');
    if (firstFocusable) firstFocusable.focus();
  }

  closeModal() {
    this.modal.classList.remove('active');
    setTimeout(() => {
      this.modal.setAttribute('hidden', '');
    }, 300);

    // Resume matrix rain
    if (window.matrixRain) {
      window.matrixRain.resume();
    }

    // H4 FIX: return focus to the element that opened the modal
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  updateGallery() {
    if (!this.currentProject) return;

    const images = this.currentProject.images;
    const currentImgSrc = images[this.currentImageIndex];
    const container = this.modal.querySelector('.gallery-container');

    if (container) {
      container.innerHTML = ''; // Clear container

      if (currentImgSrc && currentImgSrc.endsWith('.svg')) {
        // Find corresponding inline SVG in project card
        const projectId = Object.keys(this.projectData).find(key => this.projectData[key] === this.currentProject);
        const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
        const cardSvg = projectCard ? projectCard.querySelector('.project-card-svg') : null;

        if (cardSvg) {
          const clonedSvg = cardSvg.cloneNode(true);
          clonedSvg.classList.add('gallery-image');
          clonedSvg.classList.remove('project-card-svg');
          clonedSvg.style.position = '';
          clonedSvg.style.width = '100%';
          clonedSvg.style.height = '100%';
          clonedSvg.removeAttribute('id'); // Ensure no duplicate IDs
          container.appendChild(clonedSvg);
        } else {
          // Fallback to img tag if not found
          const img = document.createElement('img');
          img.className = 'gallery-image';
          img.src = currentImgSrc;
          img.alt = `${this.currentProject.title} screenshot`;
          container.appendChild(img);
        }
      } else {
        const img = document.createElement('img');
        img.className = 'gallery-image';
        img.src = currentImgSrc;
        img.alt = `${this.currentProject.title} screenshot`;
        container.appendChild(img);
      }
    }

    // Update indicators
    this.galleryIndicators.innerHTML = '';
    images.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'gallery-indicator';
      if (index === this.currentImageIndex) {
        indicator.classList.add('active');
      }
      indicator.addEventListener('click', () => {
        this.currentImageIndex = index;
        this.updateGallery();
      });
      this.galleryIndicators.appendChild(indicator);
    });

    // Hide/show navigation if only one image
    if (images.length <= 1) {
      this.galleryPrev.style.display = 'none';
      this.galleryNext.style.display = 'none';
    } else {
      this.galleryPrev.style.display = 'flex';
      this.galleryNext.style.display = 'flex';
    }
  }

  previousImage() {
    if (!this.currentProject) return;
    const images = this.currentProject.images;
    this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
    this.updateGallery();
  }

  nextImage() {
    if (!this.currentProject) return;
    const images = this.currentProject.images;
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
    this.updateGallery();
  }

  trapFocus(e) {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
}

class ContactForm {
  constructor(options = {}) {
    this.form = document.getElementById('contact-form');
    this.nameInput = document.getElementById('name');
    this.emailInput = document.getElementById('email');
    this.messageInput = document.getElementById('message');
    this.submitBtn = this.form.querySelector('.btn-submit');
    this.statusDiv = this.form.querySelector('.form-status');
    this.emailParts = ['hello', 'zonicisalive', 'com'];

    // Worker/forwarder endpoint (server-side) — priority:
    // options.forwarderUrl -> form.dataset.forwarder -> null (mailto fallback)
    this.WORKER_URL = options.forwarderUrl || this.form.dataset.forwarder || null;

    this.lastSubmit = 0;
    this.COOLDOWN_MS = options.cooldownMs || 5000;
    this.isSubmitting = false;

    // internal state for restoring button
    this._originalButtonHTML = null;
    this._successTimeout = null;
    this._errorTimeout = null;

    this.init();
  }

  getDeobfuscatedEmail() {
    return this.emailParts[0] + '@' + this.emailParts[1] + '.' + this.emailParts[2];
  }

  revealEmail() {
    const email = this.getDeobfuscatedEmail();

    // Update the main contact email display
    const emailContactValue = document.getElementById('email-contact-value');
    if (emailContactValue) {
      emailContactValue.textContent = email;
      emailContactValue.href = `mailto:${email}`;
    }

    // Update the footer social link email
    const emailSocialLinkFooter = document.getElementById('email-social-link-footer');
    if (emailSocialLinkFooter) {
      emailSocialLinkFooter.href = `mailto:${email}`;
    }
  }

  init() {
    this.revealEmail(); // Reveal the email as soon as the form is initialized

    // Create hidden honeypot field (bots love 'website')
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.style.display = 'none';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.setAttribute('tabindex', '-1');
    this.form.appendChild(honeypot);
    this.honeypot = honeypot;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Real-time validation on blur
    this.nameInput.addEventListener('blur', () => this.validateName());
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.messageInput.addEventListener('blur', () => this.validateMessage());

    // Clear status on input
    [this.nameInput, this.emailInput, this.messageInput].forEach(el => {
      el.addEventListener('input', () => {
        this.clearStatus();
      });
    });

    // Copy to clipboard functionality (existing)
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const textToCopy = this.getDeobfuscatedEmail();
        this.copyToClipboard(textToCopy, btn);
      });
    });
  }

  // Utilities
  sanitize(s) { return String(s || '').replace(/<|>/g, ''); }
  truncate(s, n) { const str = String(s || ''); return str.length > n ? str.slice(0, n - 1) + '…' : str; }
  clearStatus() {
    if (!this.statusDiv) return;
    this.statusDiv.textContent = '';
    this.statusDiv.classList.remove('show', 'success', 'error');
  }

  async fetchIP() {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (!res.ok) return 'unknown';
      const j = await res.json();
      return j.ip || 'unknown';
    } catch { return 'unknown'; }
  }

  getBrowserInfo() {
    if (typeof bowser === 'undefined') {
      console.error('Bowser library is not loaded or available.');
      return {
        browserName: 'Unknown',
        browserVersion: 'Unknown',
        osName: 'Unknown'
      };
    }
    try {
      const parser = bowser.getParser(window.navigator.userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      return {
        browserName: browser.name || 'Unknown',
        browserVersion: browser.version || 'Unknown',
        osName: os.name || 'Unknown'
      };
    } catch (e) {
      console.error('Error parsing user agent with Bowser:', e);
      return {
        browserName: 'Unknown',
        browserVersion: 'Unknown',
        osName: 'Unknown'
      };
    }
  }

  async buildPayload(name, email, message) {
    const ip = await this.fetchIP();
    const ua = navigator.userAgent || 'unknown';
    const platform = navigator.platform || 'unknown';
    const lang = navigator.language || 'unknown';
    const viewport = (screen && screen.width) ? `${screen.width}×${screen.height}` : 'unknown';
    const safeMessage = this.truncate(message, 1800);
    const { browserName, browserVersion, osName } = this.getBrowserInfo();

    return {
      name: this.truncate(name, 100),
      email: this.truncate(email, 200),
      message: safeMessage,
      platform,
      locale: lang,
      viewport,
      ip,
      userAgent: ua,
      browserName,
      browserVersion,
      osName
    };
  }

  validateName() {
    const name = this.nameInput.value.trim();
    const errorSpan = this.nameInput.nextElementSibling;
    if (name.length < 2 || name.length > 40) {
      this.showError(this.nameInput, errorSpan, 'Name must be 2–40 characters');
      return false;
    }
    this.clearError(this.nameInput, errorSpan);
    return true;
  }

  validateEmail() {
    const email = this.emailInput.value.trim();
    const errorSpan = this.emailInput.nextElementSibling;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError(this.emailInput, errorSpan, 'Please enter a valid email address');
      return false;
    }
    this.clearError(this.emailInput, errorSpan);
    return true;
  }

  validateMessage() {
    const message = this.messageInput.value.trim();
    const errorSpan = this.messageInput.nextElementSibling;
    if (message.length < 10 || message.length > 2000) {
      this.showError(this.messageInput, errorSpan, 'Message must be 10–2000 characters');
      return false;
    }
    this.clearError(this.messageInput, errorSpan);
    return true;
  }

  showError(input, errorSpan, message) {
    input.classList.add('error');
    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.classList.add('show');
    }
  }
  clearError(input, errorSpan) {
    input.classList.remove('error');
    if (errorSpan) {
      errorSpan.textContent = '';
      errorSpan.classList.remove('show');
    }
  }

  // BUTTON STATE HELPERS
  _saveOriginalButton() {
    if (!this._originalButtonHTML) {
      this._originalButtonHTML = this.submitBtn.innerHTML;
    }
  }

  setLoading(on = true) {
    if (on) {
      this._saveOriginalButton();
      this.submitBtn.classList.add('loading');
      this.submitBtn.disabled = true;
      const text = this.submitBtn.querySelector('.btn-text');
      if (text) text.textContent = 'Sending...';
      const loader = this.submitBtn.querySelector('.btn-loader');
      if (loader) loader.style.display = 'inline-block';
    } else {
      this.submitBtn.classList.remove('loading');
      this.submitBtn.disabled = false;
      const text = this.submitBtn.querySelector('.btn-text');
      if (text) text.textContent = 'Send Message';
      const loader = this.submitBtn.querySelector('.btn-loader');
      if (loader) loader.style.display = 'none';
    }
  }

  // show temporary success state on the submit button
  setButtonSuccess(message = 'Message sent', timeout = 3000) {
    this._saveOriginalButton();
    this.submitBtn.disabled = true;
    this.submitBtn.classList.remove('loading');
    this.submitBtn.classList.remove('btn-error');
    this.submitBtn.classList.add('btn-success');

    this.submitBtn.innerHTML = `
      <span class="btn-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span class="btn-text">${message}</span>
    `;

    clearTimeout(this._successTimeout);
    if (timeout > 0) {
      this._successTimeout = setTimeout(() => {
        this.restoreButton();
      }, timeout);
    }
  }

  // show error state on button (keeps disabled so user sees the failure)
  setButtonError(message = 'Send failed', timeout = 3500) {
    this._saveOriginalButton();
    this.submitBtn.disabled = true;
    this.submitBtn.classList.remove('loading');
    this.submitBtn.classList.remove('btn-success');
    this.submitBtn.classList.add('btn-error');
    this.submitBtn.innerHTML = `<span class="btn-text">${message}</span>`;

    clearTimeout(this._errorTimeout);
    if (timeout > 0) {
      this._errorTimeout = setTimeout(() => this.restoreButton(), timeout);
    }
  }

  restoreButton() {
    clearTimeout(this._successTimeout);
    clearTimeout(this._errorTimeout);
    if (this._originalButtonHTML) {
      this.submitBtn.innerHTML = this._originalButtonHTML;
    }
    this.submitBtn.disabled = false;
    this.submitBtn.classList.remove('btn-success', 'btn-error', 'loading');
  }

  // Main submit handler - sends to WORKER_URL (server-side forwarder)
  async handleSubmit() {
    if (this.isSubmitting) return;
    this.clearStatus();

    const now = Date.now();
    if (now - this.lastSubmit < this.COOLDOWN_MS) {
      if (this.statusDiv) {
        this.statusDiv.textContent = 'Please wait a moment before sending again.';
        this.statusDiv.classList.add('show', 'error');
      }
      this.setButtonError('Slow down');
      return;
    }

    // Honeypot: silently drop bots
    if (this.honeypot.value.trim() !== '') return;

    // Validate fields
    const validName = this.validateName();
    const validEmail = this.validateEmail();
    const validMessage = this.validateMessage();
    if (!validName || !validEmail || !validMessage) {
      this.setButtonError('Check fields');
      return;
    }

    this.isSubmitting = true;

    // Prepare data
    const name = this.sanitize(this.nameInput.value.trim());
    const email = this.sanitize(this.emailInput.value.trim());
    const message = this.sanitize(this.messageInput.value.trim());

    this.setLoading(true);

    try {
      const payload = await this.buildPayload(name, email, message);

      // If you have a server-side forwarder (recommended), send there.
      if (this.WORKER_URL) {
        const res = await fetch(this.WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          if (this.statusDiv) {
            this.statusDiv.textContent = 'Message sent — thank you!';
            this.statusDiv.classList.add('show', 'success');
          }
          this.form.reset();
          this.lastSubmit = Date.now();

          // Button success state
          this.setButtonSuccess('Message sent');
        } else {
          // Try to get human-friendly error
          let bodyText = '';
          try { bodyText = await res.text(); } catch (e) { }
          if (this.statusDiv) {
            this.statusDiv.textContent = `Failed to send. ${res.status}${bodyText ? ': ' + bodyText : ''}`;
            this.statusDiv.classList.add('show', 'error');
          }
          this.setButtonError('Send failed');
        }
      } else {
        // Fallback: open mail client (no webhook leakage)
        const subject = encodeURIComponent(`Contact from ${name}`);
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        const deobfuscatedEmail = this.getDeobfuscatedEmail();
        window.location.href = `mailto:${deobfuscatedEmail}?subject=${subject}&body=${body}`;
        if (this.statusDiv) {
          this.statusDiv.textContent = 'Opening your email client…';
          this.statusDiv.classList.add('show', 'success');
        }
        this.form.reset();
        this.lastSubmit = Date.now();

        // Button success for mailto fallback
        this.setButtonSuccess('Opening email…');
      }
    } catch (err) {
      console.error('Contact send error:', err);
      if (this.statusDiv) {
        this.statusDiv.textContent = 'Network error. Please try again.';
        this.statusDiv.classList.add('show', 'error');
      }
      this.setButtonError('Network error');
    } finally {
      // hide loader but leave the success/error state until timeout restores it
      const loader = this.submitBtn.querySelector('.btn-loader');
      if (loader) loader.style.display = 'none';
      this.submitBtn.classList.remove('loading');
      this.isSubmitting = false;
    }
  }

  // Copy helper
  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add('copied');
      const originalHTML = button.innerHTML;
      button.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = originalHTML;
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
}

// Note: ContactForm is instantiated inside initializeApp() at the end of the file.


// ============================================
// THEME TOGGLE
// ============================================
class ThemeToggle {
  constructor(matrixRainInstance = null) {
    this.toggleBtn = document.querySelector('.theme-toggle');
    this.body = document.body;
    this.storageKey = 'neon-theme';
    this.matrixRain = matrixRainInstance || window.matrixRain || null;

    this.init();
  }

  init() {
    // Load saved preference
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme === 'reduced') {
      this.body.classList.add('neon-reduced');
    }

    const isReduced = this.body.classList.contains('neon-reduced');
    this.syncButtonState(isReduced);
    this.updateMatrixRainState(isReduced);

    if (!this.toggleBtn) return;

    // Toggle on click
    this.toggleBtn.addEventListener('click', () => {
      const reduced = this.body.classList.toggle('neon-reduced');

      // Save preference
      localStorage.setItem(this.storageKey, reduced ? 'reduced' : 'full');
      this.syncButtonState(reduced);
      this.updateMatrixRainState(reduced);
    });
  }

  syncButtonState(isReduced) {
    if (!this.toggleBtn) return;
    this.toggleBtn.setAttribute('aria-pressed', isReduced ? 'true' : 'false');
    this.toggleBtn.classList.toggle('is-active', isReduced);
  }

  updateMatrixRainState(isReduced) {
    if (this.matrixRain && typeof this.matrixRain.setActive === 'function') {
      this.matrixRain.setActive(!isReduced);
    }
  }
}

// ============================================
// LAZY LOADING IMAGES
// ============================================
class LazyLoader {
  constructor() {
    this.images = document.querySelectorAll('img[loading="lazy"]');
    this.init();
  }

  init() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      return;
    }

    // Fallback for browsers that don't support native lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });

    this.images.forEach(img => imageObserver.observe(img));
  }
}

/* ---------------------------
   Interactive Radar Scanner Interaction Class
   --------------------------- */
class RadarInteraction {
  constructor() {
    this.radars = document.querySelectorAll('.interactive-radar');
    this.init();
  }

  init() {
    this.radars.forEach(radar => {
      const sweep = radar.querySelector('.radar-sweep');
      const orbGroup = radar.querySelector('.radar-orb-group');

      radar.addEventListener('mousemove', (e) => {
        const rect = radar.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

        if (sweep && orbGroup) {
          sweep.style.transform = `rotate(${angle}deg)`;
          orbGroup.style.transform = `rotate(${angle}deg)`;
        }
      });

      radar.addEventListener('mouseleave', () => {
        if (sweep && orbGroup) {
          sweep.style.transform = '';
          orbGroup.style.transform = '';
        }
      });

      radar.addEventListener('click', (e) => {
        const rect = radar.getBoundingClientRect();
        const localX = (e.clientX - rect.left) * (200 / rect.width);
        const localY = (e.clientY - rect.top) * (200 / rect.height);

        const ping = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ping.setAttribute('cx', localX.toString());
        ping.setAttribute('cy', localY.toString());
        ping.setAttribute('class', 'radar-ping');

        radar.appendChild(ping);

        setTimeout(() => {
          ping.remove();
        }, 800);
      });
    });
  }
}

/* ---------------------------
   Interactive Hero Hologram Interaction Class
   --------------------------- */
class HologramInteraction {
  constructor() {
    this.container = document.querySelector('.interactive-hologram');
    if (!this.container) return;

    this.sweep = this.container.querySelector('.holo-sweep');
    this.orbGroup = this.container.querySelector('.holo-orb-group');
    this.coreGroup = this.container.querySelector('.holo-core-group');
    this.svg = this.container.querySelector('.hologram-svg');

    this.hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.init();
  }

  init() {
    const triggerArea = document.querySelector('.hero-visual') || this.container;

    triggerArea.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      if (this.hasPointer) {
        const maxTilt = 18;
        const tiltX = (dx / (window.innerWidth / 2)) * maxTilt;
        const tiltY = -(dy / (window.innerHeight / 2)) * maxTilt;

        this.container.style.transform = `perspective(1000px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale3d(1.04, 1.04, 1.04)`;
      }

      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (this.sweep && this.orbGroup) {
        this.sweep.style.transform = `rotate(${angle}deg)`;
        this.orbGroup.style.transform = `rotate(${angle}deg)`;
      }

      if (this.coreGroup) {
        const maxOffset = 22;
        const dist = Math.min(maxOffset, Math.hypot(dx, dy) * 0.15);
        const angleRad = Math.atan2(dy, dx);
        const shiftX = Math.cos(angleRad) * dist;
        const shiftY = Math.sin(angleRad) * dist;
        this.coreGroup.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
      }
    });

    triggerArea.addEventListener('mouseleave', () => {
      this.container.style.transform = '';

      if (this.sweep && this.orbGroup) {
        this.sweep.style.transform = '';
        this.orbGroup.style.transform = '';
      }

      if (this.coreGroup) {
        this.coreGroup.style.transform = '';
      }
    });

    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();

      const localX = (e.clientX - rect.left) * (300 / rect.width);
      const localY = (e.clientY - rect.top) * (300 / rect.height);

      const ping = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ping.setAttribute('cx', localX.toString());
      ping.setAttribute('cy', localY.toString());
      ping.setAttribute('class', 'holo-ping');

      if (this.svg) {
        this.svg.appendChild(ping);
      }

      setTimeout(() => {
        ping.remove();
      }, 1000);
    });
  }
}

/* ---------------------------
   Full Simulated Terminal Class
   --------------------------- */
class SimTerminal {
  constructor() {
    // DOM elements
    this.el = document.getElementById('sim-terminal');
    this.screen = document.getElementById('sim-terminal-screen');
    this.input = document.getElementById('sim-terminal-input');
    this.closeBtn = document.getElementById('sim-terminal-close');
    this.toggleBtn = document.getElementById('sim-terminal-btn');

    // internal state
    this.history = [];
    this.historyIndex = -1;
    this.commands = ['help', 'about', 'skills', 'projects', 'contact', 'clear'];

    this.initialized = false; // print intro only once

    this.bind();

    // ensure hidden by default (CSS also hides it)
    if (this.el) this.el.style.display = 'none';
  }

  bind() {
    if (!this.el) return;

    // input keyboard handling
    if (this.input) this.input.addEventListener('keydown', (e) => this.onKey(e));

    // clicking screen focuses input
    if (this.screen) this.screen.addEventListener('click', () => {
      try { this.input.focus(); } catch (e) { }
    });

    // close and toggle buttons
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.toggle(false));
    if (this.toggleBtn) this.toggleBtn.addEventListener('click', () => this.toggle()); // toggles open/close

    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // toggle on Ctrl+`
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
      // ESC to close if open
      if (e.key === 'Escape') {
        const computed = this.el && getComputedStyle(this.el);
        if (this.el && computed && computed.display !== 'none') {
          this.toggle(false);
        }
      }
    });
  }

  // Toggle: show/hide terminal. forceState true=open, false=close, undefined=toggle
  toggle(forceState) {
    if (!this.el) return;
    const computed = getComputedStyle(this.el);
    const isHidden = this.el.style.display === 'none' || computed.display === 'none';
    const show = (typeof forceState === 'boolean') ? forceState : isHidden;

    const smallScreen = window.innerWidth <= 600;

    if (show) {
      // show element so transitions can run
      this.el.style.display = 'flex';

      // apply classes after layout so transitions fire
      requestAnimationFrame(() => {
        if (smallScreen) this.el.classList.add('fullscreen');
        else this.el.classList.remove('fullscreen');

        this.el.classList.add('show');             // main open animation
        if (this.toggleBtn) this.toggleBtn.classList.add('open'); // button pulse
      });

      // lock scroll for mobile drawer
      if (smallScreen) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }

      // first-time animated intro
      if (!this.initialized) {
        this.printIntro();
        this.initialized = true;
      }

      const focusDelay = smallScreen ? 350 : 160;
      setTimeout(() => {
        try {
          // If a recent doOpen() requested to suppress focus, skip focusing to avoid closing the modal.
          if (!this._suppressFocus) {
            this.input.focus();
            if (!smallScreen) this.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // optionally log or mark that focus was suppressed (for debugging)
            // console.debug('Terminal input focus suppressed to avoid closing modal.');
          }
        } catch (e) { }
      }, focusDelay);


    } else {
      // animate out
      this.el.classList.remove('show');
      if (this.toggleBtn) this.toggleBtn.classList.remove('open');

      // restore page scrolling immediately
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';

      // after the animation finishes, hide element to preserve layout
      setTimeout(() => {
        try {
          this.el.style.display = 'none';
          this.el.classList.remove('fullscreen');
        } catch (e) { }
      }, 320); // buffer slightly longer than CSS transition

      try { this.input.blur(); } catch (e) { }
    }
  }

  // Animated typewriter intro (first time open)
  async printIntro() {
    const line = 'terminal — type "help" to start.';
    await this.typeLine(line, 'sim-out-quiet', { caret: true, speed: 22 });
    this.printPrompt();
  }

  printPrompt() {
    try { this.input.focus(); } catch (e) { }
  }

  onKey(e) {
    if (e.key === 'Enter') {
      const raw = this.input.value.trim();
      this.input.value = '';
      if (!raw) return;
      this.history.unshift(raw);
      this.historyIndex = -1;
      this.echo(`$ ${raw}`);
      this.exec(raw);
    } else if (e.key === 'ArrowUp') {
      if (this.history.length === 0) return;
      e.preventDefault();
      this.historyIndex = Math.min(this.history.length - 1, this.historyIndex + 1);
      this.input.value = this.history[this.historyIndex] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex <= 0) {
        this.historyIndex = -1;
        this.input.value = '';
      } else {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex] || '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.autocomplete();
    }
  }

  // animated echo with fade-in
  echo(text, cls = 'sim-out-echo') {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    this.screen.appendChild(d);
    // trigger CSS transition
    requestAnimationFrame(() => d.classList.add('visible'));
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  printLine(text, cls = 'sim-out-info') {
    this.echo(text, cls);
  }

  clearScreen() {
    if (this.screen) this.screen.innerHTML = '';
  }

  autocomplete() {
    const val = this.input.value.trim();
    const hits = this.commands.filter(c => c.startsWith(val));
    if (hits.length === 1) this.input.value = hits[0] + (['open', 'run'].includes(hits[0]) ? ' ' : '');
    else if (hits.length > 1) this.printLine('Possible: ' + hits.join(', '), 'sim-out-quiet');
  }

  exec(raw) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    switch (cmd) {
      case 'help':
        this.printLine('Available commands:', 'sim-out-quiet');
        this.printLine('• help — list commands');
        this.printLine('• about — short bio');
        this.printLine('• skills — skills list');
        this.printLine('• projects — list projects');
        this.printLine('• contact — show contact info');
        this.printLine('• clear — clear screen');
        break;

      case 'about':
        this.doAbout();
        break;

      case 'skills':
        this.doSkills();
        break;

      case 'projects':
        this.doProjects();
        break;

      case 'contact':
        this.doContact();
        break;

      case 'clear':
        this.clearScreen();
        break;

      default:
        this.printLine(`Unknown command: ${cmd} — try "help".`, 'sim-out-error');
    }
  }

  doAbout() {
    const aboutEl = document.querySelector('#about .about-text');
    if (aboutEl) {
      this.printLine(aboutEl.innerText.trim().split('\n').slice(0, 2).join(' '));
    } else {
      this.printLine('About info not found on page.', 'sim-out-error');
    }
  }

  doSkills() {
    const tags = Array.from(document.querySelectorAll('.skill-tag')).map(s => s.textContent.trim());
    const bars = Array.from(document.querySelectorAll('.skill-bar')).map(b => {
      const name = b.getAttribute('data-skill') || b.querySelector('.skill-bar-label span')?.textContent?.trim() || '';
      const level = b.getAttribute('data-level') || b.querySelector('.skill-bar-percent')?.textContent?.trim() || '';
      return `${name} — ${level}%`;
    });
    if (bars.length) {
      bars.forEach(l => this.printLine(l));
    } else if (tags.length) {
      this.printLine('Skills: ' + tags.join(', '));
    } else {
      this.printLine('No skills found on the page.', 'sim-out-error');
    }
  }

  doProjects() {
    const cards = Array.from(document.querySelectorAll('.project-card'));
    if (!cards.length) { this.printLine('No projects found.', 'sim-out-error'); return; }
    cards.forEach(card => {
      const id = card.getAttribute('data-project-id') || card.dataset.projectId || '?';
      const title = card.querySelector('.project-title')?.textContent?.trim() || 'Untitled';
      this.printLine(`${id} — ${title}`);
    });
  }

  doContact() {
    const deobfuscatedEmail = window.contactForm ? window.contactForm.getDeobfuscatedEmail() : 'loading...';
    this.printLine(`Email: ${deobfuscatedEmail}`, 'sim-out-quiet');
    this.printLine("Insta: @princeisalive", 'sim-out-quiet');
    this.printLine("GitHub: @ZonicExists", 'sim-out-quiet');

  }

  // types a line character-by-character into the screen and animates it
  async typeLine(text, cls = 'sim-out-info', opts = {}) {
    const speed = opts.speed || 24; // ms per character
    const caret = opts.caret || false;

    const div = document.createElement('div');
    div.className = cls;
    const span = document.createElement('span');
    div.appendChild(span);

    // optional caret
    let caretEl = null;
    if (caret) {
      caretEl = document.createElement('span');
      caretEl.className = 'sim-type-caret';
      div.appendChild(caretEl);
    }

    this.screen.appendChild(div);
    this.screen.scrollTop = this.screen.scrollHeight;

    for (let i = 0; i < text.length; i++) {
      span.textContent = text.slice(0, i + 1);
      this.screen.scrollTop = this.screen.scrollHeight;
      const jitter = Math.round((Math.random() - 0.5) * (speed * 0.35));
      await this.sleep(Math.max(8, speed + jitter));
    }

    if (caretEl && caretEl.parentNode) caretEl.remove();

    requestAnimationFrame(() => div.classList.add('visible'));
  }

  sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
}

// instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.simTerminal = new SimTerminal();
  } catch (err) {
    console.warn('SimTerminal init failed', err);
  }
});

/* ===========================
   GLOBAL TOGGLE PERSISTENCE (NO RESET)
   - Persists states for:
     * theme toggle (.theme-toggle) -> 'neonReduced'
     * nav toggle (.nav-toggle /.nav-menu) -> 'navOpen'
     * project filters (.filter-btn) -> 'projectFilter'
     * modal code toggle (.modal-code-toggle) -> 'modalCodeVisible'
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const modalCodeToggleSelector = '.modal-code-toggle';

  // Helper keys
  const KEY = {
    NEON: 'neonReduced',
    NAV: 'navOpen',
    FILTER: 'projectFilter',
    MODAL_CODE: 'modalCodeVisible'
  };

  // ---------- Project filters ----------
  (function initFilters() {
    if (!filterBtns.length) return;
    const stored = localStorage.getItem(KEY.FILTER) || 'all';
    // Apply stored active
    filterBtns.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f === stored) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');  // M5 FIX: role="radio" uses aria-checked
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      }
    });

    // Save when clicked (existing ProjectFilter still runs filter logic)
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        try { localStorage.setItem(KEY.FILTER, f); } catch (e) { }
      });
    });
  })();

  // ---------- Modal code toggle persistence ----------
  (function initModalCodeTogglePersistence() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest(modalCodeToggleSelector);
      if (!el) return;
      setTimeout(() => {
        const active = el.classList.contains('active');
        try { localStorage.setItem(KEY.MODAL_CODE, String(active)); } catch (err) { }
      }, 40);
    });
  })();

  // Ensure that when a modal opens, if modalCodeVisible is true we show code.
  (function syncModalOnOpen() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    const observer = new MutationObserver(() => {
      if (modal.classList.contains('active')) {
        const saved = localStorage.getItem(KEY.MODAL_CODE) === 'true';
        const mToggle = modal.querySelector(modalCodeToggleSelector);
        if (mToggle) {
          const isActive = mToggle.classList.contains('active');
          if (saved && !isActive) {
            mToggle.click();
          } else if (!saved && isActive) {
            mToggle.click();
          }
        }
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'], subtree: false });
  })();

  // expose small helper if you ever want to clear localStorage manually from console
  window.clearTogglePersistence = function () {
    try {
      localStorage.removeItem(KEY.NEON);
      localStorage.removeItem(KEY.NAV);
      localStorage.removeItem(KEY.FILTER);
      localStorage.removeItem(KEY.MODAL_CODE);
      console.log('Toggle persistence cleared (manual).');
    } catch (e) { console.warn('Could not clear toggle persistence:', e); }
  };
});


// ============================================
// AMBIENT AUDIO ENGINE
// Server-room hum: filtered noise + gentle sine + soft blips
// On by default — toggled via the theme-toggle button
// ============================================
class AmbientAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.noiseNode = null;
    this.blipTimer = null;
    this.isOn = false;
    this.fadeDuration = 1.5;
    this.toggleBtn = document.querySelector('.theme-toggle');
    this._init();
  }

  _createContext() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  // Generate N seconds of stereo white noise in a loop buffer
  _makeNoiseBuf(seconds = 4) {
    const sr = this.ctx.sampleRate;
    const len = sr * seconds;
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  _buildAmbience() {
    if (this.noiseNode) return;
    const ctx = this.ctx;

    // ── Layer 1: Low-pass filtered noise (smooth room hum) ──
    const noiseBuf = this._makeNoiseBuf(6);
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuf;
    noiseNode.loop = true;

    // Steep low-pass: only sub-200Hz rumble comes through
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 120;
    lp1.Q.value = 0.5;

    const lp2 = ctx.createBiquadFilter(); // second pass for extra smoothness
    lp2.type = 'lowpass';
    lp2.frequency.value = 80;
    lp2.Q.value = 0.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.18; // very quiet

    noiseNode.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseNode.start();
    this.noiseNode = noiseNode;

    // ── Layer 2: Gentle 60 Hz sine with slow tremolo ──
    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.value = 60;

    const sineGain = ctx.createGain();
    sineGain.gain.value = 0.04;

    // LFO: slow 0.08 Hz amplitude swell
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025; // modulation depth
    lfo.connect(lfoGain);
    lfoGain.connect(sineGain.gain);
    lfo.start();

    sine.connect(sineGain);
    sineGain.connect(this.masterGain);
    sine.start();

    // ── Layer 3: Occasional ultra-soft band-pass blips ──
    this._scheduleBlips();
  }

  _scheduleBlips() {
    const fire = () => {
      if (!this.isOn || !this.ctx) return;
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * 0.04); // 40ms burst
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      // Band-pass centred ~800-2000 Hz gives a soft "hiss tick"
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 800 + Math.random() * 1200;
      bp.Q.value = 2.5;

      // Envelope: fast attack, decay
      const eg = ctx.createGain();
      eg.gain.setValueAtTime(0, ctx.currentTime);
      eg.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.005);
      eg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      src.connect(bp);
      bp.connect(eg);
      eg.connect(this.masterGain);
      src.start();

      // next blip: 4-9 seconds
      this.blipTimer = setTimeout(fire, 4000 + Math.random() * 5000);
    };

    // first blip after 3-6 seconds
    this.blipTimer = setTimeout(fire, 3000 + Math.random() * 3000);
  }

  _stopBlips() {
    clearTimeout(this.blipTimer);
    this.blipTimer = null;
  }

  on() {
    if (this.isOn) return;
    this._createContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._buildAmbience();
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + this.fadeDuration);
    this.isOn = true;
    this._syncBtn(true);
    try { localStorage.setItem('ambient-audio', 'on'); } catch (_) { }
  }

  off() {
    if (!this.isOn || !this.ctx) return;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.fadeDuration * 0.5);
    this._stopBlips();
    this.isOn = false;
    this._syncBtn(false);
    try { localStorage.setItem('ambient-audio', 'off'); } catch (_) { }
  }

  toggle() { this.isOn ? this.off() : this.on(); }

  _syncBtn(on) {
    if (!this.toggleBtn) return;
    this.toggleBtn.classList.toggle('audio-on', on);
    this.toggleBtn.title = on
      ? 'Neon & Sound ON — click to mute'
      : 'Neon & Sound OFF — click to enable';
  }

  _init() {
    if (PREFERS_REDUCED_MOTION) return;

    // Read persisted state — default is 'on' if nothing saved yet
    const saved = (() => { try { return localStorage.getItem('ambient-audio'); } catch (_) { return null; } })();
    const shouldAutoStart = saved !== 'off'; // null (first visit) or 'on' → start

    // Browsers require a user gesture before AudioContext can play
    const startOnInteraction = () => {
      if (shouldAutoStart) this.on();
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
    };
    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('keydown', startOnInteraction, { once: true });

    // Sync with theme toggle: neon-reduced → audio off
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        requestAnimationFrame(() => {
          document.body.classList.contains('neon-reduced') ? this.off() : this.on();
        });
      });
    }
  }
}

// ============================================
// VISITOR COUNTER
// ============================================
class VisitorCounter {
  constructor() {
    this.el = document.getElementById('visitor-count');
    if (!this.el) return;
    this._fetch();
  }

  async _fetch() {
    try {
      const res = await fetch('https://api.counterapi.dev/v2/who-is-zonics-team-4533/first-counter-4533/up');
      if (res.ok) {
        const json = await res.json();
        const value = json && json.data ? json.data.up_count : (json ? json.count : 0);
        if (value > 0) {
          this._rollUp(value);
          return;
        }
      }
    } catch (e) {
      // CounterAPI blocked by adblocker / network
    }

    // Dynamic real visit tracking fallback if API is blocked by adblocker
    let localCount = parseInt(localStorage.getItem('zonic_visits') || '135', 10);
    localCount += 1;
    localStorage.setItem('zonic_visits', localCount);
    this._rollUp(localCount);
  }

  _rollUp(target) {
    const duration = 1200;
    const start = performance.now();
    const update = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * target);
      this.el.textContent = val.toLocaleString();
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}

// ============================================
// SKILLS RADAR CHART (Chart.js)
// ============================================
class SkillsRadarChart {
  constructor() {
    this.canvas = document.getElementById('skills-radar');
    if (!this.canvas || typeof Chart === 'undefined') return;
    this._observed = false;
    this._observe();
  }

  _observe() {
    if (PREFERS_REDUCED_MOTION) { this._build(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this._observed) {
        this._observed = true;
        this._build();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(this.canvas);
  }

  _build() {
    // Read current CSS variable value for consistent theme color
    const computedStyle = getComputedStyle(document.documentElement);
    const themeColor = computedStyle.getPropertyValue('--color-matrix-green').trim() || '#00FF8C';
    
    // Parse hex to rgb
    const r = parseInt(themeColor.substring(1, 3), 16) || 0;
    const g = parseInt(themeColor.substring(3, 5), 16) || 255;
    const b = parseInt(themeColor.substring(5, 7), 16) || 140;

    const GREEN = `rgba(${r}, ${g}, ${b}, `;
    const CYAN = 'rgba(0, 240, 255, ';

    Chart.defaults.color = '#959595';
    Chart.defaults.font.family = "'JetBrains Mono', monospace";

    this.chart = new Chart(this.canvas, {
      type: 'radar',
      data: {
        labels: ['Python', 'Bash/Shell', 'C', 'Systems', 'Scripting', 'Automation'],
        datasets: [{
          label: 'Skill Level',
          data: [85, 80, 70, 60, 60, 50],
          backgroundColor: GREEN + '0.12)',
          borderColor: GREEN + '0.9)',
          borderWidth: 2,
          pointBackgroundColor: GREEN + '1)',
          pointBorderColor: CYAN + '0.8)',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
        }]
      },
      options: {
        animation: { duration: PREFERS_REDUCED_MOTION ? 0 : 1200, easing: 'easeOutQuart' },
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 100,
            ticks: {
              stepSize: 25,
              color: 'rgba(149,149,149,0.5)',
              backdropColor: 'transparent',
              font: { size: 9 }
            },
            grid: { color: GREEN + '0.1)' },
            angleLines: { color: GREEN + '0.12)' },
            pointLabels: { color: '#E0E0E0', font: { size: 11, weight: '500' } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderColor: GREEN + '0.5)',
            borderWidth: 1,
            titleColor: themeColor,
            bodyColor: '#E0E0E0',
            callbacks: { label: (ctx) => ` ${ctx.raw}%` }
          }
        }
      }
    });
  }

  updateColors(hex) {
    if (!this.chart) return;
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 255;
    const b = parseInt(hex.substring(5, 7), 16) || 140;

    const dataset = this.chart.data.datasets[0];
    dataset.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
    dataset.borderColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
    dataset.pointBackgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;

    this.chart.options.scales.r.grid.color = `rgba(${r}, ${g}, ${b}, 0.1)`;
    this.chart.options.scales.r.angleLines.color = `rgba(${r}, ${g}, ${b}, 0.12)`;
    this.chart.options.plugins.tooltip.borderColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    this.chart.options.plugins.tooltip.titleColor = hex;

    this.chart.update();
  }
}

// ============================================
// MATRIX RAIN CUSTOMIZER
// ============================================
class MatrixCustomizer {
  constructor(matrixRainInstance) {
    this.rain = matrixRainInstance || window.matrixRain;
    this.panel = document.getElementById('matrix-customizer');
    this.btn = document.getElementById('matrix-customizer-btn');
    this.closeBtn = document.getElementById('mc-close');
    this.speedSlider = document.getElementById('mc-speed');
    this.speedVal = document.getElementById('mc-speed-val');
    this.densitySlider = document.getElementById('mc-density');
    this.densityVal = document.getElementById('mc-density-val');
    this.swatches = document.querySelectorAll('.mc-color-swatch');

    if (!this.panel || !this.btn) return;
    this._loadSaved();
    this._bind();
  }

  _loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem('mc-settings') || '{}');
      if (saved.speed) { this.speedSlider.value = saved.speed; this._applySpeed(saved.speed); }
      if (saved.density) { this.densitySlider.value = saved.density; this._applyDensity(saved.density); }
      if (saved.color) this._applyColor(saved.color);
    } catch { }
  }

  _save() {
    try {
      localStorage.setItem('mc-settings', JSON.stringify({
        speed: this.speedSlider.value,
        density: this.densitySlider.value,
        color: this._currentColor()
      }));
    } catch { }
  }

  _currentColor() {
    const active = this.panel.querySelector('.mc-color-swatch.active');
    return active ? active.dataset.color : '#00FF8C';
  }

  _applySpeed(val) {
    if (this.speedVal) this.speedVal.textContent = val;
    if (this.rain) {
      this.rain.speedSetting = Math.max(1, Number(val));
      this.rain.frameInterval = 1000 / this.rain.speedSetting;
    }
  }

  _applyDensity(val) {
    if (this.densityVal) this.densityVal.textContent = val + '%';
    if (this.rain) this.rain.density = Number(val) / 100;
  }

  _hexToRgbStr(hex) {
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 0;
    const b = parseInt(hex.substring(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
  }

  _applyColor(hex) {
    hex = (hex || '#00FF8C').toUpperCase();
    if (hex === 'VAR(--COLOR-MATRIX-GREEN)') hex = '#00FF8C';

    // Update MatrixRain draw color via a stored property
    if (this.rain) this.rain.color = hex;
    // Patch draw method color on the fly
    this.swatches.forEach(s => s.classList.toggle('active', s.dataset.color === hex));

    const palettes = {
      '#00FF8C': { primary: '#00FF8C', secondary: '#00F0FF', tertiary: '#B028FF', dark: '#00CC70' },
      '#00F0FF': { primary: '#00F0FF', secondary: '#B028FF', tertiary: '#00FF8C', dark: '#00C0CC' },
      '#FF3333': { primary: '#FF3333', secondary: '#FF9933', tertiary: '#FF33B0', dark: '#CC2828' },
      '#B028FF': { primary: '#B028FF', secondary: '#00F0FF', tertiary: '#FF33B0', dark: '#8C20CC' }
    };

    const palette = palettes[hex] || palettes['#00FF8C'];

    // Update global site theme CSS variables dynamically
    document.documentElement.style.setProperty('--color-matrix-green', palette.primary);
    document.documentElement.style.setProperty('--color-cyan', palette.secondary);
    document.documentElement.style.setProperty('--color-purple', palette.tertiary);
    document.documentElement.style.setProperty('--color-matrix-green-dark', palette.dark);

    // Update RGB variants for transparency-based styling
    document.documentElement.style.setProperty('--color-matrix-green-rgb', this._hexToRgbStr(palette.primary));
    document.documentElement.style.setProperty('--color-cyan-rgb', this._hexToRgbStr(palette.secondary));
    document.documentElement.style.setProperty('--color-purple-rgb', this._hexToRgbStr(palette.tertiary));

    // Update the chart if it exists
    if (window.skillsRadarChart && typeof window.skillsRadarChart.updateColors === 'function') {
      window.skillsRadarChart.updateColors(palette.primary);
    }
  }

  _darkenColor(hex, percent) {
    let num = parseInt(hex.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 + (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 + (B < 0 ? 0 : B > 255 ? 255 : B)).toString(16).slice(1);
  }

  _bind() {
    this.btn.addEventListener('click', () => this._toggle());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this._toggle(false));

    this.speedSlider.addEventListener('input', () => {
      this._applySpeed(this.speedSlider.value);
      this._save();
    });
    this.densitySlider.addEventListener('input', () => {
      this._applyDensity(this.densitySlider.value);
      this._save();
    });
    this.swatches.forEach(sw => {
      sw.addEventListener('click', () => {
        this._applyColor(sw.dataset.color);
        this._save();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.panel.classList.contains('open')) return;
      if (!this.panel.contains(e.target) && !this.btn.contains(e.target)) {
        this._toggle(false);
      }
    });
  }

  _toggle(force) {
    const open = (typeof force === 'boolean') ? force : !this.panel.classList.contains('open');
    this.panel.classList.toggle('open', open);
    this.panel.setAttribute('aria-hidden', String(!open));
    this.btn.classList.toggle('open', open);
  }
}

// Patch MatrixRain to support dynamic color
(function patchMatrixRainColor() {
  const orig = MatrixRain.prototype.draw;
  MatrixRain.prototype.draw = function () {
    if (!this.ctx || !this.canvas) return;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.color || '#00FF8C';
    this.ctx.font = `${this.fontSize}px monospace`;
    for (let i = 0; i < this.drops.length; i++) {
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;
      if (Math.random() <= this.density) {
        const char = this.chars[Math.floor(Math.random() * this.chars.length)];
        this.ctx.fillText(char, x, y);
      }
      if (y > this.canvas.height && Math.random() > 0.975) this.drops[i] = 0;
      this.drops[i]++;
    }
  };
})();

// ============================================
// CURRENTLY LEARNING BADGE
// ============================================
class CurrentlyLearning {
  // Update this array to change what appears in the badge
  static TOPICS = [
    '[ Penetration Testing ]',
    '[ Web Exploitation ]',
    '[ Linux Internals ]',
    '[ Python Scripting ]',
    '[ Network Protocols ]',
  ];

  constructor() {
    this.el = document.getElementById('cl-topic');
    if (!this.el) return;
    this._topicIndex = 0;
    this._type(CurrentlyLearning.TOPICS[0]);
  }

  async _type(text) {
    this.el.textContent = '';
    for (let i = 0; i <= text.length; i++) {
      this.el.textContent = text.slice(0, i);
      await this._sleep(38 + Math.random() * 20);
    }
    await this._sleep(3200);
    await this._erase(text);
    this._topicIndex = (this._topicIndex + 1) % CurrentlyLearning.TOPICS.length;
    this._type(CurrentlyLearning.TOPICS[this._topicIndex]);
  }

  async _erase(text) {
    for (let i = text.length; i >= 0; i--) {
      this.el.textContent = text.slice(0, i);
      await this._sleep(22);
    }
    await this._sleep(400);
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ============================================
// KONAMI CODE SECRET
// ============================================
class KonamiCode {
  static SEQUENCE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  constructor(matrixRainInstance) {
    this.rain = matrixRainInstance || window.matrixRain;
    this.overlay = document.getElementById('konami-overlay');
    this._progress = 0;
    this._timer = null;
    if (!this.overlay) return;
    document.addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    const expected = KonamiCode.SEQUENCE[this._progress];
    if (e.key === expected) {
      this._progress++;
      clearTimeout(this._timer);
      this._timer = setTimeout(() => { this._progress = 0; }, 2000);
      if (this._progress === KonamiCode.SEQUENCE.length) {
        this._progress = 0;
        this._trigger();
      }
    } else {
      this._progress = 0;
    }
  }

  _trigger() {
    if (!this.overlay) return;

    // Hyper-speed matrix rain for 2.5s
    if (this.rain) {
      const origSpeed = this.rain.speedSetting;
      const origDensity = this.rain.density;
      this.rain.speedSetting = 60;
      this.rain.frameInterval = 1000 / 60;
      this.rain.density = 1;
      setTimeout(() => {
        this.rain.speedSetting = origSpeed;
        this.rain.frameInterval = 1000 / origSpeed;
        this.rain.density = origDensity;
      }, 2500);
    }

    // Show overlay
    this.overlay.removeAttribute('aria-hidden');
    this.overlay.classList.add('active');

    // Auto-dismiss after 3s
    setTimeout(() => {
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
    }, 3000);

    // Click to dismiss early
    const dismiss = () => {
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.overlay.removeEventListener('click', dismiss);
    };
    this.overlay.addEventListener('click', dismiss);
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  function initializeApp() {
    if (window.appInitialized) return;
    window.appInitialized = true;
    // Initialize Matrix Rain
    const matrixRain = new MatrixRain('matrix-canvas');
    window.matrixRain = matrixRain;
    new StellarField('stellar-canvas');

    // Initialize Custom Cursor (only on non-touch devices)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      new CustomCursor();
    }

    // Initialize Navigation
    new Navigation();

    // Initialize Scroll Animations
    new ScrollAnimations();

    // Scroll progress indicator
    new ScrollProgress();

    // Initialize Project Filter
    new ProjectFilter();

    // Initialize Project Card Tilt
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      new ProjectCardTilt();
    }

    // Initialize Project Modal
    new ProjectModal();

    // Initialize Contact Form and expose it globally for the terminal
    window.contactForm = new ContactForm();

    // Initialize Theme Toggle
    new ThemeToggle(matrixRain);

    // Initialize Lazy Loading
    new LazyLoader();

    // Hero intro + parallax
    new HeroMotion();

    // Initialize Hero Radar Canvas (interactive hologram)
    new HeroRadarCanvas();

    // ── NEW FEATURES ────────────────────────────────────
    // Ambient Audio (on by default, wired to theme toggle)
    window.ambientAudio = new AmbientAudio();

    // Visitor Counter
    new VisitorCounter();

    // Skills Radar Chart
    window.skillsRadarChart = new SkillsRadarChart();

    // Matrix Rain Customizer
    new MatrixCustomizer(matrixRain);

    // Currently Learning badge
    new CurrentlyLearning();

    // Konami Code
    new KonamiCode(matrixRain);

    console.log('%c💚 Welcome to the Matrix 💚', 'color: #00FF8C; font-size: 20px; font-weight: bold;');
    console.log('%cPortfolio by Zonic', 'color: #00F0FF; font-size: 14px;');
    console.log('%c↑↑↓↓←→←→BA 👀', 'color: #B028FF; font-size: 11px;');
  }

  // Create a script element for Bowser
  var bowserScript = document.createElement('script');
  bowserScript.src = "https://cdnjs.cloudflare.com/ajax/libs/bowser/2.12.1/bundled.js";
  bowserScript.onload = initializeApp; // Initialize after loading
  bowserScript.onerror = function () {
    console.error("Bowser script could not be loaded. The application will be initialized without it.");
    initializeApp(); // Initialize anyway, getBrowserInfo will have its fallback
  };
  document.head.appendChild(bowserScript);
});