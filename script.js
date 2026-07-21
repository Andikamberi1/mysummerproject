/* ═══════════════════════════════════════════
   GAMEVERSE — script.js
   3D Multiplayer RPG via Three.js + Supabase
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://wqghmsbjfxlxgstktggj.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ2htc2JqZnhseGdzdGt0Z2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjkzMDQsImV4cCI6MjA5OTc0NTMwNH0.D8_FEUzZ4QqCbea1NCyWdhct0KuT8-_B2OGUt901S0E';

  var supabase = null, currentUser = null;

  /* ═══ DOM ═══ */
  var authGate=document.getElementById('auth-gate'), mainContent=document.getElementById('main-content');
  var loginCard=document.getElementById('login-card'), regCard=document.getElementById('register-card');
  var loginError=document.getElementById('login-error'), regError=document.getElementById('register-error');

  function showCardError(card,msg,s){var e=card==='login'?loginError:regError;e.textContent=msg;e.className='auth-error show'+(s?' auth-success':'');}
  function hideCardErrors(){loginError.classList.remove('show');regError.classList.remove('show');}

  /* ═══ AUTH ═══ */
  function login(email,password){if(!supabase)return showCardError('login','Auth not loaded.');var b=document.querySelector('#login-form .auth-btn');b.textContent='Signing in...';b.disabled=true;supabase.auth.signInWithPassword({email:email,password:password}).then(function(r){if(r.error){var m=r.error.message||'';if(r.error.status===429||m.indexOf('429')!==-1)m='Too many attempts. Wait 60s.';showCardError('login',m);}}).catch(function(){showCardError('login','Connection error.');}).finally(function(){b.textContent='Login';b.disabled=false;});}
  var regCooldown=0;
  function register(name,email,password){if(!supabase)return showCardError('register','Auth not loaded.');if(regCooldown>0)return;var b=document.querySelector('#register-form .auth-btn');b.textContent='Creating...';b.disabled=true;supabase.auth.signUp({email:email,password:password,options:{data:{full_name:name}}}).then(function(r){if(r.error){var m=r.error.message||'';if(r.error.status===429||m.indexOf('429')!==-1){showCardError('register','Rate limited. Wait 5 min.');startRegCooldown(b,300);return;}showCardError('register',m);}else if(r.data.user&&r.data.user.identities&&r.data.user.identities.length===0){showCardError('register','Email already exists. Try logging in.');}else{showCardError('register','Account created! Switch to Sign In.',true);setTimeout(function(){document.getElementById('show-login-link').click();},1500);}}).catch(function(){showCardError('register','Connection error.');}).finally(function(){b.textContent='Create Account';b.disabled=false;});}
  function startRegCooldown(b,s){regCooldown=s;var i=setInterval(function(){regCooldown--;b.textContent='Wait '+regCooldown+'s';if(regCooldown<=0){clearInterval(i);b.textContent='Create Account';b.disabled=false;}},1000);}
  function logout(){if(!supabase)return;supabase.auth.signOut().then(function(){currentUser=null;hideMainContent();showAuthGate();document.getElementById('login-form').reset();document.getElementById('register-form').reset();loginCard.style.display='';regCard.style.display='none';hideCardErrors();});}

  /* ═══ GATE ═══ */
  function hideAuthGate(){authGate.classList.add('hidden');}function showAuthGate(){authGate.classList.remove('hidden');}
  function showMainContent(){mainContent.classList.add('visible');}function hideMainContent(){mainContent.classList.remove('visible');}
  function updateUserUI(u){var e=document.getElementById('nav-user-email');if(e&&u)e.textContent=u.email;}

  /* ═══ FORM HANDLERS ═══ */
  document.getElementById('login-form').addEventListener('submit',function(e){e.preventDefault();hideCardErrors();var em=document.getElementById('login-email').value.trim(),pw=document.getElementById('login-password').value.trim();if(!em||!pw){showCardError('login','Fill all fields.');return;}login(em,pw);});
  document.getElementById('register-form').addEventListener('submit',function(e){e.preventDefault();hideCardErrors();var n=document.getElementById('reg-fullname').value.trim(),em=document.getElementById('reg-email').value.trim(),pw=document.getElementById('reg-password').value.trim();if(!em||!pw){showCardError('register','Fill email and password.');return;}register(n,em,pw);});
  document.getElementById('show-register-link').addEventListener('click',function(e){e.preventDefault();loginCard.style.display='none';regCard.style.display='';hideCardErrors();});
  document.getElementById('show-login-link').addEventListener('click',function(e){e.preventDefault();regCard.style.display='none';loginCard.style.display='';hideCardErrors();});

  /* ═══ SUPABASE CDN ═══ */
  function loadSupabase(cb){if(SUPABASE_URL.indexOf('YOUR_PROJECT_ID')!==-1){console.warn('Supabase not configured.');cb();return;}var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=function(){supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);cb();};s.onerror=function(){console.warn('CDN failed.');cb();};document.head.appendChild(s);}
  function initAuth(){if(supabase){supabase.auth.onAuthStateChange(function(ev,session){if(session&&session.user){currentUser=session.user;hideAuthGate();showMainContent();updateUserUI(session.user);}else if(ev==='SIGNED_OUT'){currentUser=null;hideMainContent();showAuthGate();document.getElementById('login-form').reset();document.getElementById('register-form').reset();loginCard.style.display='';regCard.style.display='none';hideCardErrors();}});supabase.auth.getSession().then(function(r){if(r.data.session&&r.data.session.user){currentUser=r.data.session.user;hideAuthGate();showMainContent();updateUserUI(r.data.session.user);}});}else{console.warn('Dev mode.');hideAuthGate();showMainContent();}}
  document.getElementById('btn-logout').addEventListener('click',logout);

  /* ═══ PARTICLES ═══ */
  function initParticles(){var c=document.getElementById('particles-canvas'),ctx=c.getContext('2d'),ps=[],mx=-1000,my=-1000;function rs(){c.width=window.innerWidth;c.height=window.innerHeight;}rs();window.addEventListener('resize',rs);for(var i=0;i<80;i++)ps.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-0.5)*0.6,vy:(Math.random()-0.5)*0.6,size:Math.random()*2+0.5,color:['#00f0ff','#ff00ff','#b000ff','#ffffff'][Math.floor(Math.random()*4)]});document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});function anim(){ctx.clearRect(0,0,c.width,c.height);for(var i=0;i<ps.length;i++){var p=ps[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;var dx=mx-p.x,dy=my-p.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<150&&dist>0){p.vx+=(dx/dist)*0.015;p.vy+=(dy/dist)*0.015;p.vx=Math.max(-1.5,Math.min(1.5,p.vx));p.vy=Math.max(-1.5,Math.min(1.5,p.vy));}p.vx*=0.999;p.vy*=0.999;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=0.6;ctx.fill();for(var j=i+1;j<ps.length;j++){var p2=ps[j],dx2=p.x-p2.x,dy2=p.y-p2.y,dist2=Math.sqrt(dx2*dx2+dy2*dy2);if(dist2<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p2.x,p2.y);ctx.strokeStyle=p.color;ctx.globalAlpha=0.08*(1-dist2/100);ctx.lineWidth=0.5;ctx.stroke();}}}ctx.globalAlpha=1;requestAnimationFrame(anim);}anim();}

  /* ═══ MOBILE NAV ═══ */
  function initMobileNav(){var h=document.getElementById('hamburger'),n=document.getElementById('navLinks');h.addEventListener('click',function(){n.classList.toggle('open');});var ls=n.querySelectorAll('a');for(var k=0;k<ls.length;k++)ls[k].addEventListener('click',function(){n.classList.remove('open');});}

  /* ═══ SCROLL REVEAL ═══ */
  function initScrollReveal(){var rs=document.querySelectorAll('.reveal');function chk(){var wh=window.innerHeight;for(var r=0;r<rs.length;r++){var el=rs[r];if(el.getBoundingClientRect().top<wh-80)el.classList.add('visible');}}window.addEventListener('scroll',chk);chk();}

  /* ═══ NEWSLETTER ═══ */
  function initNewsletter(){var f=document.getElementById('newsletterForm');f.addEventListener('submit',function(e){e.preventDefault();var inp=f.querySelector('input');if(inp.value.trim()){inp.value='';inp.placeholder='✓ You\'re in!';setTimeout(function(){inp.placeholder='Enter your email';},3000);}});}

  /* ═══ SMOOTH SCROLL ═══ */
  function initSmoothScroll(){document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var t=document.querySelector(this.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'});});});}

  /* ═══════════════════════════════════════════
     3D MULTIPLAYER RPG — Three.js + Supabase
     ═══════════════════════════════════════════ */
  var rpgChannel=null, remotePlayers={}, playerName='Player', playerColor='#00f0ff';
  var blockType=1, buildMode=false;
  var rpgChatMsgs, rpgChatInput, playerList;

  function initRPG(){
    var container=document.getElementById('rpg-canvas');
    if(!container)return;
    var scoreEl=document.getElementById('rpg-score'), healthEl=document.getElementById('rpg-health');
    var levelEl=document.getElementById('rpg-level'), modeEl=document.getElementById('rpg-mode');
    rpgChatMsgs=document.getElementById('rpg-chat-msgs');
    rpgChatInput=document.getElementById('rpg-chat-input');
    playerList=document.getElementById('rpg-player-list');
    var chatSend=document.getElementById('rpg-chat-send');

    var W=container.clientWidth||800, H=500;
    var TILE=1, COLS=25, ROWS=18;
    var FLOOR=0,WALL=1;
    var BLOCK_COLORS={1:0x5a5a8c,2:0x2d8c2d,3:0x2266cc,4:0x8b6914,5:0x777777};

    // Three.js setup
    var scene=new THREE.Scene();
    scene.background=new THREE.Color(0x0a0a18);
    scene.fog=new THREE.Fog(0x0a0a18,20,60);

    var camera=new THREE.PerspectiveCamera(55,W/H,0.5,100);
    camera.position.set(COLS/2,20,ROWS/2+8);
    camera.lookAt(COLS/2,0,ROWS/2);

    var renderer=new THREE.WebGLRenderer({canvas:container,antialias:true});
    renderer.setSize(W,H);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;

    // Lighting
    var ambient=new THREE.AmbientLight(0x334466,0.6);scene.add(ambient);
    var sun=new THREE.DirectionalLight(0xffeedd,1.2);sun.position.set(15,25,10);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.near=0.5;sun.shadow.camera.far=80;
    sun.shadow.camera.left=-20;sun.shadow.camera.right=20;
    sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
    scene.add(sun);

    // Ground
    var groundGeo=new THREE.PlaneGeometry(COLS+10,ROWS+10);
    var groundMat=new THREE.MeshStandardMaterial({color:0x1a1a30,roughness:0.9});
    var ground=new THREE.Mesh(groundGeo,groundMat);
    ground.rotation.x=-Math.PI/2;ground.position.set(COLS/2,-0.55,ROWS/2);
    ground.receiveShadow=true;scene.add(ground);

    // Grid lines
    var gridHelper=new THREE.GridHelper(Math.max(COLS,ROWS)+4,Math.max(COLS,ROWS)+4,0x222244,0x111122);
    gridHelper.position.set(COLS/2,-0.5,ROWS/2);scene.add(gridHelper);

    // Map
    var map=[], blockMeshes=[];
    function initMap(){
      for(var r=0;r<ROWS;r++){map[r]=[];for(var c=0;c<COLS;c++)map[r][c]=FLOOR;}
      // Pre-built structures
      var b=WALL;
      [[3,3,b],[4,3,b],[5,3,b],[3,4,b],[5,4,b],[3,5,b],[4,5,b],[5,5,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[12,2,b],[13,2,b],[14,2,b],[12,3,b],[14,3,b],[12,4,b],[14,4,b],[12,5,b],[13,5,b],[14,5,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[8,8,b],[9,8,b],[8,9,b],[9,9,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
      [[17,10,b],[18,10,b],[19,10,b],[17,11,b],[19,11,b],[17,12,b],[18,12,b],[19,12,b]].forEach(function(p){map[p[1]][p[0]]=p[2];});
    }
    function rebuildAllBlocks(){
      for(var i=blockMeshes.length-1;i>=0;i--){scene.remove(blockMeshes[i]);}
      blockMeshes=[];
      for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)if(map[r][c]!==FLOOR)placeBlockMesh(c,r,map[r][c]);
    }
    function placeBlockMesh(cx,cy,tile){
      var color=BLOCK_COLORS[tile]||0x5a5a8c;
      var geo=new THREE.BoxGeometry(0.9,1,0.9);
      var mat=new THREE.MeshStandardMaterial({color:color,roughness:0.4,metalness:0.1});
      var mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(cx+0.5,0.5,cy+0.5);
      mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.userData={cx:cx,cy:cy};
      scene.add(mesh);blockMeshes.push(mesh);
    }
    initMap();rebuildAllBlocks();

    // Player
    var playerGeo=new THREE.CylinderGeometry(0.3,0.35,1.2,8);
    var playerMat=new THREE.MeshStandardMaterial({color:0x00f0ff,roughness:0.3,emissive:0x002244,emissiveIntensity:0.5});
    var playerMesh=new THREE.Mesh(playerGeo,playerMat);
    playerMesh.position.set(2.5,0.6,2.5);playerMesh.castShadow=true;
    // Head
    var headGeo=new THREE.SphereGeometry(0.3,8,8);
    var headMesh=new THREE.Mesh(headGeo,playerMat);
    headMesh.position.y=0.9;
    playerMesh.add(headMesh);
    // Name label (billboard sprite)
    var nameCanvas=document.createElement('canvas');nameCanvas.width=256;nameCanvas.height=64;
    var nameCtx=nameCanvas.getContext('2d');
    var nameTexture=new THREE.CanvasTexture(nameCanvas);
    var nameSpriteMat=new THREE.SpriteMaterial({map:nameTexture,transparent:true,depthTest:false});
    var nameSprite=new THREE.Sprite(nameSpriteMat);
    nameSprite.position.y=2;nameSprite.scale.set(3,0.75,1);
    playerMesh.add(nameSprite);
    function updateNameSprite(name,color){
      nameCtx.clearRect(0,0,256,64);nameCtx.fillStyle=color;nameCtx.font='bold 32px Arial';nameCtx.textAlign='center';
      nameCtx.fillText(name+' (you)',128,40);nameTexture.needsUpdate=true;
    }
    scene.add(playerMesh);

    var player={x:2,y:2,dir:0,speed:0.08};

    // Remote players
    var remoteMeshes={};
    function createRemoteMesh(id,name,color){
      var g=new THREE.CylinderGeometry(0.3,0.35,1.2,8);
      var m=new THREE.MeshStandardMaterial({color:new THREE.Color(color),roughness:0.3});
      var mesh=new THREE.Mesh(g,m);mesh.position.set(0,0.6,0);mesh.castShadow=true;
      var hg=new THREE.SphereGeometry(0.3,8,8);var hm=new THREE.Mesh(hg,m);hm.position.y=0.9;mesh.add(hm);
      // Name sprite
      var nc=document.createElement('canvas');nc.width=256;nc.height=64;
      var nctx=nc.getContext('2d');nctx.fillStyle=color;nctx.font='bold 28px Arial';nctx.textAlign='center';
      nctx.fillText(name,128,40);
      var nt=new THREE.CanvasTexture(nc);var ns=new THREE.Sprite(new THREE.SpriteMaterial({map:nt,transparent:true,depthTest:false}));
      ns.position.y=2;ns.scale.set(2.5,0.6,1);mesh.add(ns);
      scene.add(mesh);remoteMeshes[id]=mesh;
    }

    // Coins
    var coins=[],coinMeshes=[];
    var coinGeo=new THREE.CylinderGeometry(0.25,0.25,0.1,16);
    var coinMat=new THREE.MeshStandardMaterial({color:0xffd700,roughness:0.2,metalness:0.8,emissive:0x332200,emissiveIntensity:0.4});
    function spawnCoins(count){
      for(var i=coinMeshes.length-1;i>=0;i--){scene.remove(coinMeshes[i]);}
      coins=[];coinMeshes=[];
      for(var i=0;i<count;i++){
        var cx,cy;do{cx=Math.floor(Math.random()*COLS);cy=Math.floor(Math.random()*ROWS);}while(map[cy][cx]!==FLOOR||(cx===player.x&&cy===player.y));
        var m=new THREE.Mesh(coinGeo,coinMat);m.position.set(cx+0.5,0.5,cy+0.5);m.rotation.x=Math.PI/2;
        m.castShadow=true;scene.add(m);coinMeshes.push(m);
        coins.push({x:cx,y:cy,mesh:m,collected:false,value:Math.random()<0.2?10:1});
      }
    }

    // Enemies
    var enemies=[],enemyMeshes=[];
    var enemyGeo=new THREE.SphereGeometry(0.4,8,8);
    var enemyMat=new THREE.MeshStandardMaterial({color:0xff4444,roughness:0.3,emissive:0x330000,emissiveIntensity:0.3});
    function spawnEnemies(count){
      for(var i=enemyMeshes.length-1;i>=0;i--){scene.remove(enemyMeshes[i]);}
      enemies=[];enemyMeshes=[];
      for(var i=0;i<count;i++){
        var ex,ey;do{ex=Math.floor(Math.random()*COLS);ey=Math.floor(Math.random()*ROWS);}while(map[ey][ex]!==FLOOR||(Math.abs(ex-player.x)<4&&Math.abs(ey-player.y)<4));
        var m=new THREE.Mesh(enemyGeo,enemyMat);m.position.set(ex+0.5,0.6,ey+0.5);m.castShadow=true;scene.add(m);enemyMeshes.push(m);
        enemies.push({x:ex,y:ey,mesh:m,dir:Math.floor(Math.random()*4),moveTimer:Math.random()*60,moveInterval:35+Math.random()*45,type:Math.random()<0.3?'boss':'grunt',alive:true});
      }
    }

    var score=0,health=100,level=1,gameOver=false,invincibleTimer=0,animFrame=0;

    // Input
    var GAME_KEYS=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D','r','R'];
    var keys={};
    document.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&document.activeElement!==rpgChatInput){rpgChatInput.focus();e.preventDefault();return;}
      if(GAME_KEYS.indexOf(e.key)===-1)return;e.preventDefault();keys[e.key]=true;
      if(gameOver&&(e.key==='r'||e.key==='R'))resetGame();
    });
    document.addEventListener('keyup',function(e){if(GAME_KEYS.indexOf(e.key)===-1)return;e.preventDefault();keys[e.key]=false;});
    document.addEventListener('keydown',function(e){var n=parseInt(e.key);if(n>=1&&n<=5&&document.activeElement!==rpgChatInput){blockType=n;buildMode=true;modeEl.textContent='Build '+n;}});

    // Building
    var raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    container.addEventListener('click',function(e){
      var rect=container.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      var intersects=raycaster.intersectObject(ground);
      if(intersects.length>0){
        var p=intersects[0].point,cx=Math.floor(p.x),cy=Math.floor(p.z);
        if(cx>=0&&cx<COLS&&cy>=0&&cy<ROWS&&!(cx===player.x&&cy===player.y)){
          if(buildMode&&map[cy][cx]===FLOOR){map[cy][cx]=blockType;placeBlockMesh(cx,cy,blockType);broadcastMap(cx,cy,blockType);}
          else if(map[cy][cx]!==FLOOR){map[cy][cx]=FLOOR;rebuildAllBlocks();broadcastMap(cx,cy,FLOOR);}
        }
      }
    });
    container.addEventListener('contextmenu',function(e){e.preventDefault();});

    // Chat
    function addChat(name,text){
      var d=document.createElement('div');d.className='chat-msg';
      d.innerHTML='<span class="chat-name">'+esc(name)+':</span> <span class="chat-text">'+esc(text)+'</span>';
      rpgChatMsgs.appendChild(d);rpgChatMsgs.scrollTop=rpgChatMsgs.scrollHeight;
      if(rpgChatMsgs.children.length>80)rpgChatMsgs.removeChild(rpgChatMsgs.firstChild);
    }
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function sendChat(){
      var t=rpgChatInput.value.trim();if(!t)return;
      if(rpgChannel)rpgChannel.send({type:'broadcast',event:'chat',payload:{name:playerName,text:t}});
      addChat(playerName,t);rpgChatInput.value='';
    }
    chatSend.addEventListener('click',sendChat);
    rpgChatInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sendChat();}if(e.key==='Escape')rpgChatInput.blur();});

    // Supabase channel
    if(supabase&&currentUser){playerName=currentUser.email?currentUser.email.split('@')[0]:'Player';playerColor='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');}
    updateNameSprite(playerName,playerColor);

    function connectChannel(){
      if(!supabase)return;
      rpgChannel=supabase.channel('gameverse-3d',{config:{presence:{key:currentUser?currentUser.id:'anon-'+Date.now()}}});
      rpgChannel
        .on('broadcast',{event:'player-move'},function(p){  // FIXED: payload is direct, not nested
          if(p.id===(currentUser?currentUser.id:''))return;
          if(!remotePlayers[p.id]){remotePlayers[p.id]={name:p.name,color:p.color,x:p.x,y:p.y};createRemoteMesh(p.id,p.name,p.color);updatePlayerList();}
          var r=remotePlayers[p.id];if(r){r.x=p.x;r.y=p.y;r.lastSeen=Date.now();}
        })
        .on('broadcast',{event:'chat'},function(p){addChat(p.name,p.text);})  // FIXED: p.name, not p.payload.name
        .on('broadcast',{event:'map-change'},function(p){if(p.x>=0&&p.x<COLS&&p.y>=0&&p.y<ROWS){map[p.y][p.x]=p.tile;rebuildAllBlocks();}})
        .subscribe(function(status){if(status==='SUBSCRIBED'){addChat('System','Connected! Players online: see sidebar.');broadcastPos();}});
    }
    connectChannel();

    function broadcastPos(){
      if(!rpgChannel)return;
      rpgChannel.send({type:'broadcast',event:'player-move',payload:{id:currentUser?currentUser.id:'',name:playerName,color:playerColor,x:player.x,y:player.y}});
    }
    function broadcastMap(x,y,tile){if(!rpgChannel)return;rpgChannel.send({type:'broadcast',event:'map-change',payload:{x:x,y:y,tile:tile}});}

    function updatePlayerList(){
      var h='<li class="me">🟢 '+esc(playerName)+' (you)</li>';
      var ids=Object.keys(remotePlayers);for(var i=0;i<ids.length;i++)h+='<li>🔵 '+esc(remotePlayers[ids[i]].name)+'</li>';
      playerList.innerHTML=h||'<li>Just you</li>';
    }
    updatePlayerList();

    setInterval(function(){var n=Date.now(),ids=Object.keys(remotePlayers),ch=false;for(var i=0;i<ids.length;i++){if(n-remotePlayers[ids[i]].lastSeen>15000){delete remotePlayers[ids[i]];if(remoteMeshes[ids[i]]){scene.remove(remoteMeshes[ids[i]]);delete remoteMeshes[ids[i]];}ch=true;}}if(ch)updatePlayerList();},3000);

    /* ═══ GAME LOGIC ═══ */
    function resetGame(){
      score=0;health=100;level=1;gameOver=false;invincibleTimer=0;player.x=2;player.y=2;
      initMap();rebuildAllBlocks();spawnCoins(12);spawnEnemies(4);
    }
    function tryMove(dx,dy){
      if(gameOver)return;var nx=player.x+dx,ny=player.y+dy;
      if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&map[ny][nx]===FLOOR){player.x=nx;player.y=ny;if(dx===0&&dy===1)player.dir=0;else if(dx===-1&&dy===0)player.dir=1;else if(dx===1&&dy===0)player.dir=2;else if(dx===0&&dy===-1)player.dir=3;}
    }
    function updatePlayer(){
      if(!player.moving){if(keys['ArrowUp']||keys['w']||keys['W'])tryMove(0,-1);else if(keys['ArrowDown']||keys['s']||keys['S'])tryMove(0,1);else if(keys['ArrowLeft']||keys['a']||keys['A'])tryMove(-1,0);else if(keys['ArrowRight']||keys['d']||keys['D'])tryMove(1,0);else buildMode=false;}
      var tx=player.x+0.5,tz=player.y+0.5;playerMesh.position.x+=(tx-playerMesh.position.x)*0.2;playerMesh.position.z+=(tz-playerMesh.position.z)*0.2;
      var rot=0;if(player.dir===0)rot=0;else if(player.dir===1)rot=Math.PI/2;else if(player.dir===2)rot=-Math.PI/2;else rot=Math.PI;playerMesh.rotation.y+=(rot-playerMesh.rotation.y)*0.2;
      for(var i=0;i<coins.length;i++){var c=coins[i];if(!c.collected&&c.x===player.x&&c.y===player.y){c.collected=true;scene.remove(c.mesh);score+=c.value;if(c.value===10)health=Math.min(100,health+15);}}
      if(invincibleTimer<=0){for(var j=0;j<enemies.length;j++){var en=enemies[j];if(en.alive&&en.x===player.x&&en.y===player.y){health-=en.type==='boss'?25:10;invincibleTimer=40;if(health<=0){health=0;gameOver=true;}}}}
      if(invincibleTimer>0){invincibleTimer--;playerMesh.visible=Math.floor(invincibleTimer/3)%2===0;}
    }
    function updateEnemies(){
      for(var i=0;i<enemies.length;i++){var en=enemies[i];if(!en.alive)continue;en.moveTimer++;en.mesh.position.x+=(en.x+0.5-en.mesh.position.x)*0.1;en.mesh.position.z+=(en.y+0.5-en.mesh.position.z)*0.1;en.mesh.position.y=0.6+Math.sin(animFrame*0.1)*0.1;
        if(en.moveTimer>=en.moveInterval){en.moveTimer=0;en.moveInterval=35+Math.random()*45;var dirs=[[0,1],[0,-1],[1,0],[-1,0]];if(Math.random()<0.4){var pdx=player.x-en.x,pdy=player.y-en.y;dirs=Math.abs(pdx)>Math.abs(pdy)?[[Math.sign(pdx),0],[0,Math.sign(pdy)],[0,-Math.sign(pdy)],[-Math.sign(pdx),0]]:[[0,Math.sign(pdy)],[Math.sign(pdx),0],[-Math.sign(pdx),0],[0,-Math.sign(pdy)]];}for(var d=0;d<dirs.length;d++){var nx=en.x+dirs[d][0],ny=en.y+dirs[d][1];if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&map[ny][nx]===FLOOR){en.x=nx;en.y=ny;break;}}}}
    }
    function checkLevelComplete(){
      var all=true;for(var i=0;i<coins.length;i++)if(!coins[i].collected){all=false;break;}
      if(all&&!gameOver){level++;health=Math.min(100,health+30);spawnCoins(8+level*2);spawnEnemies(2+level);player.x=2;player.y=2;}
    }

    // Remote player animation
    function updateRemotePlayers(){
      var ids=Object.keys(remotePlayers);
      for(var i=0;i<ids.length;i++){var rp=remotePlayers[ids[i]],m=remoteMeshes[ids[i]];if(!m)continue;m.position.x+=(rp.x+0.5-m.position.x)*0.15;m.position.z+=(rp.y+0.5-m.position.z)*0.15;}
    }

    // Camera follow
    function updateCamera(){camera.position.x+=(playerMesh.position.x-camera.position.x)*0.05;camera.position.z+=(playerMesh.position.z+8-camera.position.z)*0.05;camera.lookAt(playerMesh.position.x,0,playerMesh.position.z);}

    var lastBroadcast=0;
    function gameLoop(){
      animFrame++;
      if(!gameOver){updatePlayer();updateEnemies();checkLevelComplete();}
      if(Date.now()-lastBroadcast>100){broadcastPos();lastBroadcast=Date.now();}
      updateRemotePlayers();updateCamera();
      // Rotate coins
      for(var i=0;i<coinMeshes.length;i++)coinMeshes[i].rotation.z+=0.03;
      // HUD
      scoreEl.textContent=score;healthEl.textContent=health;levelEl.textContent=level;
      if(!buildMode)modeEl.textContent=gameOver?'Dead':'Explore';
      renderer.render(scene,camera);
      requestAnimationFrame(gameLoop);
    }

    spawnCoins(12);spawnEnemies(4);gameLoop();
  }

  /* ═══ INIT ═══ */
  function initAll(){initParticles();initMobileNav();initScrollReveal();initNewsletter();initSmoothScroll();}
  var rpgStarted=false;
  function tryStartRPG(){if(rpgStarted)return;var el=document.getElementById('rpg-canvas');if(!el)return;var rect=el.getBoundingClientRect();if(rect.top<window.innerHeight+200){rpgStarted=true;initRPG();}}
  window.addEventListener('scroll',tryStartRPG,{passive:true});
  var origShowMainContent=showMainContent;showMainContent=function(){origShowMainContent();setTimeout(tryStartRPG,200);};
  loadSupabase(function(){initAuth();initAll();});
})();
