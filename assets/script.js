const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = document.querySelector('[data-nav-links]');

if (navLinks) {
  const currentSlug = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  navLinks.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) return;
    const linkSlug = href.split('/').pop().split('#')[0].replace(/\.html$/, '') || 'index';
    if (linkSlug === currentSlug) link.setAttribute('aria-current', 'page');
  });
}

if (navToggle && navLinks) {
  const closeNavigation = ({ restoreFocus = false } = {}) => {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (restoreFocus) navToggle.focus();
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeNavigation());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      closeNavigation({ restoreFocus: true });
    }
  });
}

document.querySelectorAll('[data-faq-button]').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('[data-faq-item]');
    const isOpen = item.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
  });
});

document.querySelectorAll('[data-contact-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-form-message]');
    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton?.innerHTML;

    if (form.dataset.submitting === 'true') return;
    form.dataset.submitting = 'true';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Saving details...';
    }
    if (message) {
      message.textContent = '';
      delete message.dataset.state;
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });

      if (response.status === 429) throw new Error('rate-limit');
      if (!response.ok) throw new Error('delivery');
      if (message) {
        message.textContent = 'Thanks. Your audit request was sent to Amplify Outreach.';
        message.dataset.state = 'success';
      }
      form.reset();
    } catch (error) {
      if (message) {
        message.textContent = error instanceof Error && error.message === 'rate-limit'
          ? 'Please wait a moment before sending another request.'
          : 'We could not send the request. Please try again in a moment.';
        message.dataset.state = 'error';
      }
    } finally {
      delete form.dataset.submitting;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });
});

document.querySelectorAll('[data-lead-calculator]').forEach((form) => {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const breakevenNode = form.querySelector('[data-calc-breakeven]');
  const leadsNode = form.querySelector('[data-calc-leads]');
  const cplNode = form.querySelector('[data-calc-cpl]');
  const statusNode = form.querySelector('[data-calc-status]');

  function readNumber(name, fallback) {
    const value = Number(form.elements[name]?.value);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function calculate() {
    const jobValue = readNumber('jobValue', 1200);
    const margin = readNumber('margin', 45) / 100;
    const closeRate = readNumber('closeRate', 35) / 100;
    const targetJobs = readNumber('targetJobs', 6);
    const adSpend = readNumber('adSpend', 1500);
    const profitPerJob = Math.max(jobValue * margin, 1);
    const breakEvenJobs = Math.ceil(adSpend / profitPerJob);
    const requiredLeads = Math.ceil(targetJobs / Math.max(closeRate, 0.01));
    const cplCeiling = Math.max((targetJobs * profitPerJob) / Math.max(requiredLeads, 1), 0);

    breakevenNode.textContent = String(breakEvenJobs);
    leadsNode.textContent = String(requiredLeads);
    cplNode.textContent = money.format(cplCeiling);

    if (targetJobs >= breakEvenJobs + 2) {
      statusNode.textContent = 'Room to test if lead quality stays tight.';
    } else if (targetJobs >= breakEvenJobs) {
      statusNode.textContent = 'The math is tight. Start with the highest-margin service first.';
    } else {
      statusNode.textContent = 'This may be too thin unless the job value, margin, or close rate improves.';
    }
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', calculate);
  calculate();
});

const pendingReveals = new Set(document.querySelectorAll('.reveal'));

function markRevealed(node) {
  node.classList.add('is-visible');
  pendingReveals.delete(node);
  revealObserver.unobserve(node);
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) markRevealed(entry.target);
  });
}, { threshold: 0.16 });

pendingReveals.forEach((node) => revealObserver.observe(node));

