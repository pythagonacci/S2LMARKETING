(function () {
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const frames = document.querySelectorAll('.product-visual');
  const heroFrame = document.querySelector('.product-visual--hero');
  const revealItems = document.querySelectorAll('.reveal');
  const year = document.querySelector('[data-year]');
  const leadForm = document.querySelector('[data-lead-form]');
  const otherIntake = document.querySelector('[data-other-intake]');
  const otherField = document.querySelector('[data-other-field]');
  const otherInput = document.querySelector('[data-other-input]');
  const formStatus = document.querySelector('[data-form-status]');
  const submitButton = document.querySelector('[data-submit-button]');
  const submitLabel = document.querySelector('[data-submit-label]');
  const frameFitState = new WeakMap();

  if (year) year.textContent = new Date().getFullYear();

  function setOtherFieldState() {
    if (!otherIntake || !otherField || !otherInput) return;

    const isSelected = otherIntake.checked;
    otherField.hidden = !isSelected;
    otherInput.disabled = !isSelected;
    otherInput.required = isSelected;

    if (!isSelected) otherInput.value = '';
  }

  if (otherIntake) {
    setOtherFieldState();
    otherIntake.addEventListener('change', function () {
      setOtherFieldState();
      if (otherIntake.checked && otherInput) otherInput.focus();
    });
  }

  function showFormStatus(type, message) {
    if (!formStatus) return;
    formStatus.hidden = false;
    formStatus.className = 'form-status form-status--' + type;
    formStatus.textContent = message;
    formStatus.focus({ preventScroll: true });
  }

  if (leadForm) {
    const submittedFromFallback = new URLSearchParams(window.location.search).get('submitted') === 'true';
    if (submittedFromFallback) {
      showFormStatus('success', 'Thanks — your information was sent. We’ll be in touch soon.');
      window.history.replaceState({}, '', window.location.pathname + '#get-started');
    }

    leadForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!leadForm.reportValidity()) return;

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending…';
      if (formStatus) formStatus.hidden = true;

      try {
        const response = await fetch('https://formsubmit.co/ajax/aahmadamna@gmail.com', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(leadForm)
        });
        const result = await response.json();
        const awaitingActivation = typeof result.message === 'string' && /activation/i.test(result.message);

        if (!response.ok || (!awaitingActivation && (result.success === false || result.success === 'false'))) {
          throw new Error('Submission failed');
        }

        leadForm.reset();
        setOtherFieldState();
        showFormStatus('success', 'Thanks — your information was sent. We’ll be in touch soon.');
      } catch (error) {
        showFormStatus('error', 'We couldn’t send your information. Please try again or email hello@s2lmarketing.com.');
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Send My Information';
      }
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', String(willOpen));
      document.body.classList.toggle('nav-open', willOpen);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  function startHeroVisualWhenReady() {
    if (!heroFrame || heroFrame.dataset.loaded !== 'true' || heroFrame.dataset.started === 'true' || !heroFrame.contentWindow) return;

    const rect = heroFrame.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const requiredHeight = Math.min(rect.height * 0.5, window.innerHeight * 0.55);

    if (visibleHeight >= requiredHeight) {
      const visualUrl = new URL(heroFrame.src, window.location.href);
      visualUrl.searchParams.set('autoplay', '1');
      heroFrame.dataset.started = 'true';
      heroFrame.src = visualUrl.toString();
    }
  }

  if (heroFrame && 'IntersectionObserver' in window) {
    const heroThresholds = Array.from({ length: 21 }, function (_, index) { return index / 20; });
    const heroObserver = new IntersectionObserver(function () {
      startHeroVisualWhenReady();
      if (heroFrame.dataset.started === 'true') heroObserver.disconnect();
    }, { threshold: heroThresholds });

    heroObserver.observe(heroFrame);
    window.addEventListener('resize', startHeroVisualWhenReady, { passive: true });
  } else if (heroFrame) {
    window.addEventListener('scroll', startHeroVisualWhenReady, { passive: true });
    window.addEventListener('resize', startHeroVisualWhenReady, { passive: true });
  }

  function fitFrame(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;

      const target = doc.body || doc.documentElement;
      const existingState = frameFitState.get(frame);
      if (existingState && existingState.doc === doc && existingState.target === target) {
        existingState.measure();
        return;
      }

      if (existingState && existingState.resizeObserver) {
        existingState.resizeObserver.disconnect();
      }

      const measure = function () {
        const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
        const rootHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
        const nextHeight = Math.ceil(Math.max(bodyHeight, rootHeight));
        if (nextHeight > 0 && Math.abs(nextHeight - frame.offsetHeight) > 2) {
          frame.style.height = nextHeight + 'px';
        }
      };

      measure();

      let resizeObserver = null;
      if ('ResizeObserver' in window) {
        if (target) {
          resizeObserver = new ResizeObserver(measure);
          resizeObserver.observe(target);
        }
      }

      frameFitState.set(frame, { doc, target, measure, resizeObserver });

      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(measure);
      }

      window.setTimeout(measure, 250);
      window.setTimeout(measure, 1200);
    } catch (error) {
      frame.style.height = frame.classList.contains('product-visual--hero') ? '760px' : '720px';
    }
  }

  frames.forEach(function (frame) {
    const initializeFrame = function () {
      fitFrame(frame);
      if (frame === heroFrame) {
        heroFrame.dataset.loaded = 'true';
        startHeroVisualWhenReady();
      }
    };

    frame.addEventListener('load', initializeFrame);
    window.requestAnimationFrame(initializeFrame);
    [100, 300, 750, 1500].forEach(function (delay) {
      window.setTimeout(initializeFrame, delay);
    });
  });
})();
