/**
 * Apology Website - Interactive Logic & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  let currentPage = 1;
  const totalPages = 14;
  let soundEnabled = true;
  let audioCtx = null;
  let teleportAttempts = 0;

  // Funny remarks for the trick button on Page 13
  const trickHints = [
    "Whoops, too slow! 😜",
    "Nope, over here! 💨",
    "Nice try, but impossible! ✨",
    "Can't click me! 🏃‍♂️",
    "I'm too quick! 😸",
    "Just forgive me already! 💕",
    "Still trying? Hehehe 🙈",
    "You know you want to forgive! 💖"
  ];

  // DOM Elements
  const cardStage = document.getElementById('card-stage');
  const greetingCard = document.getElementById('greeting-card');
  const tracker = document.getElementById('card-tracker');
  const pageViews = document.querySelectorAll('.page-view');
  const btnPage1Next = document.getElementById('btn-page1-next');
  const page13NoBtn = document.getElementById('btn-page13-no');
  const trickHint = document.getElementById('trick-hint');
  const btnReplay = document.getElementById('btn-replay');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // ---------------------------------------------------------------------------
  // Web Audio API Synthesizer (Zero External Dependencies)
  // ---------------------------------------------------------------------------
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context not allowed yet
    }
  }

  // Cute Sound Effects
  function playNegativeSound() {
    playTone(320, 0.12, 'triangle', 0.12);
  }

  function playTeleportSound() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function playPositiveSound() {
    // Happy celebratory major arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 0.28, 'triangle', 0.18);
      }, idx * 110);
    });
  }

  // ---------------------------------------------------------------------------
  // Page Navigation Logic
  // ---------------------------------------------------------------------------
  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    currentPage = targetPage;

    // Toggle wide stage for Page 1 two-column layout
    if (currentPage === 1) {
      cardStage.classList.add('wide-stage');
    } else {
      cardStage.classList.remove('wide-stage');
    }

    // Reset trick button position when switching away or onto Page 13
    if (page13NoBtn) {
      page13NoBtn.classList.remove('teleporting');
      page13NoBtn.style.left = '';
      page13NoBtn.style.top = '';
      if (trickHint) trickHint.textContent = '';
      teleportAttempts = 0;
    }

    // Update active page view
    pageViews.forEach(page => {
      const pageNum = parseInt(page.getAttribute('data-page'), 10);
      if (pageNum === currentPage) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Update Tracker
    if (currentPage === 14) {
      tracker.textContent = "Forgiven! 💖";
      startConfettiShower();
      playPositiveSound();
    } else {
      tracker.textContent = `Page ${currentPage} of ${totalPages - 1}`;
      stopConfettiShower();
    }
  }

  // ---------------------------------------------------------------------------
  // Button Event Handlers
  // ---------------------------------------------------------------------------
  // Page 1: Single "Next ->" button
  btnPage1Next.addEventListener('click', () => {
    goToPage(2);
    playNegativeSound();
  });

  // Pages 2 to 13: Positive & Negative Logic
  // - Clicking ANY "Positive" button navigates immediately to Page 14
  // - Clicking a "Negative" button navigates to the next sequential page
  document.querySelectorAll('.btn-positive').forEach(btn => {
    btn.addEventListener('click', () => {
      goToPage(14);
    });
  });

  document.querySelectorAll('.btn-negative').forEach(btn => {
    if (btn.id === 'btn-page13-no') {
      // Handled separately by trick logic
      return;
    }
    btn.addEventListener('click', () => {
      playNegativeSound();
      goToPage(currentPage + 1);
    });
  });

  // Replay Button (Page 14)
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      goToPage(1);
    });
  }

  // ---------------------------------------------------------------------------
  // SPECIAL INTERACTION: Page 13 Trick "No" Button
  // When cursor hovers or pointer nears the "No" button, it teleports to a
  // random location within the card container so the user cannot click it.
  // ---------------------------------------------------------------------------
  function teleportNoButton(e) {
    if (currentPage !== 13) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    playTeleportSound();
    teleportAttempts++;

    // Switch to absolute positioning within the greeting card
    if (!page13NoBtn.classList.contains('teleporting')) {
      page13NoBtn.classList.add('teleporting');
    }

    const cardRect = greetingCard.getBoundingClientRect();
    const btnRect = page13NoBtn.getBoundingClientRect();

    // Bounds checking inside card: keep inside dashed border with safe padding
    const padding = 28;
    const minX = padding;
    const maxX = Math.max(minX, cardRect.width - btnRect.width - padding);
    const minY = 65; // Below the washi tape & heading area
    const maxY = Math.max(minY, cardRect.height - btnRect.height - padding);

    // Calculate new random coordinates
    let randomX = Math.random() * (maxX - minX) + minX;
    let randomY = Math.random() * (maxY - minY) + minY;

    // Apply new position
    page13NoBtn.style.left = `${randomX}px`;
    page13NoBtn.style.top = `${randomY}px`;

    // Show funny teasing remarks
    if (trickHint) {
      const hintMsg = trickHints[teleportAttempts % trickHints.length];
      trickHint.textContent = hintMsg;
    }
  }

  // Hover events for desktop
  page13NoBtn.addEventListener('mouseenter', teleportNoButton);
  page13NoBtn.addEventListener('mouseover', teleportNoButton);
  page13NoBtn.addEventListener('pointerenter', teleportNoButton);

  // Proximity detection: when mouse moves close to button on page 13, jump before touching!
  document.addEventListener('mousemove', (e) => {
    if (currentPage !== 13) return;
    const btnRect = page13NoBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const dist = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);
    // If cursor gets within 65px radius, teleport!
    if (dist < 65) {
      teleportNoButton(e);
    }
  });

  // Touch & Click guards for mobile / quick clicking
  page13NoBtn.addEventListener('touchstart', (e) => {
    teleportNoButton(e);
  }, { passive: false });

  page13NoBtn.addEventListener('pointerdown', (e) => {
    teleportNoButton(e);
  });

  page13NoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    teleportNoButton(e);
  });

  // ---------------------------------------------------------------------------
  // Sound Toggle Control
  // ---------------------------------------------------------------------------
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundIcon.textContent = '🔊';
      soundLabel.textContent = 'Sound On';
      getAudioContext();
      playTone(660, 0.1);
    } else {
      soundIcon.textContent = '🔇';
      soundLabel.textContent = 'Muted';
    }
  });

  // ---------------------------------------------------------------------------
  // Confetti Particle System (Page 14 Celebration)
  // ---------------------------------------------------------------------------
  let confettiAnimId = null;
  const particles = [];
  const particleColors = ['#FF4D6D', '#FF758F', '#FFB3C6', '#FFE066', '#70C1FF', '#A7F3D0', '#F3C4FB'];

  function resizeCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createConfettiParticle() {
    const isHeart = Math.random() > 0.6;
    const isStar = !isHeart && Math.random() > 0.5;

    return {
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height * 0.5,
      size: Math.random() * 9 + 6,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      speedY: Math.random() * 2.5 + 2.5,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
      isHeart,
      isStar
    };
  }

  function drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    // Left curve
    ctx.bezierCurveTo(-size / 2, -topCurveHeight, -size, size / 3, 0, size);
    // Right curve
    ctx.bezierCurveTo(size, size / 3, size / 2, -topCurveHeight, 0, topCurveHeight);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size, -Math.sin((18 + i * 72) * Math.PI / 180) * size);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (size / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (size / 2));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function renderConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.x += Math.sin(p.y * 0.02) + p.speedX;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.isHeart) {
        drawHeart(ctx, 0, 0, p.size, p.color);
      } else if (p.isStar) {
        drawStar(ctx, 0, 0, p.size, p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();

      // Recycle particles that drop off screen
      if (p.y > confettiCanvas.height + 20) {
        particles[i] = createConfettiParticle();
        particles[i].y = -20;
      }
    }

    confettiAnimId = requestAnimationFrame(renderConfetti);
  }

  function startConfettiShower() {
    if (particles.length === 0) {
      for (let i = 0; i < 90; i++) {
        particles.push(createConfettiParticle());
      }
    }
    if (!confettiAnimId) {
      renderConfetti();
    }
  }

  function stopConfettiShower() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    particles.length = 0;
    if (confettiCanvas) {
      const ctx = confettiCanvas.getContext('2d');
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // ---------------------------------------------------------------------------
  // Personalization & URL Parameter Handler
  // ---------------------------------------------------------------------------
  const personalizeBtn = document.getElementById('personalize-btn');
  const personalizeModal = document.getElementById('personalize-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const inputRecipient = document.getElementById('input-recipient');
  const inputSender = document.getElementById('input-sender');
  const btnSavePersonalize = document.getElementById('btn-save-personalize');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const copyAlert = document.getElementById('copy-alert');

  const page1Heading = document.getElementById('page1-heading');
  const stickySignature = document.getElementById('sticky-signature');

  // Load from URL parameters if present
  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    const fromParam = params.get('from');

    if (toParam) {
      const sanitizedTo = toParam.trim();
      inputRecipient.value = sanitizedTo;
      page1Heading.textContent = `A Letter For ${sanitizedTo} 💌`;
    }
    if (fromParam) {
      const sanitizedFrom = fromParam.trim();
      inputSender.value = sanitizedFrom;
      stickySignature.textContent = `Forever yours, ${sanitizedFrom} 💕`;
    }
  }

  function applyPersonalization() {
    const toVal = inputRecipient.value.trim();
    const fromVal = inputSender.value.trim();

    if (toVal) {
      page1Heading.textContent = `A Letter For ${toVal} 💌`;
    } else {
      page1Heading.textContent = "A Letter For You 💌";
    }

    if (fromVal) {
      stickySignature.textContent = `Forever yours, ${fromVal} 💕`;
    } else {
      stickySignature.textContent = "Forever yours 💕";
    }
  }

  if (personalizeBtn && personalizeModal) {
    personalizeBtn.addEventListener('click', () => {
      personalizeModal.classList.add('open');
      copyAlert.textContent = '';
    });

    modalCloseBtn.addEventListener('click', () => {
      personalizeModal.classList.remove('open');
    });

    personalizeModal.addEventListener('click', (e) => {
      if (e.target === personalizeModal) {
        personalizeModal.classList.remove('open');
      }
    });

    btnSavePersonalize.addEventListener('click', () => {
      applyPersonalization();
      personalizeModal.classList.remove('open');
      playTone(587, 0.15);
    });

    btnCopyLink.addEventListener('click', () => {
      applyPersonalization();
      const toVal = inputRecipient.value.trim();
      const fromVal = inputSender.value.trim();

      const url = new URL(window.location.href);
      if (toVal) url.searchParams.set('to', toVal);
      else url.searchParams.delete('to');

      if (fromVal) url.searchParams.set('from', fromVal);
      else url.searchParams.delete('from');

      navigator.clipboard.writeText(url.toString()).then(() => {
        copyAlert.textContent = "Link copied to clipboard! 📋✨";
        playTone(784, 0.12);
        setTimeout(() => {
          if (copyAlert) copyAlert.textContent = '';
        }, 3000);
      }).catch(() => {
        copyAlert.textContent = `Copy this URL: ${url.toString()}`;
      });
    });
  }

  loadFromURL();

  // Keyboard Navigation: Left/Right arrows for convenience
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && currentPage < 13) {
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 1 && currentPage < 14) {
      goToPage(currentPage - 1);
    }
  });

  // Initialize
  goToPage(1);
});