// Catch-up for anchor jumps and fast scrolls: instant jumps can teleport an
// element across the viewport between frames, so the observer never fires.
let revealSweepQueued = false;
window.addEventListener('scroll', () => {
  if (revealSweepQueued || !pendingReveals.size) return;
  revealSweepQueued = true;
  window.requestAnimationFrame(() => {
    revealSweepQueued = false;
    pendingReveals.forEach((node) => {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) markRevealed(node);
    });
  });
}, { passive: true });

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function initMotionHero() {
  const hero = document.querySelector('[data-motion-hero]');
  const stage = hero?.querySelector('[data-motion-stage]');
  if (!hero || !stage) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;
  let lockedStage = '';
  let previewStage = '';

  const motionNodes = [...stage.querySelectorAll('[data-motion-node]')];

  function syncActiveStage() {
    const activeStage = previewStage || lockedStage;
    if (activeStage) stage.dataset.activeStage = activeStage;
    else delete stage.dataset.activeStage;

    motionNodes.forEach((node) => {
      node.setAttribute('aria-pressed', String(node.dataset.motionNode === lockedStage));
    });
  }

  function applyPointerPosition() {
    currentX += (targetX - currentX) * 0.11;
    currentY += (targetY - currentY) * 0.11;
    stage.style.setProperty('--pointer-x', currentX.toFixed(3));
    stage.style.setProperty('--pointer-y', currentY.toFixed(3));
    stage.style.setProperty('--motion-rotate-x', `${(-currentY * 4.5).toFixed(2)}deg`);
    stage.style.setProperty('--motion-rotate-y', `${(currentX * 5.5).toFixed(2)}deg`);
    stage.style.setProperty('--motion-shift-x', `${(currentX * 10).toFixed(2)}px`);
    stage.style.setProperty('--motion-shift-y', `${(currentY * 8).toFixed(2)}px`);

    if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
      rafId = window.requestAnimationFrame(applyPointerPosition);
    } else {
      currentX = targetX;
      currentY = targetY;
      stage.style.setProperty('--pointer-x', currentX.toFixed(3));
      stage.style.setProperty('--pointer-y', currentY.toFixed(3));
      stage.style.setProperty('--motion-rotate-x', `${(-currentY * 4.5).toFixed(2)}deg`);
      stage.style.setProperty('--motion-rotate-y', `${(currentX * 5.5).toFixed(2)}deg`);
      stage.style.setProperty('--motion-shift-x', `${(currentX * 10).toFixed(2)}px`);
      stage.style.setProperty('--motion-shift-y', `${(currentY * 8).toFixed(2)}px`);
      rafId = null;
    }
  }

  function schedulePointerPosition() {
    if (!rafId) rafId = window.requestAnimationFrame(applyPointerPosition);
  }

  function handlePointerMove(event) {
    if (motionQuery.matches) return;
    const bounds = stage.getBoundingClientRect();
    targetX = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targetY = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
    schedulePointerPosition();
  }

  function resetPointerPosition() {
    targetX = 0;
    targetY = 0;
    schedulePointerPosition();
  }

  function handleMotionPreference() {
    if (motionQuery.matches) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
      currentX = 0;
      currentY = 0;
      targetX = 0;
      targetY = 0;
      stage.style.setProperty('--pointer-x', '0');
      stage.style.setProperty('--pointer-y', '0');
      stage.style.setProperty('--motion-rotate-x', '0deg');
      stage.style.setProperty('--motion-rotate-y', '0deg');
      stage.style.setProperty('--motion-shift-x', '0px');
      stage.style.setProperty('--motion-shift-y', '0px');
    }
  }

  stage.addEventListener('pointermove', handlePointerMove, { passive: true });
  stage.addEventListener('pointerleave', resetPointerPosition);
  motionNodes.forEach((node) => {
    const stageName = node.dataset.motionNode;
    node.addEventListener('pointerenter', () => {
      previewStage = stageName;
      syncActiveStage();
    });
    node.addEventListener('pointerleave', () => {
      previewStage = '';
      syncActiveStage();
    });
    node.addEventListener('focus', () => {
      previewStage = stageName;
      syncActiveStage();
    });
    node.addEventListener('blur', () => {
      previewStage = '';
      syncActiveStage();
    });
    node.addEventListener('click', () => {
      lockedStage = lockedStage === stageName ? '' : stageName;
      previewStage = '';
      syncActiveStage();
    });
  });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionPreference);
  else motionQuery.addListener(handleMotionPreference);
}

initMotionHero();

