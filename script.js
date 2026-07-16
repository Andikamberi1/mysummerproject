/* ═══════════════════════════════════════════
   GAMEVERSE — script.js
   Auth gate + RPG minigame + all interactivity
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     SUPABASE CONFIG — replace with your own
     ═══════════════════════════════════════════ */
  var SUPABASE_URL = 'https://wqghmsbjfxlxgstktggj.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ2htc2JqZnhseGdzdGt0Z2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjkzMDQsImV4cCI6MjA5OTc0NTMwNH0.D8_FEUzZ4QqCbea1NCyWdhct0KuT8-_B2OGUt901S0E';

  var supabase = null;
  var currentUser = null;

  /* ═══════════════════════════════════════════
     DOM refs
     ═══════════════════════════════════════════ */
  var authGate    = document.getElementById('auth-gate');
  var mainContent = document.getElementById('main-content');
  var loginCard   = document.getElementById('login-card');
  var regCard     = document.getElementById('register-card');
  var loginError  = document.getElementById('login-error');
  var regError    = document.getElementById('register-error');

  function showCardError(card, msg, isSuccess) {
    var el = card === 'login' ? loginError : regError;
    el.textContent = msg;
    el.className = 'auth-error show' + (isSuccess ? ' auth-success' : '');
  }

  function hideCardErrors() {
    loginError.classList.remove('show');
    regError.classList.remove('show');
  }

  /* ═══════════════════════════════════════════
     AUTH ACTIONS
     ═══════════════════════════════════════════ */
  function login(email, password) {
    if (!supabase) return showCardError('login', 'Auth system not loaded.');
    var btn = document.querySelector('#login-form .auth-btn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    supabase.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) {
          var msg = res.error.message || '';
          if (res.error.status === 429 || msg.indexOf('429') !== -1) {
            msg = 'Too many attempts. Please wait 60 seconds and try again.';
          }
          showCardError('login', msg);
        }
      })
      .catch(function (err) {
        showCardError('login', 'Too many attempts. Please wait a moment and try again.');
      })
      .finally(function () {
        btn.textContent = 'Login';
        btn.disabled = false;
      });
  }

  var registerCooldown = 0;

  function register(fullName, email, password) {
    if (!supabase) return showCardError('register', 'Auth system not loaded.');
    if (registerCooldown > 0) return;
    var btn = document.querySelector('#register-form .auth-btn');
    btn.textContent = 'Creating...';
    btn.disabled = true;
    supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: fullName } }
    }).then(function (res) {
      if (res.error) {
        var msg = res.error.message || '';
        if (res.error.status === 429 || msg.indexOf('429') !== -1) {
          showCardError('register', 'Rate limited. Wait 5 minutes, or try logging in — you may already be registered.');
          startRegisterCooldown(btn, 300);
          return;
        }
        showCardError('register', msg);
      } else if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
        showCardError('register', 'Account with this email already exists. Try logging in instead.');
      } else {
        showCardError('register', 'Account created! Switch to the Sign In tab to log in.', true);
        setTimeout(function () {
          document.getElementById('show-login-link').click();
        }, 2000);
      }
    }).catch(function (err) {
      showCardError('register', 'Network error. Try again in a moment.');
      startRegisterCooldown(btn, 60);
    }).finally(function () {
      if (registerCooldown === 0) {
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  }

  function startRegisterCooldown(btn, secs) {
    registerCooldown = secs || 60;
    btn.disabled = true;
    var tick = function () {
      if (registerCooldown <= 0) {
        btn.textContent = 'Create Account';
        btn.disabled = false;
        return;
      }
      var m = Math.floor(registerCooldown / 60);
      var s = registerCooldown % 60;
      btn.textContent = 'Wait ' + (m > 0 ? m + 'm ' : '') + s + 's...';
      registerCooldown--;
      setTimeout(tick, 1000);
    };
    tick();
  }

  function logout() {
    if (!supabase) return;
    supabase.auth.signOut().then(function () {
      currentUser = null;
      hideMainContent();
      showAuthGate();
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
      loginCard.style.display = '';
      regCard.style.display = 'none';
      hideCardErrors();
    });
  }

  /* ═══════════════════════════════════════════
     GATE TOGGLES
     ═══════════════════════════════════════════ */
  function hideAuthGate() { authGate.classList.add('hidden'); }
  function showAuthGate() { authGate.classList.remove('hidden'); }
  function showMainContent() { mainContent.classList.add('visible'); }
  function hideMainContent() { mainContent.classList.remove('visible'); }

  function updateUserUI(user) {
    var el = document.getElementById('nav-user-email');
    if (el && user) el.textContent = user.email;
  }

  /* ═══════════════════════════════════════════
     FORM HANDLERS — two independent forms
     ═══════════════════════════════════════════ */
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideCardErrors();
    var email = document.getElementById('login-email').value.trim();
    var pass  = document.getElementById('login-password').value.trim();
    if (!email || !pass) { showCardError('login', 'Please fill in all fields.'); return; }
    login(email, pass);
  });

  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideCardErrors();
    var name  = document.getElementById('reg-fullname').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var pass  = document.getElementById('reg-password').value.trim();
    if (!email || !pass) { showCardError('register', 'Please fill in all fields.'); return; }
    register(name, email, pass);
  });

  // Card switching
  document.getElementById('show-register-link').addEventListener('click', function (e) {
    e.preventDefault();
    hideCardErrors();
    loginCard.style.display = 'none';
    regCard.style.display = '';
    document.getElementById('login-form').reset();
  });

  document.getElementById('show-login-link').addEventListener('click', function (e) {
    e.preventDefault();
    hideCardErrors();
    regCard.style.display = 'none';
    loginCard.style.display = '';
    document.getElementById('register-form').reset();
  });

  /* ═══════════════════════════════════════════
     DYNAMIC SUPABASE CDN LOADING
     ═══════════════════════════════════════════ */
  function loadSupabase(cb) {
    // Skip if placeholder values; show the gate but auth will fail gracefully
    if (SUPABASE_URL.indexOf('YOUR_PROJECT_ID') !== -1) {
      console.warn('Supabase not configured. Auth disabled. Replace SUPABASE_URL and SUPABASE_ANON_KEY in script.js.');
      // Still call cb so page loads, but without real auth
      cb();
      return;
    }

    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = function () {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      cb();
    };
    s.onerror = function () {
      console.warn('Supabase CDN failed to load. Auth disabled.');
      cb();
    };
    document.head.appendChild(s);
  }

  function initAuth() {
    if (supabase) {
      // Listen for auth state changes
      supabase.auth.onAuthStateChange(function (event, session) {
        if (session && session.user) {
          currentUser = session.user;
          hideAuthGate();
          showMainContent();
          updateUserUI(session.user);
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          hideMainContent();
          showAuthGate();
          document.getElementById('login-form').reset();
          document.getElementById('register-form').reset();
          loginCard.style.display = '';
          regCard.style.display = 'none';
          hideCardErrors();
        }
      });

      // Check existing session
      supabase.auth.getSession().then(function (res) {
        if (res.data.session && res.data.session.user) {
          currentUser = res.data.session.user;
          hideAuthGate();
          showMainContent();
          updateUserUI(res.data.session.user);
        }
      });
    } else {
      // DEV MODE: no Supabase configured — skip auth gate entirely
      console.warn('Running in dev mode — auth bypassed. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable auth.');
      hideAuthGate();
      showMainContent();
    }
  }

  // Wire logout button
  document.getElementById('btn-logout').addEventListener('click', logout);

  /* ═══════════════════════════════════════════
     PARTICLE SYSTEM
     ═══════════════════════════════════════════ */
  function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouseX = -1000, mouseY = -1000;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 0.5,
        color: ['#00f0ff', '#ff00ff', '#b000ff', '#ffffff'][Math.floor(Math.random() * 4)]
      });
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        var dx = mouseX - p.x;
        var dy = mouseY - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          var force = 0.015;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
          p.vy = Math.max(-1.5, Math.min(1.5, p.vy));
        }

        p.vx *= 0.999;
        p.vy *= 0.999;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x;
          var dy2 = p.y - p2.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.08 * (1 - dist2 / 100);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ═══════════════════════════════════════════
     MOBILE NAV
     ═══════════════════════════════════════════ */
  function initMobileNav() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });

    var links = navLinks.querySelectorAll('a');
    for (var k = 0; k < links.length; k++) {
      links[k].addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    }
  }

  /* ═══════════════════════════════════════════
     SCROLL REVEAL
     ═══════════════════════════════════════════ */
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    function checkReveal() {
      var windowHeight = window.innerHeight;
      for (var r = 0; r < reveals.length; r++) {
        var el = reveals[r];
        var top = el.getBoundingClientRect().top;
        if (top < windowHeight - 80) {
          el.classList.add('visible');
        }
      }
    }
    window.addEventListener('scroll', checkReveal);
    checkReveal();
  }

  /* ═══════════════════════════════════════════
     NEWSLETTER
     ═══════════════════════════════════════════ */
  function initNewsletter() {
    var form = document.getElementById('newsletterForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      if (input.value.trim()) {
        input.value = '';
        input.placeholder = '✓ You\'re in! Welcome to Gameverse.';
        setTimeout(function () {
          input.placeholder = 'Enter your email';
        }, 3000);
      }
    });
  }

  /* ═══════════════════════════════════════════
     SMOOTH SCROLL
     ═══════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     2D TOP-DOWN RPG MINIGAME
     ═══════════════════════════════════════════ */
  function initRPG() {
    var canvas = document.getElementById('rpg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // Display elements
    var scoreEl = document.getElementById('rpg-score');
    var healthEl = document.getElementById('rpg-health');
    var levelEl = document.getElementById('rpg-level');

    // Game config
    var TILE = 32;
    var COLS = 20;
    var ROWS = 14;
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    // Tile types
    var FLOOR = 0, WALL = 1, DOOR = 2;

    // Map: 20x14 grid (0=floor, 1=wall)
    var map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1]
    ];

    // Player
    var player = {
      x: 1, y: 1,
      px: 1, py: 1,        // pixel position (for smooth movement)
      targetPx: 1 * TILE, targetPy: 1 * TILE,
      moving: false,
      dir: 0,              // 0=down, 1=left, 2=right, 3=up
      speed: 4
    };

    // Set initial pixel pos
    player.px = player.x * TILE + TILE/2;
    player.py = player.y * TILE + TILE/2;
    player.targetPx = player.px;
    player.targetPy = player.py;

    // Coins
    var coins = [];
    var coinTypes = ['🪙','💎','⭐','🔮'];
    function spawnCoins(count) {
      coins = [];
      for (var i = 0; i < count; i++) {
        var cx, cy;
        do {
          cx = Math.floor(Math.random() * COLS);
          cy = Math.floor(Math.random() * ROWS);
        } while (map[cy][cx] !== FLOOR || (cx === player.x && cy === player.y));
        coins.push({
          x: cx, y: cy,
          type: coinTypes[Math.floor(Math.random() * coinTypes.length)],
          value: Math.random() < 0.2 ? 10 : 1,
          collected: false,
          bobOffset: Math.random() * Math.PI * 2
        });
      }
    }

    // Enemies
    var enemies = [];
    function spawnEnemies(count) {
      enemies = [];
      for (var i = 0; i < count; i++) {
        var ex, ey;
        do {
          ex = Math.floor(Math.random() * COLS);
          ey = Math.floor(Math.random() * ROWS);
        } while (
          map[ey][ex] !== FLOOR ||
          (Math.abs(ex - player.x) < 4 && Math.abs(ey - player.y) < 4)
        );
        enemies.push({
          x: ex, y: ey,
          px: ex * TILE + TILE/2, py: ey * TILE + TILE/2,
          dir: Math.floor(Math.random() * 4),
          moveTimer: Math.random() * 60,
          moveInterval: 40 + Math.random() * 40,
          type: Math.random() < 0.3 ? 'boss' : 'grunt',
          alive: true
        });
      }
    }

    // Game state
    var score = 0;
    var health = 100;
    var level = 1;
    var gameOver = false;
    var invincibleTimer = 0;
    var animFrame = 0;

    // Input — only intercept game keys, don't block typing elsewhere
    var GAME_KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D','r','R'];
    var keys = {};
    document.addEventListener('keydown', function (e) {
      if (GAME_KEYS.indexOf(e.key) === -1) return;
      e.preventDefault();
      keys[e.key] = true;
      if (gameOver && (e.key === 'r' || e.key === 'R')) resetGame();
    });
    document.addEventListener('keyup', function (e) {
      if (GAME_KEYS.indexOf(e.key) === -1) return;
      e.preventDefault();
      keys[e.key] = false;
    });

    function resetGame() {
      score = 0;
      health = 100;
      level = 1;
      gameOver = false;
      invincibleTimer = 0;
      player.x = 1; player.y = 1;
      player.px = player.x * TILE + TILE/2;
      player.py = player.y * TILE + TILE/2;
      player.targetPx = player.px;
      player.targetPy = player.py;
      player.moving = false;
      spawnCoins(10);
      spawnEnemies(3);
    }

    function tryMovePlayer(dx, dy) {
      if (gameOver) return;
      var nx = player.x + dx;
      var ny = player.y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && map[ny][nx] !== WALL) {
        player.x = nx;
        player.y = ny;
        player.targetPx = nx * TILE + TILE/2;
        player.targetPy = ny * TILE + TILE/2;
        player.moving = true;
        if (dx === 0 && dy === 1) player.dir = 0;
        else if (dx === -1 && dy === 0) player.dir = 1;
        else if (dx === 1 && dy === 0) player.dir = 2;
        else if (dx === 0 && dy === -1) player.dir = 3;
      }
    }

    function updatePlayer() {
      // Movement input (only when not mid-move)
      if (!player.moving) {
        if (keys['ArrowUp'] || keys['w'] || keys['W']) tryMovePlayer(0, -1);
        else if (keys['ArrowDown'] || keys['s'] || keys['S']) tryMovePlayer(0, 1);
        else if (keys['ArrowLeft'] || keys['a'] || keys['A']) tryMovePlayer(-1, 0);
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) tryMovePlayer(1, 0);
      }

      // Smooth movement toward target
      if (player.moving) {
        var dx = player.targetPx - player.px;
        var dy = player.targetPy - player.py;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.speed) {
          player.px = player.targetPx;
          player.py = player.targetPy;
          player.moving = false;
        } else {
          player.px += (dx / dist) * player.speed;
          player.py += (dy / dist) * player.speed;
        }
      }

      // Coin collection
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i];
        if (!c.collected && c.x === player.x && c.y === player.y) {
          c.collected = true;
          score += c.value;
          if (c.value === 10) health = Math.min(100, health + 15);
        }
      }

      // Enemy collision
      if (invincibleTimer <= 0) {
        for (var j = 0; j < enemies.length; j++) {
          var en = enemies[j];
          if (en.alive && en.x === player.x && en.y === player.y) {
            health -= en.type === 'boss' ? 25 : 10;
            invincibleTimer = 40;
            if (health <= 0) {
              health = 0;
              gameOver = true;
            }
          }
        }
      }
      if (invincibleTimer > 0) invincibleTimer--;
    }

    function updateEnemies() {
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en.alive) continue;
        en.moveTimer++;

        // Smooth pixel movement
        var tdx = en.x * TILE + TILE/2 - en.px;
        var tdy = en.y * TILE + TILE/2 - en.py;
        var tdist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (tdist > 0.5) {
          en.px += (tdx / tdist) * 2;
          en.py += (tdy / tdist) * 2;
        } else {
          en.px = en.x * TILE + TILE/2;
          en.py = en.y * TILE + TILE/2;
        }

        if (en.moveTimer >= en.moveInterval) {
          en.moveTimer = 0;
          en.moveInterval = 35 + Math.random() * 45;
          var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
          // Occasionally move toward player
          if (Math.random() < 0.4) {
            var pdx = player.x - en.x;
            var pdy = player.y - en.y;
            if (Math.abs(pdx) > Math.abs(pdy)) {
              dirs = [[Math.sign(pdx),0],[0,Math.sign(pdy)],[0,-Math.sign(pdy)],[-Math.sign(pdx),0]];
            } else {
              dirs = [[0,Math.sign(pdy)],[Math.sign(pdx),0],[-Math.sign(pdx),0],[0,-Math.sign(pdy)]];
            }
          }
          for (var d = 0; d < dirs.length; d++) {
            var nx = en.x + dirs[d][0];
            var ny = en.y + dirs[d][1];
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && map[ny][nx] !== WALL) {
              en.x = nx;
              en.y = ny;
              break;
            }
          }
        }
      }
    }

    function checkLevelComplete() {
      var allCollected = true;
      for (var i = 0; i < coins.length; i++) {
        if (!coins[i].collected) { allCollected = false; break; }
      }
      if (allCollected && !gameOver) {
        level++;
        health = Math.min(100, health + 30);
        spawnCoins(8 + level * 2);
        spawnEnemies(2 + level);
        player.x = 1; player.y = 1;
        player.px = player.x * TILE + TILE/2;
        player.py = player.y * TILE + TILE/2;
        player.targetPx = player.px;
        player.targetPy = player.py;
        player.moving = false;
      }
    }

    function drawMap() {
      for (var row = 0; row < ROWS; row++) {
        for (var col = 0; col < COLS; col++) {
          var x = col * TILE;
          var y = row * TILE;
          if (map[row][col] === WALL) {
            ctx.fillStyle = '#3a3a5c';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#4a4a6c';
            ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
            ctx.strokeStyle = '#5a5a8c';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
          } else {
            var shade = ((col + row) % 2 === 0) ? '#1e1e35' : '#222240';
            ctx.fillStyle = shade;
            ctx.fillRect(x, y, TILE, TILE);
            // Subtle grid lines
            ctx.strokeStyle = 'rgba(255,255,255,0.02)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, TILE, TILE);
          }
        }
      }
    }

    function drawCoins() {
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i];
        if (c.collected) continue;
        var cx = c.x * TILE + TILE/2;
        var cy = c.y * TILE + TILE/2 + Math.sin(animFrame * 0.05 + c.bobOffset) * 3;
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.type, cx, cy);

        // Glow
        ctx.shadowColor = c.value === 10 ? '#ffd700' : '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillText(c.type, cx, cy);
        ctx.shadowBlur = 0;
      }
    }

    function drawEnemies() {
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en.alive) continue;
        var ex = en.px;
        var ey = en.py;

        // Enemy body
        ctx.fillStyle = en.type === 'boss' ? '#ff3355' : '#ff8844';
        ctx.beginPath();
        ctx.arc(ex, ey, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 3, 4, 0, Math.PI * 2);
        ctx.arc(ex + 4, ey - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 3, 2, 0, Math.PI * 2);
        ctx.arc(ex + 4, ey - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Boss crown
        if (en.type === 'boss') {
          ctx.fillStyle = '#ffd700';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👑', ex, ey - 16);
        }
      }
    }

    function drawPlayer() {
      var px = player.px;
      var py = player.py;

      // Invincibility flash
      if (invincibleTimer > 0 && Math.floor(invincibleTimer / 3) % 2 === 0) return;

      // Body
      var gradient = ctx.createRadialGradient(px, py, 3, px, py, 14);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#0060aa');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eyes (direction-based)
      ctx.fillStyle = '#fff';
      var eyeOffX = 0, eyeOffY = 0;
      if (player.dir === 0) { eyeOffY = 2; }      // down
      else if (player.dir === 1) { eyeOffX = -2; } // left
      else if (player.dir === 2) { eyeOffX = 2; }  // right
      else if (player.dir === 3) { eyeOffY = -2; } // up

      ctx.beginPath();
      ctx.arc(px - 4 + eyeOffX, py - 2 + eyeOffY, 3.5, 0, Math.PI * 2);
      ctx.arc(px + 4 + eyeOffX, py - 2 + eyeOffY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(px - 4 + eyeOffX, py - 2 + eyeOffY, 1.8, 0, Math.PI * 2);
      ctx.arc(px + 4 + eyeOffX, py - 2 + eyeOffY, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawHUD() {
      scoreEl.textContent = score;
      healthEl.textContent = health;
      levelEl.textContent = level;

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff3355';
        ctx.font = 'bold 36px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 30);
        ctx.font = '18px Orbitron, sans-serif';
        ctx.fillText('Score: ' + score + '  |  Level: ' + level, canvas.width/2, canvas.height/2 + 60);
      }
    }

    function gameLoop() {
      animFrame++;
      if (!gameOver) {
        updatePlayer();
        updateEnemies();
        checkLevelComplete();
      }
      drawMap();
      drawCoins();
      drawEnemies();
      drawPlayer();
      drawHUD();
      requestAnimationFrame(gameLoop);
    }

    // Initialize
    spawnCoins(10);
    spawnEnemies(3);
    gameLoop();
  }

  /* ═══════════════════════════════════════════
     INIT EVERYTHING
     ═══════════════════════════════════════════ */
  function initAll() {
    initParticles();
    initMobileNav();
    initScrollReveal();
    initNewsletter();
    initSmoothScroll();
    // RPG starts after auth — see showMainContent()
  }

  // Start RPG when it scrolls into view — most reliable trigger
  var rpgStarted = false;
  function tryStartRPG() {
    if (rpgStarted) return;
    var el = document.getElementById('rpg-canvas');
    if (!el) return;
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      rpgStarted = true;
      initRPG();
    }
  }
  window.addEventListener('scroll', tryStartRPG, {passive: true});

  // Also trigger after auth shows main content (backup)
  var origShowMainContent = showMainContent;
  showMainContent = function () {
    origShowMainContent();
    setTimeout(tryStartRPG, 200);
  };

  // Bootstrap: load Supabase → init auth → then init everything else
  loadSupabase(function () {
    initAuth();
    initAll();
  });

})();
