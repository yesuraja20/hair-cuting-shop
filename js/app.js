/**
 * AUREUS & BLADE - CORE APPLICATION CONTROLLER
 * Orchestrates: Intro sequence, navbar transitions, word-by-word reveals,
 * counter animations, gallery lightbox, and audio feedback.
 */

document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('intro-screen');
  const skipIntroBtn = document.getElementById('btn-skip-intro');
  const introScissorsBox = document.getElementById('intro-scissors-stage');
  const introCrest = document.getElementById('intro-crest-reveal');

  const navbar = document.getElementById('navbar');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinksList = document.getElementById('nav-links');

  const heroShearsContainer = document.getElementById('hero-shears-container');
  const craftStageShearsContainer = document.getElementById('craft-shears-stage');

  let audioMuted = true; // default mute state for polite browsing

  // ==========================================================================
  // 1. MOUNT VECTOR SCISSORS INTO DESIGNATED STAGES
  // ==========================================================================
  if (window.scissorEngine) {
    if (heroShearsContainer) {
      window.scissorEngine.mount(heroShearsContainer, 'hero');
      // Track 3D tilt
      const heroCard = document.querySelector('.hero-visual-card');
      if (heroCard) {
        window.scissorEngine.trackElement(heroCard, 10, 15);
      }
    }

    if (craftStageShearsContainer) {
      window.scissorEngine.mount(craftStageShearsContainer, 'craft');
      window.scissorEngine.trackElement(craftStageShearsContainer, 6, 8);
    }
  }

  // Interactive craft buttons (Manual snip & shine trigger)
  const btnTriggerSnip = document.getElementById('btn-stage-snip');
  if (btnTriggerSnip && window.scissorEngine && craftStageShearsContainer) {
    btnTriggerSnip.addEventListener('click', () => {
      window.scissorEngine.triggerSnip(craftStageShearsContainer);
    });
  }

  const btnHeroSnip = document.getElementById('btn-hero-snip');
  if (btnHeroSnip && window.scissorEngine && heroShearsContainer) {
    btnHeroSnip.addEventListener('click', () => {
      window.scissorEngine.triggerSnip(heroShearsContainer);
    });
  }

  // ==========================================================================
  // 2. HAIR-CUTTING CINEMATIC INTRO (Requirement 2)
  // ==========================================================================
  function runIntroSequence() {
    if (!introScreen) return;

    // If user already visited in this session, skip intro immediately
    if (sessionStorage.getItem('aureus_intro_seen') === 'true') {
      dismissIntroFast();
      return;
    }

    // Mount scissors in intro stage
    if (introScissorsBox && window.scissorEngine) {
      window.scissorEngine.mount(introScissorsBox, 'intro');
    }

    // Intro timeline (Quick ~2.2s total so user never waits long)
    // Step 1: Scissor snip 1 at 400ms
    setTimeout(() => {
      if (window.scissorEngine && introScissorsBox) {
        window.scissorEngine.triggerSnip(introScissorsBox);
      }
      if (window.hairParticleEngine) {
        const rect = introScissorsBox.getBoundingClientRect();
        window.hairParticleEngine.burstHair(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
      }
    }, 450);

    // Step 2: Scissor snip 2 at 1000ms
    setTimeout(() => {
      if (window.scissorEngine && introScissorsBox) {
        window.scissorEngine.triggerSnip(introScissorsBox);
      }
      if (window.hairParticleEngine) {
        const rect = introScissorsBox.getBoundingClientRect();
        window.hairParticleEngine.burstHair(rect.left + rect.width / 2 + 10, rect.top + rect.height / 2 - 5, 14);
      }
    }, 1050);

    // Step 3: Crest smooth reveal at 1400ms
    setTimeout(() => {
      if (introCrest) {
        introCrest.classList.add('revealed');
      }
    }, 1400);

    // Step 4: Fade out into Hero at 2300ms
    setTimeout(() => {
      dismissIntro();
    }, 2400);
  }

  function dismissIntro() {
    if (!introScreen) return;
    introScreen.classList.add('hidden');
    sessionStorage.setItem('aureus_intro_seen', 'true');
    triggerHeroWordReveals();
  }

  function dismissIntroFast() {
    if (!introScreen) return;
    introScreen.style.display = 'none';
    triggerHeroWordReveals();
  }

  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', dismissIntro);
  }

  // Run intro
  runIntroSequence();

  // ==========================================================================
  // 4. HERO SECTION ANIMATIONS (Requirement 4)
  // ==========================================================================
  function triggerHeroWordReveals() {
    const heroWords = document.querySelectorAll('.hero-heading .word');
    heroWords.forEach((word, index) => {
      setTimeout(() => {
        word.classList.add('revealed');
      }, 100 + index * 120);
    });

    // Stagger description and CTA buttons
    setTimeout(() => {
      const heroDesc = document.querySelector('.hero-description');
      if (heroDesc) heroDesc.classList.add('hero-fade-in');
    }, 550);

    setTimeout(() => {
      const heroCtas = document.querySelector('.hero-cta-group');
      if (heroCtas) heroCtas.classList.add('hero-fade-in');
    }, 750);

    setTimeout(() => {
      const heroStats = document.querySelector('.hero-stats-row');
      if (heroStats) heroStats.classList.add('hero-fade-in');
    }, 950);
  }

  // ==========================================================================
  // 5. SCROLL OBSERVER & REVEALS (Requirement 5)
  // ==========================================================================
  const animatedElements = document.querySelectorAll('[data-animate]');
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => revealObserver.observe(el));

  // ==========================================================================
  // 9. ANIMATED VIEWPORT COUNTERS (Requirement 9)
  // ==========================================================================
  const counterElements = document.querySelectorAll('.counter-number');
  let countersTriggered = false;

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersTriggered) {
        countersTriggered = true;
        animateAllCounters();
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    countObserver.observe(statsSection);
  }

  function animateAllCounters() {
    counterElements.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target'));
      const isDecimal = target % 1 !== 0;
      const duration = 2000; // 2 seconds
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = easeOut * target;

        if (isDecimal) {
          counter.textContent = currentVal.toFixed(1);
        } else {
          counter.textContent = Math.floor(currentVal).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  // ==========================================================================
  // 8. GALLERY FILTER & LIGHTBOX (Requirement 8)
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.getElementById('lightbox-close-btn');

  // Filtering
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.style.display = 'block';
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Open
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('.gallery-item-img');
      const title = item.querySelector('.gallery-item-title').textContent;
      const cat = item.querySelector('.gallery-item-category').textContent;

      if (lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = title;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxDesc) lightboxDesc.textContent = `Signature Craft • Category: ${cat}`;
        lightbox.classList.add('active');
      }
    });
  });

  // Lightbox Close
  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // 10. NAVBAR SCROLL & AUDIO CONTROLS (Requirement 10)
  // ==========================================================================
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Audio Toggle
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioMuted = !audioMuted;
      if (window.scissorEngine) {
        window.scissorEngine.setAudioEnabled(!audioMuted);
      }
      const icon = audioToggleBtn.querySelector('.audio-icon');
      if (icon) {
        icon.textContent = audioMuted ? '🔇' : '🔊';
      }
      audioToggleBtn.setAttribute('aria-label', audioMuted ? 'Unmute Audio' : 'Mute Audio');
    });
  }

  // Mobile Menu Toggle
  if (mobileMenuBtn && navLinksList) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navLinksList.style.display === 'flex';
      navLinksList.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        navLinksList.style.flexDirection = 'column';
        navLinksList.style.position = 'absolute';
        navLinksList.style.top = '100%';
        navLinksList.style.left = '0';
        navLinksList.style.right = '0';
        navLinksList.style.background = 'rgba(11, 11, 15, 0.96)';
        navLinksList.style.backdropFilter = 'blur(16px)';
        navLinksList.style.padding = '2rem';
        navLinksList.style.borderBottom = '1px solid var(--border-subtle)';
      }
    });
  }

  // ==========================================================================
  // 11. DYNAMIC HYDRATION (Supabase / Admin Sync for Pricing & Images)
  // ==========================================================================
  async function hydrateDynamicData() {
    if (!window.AureusDB) return;

    // 1. Hydrate Site Images
    try {
      const images = await window.AureusDB.getImages();
      if (images) {
        document.querySelectorAll('[data-image-key]').forEach(imgEl => {
          const key = imgEl.getAttribute('data-image-key');
          if (images[key]) {
            imgEl.src = images[key];
          }
        });
      }
    } catch (e) {
      console.warn('Image hydration error:', e);
    }

    // 2. Hydrate Services & Pricing
    try {
      const services = await window.AureusDB.getServices();
      if (services && services.length) {
        const currencySymbol = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment && window.AUREUS_CONFIG.payment.currencySymbol) || '$';

        services.forEach(service => {
          // Update service card in #services section
          const serviceCard = document.querySelector(`.service-card[data-service="${service.id}"]`);
          if (serviceCard) {
            const titleEl = serviceCard.querySelector('.service-title');
            if (titleEl) titleEl.textContent = service.title;

            const durationEl = serviceCard.querySelector('.service-duration');
            if (durationEl) durationEl.textContent = service.duration;

            const descEl = serviceCard.querySelector('.service-desc');
            if (descEl) descEl.textContent = service.description;

            const priceEl = serviceCard.querySelector('.service-price');
            if (priceEl) priceEl.textContent = `${currencySymbol}${Number(service.price).toFixed(0)}`;
          }

          // Update booking pill in #booking section
          const bookingInput = document.querySelector(`input[name="service"][value="${service.id}"]`);
          if (bookingInput) {
            const label = bookingInput.closest('.service-pill-label');
            if (label) {
              const nameEl = label.querySelector('.service-pill-name');
              if (nameEl) nameEl.textContent = service.title;

              const metaDiv = label.querySelector('.service-pill-meta');
              if (metaDiv) {
                const durationSpan = metaDiv.querySelector('span');
                if (durationSpan) durationSpan.textContent = service.duration;

                const priceStrong = metaDiv.querySelector('strong');
                if (priceStrong) priceStrong.textContent = `${currencySymbol}${Number(service.price).toFixed(0)}`;
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn('Services hydration error:', e);
    }
  }

  hydrateDynamicData();
});
