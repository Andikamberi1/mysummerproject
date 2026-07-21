/* ═══════════════════════════════════════════
   GAMEVERSE — script.js (RPG section rewritten)
   Multiplayer RPG via Supabase Realtime
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

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
        }, 1500);
      }
    }).catch(function () {
      showCardError('register', 'Connection error. Please try again.');
    }).finally(function () {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    });
  }

  function startRegisterCooldown(btn, secs) {
    registerCooldown = secs;
    var iv = setInterval(function () {
      registerCooldown--;
      btn.textContent = 'Wait ' + registerCooldown + 's';
      if (registerCooldown <= 0) {
        clearInterval(iv);
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    }, 1000);
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
    var emailEl = document.getElementById('nav-user-email');
    if (emailEl && user) {
      emailEl.textContent = user.email;
    }
  }

  /* ═══════════════════════════════════════════
     AUTH FORMS
     ═══════════════════════════════════════════ */
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideCardErrors();
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value.trim();
    if (!email || !password) { showCardError('login', 'Please fill in all fields.'); return; }
    login(email, password);
  });

  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideCardErrors();
    var name = document.getElementById('reg-fullname').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var password = document.getElementById('reg-password').value.trim();
    if (!email || !password) { showCardError('register', 'Please fill in email and password.'); return; }
    register(name, email, password);
  });

  document.getElementById('show-register-link').addEventListener('click', function (e) {
    e.preventDefault();
    loginCard.style.display = 'none';
    regCard.style.display = '';
    hideCardErrors();
  });

  document.getElementById('show-login-link').addEventListener('click', function (e) {
    e.preventDefault();
    regCard.style.display = 'none';
    loginCard.style.display = '';
    hideCardErrors();
  });

  /* ═══════════════════════════════════════════
     DYNAMIC SUPABASE CDN LOADING
     ═══════════════════════════════════════════ */
  function loadSupabase(cb) {
    if (SUPABASE_URL.indexOf('YOUR_PROJECT_ID') !== -1) {
      console.warn('Supabase not configured. Auth disabled. Replace SUPABASE_URL and SUPABASE_ANON_KEY in script.js.');
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
      supabase.auth.getSession().then(function (res) {
        if (res.data.session && res.data.session.user) {
          currentUser = res.data.session.user;
          hideAuthGate();
          showMainContent();
          updateUserUI(res.data.session.user);
        }
      });
    } else {
      console.warn('Running in dev mode — auth bypassed. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable auth.');
      hideAuthGate();
      showMainContent();
    }
  }

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
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        var dx = mouseX - p.x, dy = mouseY - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          p.vx += (dx / dist) * 0.015;
          p.vy += (dy / dist) * 0.015;
          p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
          p.vy = Math.max(-1.5, Math.min(1.5, p.vy));
        }
        p.vx *= 0.999; p.vy *= 0.999;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x, dy2 = p.y - p2.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color; ctx.globalAlpha = 0.08 * (1 - dist2 / 100);
            ctx.lineWidth = 0.5; ctx.stroke();
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
    hamburger.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    var links = navLinks.querySelectorAll('a');
    for (var k = 0; k < links.length; k++) {
      links[k].addEventListener('click', function () { navLinks.classList.remove('open'); });
    }
  }

  /* ═══════════════════════════════════════════
     SCROLL REVEAL
     ═══════════════════════════════════════════ */
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    function checkReveal() {
      var wh = window.innerHeight;
      for (var r = 0; r < reveals.length; r++) {
        var el = reveals[r];
        if (el.getBoundingClientRect().top < wh - 80) el.classList.add('visible');
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
        setTimeout(function () { input.placeholder = 'Enter your email'; }, 3000);
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
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ═══════════════════════════════════════════
     MULTIPLAYER RPG
     ═══════════════════════════════════════════ */
  var rpgChannel = null;
  var remotePlayers = {};
  var playerName = 'Player';
  var playerColor = '#00f0ff';
  var blockType = 1, buildMode = false;

  function initRPG() {
    var canvas = document.getElementById('rpg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var scoreEl = document.getElementById('rpg-score');
    var healthEl = document.getElementById('rpg-health');
    var levelEl = document.getElementById('rpg-level');
    var modeEl = document.getElementById('rpg-mode');
    var chatMsgs = document.getElementById('rpg-chat-msgs');
    var chatInput = document.getElementById('rpg-chat-input');
    var chatSend = document.getElementById('rpg-chat-send');
    var playerList = document.getElementById('rpg-player-list');

    // Game config
    var TILE = 32;
    var COLS = 25;
    var ROWS = 18;
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    var FLOOR = 0, WALL = 1, GRASS = 2, WATER = 3, WOOD = 4, STONE = 5;

    // Block colors for building
    var BLOCK_COLORS = {1:'#5a5a8c', 2:'#2d8c2d', 3:'#2266cc', 4:'#8b6914', 5:'#777777'};

    // Map
    var map = [];
    function initMap() {
      for (var r = 0; r < ROWS; r++) {
        map[r] = [];
        for (var c = 0; c < COLS; c++) {
          if (r === 0 || r === ROWS-1 || c === 0 || c === COLS-1) map[r][c] = WALL;
          else map[r][c] = FLOOR;
        }
      }
      // Pre-built structures
      var b = WALL;
      [[3,3,b],[4,3,b],[5,3,b],[3,4,b],[5,4,b],[3,5,b],[4,5,b],[5,5,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[12,2,b],[13,2,b],[14,2,b],[12,3,b],[14,3,b],[12,4,b],[14,4,b],[12,5,b],[13,5,b],[14,5,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[8,8,b],[9,8,b],[8,9,b],[9,9,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[17,10,b],[18,10,b],[19,10,b],[17,11,b],[19,11,b],[17,12,b],[18,12,b],[19,12,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
    }
    initMap();

    // Player
    var player = {x:2, y:2, px:2*TILE+TILE/2, py:2*TILE+TILE/2, targetPx:2*TILE+TILE/2, targetPy:2*TILE+TILE/2, moving:false, dir:0, speed:5};

    var coins = [];
    var coinTypes = ['🪙','💎','⭐','🔮'];
    function spawnCoins(count) {
      coins = [];
      for (var i = 0; i < count; i++) {
        var cx, cy;
        do { cx = Math.floor(Math.random()*COLS); cy = Math.floor(Math.random()*ROWS); }
        while (map[cy][cx] !== FLOOR || (cx === player.x && cy === player.y));
        coins.push({x:cx, y:cy, type:coinTypes[Math.floor(Math.random()*coinTypes.length)], value:Math.random()<0.2?10:1, collected:false, bobOffset:Math.random()*Math.PI*2});
      }
    }

    var enemies = [];
    function spawnEnemies(count) {
      enemies = [];
      for (var i = 0; i < count; i++) {
        var ex, ey;
        do { ex = Math.floor(Math.random()*COLS); ey = Math.floor(Math.random()*ROWS); }
        while (map[ey][ex] !== FLOOR || (Math.abs(ex-player.x)<4 && Math.abs(ey-player.y)<4));
        enemies.push({x:ex, y:ey, px:ex*TILE+TILE/2, py:ey*TILE+TILE/2, dir:Math.floor(Math.random()*4), moveTimer:Math.random()*60, moveInterval:35+Math.random()*45, type:Math.random()<0.3?'boss':'grunt', alive:true});
      }
    }

    var score = 0, health = 100, level = 1, gameOver = false, invincibleTimer = 0, animFrame = 0;

    // Input
    var GAME_KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D','r','R'];
    var keys = {};
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && document.activeElement !== chatInput) { chatInput.focus(); e.preventDefault(); return; }
      if (GAME_KEYS.indexOf(e.key) === -1) return;
      e.preventDefault();
      keys[e.key] = true;
      if (gameOver && (e.key === 'r' || e.key === 'R')) resetGame();
    });
    document.addEventListener('keyup', function(e) {
      if (GAME_KEYS.indexOf(e.key) === -1) return;
      e.preventDefault();
      keys[e.key] = false;
    });

    // Block selection with number keys
    document.addEventListener('keydown', function(e) {
      var num = parseInt(e.key);
      if (num >= 1 && num <= 5 && document.activeElement !== chatInput) {
        blockType = num; buildMode = true; modeEl.textContent = 'Build ' + num;
      }
    });

    // Click to build/destroy
    canvas.addEventListener('click', function(e) {
      if (!buildMode && keys['Shift']) return;
      var rect = canvas.getBoundingClientRect();
      var cx = Math.floor((e.clientX - rect.left) / TILE);
      var cy = Math.floor((e.clientY - rect.top) / TILE);
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
      if (cx === player.x && cy === player.y) return;
      if (map[cy][cx] === FLOOR && buildMode) {
        map[cy][cx] = blockType;
        broadcastMapChange(cx, cy, blockType);
      }
    });
    canvas.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var cx = Math.floor((e.clientX - rect.left) / TILE);
      var cy = Math.floor((e.clientY - rect.top) / TILE);
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
      if (map[cy][cx] > FLOOR) {
        map[cy][cx] = FLOOR;
        broadcastMapChange(cx, cy, FLOOR);
      }
    });

    // Chat
    function addChat(name, text) {
      var div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = '<span class="chat-name">' + escapeHtml(name) + ':</span> <span class="chat-text">' + escapeHtml(text) + '</span>';
      chatMsgs.appendChild(div);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
      if (chatMsgs.children.length > 50) chatMsgs.removeChild(chatMsgs.firstChild);
    }
    function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function sendChat() {
      var text = chatInput.value.trim();
      if (!text) return;
      if (rpgChannel) {
        rpgChannel.send({type:'broadcast', event:'chat', payload:{name:playerName, text:text}});
      }
      addChat(playerName, text);
      chatInput.value = '';
    }
    chatSend.addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
      if (e.key === 'Escape') { chatInput.blur(); }
    });

    // ── SUPABASE REALTIME CHANNEL ──
    if (supabase && currentUser) {
      playerName = currentUser.email ? currentUser.email.split('@')[0] : 'Player';
      playerColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    }

    function connectChannel() {
      if (!supabase) return;
      rpgChannel = supabase.channel('gameverse-rpg', {
        config: { presence: { key: currentUser ? currentUser.id : 'anon-' + Date.now() } }
      });

      rpgChannel
        .on('broadcast', { event: 'player-move' }, function(payload) {
          var p = payload.payload;
          if (p.id === (currentUser ? currentUser.id : '')) return;
          if (!remotePlayers[p.id]) {
            remotePlayers[p.id] = {name:p.name, color:p.color, x:p.x, y:p.y, px:p.px, py:p.py, dir:p.dir};
            updatePlayerList();
          }
          var rp = remotePlayers[p.id];
          if (rp) { rp.x = p.x; rp.y = p.y; rp.px = p.px; rp.py = p.py; rp.dir = p.dir; rp.lastSeen = Date.now(); }
        })
        .on('broadcast', { event: 'chat' }, function(payload) {
          addChat(payload.payload.name, payload.payload.text);
        })
        .on('broadcast', { event: 'map-change' }, function(payload) {
          var m = payload.payload;
          if (m.x >= 0 && m.x < COLS && m.y >= 0 && m.y < ROWS) {
            map[m.y][m.x] = m.tile;
          }
        })
        .subscribe(function(status) {
          if (status === 'SUBSCRIBED') {
            addChat('System', 'Connected to the world! Other players can see you now.');
            broadcastPosition();
          }
        });
    }
    connectChannel();

    function broadcastPosition() {
      if (!rpgChannel) return;
      rpgChannel.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: currentUser ? currentUser.id : '',
          name: playerName,
          color: playerColor,
          x: player.x, y: player.y,
          px: player.px, py: player.py,
          dir: player.dir
        }
      });
    }

    function broadcastMapChange(x, y, tile) {
      if (!rpgChannel) return;
      rpgChannel.send({type:'broadcast', event:'map-change', payload:{x:x, y:y, tile:tile}});
    }

    function updatePlayerList() {
      var html = '<li class="me">🟢 ' + escapeHtml(playerName) + ' (you)</li>';
      var ids = Object.keys(remotePlayers);
      for (var i = 0; i < ids.length; i++) {
        html += '<li>🔵 ' + escapeHtml(remotePlayers[ids[i]].name) + '</li>';
      }
      playerList.innerHTML = html || '<li>Just you</li>';
    }
    updatePlayerList();

    // Cleanup stale remote players
    setInterval(function() {
      var now = Date.now();
      var changed = false;
      var ids = Object.keys(remotePlayers);
      for (var i = 0; i < ids.length; i++) {
        if (now - remotePlayers[ids[i]].lastSeen > 15000) {
          delete remotePlayers[ids[i]];
          changed = true;
        }
      }
      if (changed) updatePlayerList();
    }, 3000);

    var lastBroadcast = 0;
    var BROADCAST_INTERVAL = 100;

    /* ═══ GAME FUNCTIONS ═══ */
    function resetGame() {
      score = 0; health = 100; level = 1; gameOver = false; invincibleTimer = 0;
      player.x = 2; player.y = 2;
      player.px = player.x*TILE+TILE/2; player.py = player.y*TILE+TILE/2;
      player.targetPx = player.px; player.targetPy = player.py;
      player.moving = false;
      initMap();
      spawnCoins(10); spawnEnemies(3);
    }

    function tryMovePlayer(dx, dy) {
      if (gameOver) return;
      var nx = player.x + dx, ny = player.y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && map[ny][nx] === FLOOR) {
        player.x = nx; player.y = ny;
        player.targetPx = nx*TILE+TILE/2; player.targetPy = ny*TILE+TILE/2;
        player.moving = true;
        if (dx===0&&dy===1) player.dir=0;
        else if (dx===-1&&dy===0) player.dir=1;
        else if (dx===1&&dy===0) player.dir=2;
        else if (dx===0&&dy===-1) player.dir=3;
      }
    }

    function updatePlayer() {
      if (!player.moving) {
        if (keys['ArrowUp']||keys['w']||keys['W']) tryMovePlayer(0,-1);
        else if (keys['ArrowDown']||keys['s']||keys['S']) tryMovePlayer(0,1);
        else if (keys['ArrowLeft']||keys['a']||keys['A']) tryMovePlayer(-1,0);
        else if (keys['ArrowRight']||keys['d']||keys['D']) tryMovePlayer(1,0);
        else buildMode = false;
      }
      if (player.moving) {
        var dx = player.targetPx - player.px, dy = player.targetPy - player.py;
        var dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < player.speed) { player.px=player.targetPx; player.py=player.targetPy; player.moving=false; }
        else { player.px+=(dx/dist)*player.speed; player.py+=(dy/dist)*player.speed; }
      }
      // Coins
      for (var i=0;i<coins.length;i++) {
        var c=coins[i];
        if (!c.collected && c.x===player.x && c.y===player.y) {
          c.collected=true; score+=c.value;
          if (c.value===10) health=Math.min(100,health+15);
        }
      }
      // Enemy collision
      if (invincibleTimer<=0) {
        for (var j=0;j<enemies.length;j++) {
          var en=enemies[j];
          if (en.alive && en.x===player.x && en.y===player.y) {
            health-=en.type==='boss'?25:10; invincibleTimer=40;
            if (health<=0) { health=0; gameOver=true; }
          }
        }
      }
      if (invincibleTimer>0) invincibleTimer--;
    }

    function updateEnemies() {
      for (var i=0;i<enemies.length;i++) {
        var en=enemies[i];
        if (!en.alive) continue;
        en.moveTimer++;
        // Smooth to target
        var tdx=en.x*TILE+TILE/2-en.px, tdy=en.y*TILE+TILE/2-en.py;
        var tdist=Math.sqrt(tdx*tdx+tdy*tdy);
        if (tdist>0.5) { en.px+=(tdx/tdist)*2; en.py+=(tdy/tdist)*2; }
        else { en.px=en.x*TILE+TILE/2; en.py=en.y*TILE+TILE/2; }
        if (en.moveTimer>=en.moveInterval) {
          en.moveTimer=0; en.moveInterval=35+Math.random()*45;
          var dirs=[[0,1],[0,-1],[1,0],[-1,0]];
          if (Math.random()<0.4) {
            var pdx=player.x-en.x, pdy=player.y-en.y;
            dirs=Math.abs(pdx)>Math.abs(pdy)?[[Math.sign(pdx),0],[0,Math.sign(pdy)],[0,-Math.sign(pdy)],[-Math.sign(pdx),0]]:[[0,Math.sign(pdy)],[Math.sign(pdx),0],[-Math.sign(pdx),0],[0,-Math.sign(pdy)]];
          }
          for (var d=0;d<dirs.length;d++) {
            var nx=en.x+dirs[d][0], ny=en.y+dirs[d][1];
            if (nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&map[ny][nx]===FLOOR) { en.x=nx; en.y=ny; break; }
          }
        }
      }
    }

    function checkLevelComplete() {
      var all=true;
      for (var i=0;i<coins.length;i++) { if (!coins[i].collected) { all=false; break; } }
      if (all && !gameOver) { level++; health=Math.min(100,health+30); spawnCoins(8+level*2); spawnEnemies(2+level); player.x=2;player.y=2;player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;player.targetPx=player.px;player.targetPy=player.py;player.moving=false; }
    }

    /* ═══ DRAWING ═══ */
    function drawMap() {
      for (var r=0;r<ROWS;r++) {
        for (var c=0;c<COLS;c++) {
          var x=c*TILE,y=r*TILE;
          if (map[r][c]===FLOOR) { ctx.fillStyle=((c+r)%2===0)?'#1e1e35':'#222240'; ctx.fillRect(x,y,TILE,TILE); }
          else {
            var color=BLOCK_COLORS[map[r][c]]||'#4a4a6c';
            ctx.fillStyle=color; ctx.fillRect(x,y,TILE,TILE);
            ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
            ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.strokeRect(x,y,TILE,TILE);
          }
          ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,TILE,TILE);
        }
      }
    }

    function drawCoins() {
      for (var i=0;i<coins.length;i++) {
        var c=coins[i]; if (c.collected) continue;
        var cx=c.x*TILE+TILE/2, cy=c.y*TILE+TILE/2+Math.sin(animFrame*0.05+c.bobOffset)*3;
        ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.shadowColor=c.value===10?'#ffd700':'#00f0ff'; ctx.shadowBlur=6;
        ctx.fillText(c.type,cx,cy); ctx.shadowBlur=0;
      }
    }

    function drawEnemies() {
      for (var i=0;i<enemies.length;i++) {
        var en=enemies[i]; if (!en.alive) continue;
        ctx.fillStyle=en.type==='boss'?'#ff3355':'#ff8844';
        ctx.beginPath(); ctx.arc(en.px,en.py,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath();
        ctx.arc(en.px-3,en.py-3,3,0,Math.PI*2); ctx.arc(en.px+3,en.py-3,3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.beginPath();
        ctx.arc(en.px-3,en.py-3,1.5,0,Math.PI*2); ctx.arc(en.px+3,en.py-3,1.5,0,Math.PI*2); ctx.fill();
        if (en.type==='boss') { ctx.fillStyle='#ffd700'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('👑',en.px,en.py-15); }
      }
    }

    function drawPlayerCharacter(px, py, dir, color, name, isMe) {
      if (isMe && invincibleTimer>0 && Math.floor(invincibleTimer/3)%2===0) return;
      var grad=ctx.createRadialGradient(px,py,2,px,py,12);
      grad.addColorStop(0,color); grad.addColorStop(1,'#002244');
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(px,py,12,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=color; ctx.lineWidth=isMe?2:1.5; ctx.stroke();
      // Eyes
      var eox=0, eoy=0;
      if (dir===0) eoy=2; else if (dir===1) eox=-2; else if (dir===2) eox=2; else if (dir===3) eoy=-2;
      ctx.fillStyle='#fff'; ctx.beginPath();
      ctx.arc(px-3+eox,py-2+eoy,3,0,Math.PI*2); ctx.arc(px+3+eox,py-2+eoy,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000'; ctx.beginPath();
      ctx.arc(px-3+eox,py-2+eoy,1.5,0,Math.PI*2); ctx.arc(px+3+eox,py-2+eoy,1.5,0,Math.PI*2); ctx.fill();
      // Name
      ctx.fillStyle='#fff'; ctx.font='bold 9px Inter,sans-serif'; ctx.textAlign='center';
      ctx.fillText(name+(isMe?' (you)':''), px, py-18);
      if (isMe) { ctx.shadowColor=color; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(px,py,12,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
    }

    function drawRemotePlayers() {
      var ids=Object.keys(remotePlayers);
      for (var i=0;i<ids.length;i++) {
        var rp=remotePlayers[ids[i]];
        // Smooth interpolation
        if (rp.targetX && rp.targetY) {
          rp.px += (rp.targetX - rp.px) * 0.3;
          rp.py += (rp.targetY - rp.py) * 0.3;
        }
        rp.targetX = rp.x * TILE + TILE/2;
        rp.targetY = rp.y * TILE + TILE/2;
        drawPlayerCharacter(rp.px, rp.py, rp.dir, rp.color||'#ff8844', rp.name||'Player', false);
      }
    }

    function drawHUD() {
      scoreEl.textContent=score; healthEl.textContent=health; levelEl.textContent=level;
      if (!buildMode) modeEl.textContent = gameOver ? 'Dead' : 'Explore';
      if (gameOver) {
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#ff3355'; ctx.font='bold 36px Orbitron,sans-serif'; ctx.textAlign='center';
        ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-20);
        ctx.fillStyle='#fff'; ctx.font='14px Inter,sans-serif';
        ctx.fillText('Press R to restart',canvas.width/2,canvas.height/2+30);
        ctx.font='18px Orbitron,sans-serif';
        ctx.fillText('Score: '+score+' | Level: '+level,canvas.width/2,canvas.height/2+60);
      }
    }

    function gameLoop() {
      animFrame++;
      if (!gameOver) { updatePlayer(); updateEnemies(); checkLevelComplete(); }
      if (Date.now() - lastBroadcast > BROADCAST_INTERVAL) { broadcastPosition(); lastBroadcast = Date.now(); }
      drawMap(); drawCoins(); drawEnemies(); drawRemotePlayers();
      drawPlayerCharacter(player.px, player.py, player.dir, playerColor, playerName, true);
      drawHUD();
      requestAnimationFrame(gameLoop);
    }

    spawnCoins(12); spawnEnemies(4); gameLoop();
  }

  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */
  function initAll() {
    initParticles();
    initMobileNav();
    initScrollReveal();
    initNewsletter();
    initSmoothScroll();
  }

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
  var origShowMainContent = showMainContent;
  showMainContent = function () { origShowMainContent(); setTimeout(tryStartRPG, 200); };

  loadSupabase(function () { initAuth(); initAll(); });

})();
