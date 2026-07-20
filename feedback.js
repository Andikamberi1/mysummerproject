/* ═══════════════════════════════════════════
   SIDE PANEL JS — Feedback + AI Chat
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  var OPENROUTER_KEY = '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';
  var MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

  // ═══ Website context (summarized for the AI) ═══
  var SITE_CONTEXT = [
    'This is Gameverse, a futuristic video game information website.',
    '',
    'SECTIONS ON THE SITE:',
    '- Hero: Welcome to Gameverse, a hub for video game exploration.',
    '- Fun Facts: Mind-blowing gaming facts including first video game (Tennis for Two, 1958), Pac-Man\'s original name (Puck-Man), GTA V earning $1B in 3 days, gaming increases gray matter, Minecraft sold 300M+ copies, e-sports industry worth $1.5B.',
    '- Famous Games: Minecraft (Mojang, 300M+ copies), Fortnite (Epic Games, 650M+ players), Roblox (70M+ daily users), Genshin Impact (HoYoverse, $4B+ revenue), Among Us (Innersloth, 500M+ players), Valorant (Riot Games, 28M+ monthly players).',
    '- Game Creation Platforms: Unity (intermediate), Unreal Engine 5 (advanced), Godot (beginner-friendly, free/open-source), Roblox Studio (beginner-friendly, Lua), Scratch (super beginner, MIT, drag-and-drop), GameMaker (intermediate, Undertale), RPG Maker (beginner, JRPGs), Construct 3 (beginner, browser-based).',
    '- Gaming Platforms: Steam (50,000+ games), Epic Games Store (weekly free games), Xbox Game Pass (subscription), PlayStation Plus, Nintendo eShop, Mobile (Google Play/App Store), Cloud Gaming (GeForce NOW, Xbox Cloud, Luna), itch.io (indie marketplace).',
    '- Mini RPG: Top-down dungeon crawler game built into the site. Use WASD/arrows to move, collect coins, avoid enemies.',
    '- Stats: 3.2 billion gamers worldwide, $184B industry value, 50+ years of gaming history.',
    '',
    'AUTH: Site uses Supabase authentication. Users must sign in/register to access content.',
    ''
  ].join('\n');

  // ═══ DOM ═══
  function $(id) { return document.getElementById(id); }

  // ═══ Panel open/close ═══
  function openPanel() {
    $('sp-drawer').classList.add('open');
    $('sp-overlay').classList.add('open');
  }
  function closePanel() {
    $('sp-drawer').classList.remove('open');
    $('sp-overlay').classList.remove('open');
  }

  // ═══ Tab switching ═══
  function switchTab(tabName) {
    document.querySelectorAll('.sp-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.sp-content').forEach(function (c) {
      c.classList.toggle('active', c.id === 'sp-' + tabName);
    });
  }

  // ═══ Feedback form ═══
  var fbForm = $('feedback-form');
  var fbSuccess = $('fb-success');

  fbForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('fb-name').value.trim();
    var email = $('fb-email').value.trim();
    var type = $('fb-type').value;
    var msg = $('fb-message').value.trim();

    if (!msg) return;

    // Log feedback (in production, send to a backend)
    console.log('[Feedback]', { name: name, email: email, type: type, message: msg });

    fbForm.reset();
    fbSuccess.classList.add('show');
    setTimeout(function () { fbSuccess.classList.remove('show'); }, 4000);
  });

  // ═══ AI Chat ═══
  var chatContainer = $('sp-chat');
  var promptInput = $('sp-prompt');
  var sendBtn = $('sp-send');
  var isWaiting = false;

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'sp-msg ' + role;
    var avatar = role === 'user' ? '👤' : '🤖';
    div.innerHTML = '<span class="sp-avatar">' + avatar + '</span><div class="sp-bubble">' + escapeHtml(text) + '</div>';
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return div;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'sp-msg bot sp-typing';
    div.id = 'sp-typing';
    div.innerHTML = '<span class="sp-avatar">🤖</span><div class="sp-bubble">Thinking...</div>';
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return div;
  }

  function removeTyping() {
    var el = $('sp-typing');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function askAI(question) {
    if (isWaiting) return;
    isWaiting = true;
    sendBtn.disabled = true;
    promptInput.disabled = true;

    addMessage('user', question);
    addTyping();
    promptInput.value = '';

    var messages = [
      { role: 'system', content: 'You are a helpful assistant for the Gameverse website. Answer questions based on the following website content. Be concise, friendly, and match the futuristic gaming theme. Use 1-3 short paragraphs max.\n\nWEBSITE CONTENT:\n' + SITE_CONTEXT },
      { role: 'user', content: question }
    ];

    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_KEY,
        'HTTP-Referer': window.location.href || 'https://gameverse.app',
        'X-Title': 'Gameverse AI Assistant'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    })
      .then(function (res) {
        if (res.status === 402) throw new Error('402');
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      })
      .then(function (data) {
        removeTyping();
        var reply = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : 'Sorry, I couldn\'t process that. Try again!';
        addMessage('bot', reply);
      })
      .catch(function (err) {
        removeTyping();
        console.error('[AI Chat Error]', err);
        var msg = err.message === '402'
          ? 'The AI assistant needs credits. Please add funds to your OpenRouter account at openrouter.ai/keys, then refresh.'
          : 'Sorry, something went wrong. Please try again in a moment.';
        addMessage('bot', msg);
      })
      .finally(function () {
        isWaiting = false;
        sendBtn.disabled = false;
        promptInput.disabled = false;
        promptInput.focus();
      });
  }

  function handleSend() {
    var q = promptInput.value.trim();
    if (!q) return;
    askAI(q);
  }

  sendBtn.addEventListener('click', handleSend);
  promptInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  });

  // ═══ Wire to toggle button ═══
  var toggleBtn = $('sp-toggle');
  toggleBtn.addEventListener('click', openPanel);
  $('sp-overlay').addEventListener('click', closePanel);
  $('sp-close').addEventListener('click', closePanel);

  // Tab clicks
  document.querySelectorAll('.sp-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(tab.dataset.tab);
    });
  });

  // Keyboard shortcut: Escape to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('sp-drawer').classList.contains('open')) {
      closePanel();
    }
  });

})();
