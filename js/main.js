/* ==========================================================
   SMOOTH SCROLL
========================================================== */
if (typeof SmoothScroll !== 'undefined') {
  new SmoothScroll({
    animationTime: 800,
    stepSize: 75,
    accelerationDelta: 30,
    accelerationMax: 2,
    keyboardSupport: true,
    arrowScroll: 50,
    pulseAlgorithm: true,
    pulseScale: 4,
    pulseNormalize: 1,
    touchpadSupport: true,
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('header');
  var burger = document.getElementById('burger');
  var nav = document.getElementById('main-nav');
  var mobileMenu = document.getElementById('mobile-menu');
  var floatingBtn = document.getElementById('floating-btn');
  var activePopup = null;
  var servicesSection = document.getElementById('service');
  var servicesTitle = servicesSection
    ? servicesSection.querySelector('.services__sticky-title')
    : null;

  // Absolute-scroll anchors (set by measureSvcTitle, re-set on resize)
  var svcScrollYTrigger = null; // scrollY at which effect starts
  var svcMaxShift = null;       // maximum translateY (px) = title reaches section bottom

  /* Measure title's natural page-absolute position ONCE (with all
     transforms cleared) so updateServicesTitle can work purely from
     window.pageYOffset — getBoundingClientRect would return the
     *transformed* position and produce jumpy results.              */
  function measureSvcTitle() {
    if (!servicesTitle || !servicesSection) return;

    // Reset inline styles so we read the natural position
    servicesTitle.style.transform = 'translateY(0px)';
    servicesTitle.style.opacity  = '1';

    var scrollY     = window.pageYOffset;
    var titleRect   = servicesTitle.getBoundingClientRect();
    var sectionRect = servicesSection.getBoundingClientRect();

    var titleAbsTop     = titleRect.top  + scrollY; // absolute Y of title top
    var sectionAbsBottom= sectionRect.bottom + scrollY; // absolute Y of section bottom
    var titleH          = titleRect.height || 60;

    // Header bottom when in pill state (top:16 + height:56 = 72px)
    var headerBottom = 72;
    var triggerGap   = 50; // px gap at which effect starts

    svcScrollYTrigger = titleAbsTop - headerBottom - triggerGap;
    svcMaxShift = Math.max(0, sectionAbsBottom - titleAbsTop - titleH - 80);
  }

  /* ========================================================
     HEADER: appear + scroll → pill
  ======================================================== */
  setTimeout(function () { header.classList.add('is-visible'); }, 150);

  function updateHeader() {
    var scrollY = window.pageYOffset;
    // Show/hide pill
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    // Floating button
    if (scrollY > 100) {
      floatingBtn.classList.add('is-visible');
    } else {
      floatingBtn.classList.remove('is-visible');
    }
  }

  /* ========================================================
     SERVICES TITLE — "Наши услуги" moves DOWN + fades.

     Strategy: pure scroll-position arithmetic on window.pageYOffset.
     - Never call getBoundingClientRect() after a transform is applied
       (it would return the TRANSFORMED position → jumpy results).
     - transition: none !important in CSS means no CSS animation
       ever fires on this element → zero jitter.
     - translateY = scrollY - svcScrollYTrigger  →  title appears
       fixed in the viewport (sticky-equivalent) while section scrolls.
       Relative to the section content it travels from top to bottom.
     - Opacity fades in the second half of the travel.
  ======================================================== */
  function updateServicesTitle() {
    if (!servicesTitle || svcScrollYTrigger === null) return;

    // No animation on mobile / small screens
    if (window.innerWidth <= 960) {
      servicesTitle.style.transform = '';
      servicesTitle.style.opacity   = '';
      return;
    }

    var scrollY = window.pageYOffset;

    if (scrollY <= svcScrollYTrigger) {
      // Before trigger — restore natural state
      servicesTitle.style.transform = 'translateY(0px)';
      servicesTitle.style.opacity   = '1';
      return;
    }

    var rawShift = scrollY - svcScrollYTrigger;
    var shift    = Math.min(rawShift, svcMaxShift);
    var progress = svcMaxShift > 0 ? rawShift / svcMaxShift : 0;

    // Fade: starts at 30 % of travel, fully gone at 100 %
    var opacity = Math.max(0, 1 - Math.max(0, (progress - 0.3) / 0.7));

    servicesTitle.style.transform = 'translateY(' + shift + 'px)';
    servicesTitle.style.opacity   = String(opacity);
  }

  // Measure once layout is stable, re-measure on resize
  requestAnimationFrame(function () {
    measureSvcTitle();
    updateServicesTitle();
  });
  window.addEventListener('resize', function () {
    measureSvcTitle();
    updateServicesTitle();
  }, { passive: true });

  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (!scrollTick) {
      requestAnimationFrame(function () {
        updateHeader();
        updateServicesTitle();
        scrollTick = false;
      });
      scrollTick = true;
    }
  }, { passive: true });
  updateHeader();

  /* ========================================================
     BURGER MENU — mobile-menu is outside <header> so
     position:fixed fills the full viewport on all browsers.
  ======================================================== */
  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (mobileMenu && mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileMenu) {
    var mobileMenuClose = document.getElementById('mobile-menu-close');
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });

  /* ========================================================
     ANCHOR SCROLL (offset for fixed header)
  ======================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (link.dataset.popup) return;
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });
  });

  /* ========================================================
     INTERSECTION OBSERVER — scroll animations
  ======================================================== */
  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = parseFloat(el.dataset.animateDelay) || 0;
      el.style.transitionDelay = delay + 's';
      el.classList.add('is-visible');
      this.unobserve(el);
    }.bind(this));
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' })
  .observe && document.querySelectorAll('.t-animate').forEach(function (el) {
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseFloat(entry.target.dataset.animateDelay) || 0;
        entry.target.style.transitionDelay = delay + 's';
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }).observe(el);
  });

  /* ========================================================
     POPUP MANAGER
  ======================================================== */
  function openPopup(id) {
    if (activePopup) closePopup(activePopup);
    var overlay = document.getElementById('popup-' + id);
    if (!overlay) return;
    activePopup = id;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('button, input, a[href]');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closePopup(id) {
    var overlay = document.getElementById('popup-' + id);
    if (!overlay) return;
    overlay.classList.remove('is-open');
    if (activePopup === id) {
      activePopup = null;
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-popup]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openPopup(el.dataset.popup);
    });
  });

  ['form', 'usligi'].forEach(function (id) {
    var closeBtn = document.getElementById('close-' + id);
    if (closeBtn) closeBtn.addEventListener('click', function () { closePopup(id); });
    var overlay = document.getElementById('popup-' + id);
    if (overlay) overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePopup(id);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePopup) closePopup(activePopup);
  });

  // Focus trap
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !activePopup) return;
    var overlay = document.getElementById('popup-' + activePopup);
    if (!overlay) return;
    var focusable = Array.from(overlay.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    if (e.shiftKey && document.activeElement === focusable[0]) {
      e.preventDefault(); focusable[focusable.length - 1].focus();
    } else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
      e.preventDefault(); focusable[0].focus();
    }
  });

  /* ========================================================
     FORM SUBMIT
  ======================================================== */
  var form = document.getElementById('consultation-form');
  var formSuccess = document.getElementById('form-success');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log('Form:', { name: form.name.value, phone: form.phone.value });
      form.style.display = 'none';
      if (formSuccess) { formSuccess.removeAttribute('hidden'); }
      setTimeout(function () {
        form.reset(); form.style.display = '';
        if (formSuccess) formSuccess.setAttribute('hidden', '');
        closePopup('form');
      }, 4000);
    });
  }

  /* ========================================================
     REVIEWS SLIDER
  ======================================================== */
  var revTrack = document.getElementById('reviews-track');
  var revDots = document.querySelectorAll('.reviews__dot');
  var revCurrent = 0;
  var revCount = revTrack ? revTrack.children.length : 0;

  function goReview(idx) {
    revCurrent = ((idx % revCount) + revCount) % revCount;
    revTrack.style.transform = 'translateX(-' + (revCurrent * 100) + '%)';
    revDots.forEach(function (d, i) { d.classList.toggle('active', i === revCurrent); });
  }

  var prevBtn = document.getElementById('rev-prev');
  var nextBtn = document.getElementById('rev-next');
  if (prevBtn) prevBtn.addEventListener('click', function () { goReview(revCurrent - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goReview(revCurrent + 1); });
  revDots.forEach(function (d) {
    d.addEventListener('click', function () { goReview(+d.dataset.idx); });
  });

  if (revTrack) {
    var rtx = null;
    revTrack.addEventListener('touchstart', function (e) { rtx = e.touches[0].clientX; }, { passive: true });
    revTrack.addEventListener('touchend', function (e) {
      if (rtx === null) return;
      var d = rtx - e.changedTouches[0].clientX;
      if (Math.abs(d) > 40) goReview(revCurrent + (d > 0 ? 1 : -1));
      rtx = null;
    });
  }

  /* ========================================================
     SERVICES POPUP SLIDER
  ======================================================== */
  var usTrack = document.getElementById('usligi-track');
  var usCurrent = 0;
  var usCount = usTrack ? usTrack.children.length : 0;

  function goUsligi(idx) {
    usCurrent = ((idx % usCount) + usCount) % usCount;
    usTrack.style.transform = 'translateX(-' + (usCurrent * 100) + '%)';
  }

  var usPrev = document.getElementById('usligi-prev');
  var usNext = document.getElementById('usligi-next');
  if (usPrev) usPrev.addEventListener('click', function () { goUsligi(usCurrent - 1); });
  if (usNext) usNext.addEventListener('click', function () { goUsligi(usCurrent + 1); });

  if (usTrack) {
    var utx = null;
    usTrack.addEventListener('touchstart', function (e) { utx = e.touches[0].clientX; }, { passive: true });
    usTrack.addEventListener('touchend', function (e) {
      if (utx === null) return;
      var d = utx - e.changedTouches[0].clientX;
      if (Math.abs(d) > 40) goUsligi(usCurrent + (d > 0 ? 1 : -1));
      utx = null;
    });
  }

  // Open usligi popup on specific slide by service card index
  document.querySelectorAll('.scard__btn[data-popup="usligi"]').forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      setTimeout(function () { goUsligi(idx % usCount); }, 30);
    });
  });
  document.querySelectorAll('.pcard__btn[data-popup="usligi"]').forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      setTimeout(function () { goUsligi(idx % usCount); }, 30);
    });
  });
  document.querySelectorAll('.industry-row__btn[data-popup="usligi"]').forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      setTimeout(function () { goUsligi(idx % usCount); }, 30);
    });
  });

  /* ========================================================
     INDUSTRY CHECKMARKS — bidirectional, triggers at screen middle
  ======================================================== */
  var checkmarks = document.querySelectorAll('.industry-checkmark');

  if (checkmarks.length) {
    checkmarks.forEach(function (ck) {
      var row = ck.closest('.industry-row');
      if (!row) return;

      // rootMargin "0px 0px -50% 0px" shrinks the active zone to the top half
      // of the viewport → element triggers when it crosses the vertical midpoint
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Row reached screen middle while scrolling down → show tick
            ck.classList.add('is-visible');
          } else {
            // Row left the active zone
            var rect = entry.boundingClientRect;
            if (rect.top > 0) {
              // Element is below mid-screen → user scrolled back up → hide tick
              ck.classList.remove('is-visible');
            }
            // rect.top < 0 → element is above viewport → keep tick visible
          }
        });
      }, {
        threshold: 0,
        rootMargin: '0px 0px -50% 0px'
      }).observe(row);
    });
  }

  /* ========================================================
     HASH-BASED POPUP OPEN
  ======================================================== */
  if (window.location.hash) {
    var h = window.location.hash.replace('#', '');
    if (document.getElementById('popup-' + h)) {
      setTimeout(function () { openPopup(h); }, 600);
    }
  }
});