function initLeadSignalField() {
  const hero = document.querySelector('[data-motion-hero]');
  const canvas = hero?.querySelector('[data-lead-signal-field]');
  const stage = hero?.querySelector('[data-motion-stage]');
  const context = canvas?.getContext('2d');
  if (!hero || !canvas || !stage || !context) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const palette = {
    raw: [116, 187, 211],
    qualified: [243, 199, 91],
    booked: [71, 212, 150],
    white: [255, 253, 248],
  };
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, inside: false };
  const focus = { x: 0, y: 0, radius: 90 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let signals = [];
  let fieldNodes = [];
  let rafId = null;
  let lastFrame = 0;
  let isVisible = true;
  let randomState = 0x4a3f29b1;

  function random() {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  }

  function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }

  function cubicPoint(signal, progress) {
    const inverse = 1 - progress;
    const inverseSquared = inverse * inverse;
    const progressSquared = progress * progress;
    return {
      x: inverseSquared * inverse * signal.startX
        + 3 * inverseSquared * progress * signal.controlOneX
        + 3 * inverse * progressSquared * signal.controlTwoX
        + progressSquared * progress * signal.endX,
      y: inverseSquared * inverse * signal.startY
        + 3 * inverseSquared * progress * signal.controlOneY
        + 3 * inverse * progressSquared * signal.controlTwoY
        + progressSquared * progress * signal.endY,
    };
  }

  function makeSignal(index) {
    const edge = index % 4;
    let startX;
    let startY;
    if (edge === 0) {
      startX = -width * 0.05;
      startY = height * (0.08 + random() * 0.82);
    } else if (edge === 1) {
      startX = width * (0.04 + random() * 0.88);
      startY = -height * 0.05;
    } else if (edge === 2) {
      startX = width * (0.04 + random() * 0.88);
      startY = height * 1.05;
    } else {
      startX = width * 1.05;
      startY = height * (0.08 + random() * 0.82);
    }

    const lane = random() * 2 - 1;
    const horizontalDistance = focus.x - startX;
    const verticalDistance = focus.y - startY;
    return {
      startX,
      startY,
      controlOneX: startX + horizontalDistance * (0.24 + random() * 0.16),
      controlOneY: startY + verticalDistance * 0.2 + lane * height * 0.22,
      controlTwoX: focus.x - horizontalDistance * (0.09 + random() * 0.08),
      controlTwoY: focus.y - verticalDistance * 0.11 - lane * height * 0.08,
      endX: focus.x + (random() * 2 - 1) * focus.radius,
      endY: focus.y + (random() * 2 - 1) * focus.radius,
      phase: random(),
      speed: 0.000045 + random() * 0.000035,
      size: 1.1 + random() * 1.8,
      becomesBooked: index % 5 === 0,
    };
  }

  function rebuildScene() {
    randomState = mobileQuery.matches ? 0x3c91ae73 : 0x4a3f29b1;
    const heroBounds = hero.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    focus.x = stageBounds.left - heroBounds.left + stageBounds.width * 0.5;
    focus.y = stageBounds.top - heroBounds.top + stageBounds.height * 0.5;
    focus.radius = stageBounds.width * 0.14;

    const signalCount = mobileQuery.matches ? 12 : 28;
    const nodeCount = mobileQuery.matches ? 12 : 26;
    signals = Array.from({ length: signalCount }, (_, index) => makeSignal(index));
    fieldNodes = Array.from({ length: nodeCount }, () => ({
      x: random() * width,
      y: random() * height,
      depth: 0.35 + random() * 0.9,
      size: 0.6 + random() * 1.4,
    }));
  }

  function resizeCanvas() {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(Math.round(bounds.width), 1);
    height = Math.max(Math.round(bounds.height), 1);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    pointer.x = pointer.targetX = width * 0.5;
    pointer.y = pointer.targetY = height * 0.5;
    rebuildScene();
  }

  function drawNetwork() {
    const shiftX = pointer.inside ? (pointer.x / width - 0.5) * 10 : 0;
    const shiftY = pointer.inside ? (pointer.y / height - 0.5) * 8 : 0;

    fieldNodes.forEach((node, index) => {
      const nodeX = node.x + shiftX * node.depth;
      const nodeY = node.y + shiftY * node.depth;
      for (let otherIndex = index + 1; otherIndex < fieldNodes.length; otherIndex += 1) {
        const other = fieldNodes[otherIndex];
        const otherX = other.x + shiftX * other.depth;
        const otherY = other.y + shiftY * other.depth;
        const distance = Math.hypot(nodeX - otherX, nodeY - otherY);
        if (distance > 145) continue;
        context.beginPath();
        context.moveTo(nodeX, nodeY);
        context.lineTo(otherX, otherY);
        context.strokeStyle = rgba(palette.raw, (1 - distance / 145) * 0.045);
        context.lineWidth = 0.6;
        context.stroke();
      }

      context.beginPath();
      context.arc(nodeX, nodeY, node.size, 0, Math.PI * 2);
      context.fillStyle = rgba(index % 6 === 0 ? palette.qualified : palette.raw, 0.18 + node.depth * 0.08);
      context.fill();
    });
  }

  function drawPointerGlow() {
    if (!pointer.inside) return;
    const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 170);
    glow.addColorStop(0, rgba(palette.raw, 0.075));
    glow.addColorStop(0.45, rgba(palette.raw, 0.025));
    glow.addColorStop(1, rgba(palette.raw, 0));
    context.fillStyle = glow;
    context.fillRect(pointer.x - 170, pointer.y - 170, 340, 340);
  }

  function drawSignal(signal, timestamp, activeStage) {
    const progress = (signal.phase + timestamp * signal.speed) % 1;
    const fadeIn = clamp(progress / 0.08);
    const fadeOut = clamp((1 - progress) / 0.08);
    let color = palette.raw;
    if (progress > 0.58) color = palette.qualified;
    if (progress > 0.86 && signal.becomesBooked) color = palette.booked;

    const isActiveSegment = !activeStage
      || (activeStage === 'attract' && progress < 0.58)
      || (activeStage === 'qualify' && progress >= 0.5 && progress < 0.88)
      || (activeStage === 'book' && progress >= 0.8);
    const emphasis = isActiveSegment ? 1 : 0.26;
    const alpha = Math.min(fadeIn, fadeOut) * emphasis;
    const trailStart = Math.max(progress - 0.075, 0);

    context.beginPath();
    for (let step = 0; step <= 7; step += 1) {
      const trailProgress = trailStart + (progress - trailStart) * (step / 7);
      const point = cubicPoint(signal, trailProgress);
      if (step === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.strokeStyle = rgba(color, alpha * 0.42);
    context.lineWidth = signal.size * 0.72;
    context.lineCap = 'round';
    context.stroke();

    const point = cubicPoint(signal, progress);
    context.beginPath();
    context.arc(point.x, point.y, signal.size * (isActiveSegment ? 1 : 0.75), 0, Math.PI * 2);
    context.fillStyle = rgba(color, alpha * 0.9);
    context.shadowBlur = isActiveSegment ? 12 : 5;
    context.shadowColor = rgba(color, alpha * 0.85);
    context.fill();
    context.shadowBlur = 0;
  }

  function drawFrame(timestamp) {
    rafId = null;
    if (!isVisible || motionQuery.matches) return;

    const frameInterval = mobileQuery.matches ? 1000 / 24 : 1000 / 30;
    if (timestamp - lastFrame < frameInterval) {
      rafId = window.requestAnimationFrame(drawFrame);
      return;
    }
    lastFrame = timestamp;
    pointer.x += (pointer.targetX - pointer.x) * 0.075;
    pointer.y += (pointer.targetY - pointer.y) * 0.075;
    context.clearRect(0, 0, width, height);
    drawPointerGlow();
    drawNetwork();
    const activeStage = stage.dataset.activeStage || '';
    signals.forEach((signal) => drawSignal(signal, timestamp, activeStage));
    rafId = window.requestAnimationFrame(drawFrame);
  }

  function start() {
    if (rafId || !isVisible || motionQuery.matches) return;
    rafId = window.requestAnimationFrame(drawFrame);
  }

  function stop() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  function handlePointerMove(event) {
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = event.clientX - bounds.left;
    pointer.targetY = event.clientY - bounds.top;
    pointer.inside = true;
  }

  function handleMotionPreference() {
    if (motionQuery.matches) {
      stop();
      context.clearRect(0, 0, width, height);
    } else {
      start();
    }
  }

  hero.addEventListener('pointermove', handlePointerMove, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.inside = false;
    pointer.targetX = width * 0.5;
    pointer.targetY = height * 0.5;
  });

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) start();
    else stop();
  }, { threshold: 0.01 });
  visibilityObserver.observe(hero);

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    start();
  });
  resizeObserver.observe(hero);
  window.addEventListener('resize', resizeCanvas);
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionPreference);
  else motionQuery.addListener(handleMotionPreference);

  resizeCanvas();
  start();
}

