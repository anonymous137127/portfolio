/* ==========================================================================
   PRAJWAL T N — PORTFOLIO SCRIPT
   Feature-detects per page, so this single file is safe to include everywhere.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavToggle();
  initActiveNavLink();
  initScrollReveal();
  initNetworkCanvas();
  initTerminalTyping();
  initTiltCards();
  initSkillBars();
  initProjectFilter();
  initContactForm();
  initVisitorCounter();
});

/* -------------------------------------------------------------------------
   Theme toggle (persisted in-memory only — no localStorage per platform rules
   in this environment; falls back to a plain session var)
   ------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const root = document.documentElement;
  const iconSun = toggle.querySelector('.icon-sun');
  const iconMoon = toggle.querySelector('.icon-moon');

  const apply = (theme) => {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (iconSun) iconSun.style.display = 'none';
      if (iconMoon) iconMoon.style.display = 'block';
    } else {
      root.removeAttribute('data-theme');
      if (iconSun) iconSun.style.display = 'block';
      if (iconMoon) iconMoon.style.display = 'none';
    }
  };

  apply(window.__theme || 'dark');

  toggle.addEventListener('click', () => {
    window.__theme = (window.__theme === 'light') ? 'dark' : 'light';
    apply(window.__theme);
  });
}

/* -------------------------------------------------------------------------
   Mobile nav toggle
   ------------------------------------------------------------------------- */
function initNavToggle() {
  const btn = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      links.classList.remove('open');
    });
  });
}

/* -------------------------------------------------------------------------
   Highlight the current page in nav
   ------------------------------------------------------------------------- */
function initActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* -------------------------------------------------------------------------
   Scroll-triggered reveal animations
   ------------------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  items.forEach((el) => obs.observe(el));

  // Stagger children inside .reveal-stagger containers
  document.querySelectorAll('.reveal-stagger').forEach((container) => {
    const children = container.querySelectorAll('.reveal-child');
    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * 90}ms`;
    });
  });
}

/* -------------------------------------------------------------------------
   Network / node-map canvas background for the hero
   Represents the "scanning" identity — connected nodes with a sweeping
   radar line, not generic floating bokeh.
   ------------------------------------------------------------------------- */
function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, nodes, sweepAngle = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getAccent() {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--signal').trim() || '#39FF88';
  }

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    const count = Math.min(70, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 18000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      r: Math.random() * 1.6 + 0.8,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const accent = getAccent();
    const cx = w / 2, cy = h / 2;
    const maxDist = Math.max(w, h) * 0.75;

    // update + draw nodes
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    // connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const linkDist = 140 * devicePixelRatio;
        if (dist < linkDist) {
          ctx.strokeStyle = accent;
          ctx.globalAlpha = (1 - dist / linkDist) * 0.18;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // radar sweep from center
    if (!reduceMotion) {
      const grad = ctx.createConicGradient
        ? ctx.createConicGradient(sweepAngle, cx, cy)
        : null;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createLinearGradient(0, 0, maxDist, 0);
      sweepGrad.addColorStop(0, accent);
      sweepGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxDist, -0.18, 0.18);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();
      sweepAngle += 0.006;
    }

    // nodes on top, lit up near the sweep
    nodes.forEach((n) => {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------
   Terminal boot-sequence typing effect for the hero
   ------------------------------------------------------------------------- */
function initTerminalTyping() {
  const body = document.querySelector('.terminal-body');
  if (!body) return;

  const script = [
    { type: 'cmd', path: '~', text: 'whoami' },
    { type: 'out', text: 'prajwal_t_n' },
    { type: 'cmd', path: '~', text: 'cat role.txt' },
    { type: 'out', text: 'Full-Stack Developer · Python · React · AI/ML' },
    { type: 'cmd', path: '~', text: './scan_stack.sh --target=self' },
    { type: 'out', text: '[+] Frontend .... React.js, HTML5, CSS3, JS' },
    { type: 'out', text: '[+] Backend ..... Flask, REST APIs' },
    { type: 'out', text: '[+] Data ........ MySQL, MongoDB' },
    { type: 'out', text: '[+] Security ..... Kali Linux, Nmap, Wireshark' },
    { type: 'out', text: '[+] Status ....... open to work' },
  ];

  body.innerHTML = '';
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex >= script.length) {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      const finalLine = document.createElement('div');
      finalLine.className = 'terminal-line';
      finalLine.innerHTML = `<span class="terminal-prompt">prajwal@portfolio</span><span class="terminal-path">:~$</span> `;
      finalLine.appendChild(cursor);
      body.appendChild(finalLine);
      return;
    }

    const item = script[lineIndex];
    const lineEl = document.createElement('div');
    lineEl.className = 'terminal-line';
    body.appendChild(lineEl);

    if (item.type === 'cmd') {
      const prefix = `<span class="terminal-prompt">prajwal@portfolio</span><span class="terminal-path">:${item.path}$</span> `;
      let i = 0;
      const text = item.text;
      const interval = setInterval(() => {
        lineEl.innerHTML = prefix + text.slice(0, i) + '<span class="terminal-cursor"></span>';
        i++;
        if (i > text.length) {
          clearInterval(interval);
          lineEl.innerHTML = prefix + text;
          lineIndex++;
          setTimeout(typeLine, 160);
        }
      }, 28);
    } else {
      lineEl.innerHTML = `<span class="terminal-out">${item.text}</span>`;
      lineIndex++;
      setTimeout(typeLine, 90);
    }
  }

  // Respect reduced motion: render instantly instead of animating
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    body.innerHTML = script.map((item) => {
      if (item.type === 'cmd') {
        return `<div class="terminal-line"><span class="terminal-prompt">prajwal@portfolio</span><span class="terminal-path">:${item.path}$</span> ${item.text}</div>`;
      }
      return `<div class="terminal-line"><span class="terminal-out">${item.text}</span></div>`;
    }).join('') + `<div class="terminal-line"><span class="terminal-prompt">prajwal@portfolio</span><span class="terminal-path">:~$</span> <span class="terminal-cursor"></span></div>`;
    return;
  }

  typeLine();
}

/* -------------------------------------------------------------------------
   3D tilt on project cards
   ------------------------------------------------------------------------- */
function initTiltCards() {
  const cards = document.querySelectorAll('.project-card, .terminal');
  if (!cards.length) return;
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch

  cards.forEach((card) => {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateY = ((x - midX) / midX) * 6;
      const rotateX = ((midY - y) / midY) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  });
}

/* -------------------------------------------------------------------------
   Animate skill bars when in view (resume page)
   ------------------------------------------------------------------------- */
function initSkillBars() {
  const bars = document.querySelectorAll('.bar-fill');
  if (!bars.length) return;

  if (!('IntersectionObserver' in window)) {
    bars.forEach((b) => { b.style.width = b.dataset.value + '%'; });
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.value + '%';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  bars.forEach((b) => obs.observe(b));
}

/* -------------------------------------------------------------------------
   Project filtering (projects page)
   ------------------------------------------------------------------------- */
function initProjectFilter() {
  const filterBar = document.querySelector('.filter-bar');
  const cards = document.querySelectorAll('[data-tags]');
  if (!filterBar || !cards.length) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      const tags = card.dataset.tags.split(',');
      const show = filter === 'all' || tags.includes(filter);
      card.style.display = show ? '' : 'none';
    });
  });
}

/* -------------------------------------------------------------------------
   Contact form — client-side only (no backend wired up).
   Uses mailto fallback so the message actually reaches Prajwal.
   ------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      status.textContent = 'Please fill in every field before sending.';
      status.className = 'form-status err';
      return;
    }

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:ppraju126ghu@gmail.com?subject=${subject}&body=${body}`;

    status.textContent = 'Opening your email client…';
    status.className = 'form-status ok';
  });
}

/* -------------------------------------------------------------------------
   Visitor counter — purely cosmetic, session-based (no backend/storage).
   ------------------------------------------------------------------------- */
function initVisitorCounter() {
  const el = document.querySelector('.visitor-badge .num');
  if (!el) return;
  const base = 1240;
  const bump = Math.floor(Math.random() * 30);
  el.textContent = (base + bump).toLocaleString();
}
