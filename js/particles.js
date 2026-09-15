/**
 * AUREUS & BLADE - HAIR PARTICLE PHYSICS ENGINE
 * Simulates gentle floating micro hair strands, scroll velocity impulse, and snipping particle bursts.
 */

class HairParticleEngine {
  constructor(canvasId = 'hair-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.burstParticles = [];
    this.maxParticles = 38; // Elegant and minimal, never messy
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.lastScrollY = window.scrollY;
    this.scrollVelocity = 0;
    this.mouseX = -1000;
    this.mouseY = -1000;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isRunning = true;

    this.initCanvas();
    this.createInitialParticles();
    this.bindEvents();
    if (!this.isReducedMotion) {
      this.loop();
    }
  }

  initCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticle(isNew = false) {
    const hairColors = [
      'rgba(212, 175, 55, 0.35)',   // Golden rim-lit strand
      'rgba(245, 230, 169, 0.28)',  // Champagne sheen strand
      'rgba(180, 185, 195, 0.25)',  // Silver platinum strand
      'rgba(90, 95, 110, 0.3)'      // Deep obsidian strand
    ];

    return {
      x: Math.random() * this.width,
      y: isNew ? -20 : Math.random() * this.height,
      length: 8 + Math.random() * 12,
      curve: (Math.random() - 0.5) * 8, // Curvature of the cut hair strand
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.25 + Math.random() * 0.45,
      alpha: Math.random() * 0.5,
      fadeSpeed: 0.005 + Math.random() * 0.008,
      fadeDirection: Math.random() > 0.5 ? 1 : -1,
      color: hairColors[Math.floor(Math.random() * hairColors.length)],
      width: 0.8 + Math.random() * 0.7
    };
  }

  createInitialParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(false));
    }
  }

  burstHair(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 1.6) - 0.8; // Downward spread
      const speed = 1.5 + Math.random() * 3.5;
      this.burstParticles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        length: 10 + Math.random() * 14,
        curve: (Math.random() - 0.5) * 10,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1.2,
        gravity: 0.08,
        alpha: 0.9,
        fadeSpeed: 0.02 + Math.random() * 0.015,
        color: Math.random() > 0.4 ? 'rgba(212, 175, 55, 0.75)' : 'rgba(230, 235, 245, 0.65)',
        width: 1.1
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.initCanvas();
    });

    // Scroll reaction impulse
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - this.lastScrollY;
      this.scrollVelocity = Math.max(-8, Math.min(8, delta * 0.25));
      this.lastScrollY = currentScrollY;
    }, { passive: true });

    // Mouse movement repulsion
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      this.isRunning = !document.hidden;
      if (this.isRunning && !this.isReducedMotion) {
        this.loop();
      }
    });
  }

  drawHairStrand(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);

    this.ctx.beginPath();
    this.ctx.moveTo(-p.length / 2, 0);
    this.ctx.quadraticCurveTo(0, p.curve, p.length / 2, 0);
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = p.width;
    this.ctx.lineCap = 'round';
    this.ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    this.ctx.stroke();

    this.ctx.restore();
  }

  update() {
    // Damped scroll velocity decay
    this.scrollVelocity *= 0.92;

    // Ambient floating particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Fade in / out oscillation
      p.alpha += p.fadeSpeed * p.fadeDirection;
      if (p.alpha >= 0.55) {
        p.fadeDirection = -1;
      } else if (p.alpha <= 0.05) {
        p.fadeDirection = 1;
      }

      // Position update with scroll velocity reaction
      p.x += p.vx;
      p.y += p.vy + this.scrollVelocity;
      p.angle += p.rotationSpeed;

      // Gentle mouse deflection
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80 && dist > 0) {
        const force = (80 - dist) / 80 * 0.6;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Wrap around bounds
      if (p.y > this.height + 25) {
        p.y = -20;
        p.x = Math.random() * this.width;
      } else if (p.y < -25) {
        p.y = this.height + 20;
        p.x = Math.random() * this.width;
      }

      if (p.x > this.width + 25) {
        p.x = -20;
      } else if (p.x < -25) {
        p.x = this.width + 20;
      }
    }

    // Burst cutting particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const bp = this.burstParticles[i];
      bp.vy += bp.gravity;
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.angle += bp.rotationSpeed;
      bp.alpha -= bp.fadeSpeed;

      if (bp.alpha <= 0 || bp.y > this.height) {
        this.burstParticles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      this.drawHairStrand(this.particles[i]);
    }

    for (let i = 0; i < this.burstParticles.length; i++) {
      this.drawHairStrand(this.burstParticles[i]);
    }
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Instantiate global HairParticleEngine after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.hairParticleEngine = new HairParticleEngine('hair-canvas');
});
