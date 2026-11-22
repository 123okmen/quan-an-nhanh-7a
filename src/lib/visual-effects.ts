/**
 * Visual Effects Module
 * - Scroll reveal via IntersectionObserver (stagger 60-90ms between cards)
 * - Counter animation for stats (counts up when in viewport)
 * - Header scroll detection (backdrop-blur on scroll)
 * - Smooth scroll for anchor links
 * - Wrapped in @media (prefers-reduced-motion: reduce) to disable
 */
(function () {
  'use strict';

  // Check reduced motion preference
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal via IntersectionObserver ----
  function initScrollReveal() {
    if (reduceMotion) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const elem = entry.target as HTMLElement;
            // Only reveal once
            elem.style.opacity = '1';
            elem.style.transform = 'translateY(0)';
            revealObserver.unobserve(elem);

            // Stagger next siblings (60-90ms)
            const siblings = Array.from(
              elem.parentNode?.querySelectorAll(
                `.reveal-item ~ .reveal-item`
              ) || []
            );
            for (const sibling of siblings) {
              const rect = (sibling as HTMLElement).getBoundingClientRect();
              const parentNode = elem.parentNode as HTMLElement | null;
              const parentRect = parentNode?.getBoundingClientRect() || null;
              if (parentRect && rect.top > parentRect.top) {
                const delay = 60 + Math.floor(Math.random() * 30);
                (sibling as HTMLElement).style.transitionDelay = `${delay}ms`;
              }
            }
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal-item, [data-reveal]').forEach((el) => {
      const elem = el as HTMLElement;
      elem.style.opacity = '0';
      elem.style.transform = 'translateY(24px)';
      elem.style.transition =
        'opacity 500ms var(--ease-out), transform 500ms var(--ease-out)';
      revealObserver.observe(elem);
    });
  }

  // ---- Counter animation for stats ----
  function initCounters() {
    if (reduceMotion) return;

    const counters = document.querySelectorAll(
      '.counter, [data-counter]'
    ) as NodeListOf<HTMLElement>;

    const updateCounter = (el: HTMLElement, target: number, duration = 1200) => {
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(eased * target);
        el.textContent = current.toLocaleString('vi-VN');

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target.toLocaleString('vi-VN');
        }
      };

      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseFloat(el.dataset?.counter || '0');
            if (!isNaN(target)) {
              updateCounter(el, target);
            }
            counterObserver.unobserve(el);
          }
        }
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  // ---- Header scroll detection ----
  function initHeaderScroll() {
    if (reduceMotion) return;

    const header = document.querySelector('.app-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 16) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial check
  }

  // ---- Smooth scroll for anchor links ----
  function initSmoothScroll() {
    if (reduceMotion) return;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === null || href === '#') return;

        const targetId = href.slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---- Initialize all effects ----
  if (typeof window !== 'undefined') {
    initScrollReveal();
    initCounters();
    initHeaderScroll();
    initSmoothScroll();
  }
})();
