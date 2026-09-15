/**
 * AUREUS & BLADE - REALISTIC VECTOR SCISSORS RIGGING & KINEMATICS
 * Implements: Natural cutting motion, metallic shine, cursor tracking, and procedural audio.
 */

class ScissorEngine {
  constructor() {
    this.audioCtx = null;
    this.audioEnabled = false; // default polite state, enabled on user click or toggle
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.currentX = this.mouseX;
    this.currentY = this.mouseY;
    this.currentRot = 0;
    this.trackedElements = [];
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initAudioContext();
    this.initMouseTracking();
  }

  // Procedural Web Audio Synthesizer for Scissor Snip
  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      // Lazy init on first user gesture
      const unlockAudio = () => {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      };
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
    if (enabled && this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioEnabled;
  }

  playSnipSound() {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      const t = this.audioCtx.currentTime;
      // Synthesize high-frequency crisp friction & metallic click
      const bufferSize = this.audioCtx.sampleRate * 0.07; // 70ms snip
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Highpass filter for razor-sharp steel friction
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3800, t);
      filter.Q.setValueAtTime(3.5, t);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      whiteNoise.start(t);
    } catch (e) {
      console.warn('Audio play snip suppressed:', e);
    }
  }

  // Returns realistic SVG markup for barber shears with dual rotating blades & gold pivot
  getScissorSVG(idSuffix = 'main', scale = 1) {
    return `
      <svg class="artisan-shears-svg" id="shears-${idSuffix}" viewBox="0 0 300 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Steel Blade Gradient -->
          <linearGradient id="bladeGradient-${idSuffix}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="30%" stop-color="#cbd5e1" />
            <stop offset="65%" stop-color="#64748b" />
            <stop offset="100%" stop-color="#334155" />
          </linearGradient>

          <!-- Metallic Sheen Sweep Gradient -->
          <linearGradient id="sheenGrad-${idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0)" />
            <stop offset="45%" stop-color="rgba(255,255,255,0.95)" />
            <stop offset="55%" stop-color="rgba(245,230,169,0.9)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </linearGradient>

          <!-- Gold Pivot Bolt Gradient -->
          <radialGradient id="goldPivot-${idSuffix}" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#fff4cc" />
            <stop offset="40%" stop-color="#d4af37" />
            <stop offset="85%" stop-color="#8c6d17" />
            <stop offset="100%" stop-color="#4a3b0f" />
          </radialGradient>

          <!-- Drop Shadow for Realistic Steel Depth -->
          <filter id="bladeShadow-${idSuffix}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="4" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.65" />
          </filter>
        </defs>

        <!-- TOP BLADE GROUP (Rotates around 150, 150) -->
        <g class="blade-top-group" id="top-blade-${idSuffix}">
          <!-- Handle & Finger Ring with Tang -->
          <path d="M 150 150 
                   C 142 165 130 185 110 205 
                   C 95 220 75 230 55 225 
                   C 35 220 25 198 32 178 
                   C 38 158 60 148 80 152 
                   C 100 156 115 170 125 178 
                   L 150 150 Z" 
                fill="url(#bladeGradient-${idSuffix})" 
                filter="url(#bladeShadow-${idSuffix})" />
          
          <!-- Ergonomic Finger Tang (Pinky rest) -->
          <path d="M 35 225 C 22 238 12 255 15 265 C 18 272 26 270 28 262 C 32 250 40 238 52 230 Z" 
                fill="url(#bladeGradient-${idSuffix})" />

          <!-- Finger Ring Cutout -->
          <ellipse cx="58" cy="190" rx="16" ry="22" fill="#0c0c11" />
          <ellipse cx="58" cy="190" rx="14" ry="20" fill="none" stroke="rgba(212,175,55,0.4)" stroke-width="1.5" />

          <!-- Top Cutting Blade -->
          <path d="M 150 150 
                   C 165 142 205 115 250 78 
                   C 265 65 278 50 285 38 
                   C 282 45 262 72 238 98 
                   C 205 132 170 148 150 150 Z" 
                fill="url(#bladeGradient-${idSuffix})" 
                stroke="#e2e8f0" 
                stroke-width="0.8" 
                filter="url(#bladeShadow-${idSuffix})" />

          <!-- Beveled Razor Edge Highlight -->
          <path d="M 150 150 C 185 125 240 75 285 38" 
                stroke="#ffffff" 
                stroke-width="1.6" 
                stroke-linecap="round" />

          <!-- Metallic Sheen Sweep Overlay (Top Blade) -->
          <path class="metallic-shine-path" 
                d="M 160 145 L 280 42 L 272 52 L 165 148 Z" 
                fill="url(#sheenGrad-${idSuffix})" />
        </g>

        <!-- BOTTOM BLADE GROUP (Rotates around 150, 150) -->
        <g class="blade-bottom-group" id="bottom-blade-${idSuffix}">
          <!-- Handle & Thumb Ring -->
          <path d="M 150 150 
                   C 140 135 125 115 110 95 
                   C 95 78 78 68 56 74 
                   C 36 80 28 102 36 122 
                   C 44 142 66 150 86 145 
                   C 105 140 120 125 130 118 
                   L 150 150 Z" 
                fill="url(#bladeGradient-${idSuffix})" 
                filter="url(#bladeShadow-${idSuffix})" />

          <!-- Thumb Ring Cutout -->
          <ellipse cx="60" cy="110" rx="16" ry="20" fill="#0c0c11" />
          <ellipse cx="60" cy="110" rx="14" ry="18" fill="none" stroke="rgba(212,175,55,0.4)" stroke-width="1.5" />

          <!-- Bottom Cutting Blade -->
          <path d="M 150 150 
                   C 165 158 205 185 250 222 
                   C 265 235 278 250 285 262 
                   C 282 255 262 228 238 202 
                   C 205 168 170 152 150 150 Z" 
                fill="url(#bladeGradient-${idSuffix})" 
                stroke="#e2e8f0" 
                stroke-width="0.8" 
                filter="url(#bladeShadow-${idSuffix})" />

          <!-- Beveled Razor Edge Highlight -->
          <path d="M 150 150 C 185 175 240 225 285 262" 
                stroke="#ffffff" 
                stroke-width="1.6" 
                stroke-linecap="round" />

          <!-- Metallic Sheen Sweep Overlay (Bottom Blade) -->
          <path class="metallic-shine-path" 
                d="M 160 155 L 280 258 L 272 248 L 165 152 Z" 
                fill="url(#sheenGrad-${idSuffix})" />
        </g>

        <!-- CENTER PIVOT SCREW (Japanese 440C Convex Tension System) -->
        <circle cx="150" cy="150" r="12" fill="url(#goldPivot-${idSuffix})" stroke="#ecdcb9" stroke-width="1.5" filter="url(#bladeShadow-${idSuffix})" />
        <circle cx="150" cy="150" r="5" fill="#3a2f0f" />
        <line x1="144" y1="150" x2="156" y2="150" stroke="#f5e7a9" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="147" cy="147" r="2" fill="#ffffff" opacity="0.8" />
      </svg>
    `;
  }

  // Mount realistic scissors into a DOM container
  mount(container, idSuffix = 'main') {
    if (!container) return;
    container.innerHTML = this.getScissorSVG(idSuffix);
    const shearsEl = container.querySelector(`#shears-${idSuffix}`);

    // Interactive click trigger: snappy multi-snip flourish with sound
    container.addEventListener('click', () => {
      this.triggerSnip(container);
    });

    return shearsEl;
  }

  // Trigger rapid snip sequence with sound & particles
  triggerSnip(container) {
    if (!container) return;
    container.classList.remove('scissors-active');
    void container.offsetWidth; // trigger reflow
    container.classList.add('scissors-active');

    this.playSnipSound();

    // Trigger hair particle burst at tip if particle engine is present
    if (window.hairParticleEngine) {
      const rect = container.getBoundingClientRect();
      const tipX = rect.left + rect.width * 0.85;
      const tipY = rect.top + rect.height * 0.45;
      window.hairParticleEngine.burstHair(tipX, tipY, 14);
    }

    setTimeout(() => {
      container.classList.remove('scissors-active');
    }, 450);
  }

  // Mouse tracking with smooth lerping damping on desktop
  initMouseTracking() {
    if (this.isReducedMotion || window.innerWidth < 1024) return;

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    const render = () => {
      // Linear interpolation (lerp) damping
      this.currentX += (this.mouseX - this.currentX) * 0.05;
      this.currentY += (this.mouseY - this.currentY) * 0.05;

      const deltaX = (this.mouseX - window.innerWidth / 2) / (window.innerWidth / 2);
      const deltaY = (this.mouseY - window.innerHeight / 2) / (window.innerHeight / 2);

      this.trackedElements.forEach(({ el, maxTilt, maxShift }) => {
        if (!el) return;
        const tiltX = -deltaY * maxTilt;
        const tiltY = deltaX * maxTilt;
        const shiftX = deltaX * maxShift;
        const shiftY = deltaY * maxShift;

        el.style.transform = `perspective(1000px) translate3d(${shiftX}px, ${shiftY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  trackElement(el, maxTilt = 8, maxShift = 12) {
    if (el) {
      this.trackedElements.push({ el, maxTilt, maxShift });
    }
  }
}

// Instantiate global ScissorEngine
window.scissorEngine = new ScissorEngine();
