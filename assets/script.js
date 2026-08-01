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
      submitButton.textContent = 'Sending audit...';
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
      if (form.matches('[data-step-form]')) showFormStep(form, 1);
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

function showFormStep(form, stepNumber) {
  form.querySelectorAll('[data-form-step]').forEach((step) => {
    const isActive = step.dataset.formStep === String(stepNumber);
    step.classList.toggle('is-active', isActive);
  });

  form.querySelectorAll('[data-step-indicator]').forEach((indicator) => {
    indicator.classList.toggle('is-active', indicator.dataset.stepIndicator === String(stepNumber));
  });
}

document.querySelectorAll('[data-step-form]').forEach((form) => {
  showFormStep(form, 1);

  form.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const activeStep = form.querySelector('[data-form-step].is-active');
      const fields = [...activeStep.querySelectorAll('input, select, textarea')].filter((field) => !field.disabled);
      const isValid = fields.every((field) => field.reportValidity());
      if (isValid) showFormStep(form, button.dataset.nextStep);
    });
  });

  form.querySelectorAll('[data-prev-step]').forEach((button) => {
    button.addEventListener('click', () => showFormStep(form, button.dataset.prevStep));
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

function segment(progress, start, end) {
  return clamp((progress - start) / (end - start));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function initScrollHero() {
  const hero = document.querySelector('[data-scroll-hero]');
  if (!hero) return;

  const stage = hero.querySelector('.hero-scroll-stage');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const vars = {};
  let current = 0;
  let target = 0;
  let rafId = null;

  function setVar(name, value) {
    if (vars[name] === value) return;
    vars[name] = value;
    hero.style.setProperty(name, value);
  }

  function setLandingState() {
    hero.classList.remove('is-scroll-bound');
    setVar('--hero-card-opacity', '1');
    setVar('--hero-card-y', '0px');
    setVar('--hero-card-scale', '1');
    setVar('--hero-copy-opacity', '1');
    setVar('--hero-copy-y', '0px');
    setVar('--hero-command-opacity', '1');
    setVar('--hero-command-y', '0px');
    setVar('--hero-intro-opacity', '0');
    setVar('--hero-intro-y', '0px');
    setVar('--hero-intro-scale', '1');
    setVar('--hero-art-opacity', '0.16');
    setVar('--hero-lead-opacity', '0');
    setVar('--hero-phone-opacity', '0');
    setVar('--hero-phone-y', '32px');
    setVar('--hero-phone-scale', '0.92');
    setVar('--hero-phone-rotate', '-10deg');
    setVar('--hero-cue-opacity', '0');
  }

  function apply(progress) {
    // Act 1 (0 – 0.34): full-bleed statement headline, then it lifts away.
    const introOut = easeOutCubic(segment(progress, 0.12, 0.34));
    // Act 2 (0.16 – 0.66): command-center card rises, leads route into the
    // phone inbox docked on the right, then both clear the stage.
    const system = easeOutCubic(segment(progress, 0.16, 0.5));
    const leadIn = segment(progress, 0.24, 0.38);
    const leadOut = segment(progress, 0.52, 0.64);
    const leadPeak = leadIn * (1 - leadOut);
    const phoneIn = easeOutCubic(segment(progress, 0.3, 0.46));
    const phoneOut = segment(progress, 0.54, 0.66);
    const phonePeak = phoneIn * (1 - phoneOut);
    // Act 3 (0.5 – 0.84): headline, CTAs, and command panel lock in, then hold.
    const copyIn = easeOutCubic(segment(progress, 0.5, 0.72));
    const commandIn = easeOutCubic(segment(progress, 0.62, 0.84));

    setVar('--hero-card-opacity', system.toFixed(3));
    setVar('--hero-card-y', `${((1 - system) * 110).toFixed(1)}px`);
    setVar('--hero-card-scale', (0.9 + system * 0.1).toFixed(4));
    setVar('--hero-copy-opacity', copyIn.toFixed(3));
    setVar('--hero-copy-y', `${((1 - copyIn) * 40).toFixed(1)}px`);
    setVar('--hero-command-opacity', commandIn.toFixed(3));
    setVar('--hero-command-y', `${((1 - commandIn) * 46).toFixed(1)}px`);
    setVar('--hero-intro-opacity', (1 - introOut).toFixed(3));
    setVar('--hero-intro-y', `${(introOut * -90).toFixed(1)}px`);
    setVar('--hero-intro-scale', (1 + introOut * 0.12).toFixed(4));
    setVar('--hero-art-opacity', (0.34 - introOut * 0.18).toFixed(3));
    setVar('--hero-lead-opacity', leadPeak.toFixed(3));
    setVar('--hero-phone-opacity', phonePeak.toFixed(3));
    setVar('--hero-phone-y', `${((1 - phonePeak) * 68).toFixed(1)}px`);
    setVar('--hero-phone-scale', (0.9 + phonePeak * 0.1).toFixed(4));
    setVar('--hero-phone-rotate', `${(-12 + phonePeak * 12).toFixed(1)}deg`);
    setVar('--hero-cue-opacity', (1 - segment(progress, 0, 0.1)).toFixed(3));
  }

  function readTarget() {
    const stageHeight = stage ? stage.offsetHeight : window.innerHeight;
    const scrollRange = Math.max(hero.offsetHeight - stageHeight, 1);
    target = clamp(-hero.getBoundingClientRect().top / scrollRange);
  }

  function frame() {
    // Damped follow so trackpad and wheel scrubbing both feel fluid.
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.001) {
      current = target;
      rafId = null;
    } else {
      rafId = window.requestAnimationFrame(frame);
    }
    apply(current);
  }

  function schedule() {
    if (motionQuery.matches) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
      setLandingState();
      return;
    }
    hero.classList.add('is-scroll-bound');
    readTarget();
    if (!rafId) rafId = window.requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', schedule);
  else motionQuery.addListener(schedule);

  if (motionQuery.matches) {
    setLandingState();
  } else {
    hero.classList.add('is-scroll-bound');
    readTarget();
    current = target;
    apply(current);
  }
}

initScrollHero();

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