initLeadSignalField();

function createChatbot() {
  if (document.querySelector('[data-amplify-chatbot]')) return;

  const answers = [
    {
      test: /(price|cost|fee|investment|package|working together)/i,
      text: 'Campaign scope and investment are confirmed after the free lead-flow audit. Management is month to month, and ad spend stays in the business owner\'s own Meta ad account.',
      chips: ['What is included?', 'How many campaigns?'],
    },
    {
      test: /(campaign|included|service|ads|advertising)/i,
      text: 'Amplify Outreach builds and manages Facebook and Instagram lead campaigns for home service companies. The work covers offer angles, campaign structure, testing, tracking, and optimization around booked revenue.',
      chips: ['Meta ads page', 'Industries served'],
    },
    {
      test: /(industry|landscaping|hardscaping|cleaning|pressure|junk)/i,
      text: 'The current focus industries are landscaping and hardscaping, exterior cleaning, and junk removal. The system can run multiple campaigns for seasonal pushes or different service lines.',
      chips: ['Landscaping', 'Exterior cleaning', 'Junk removal'],
    },
    {
      test: /(result|revenue|lead|click|metric|measure)/i,
      text: 'The scorecard favors revenue signals: qualified leads, booked estimates, booked jobs, close rate, and revenue from campaign opportunities. Clicks are only useful when they explain a real outcome.',
      chips: ['Results page', 'Free audit'],
    },
    {
      test: /(audit|plan|lead-flow|lead flow|free)/i,
      text: 'The free lead-flow audit looks at your service area, best jobs, job value, current lead source, ad spend, follow-up speed, and lead-quality problems so Amplify can map the first campaign direction.',
      chips: ['Request audit', 'Run lead math'],
    },
  ];

  const widget = document.createElement('aside');
  widget.className = 'chatbot-widget';
  widget.setAttribute('data-amplify-chatbot', '');
  widget.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-label="Open Amplify Outreach chat" aria-expanded="false" aria-controls="amplify-chat-panel">
      <i data-lucide="messages-square"></i>
    </button>
    <div class="chatbot-panel" id="amplify-chat-panel" role="dialog" aria-modal="true" aria-label="Amplify Outreach helper" aria-hidden="true">
      <div class="chatbot-header">
        <div>
          <strong>Amplify Helper</strong>
          <span>Answers about Meta ads</span>
        </div>
        <button class="chatbot-close" type="button" aria-label="Close chat"><i data-lucide="x"></i></button>
      </div>
      <div class="chatbot-messages" role="log" aria-live="polite"></div>
      <div class="chatbot-suggestions"></div>
      <form class="chatbot-form">
        <input type="text" name="question" autocomplete="off" placeholder="Ask about campaigns or leads" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;
  document.body.appendChild(widget);

  const launcher = widget.querySelector('.chatbot-launcher');
  const panel = widget.querySelector('.chatbot-panel');
  const closeButton = widget.querySelector('.chatbot-close');
  const messages = widget.querySelector('.chatbot-messages');
  const suggestions = widget.querySelector('.chatbot-suggestions');
  const form = widget.querySelector('.chatbot-form');
  const input = widget.querySelector('input');
  let lastFocused = null;

  function addMessage(text, sender = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `chat-message ${sender}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setSuggestions(chips) {
    suggestions.innerHTML = '';
    chips.forEach((chip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = chip;
      button.addEventListener('click', () => respond(chip));
      suggestions.appendChild(button);
    });
  }

  function respond(text) {
    addMessage(text, 'user');
    const answer = answers.find((item) => item.test.test(text));
    if (answer) {
      addMessage(answer.text);
      setSuggestions(answer.chips);
      return;
    }
    addMessage('Ask about working together, industries served, campaign work, or how Amplify measures results.');
    setSuggestions(['Working together', 'Results', 'Industries']);
  }

  function openChat() {
    lastFocused = document.activeElement;
    widget.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    if (!messages.children.length) {
      addMessage('Want the short version? Amplify Outreach runs month-to-month Meta ads for home service owners and measures success by booked estimates and revenue opportunities.');
      setSuggestions(['Working together', 'Free audit', 'Results']);
    }
    window.requestAnimationFrame(() => input.focus());
  }

  function closeChat() {
    widget.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    else launcher.focus();
  }

  launcher.addEventListener('click', () => {
    if (widget.classList.contains('is-open')) closeChat();
    else openChat();
  });

  closeButton.addEventListener('click', closeChat);

  widget.addEventListener('keydown', (event) => {
    if (!widget.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeChat();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled])')]
      .filter((element) => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    respond(text);
  });
}

createChatbot();

if (window.lucide) {
  window.lucide.createIcons();
}
