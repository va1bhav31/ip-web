// Nav scroll shadow
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('.nav__mobile-link, .nav__mobile-sub a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// Fade-in on scroll
const faders = document.querySelectorAll('.fade-in');
if (faders.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly
        const siblings = entry.target.parentElement?.querySelectorAll('.fade-in');
        let delay = 0;
        if (siblings && siblings.length > 1) {
          siblings.forEach((el, idx) => { if (el === entry.target) delay = idx * 100; });
        }
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  faders.forEach(el => observer.observe(el));
}

// Active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage) link.classList.add('active');
});

// ─── TIC-TAC-TOE SERVICE CELLS ───
(function () {
  const cells   = Array.from(document.querySelectorAll('.ttt-cell'));
  const modal   = document.getElementById('tttModal');
  const gridEl  = document.querySelector('.ttt-grid');
  if (!cells.length || !modal || !gridEl) return;

  const mNum   = modal.querySelector('.ttt-modal__num');
  const mTitle = modal.querySelector('.ttt-modal__title');
  const mDesc  = modal.querySelector('.ttt-modal__desc');

  // Game state
  let board   = Array(9).fill(null);
  let turn    = 'X';
  let locked  = false;

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // Line endpoints for each combo (viewBox 0 0 300 300, cells 100×100 each)
  const WIN_LINES = {
    '0,1,2': [10,50,290,50],  '3,4,5': [10,150,290,150], '6,7,8': [10,250,290,250],
    '0,3,6': [50,10,50,290],  '1,4,7': [150,10,150,290], '2,5,8': [250,10,250,290],
    '0,4,8': [10,10,290,290], '2,4,6': [290,10,10,290]
  };

  // Inject X and O SVGs into every cell
  cells.forEach(cell => {
    const ns = 'http://www.w3.org/2000/svg';
    const x = document.createElementNS(ns, 'svg');
    x.setAttribute('class', 'ttt-cell__mark--x');
    x.setAttribute('viewBox', '0 0 100 100');
    x.setAttribute('aria-hidden', 'true');
    x.innerHTML = '<line class="ttt-mark__line ttt-mark__line--1" x1="25" y1="25" x2="75" y2="75"/>' +
                  '<line class="ttt-mark__line ttt-mark__line--2" x1="75" y1="25" x2="25" y2="75"/>';
    cell.appendChild(x);

    const o = document.createElementNS(ns, 'svg');
    o.setAttribute('class', 'ttt-cell__mark--o');
    o.setAttribute('viewBox', '0 0 100 100');
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<circle class="ttt-mark__circle" cx="50" cy="50" r="26"/>';
    cell.appendChild(o);
  });

  // Overlay SVG for win strike line
  const ns = 'http://www.w3.org/2000/svg';
  const overlay = document.createElementNS(ns, 'svg');
  overlay.setAttribute('class', 'ttt-overlay');
  overlay.setAttribute('viewBox', '0 0 300 300');
  overlay.setAttribute('preserveAspectRatio', 'none');
  overlay.setAttribute('aria-hidden', 'true');
  const strike = document.createElementNS(ns, 'line');
  strike.setAttribute('class', 'ttt-strike');
  overlay.appendChild(strike);
  gridEl.appendChild(overlay);

  function checkWin() {
    for (const combo of WIN_COMBOS) {
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return combo;
    }
    return null;
  }

  function animateStrike(combo, winner) {
    const [x1,y1,x2,y2] = WIN_LINES[combo.join(',')];
    const len = Math.hypot(x2-x1, y2-y1);
    strike.setAttribute('x1', x1); strike.setAttribute('y1', y1);
    strike.setAttribute('x2', x2); strike.setAttribute('y2', y2);
    strike.setAttribute('stroke', winner === 'X' ? 'var(--gold)' : 'var(--sage)');
    strike.style.strokeDasharray  = len;
    strike.style.strokeDashoffset = len;
    strike.style.transition = 'none';
    overlay.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strike.style.transition = 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)';
      strike.style.strokeDashoffset = '0';
    }));
  }

  function resetBoard() {
    board  = Array(9).fill(null);
    turn   = 'X';
    locked = false;
    cells.forEach(c => c.classList.remove('marked-x', 'marked-o'));
    overlay.classList.remove('visible');
    strike.style.transition = 'none';
  }

  // Modal helpers
  function openModal(num, title, desc) {
    mNum.textContent = num; mTitle.textContent = title; mDesc.textContent = desc;
    modal.classList.add('open');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => {
      if (locked || board[idx] !== null) return;

      const player = turn;
      board[idx] = player;
      cell.classList.add(player === 'X' ? 'marked-x' : 'marked-o');
      turn = player === 'X' ? 'O' : 'X';

      // Open service modal after mark finishes drawing (shorter on touch)
      const isTouch = window.matchMedia('(hover: none)').matches;
      const markDelay = isTouch ? 300 : (player === 'X' ? 580 : 480);
      const num   = cell.querySelector('.ttt-cell__num').textContent;
      const title = cell.querySelector('.ttt-cell__title').textContent;
      const desc  = cell.querySelector('.ttt-cell__desc').textContent;
      setTimeout(() => openModal(num, title, desc), markDelay);

      const winCombo = checkWin();
      if (winCombo) {
        locked = true;
        setTimeout(() => {
          animateStrike(winCombo, player);
          setTimeout(resetBoard, 2200);
        }, 650);
      } else if (board.every(v => v !== null)) {
        // Draw — reset quietly
        locked = true;
        setTimeout(resetBoard, 1200);
      }
    });
  });

  modal.querySelector('.ttt-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.ttt-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}());

// ─── PRESS LOGO CAROUSEL ───
(function () {
  const items = Array.from(document.querySelectorAll('#pressCarousel .press__item'));
  if (!items.length) return;
  const N = items.length;
  let cur = 0;

  function update() {
    items.forEach((el, i) => {
      el.classList.remove('is--c', 'is--p1', 'is--p2', 'is--n1', 'is--n2');
      const pos = ((i - cur) % N + N) % N;
      if      (pos === 0)     el.classList.add('is--c');
      else if (pos === 1)     el.classList.add('is--n1');
      else if (pos === 2)     el.classList.add('is--n2');
      else if (pos === N - 1) el.classList.add('is--p1');
      else if (pos === N - 2) el.classList.add('is--p2');
    });
  }

  update();
  setInterval(() => { cur = (cur + 1) % N; update(); }, 2200);
}());

// ─── HERO SLIDER ───
(function () {
  const slides   = document.querySelectorAll('.slide');
  const dots     = document.querySelectorAll('.slider__dot');
  const progress = document.getElementById('sliderProgress');
  if (!slides.length) return;

  const DURATION = 5000;
  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');

    animateProgress();
  }

  function animateProgress() {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
    // double rAF to ensure the reset paints before starting
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progress.style.transition = `width ${DURATION}ms linear`;
      progress.style.width = '100%';
    }));
  }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), DURATION);
  }

  // Dot controls
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startAutoplay(); });
  });

  // Kick off
  animateProgress();
  startAutoplay();
}());
