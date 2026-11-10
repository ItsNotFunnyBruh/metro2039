(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var root = document.documentElement;
  var q = function (s, el) { return (el || document).querySelector(s); };
  var qa = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DESKTOP = "(min-width: 861px)";

  var lenis = null;
  if (!REDUCED) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { duration: 1.8 });
    else el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
  }

  var menuBtn = q(".menu-btn"), menu = q("#line-menu");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && !REDUCED) {
      gsap.fromTo(".line-menu__list li", { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.03, ease: "power3.out" });
    }
  }
  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
  qa('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"), el = id.length > 1 && q(id);
      if (!el) return;
      e.preventDefault();
      if (!menu.hidden) setMenu(false);
      scrollToEl(el);
    });
  });
  var menuItems = qa(".line-menu__list li");
  function setCurrentNav(id) {
    menuItems.forEach(function (li) { li.classList.toggle("is-current", q("a", li).getAttribute("href") === "#" + id); });
  }

  var soundBtn = q(".sound-btn");
  soundBtn.addEventListener("click", function () {
    var on = Sound.toggle();
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Выключить звук" : "Включить звук");
  });

  var THEMES = {
    ash: { bg: "#0d0c0a", accent: "#e8742c" },
    surface: { bg: "#17110b", accent: "#ee7f33" },
    tunnel: { bg: "#0c0e0b", accent: "#b6bf7c" },
    story: { bg: "#060606", accent: "#e8742c" },
    reich: { bg: "#170405", accent: "#e0262d" },
    beast: { bg: "#0b0d0c", accent: "#c4cd6c" },
    horror: { bg: "#040507", accent: "#8fb0cc" },
    olive: { bg: "#0e100b", accent: "#f2b544" },
    ember: { bg: "#130d08", accent: "#e8742c" },
    dev: { bg: "#0c0c0e", accent: "#e0b84e" },
    final: { bg: "#11100d", accent: "#ff4a32" }
  };
  var currentTheme = null;
  function applyTheme(name, rad) {
    if (rad) watch.setRad(rad);
    if (name === currentTheme || !THEMES[name]) return;
    currentTheme = name;
    gsap.to(root, { "--bg": THEMES[name].bg, "--accent": THEMES[name].accent, duration: 1.2, ease: "power2.out", overwrite: "auto" });
  }

  var hud = q(".hud");
  var watch = Watch.mount(hud);
  var FILTER_SEC = 300, lastProgress = 0, hudDead = false, needle = 0;
  function updateHud(p) {
    lastProgress = p;
    if (hudDead) return;
    var left = Math.round(FILTER_SEC * (1 - p));
    watch.setTime(String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"));
    watch.setLeds(Math.ceil(5 * (1 - p) - 0.001));
  }
  function setHudDead(dead) {
    if (dead === hudDead) return;
    hudDead = dead;
    if (dead) {
      var seq = ["88:88", "--:--", "8-:-8", "--:--"], i = 0;
      (function step() {
        if (!hudDead) return;
        watch.setDead(false, seq[i]);
        if (++i < seq.length) setTimeout(step, 90); else watch.setDead(true);
      })();
    } else {
      watch.setDead(false);
      updateHud(lastProgress);
    }
  }
  updateHud(0);

  var hero = q(".hero"), heroMedia = q(".hero__media"), heroImg = q(".hero__media img");

  (function revealHero() {
    var shown = false;
    function show() {
      if (shown) return;
      shown = true;
      if (REDUCED) { gsap.set(heroMedia, { opacity: 1 }); return; }
      gsap.to(heroMedia, { opacity: 1, duration: 1.4, ease: "power2.out" });
      gsap.fromTo(heroImg, { scale: 1.16 }, { scale: 1, duration: 3.2, ease: "power3.out" });
    }
    var ready = heroImg.decode ? heroImg.decode() : Promise.resolve();
    ready.then(show, show);
    setTimeout(show, 2500);
  })();
  var logo = q(".hero__logo"), shardsBox = q(".shards");

  var shardData = (function () {
    var cols = 8, rows = 3, pts = [], r, c;
    for (r = 0; r <= rows; r++) {
      pts[r] = [];
      for (c = 0; c <= cols; c++) {
        var x = (c / cols) * 100, y = (r / rows) * 100;
        if (c > 0 && c < cols) x += gsap.utils.random(-4.5, 4.5);
        if (r > 0 && r < rows) y += gsap.utils.random(-11, 11);
        pts[r][c] = [x, y];
      }
    }
    var tris = [];
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var A = pts[r][c], B = pts[r][c + 1], D = pts[r + 1][c], E = pts[r + 1][c + 1];
      var pair = (r + c) % 2 ? [[A, B, E], [A, E, D]] : [[A, B, D], [B, E, D]];
      pair.forEach(function (t) { tris.push(t); });
    }
    return tris.map(function (t) {
      var el = document.createElement("span");
      el.className = "shard";
      el.style.clipPath = "polygon(" + t.map(function (p) { return p[0].toFixed(2) + "% " + p[1].toFixed(2) + "%"; }).join(",") + ")";
      shardsBox.appendChild(el);
      return { el: el, cx: (t[0][0] + t[1][0] + t[2][0]) / 3, cy: (t[0][1] + t[1][1] + t[2][1]) / 3 };
    });
  })();

  function heroIntro() {
    document.body.classList.remove("is-loading");
    if (REDUCED) { hud.classList.add("is-visible"); return; }
    logo.classList.remove("is-whole");

    var w = logo.offsetWidth, h = logo.offsetHeight;
    gsap.set(heroMedia, { scale: 1.06 });

    shardData.forEach(function (s) {
      var dx = (s.cx - 50) / 50, dy = (s.cy - 50) / 50, dist = Math.hypot(dx, dy) + 0.25;
      s.from = {
        x: dx * w * gsap.utils.random(0.5, 0.9), y: dy * h * gsap.utils.random(1.4, 2.6) + gsap.utils.random(-40, 40),
        z: gsap.utils.random(-900, -250), rotationX: gsap.utils.random(-140, 140), rotationY: gsap.utils.random(-140, 140),
        rotation: gsap.utils.random(-60, 60), dist: dist
      };
      gsap.set(s.el, { x: s.from.x, y: s.from.y, z: s.from.z, rotationX: s.from.rotationX, rotationY: s.from.rotationY, rotation: s.from.rotation, opacity: 0 });
    });

    var tl = gsap.timeline({ delay: 0.2 });
    shardData.forEach(function (s) {
      var f = s.from;
      tl.to(s.el, { opacity: 1, duration: 0.5, ease: "none" }, 0.3 + Math.random() * 0.4)
        .to(s.el, { x: f.x * 0.55, y: f.y * 0.55, z: f.z * 0.5, rotationX: f.rotationX * 0.5, rotationY: f.rotationY * 0.5, rotation: f.rotation * 0.5, duration: 1.1, ease: "sine.inOut" }, 0.3)
        .to(s.el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotation: 0, duration: 0.42, ease: "power4.in" }, 1.25 + f.dist * 0.12);
    });
    var snap = 1.25 + 0.12 * 1.6 + 0.42;
    tl.add(function () { logo.classList.add("is-whole"); }, snap + 0.05)
      .fromTo(".hero__content", { y: 0 }, { y: 7, duration: 0.05, yoyo: true, repeat: 3, ease: "none" }, snap)
      .from(".hero__tagline", { opacity: 0, y: 16, duration: 0.9, ease: "power3.out" }, snap + 0.25)
      .from([".hero__date", ".hero__cta .btn"], { y: 20, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, snap + 0.4)
      .add(function () { hud.classList.add("is-visible"); }, snap + 0.6);

    if (FINE_POINTER) {
      var mx = gsap.quickTo(heroMedia, "x", { duration: 1.2, ease: "power3.out" });
      var my = gsap.quickTo(heroMedia, "y", { duration: 1.2, ease: "power3.out" });
      hero.addEventListener("pointermove", function (e) {
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        mx(nx * -30); my(ny * -20);
        embers.wind = nx;
      });
    }
    gsap.to(heroMedia, { scale: 1.2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { yPercent: -22, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "70% top", scrub: true } });
  }

  var embers = (function () {
    var canvas = q(".hero__embers"), ctx = canvas.getContext("2d");
    var w = 0, h = 0, P = [], running = false, api = { wind: 0 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = w < 700 ? 55 : 120;
      while (P.length < n) P.push(spawn({}, true));
      P.length = n;
    }
    function spawn(p, initial) {
      p.ember = Math.random() < 0.72;
      if (p.ember) {
        p.x = Math.random() * w * 0.6; p.y = initial ? Math.random() * h : h + 10;
        p.vx = 0.15 + Math.random() * 0.9; p.vy = -(0.5 + Math.random() * 1.6);
        p.r = 0.6 + Math.random() * 1.9; p.hue = 18 + Math.random() * 22;
      } else {
        p.x = Math.random() * w; p.y = initial ? Math.random() * h : -10;
        p.vx = -0.3 + Math.random() * 0.5; p.vy = 0.25 + Math.random() * 0.5; p.r = 0.8 + Math.random() * 1.5;
      }
      p.life = 0; p.max = 260 + Math.random() * 420; p.ph = Math.random() * 6.28;
      return p;
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.life++; p.ph += 0.035;
        p.x += p.vx + Math.sin(p.ph) * 0.35 + api.wind * 0.8; p.y += p.vy;
        var fade = Math.min(1, p.life / 40, (p.max - p.life) / 60);
        if (fade <= 0 || p.y < -20 || p.y > h + 20 || p.x > w + 20 || p.x < -20) { spawn(p, false); continue; }
        if (p.ember) {
          var a = fade * (0.55 + 0.45 * Math.sin(p.ph * 3.1));
          ctx.fillStyle = "hsla(" + p.hue + ",100%,60%," + (a * 0.18) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.283); ctx.fill();
          ctx.fillStyle = "hsla(" + (p.hue + 15) + ",100%,72%," + a + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = "rgba(190,182,172," + (fade * 0.22) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    if (!REDUCED) {
      resize();
      window.addEventListener("resize", resize);
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); } else if (!vis) running = false;
      }).observe(hero);
    }
    return api;
  })();

  function doorScene() {
    var world = q(".world"), canvas = q(".door-gl");
    var bridge = q(".door-layer--bridge"), tunnelImg = q(".door-layer--tunnel img");

    if (REDUCED) {
      gsap.set([bridge, canvas, ".door-caption--bridge"], { opacity: 0 });
      gsap.set(".door-caption--tunnel", { opacity: 1 });
      return;
    }

    var door = window.Door3D && window.THREE ? Door3D.create(canvas) : null;
    if (!door) gsap.set(canvas, { display: "none" });
    else door.warm();

    gsap.from(".door-caption--bridge > *", { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: world, start: "top 70%" } });

    var underground = false;
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: world, start: "top top", end: "+=420%", pin: true, scrub: 1,
        onUpdate: function (self) {
          var p = self.progress;
          if (door) door.setProgress(gsap.utils.clamp(0, 1, (p - 0.12) / 0.82));
          if (p > 0.82 !== underground) {
            underground = p > 0.82;
            applyTheme(underground ? "tunnel" : "surface", underground ? "low" : "high");
          }
        }
      }
    });
    tl.to(q("img", bridge), { scale: 1.12, duration: 0.16 }, 0)
      .to(".door-caption--bridge", { opacity: 0, y: -40, duration: 0.05 }, 0.07)
      .to(bridge, { opacity: 0, duration: 0.06 }, 0.1)
      .fromTo(tunnelImg, { scale: 1.3 }, { scale: 1, duration: 0.3 }, 0.66)
      .to(canvas, { opacity: 0, duration: 0.05 }, 0.92)
      .fromTo(".door-caption--tunnel", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.93)
      .to({}, { duration: 0.02 });

    if (door) {
      ScrollTrigger.create({
        trigger: world, start: "top bottom", end: "bottom top",
        onToggle: function (s) { door.setActive(s.isActive); }
      });
    }
  }

  function filmScene(mm) {
    var track = q(".film__track"), panels = qa(".film__panel"), counter = q(".film__counter b");
    mm.add(DESKTOP, function () {
      if (REDUCED) return;
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      var film = gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: ".story", start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true }
      });
      panels.forEach(function (panel, i) {
        var img = q(".film__img img", panel);
        if (img) {
          gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: film, start: "left right", end: "right left", scrub: true } });
          gsap.from(q(".film__img", panel), { clipPath: "inset(0% 0% 0% 100%)", duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: panel, containerAnimation: film, start: "left 85%", toggleActions: "play none none reverse" } });
        }
        ScrollTrigger.create({
          trigger: panel, containerAnimation: film, start: "left 50%", end: "right 50%",
          onToggle: function (s) { if (s.isActive) counter.textContent = String(i); }
        });
      });
    });
  }

  function reichScene() {
    if (REDUCED) return;
    var marquee = gsap.to(".marquee__row", { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".reich", start: "top bottom", end: "bottom top",
      onUpdate: function (self) {
        marquee.timeScale(1 + Math.min(Math.abs(self.getVelocity()) / 250, 7));
        gsap.to(marquee, { timeScale: 1, duration: 1.2, ease: "power2.out", overwrite: true });
      }
    });
    gsap.from(".reich__emblem", { scale: 0.55, rotation: -90, opacity: 0, duration: 1.4, ease: "back.out(1.4)", scrollTrigger: { trigger: ".reich__poster", start: "top 75%" } });
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".reich__slogan", start: "top 75%" } });
    qa(".slam").forEach(function (s, i) {
      tl.from(s, { scale: 1.9, opacity: 0, filter: "blur(10px)", duration: 0.42, ease: "power4.in", transformOrigin: "0% 50%" }, i * 0.38)
        .to(".reich__poster", { x: 6, duration: 0.05, yoyo: true, repeat: 3, ease: "none" }, i * 0.38 + 0.42);
    });
  }

  function locationsScene() {
    var frames = qa(".locs__frame"), buttons = qa(".locs__list button"), current = 0;
    function show(i) {
      if (i === current) return;
      var prev = frames[current], next = frames[i];
      buttons.forEach(function (b, k) { b.setAttribute("aria-pressed", String(k === i)); });
      current = i;
      frames.forEach(function (f) { f.style.zIndex = 0; });
      prev.style.zIndex = 1; next.style.zIndex = 2;
      next.classList.add("is-active");
      if (REDUCED) { prev.classList.remove("is-active"); return; }
      gsap.fromTo(next, { clipPath: "inset(0% 0% 0% 100%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out", overwrite: true,
        onComplete: function () { if (frames[current] !== prev) prev.classList.remove("is-active"); }
      });
      gsap.fromTo(q("img", next), { scale: 1.12, xPercent: 4 }, { scale: 1, xPercent: 0, duration: 1.3, ease: "expo.out", overwrite: true });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("focus", function () { show(i); });
      if (FINE_POINTER) b.addEventListener("mouseenter", function () { show(i); });
    });
  }

  function horrorScene() {
    var room = q(".horror__room");
    var flame = document.createElement("span");
    flame.className = "horror__flame";
    room.appendChild(flame);
    var st = { x: window.innerWidth / 2, y: window.innerHeight / 2, r: 0 }, lit = false, raf = 0;
    var baseR = function () { return Math.min(window.innerWidth, window.innerHeight) * (FINE_POINTER ? 0.26 : 0.32); };

    if (REDUCED) { room.style.setProperty("--lr", "3000px"); return; }

    function paint(t) {
      if (!lit && st.r < 1) { raf = 0; room.style.setProperty("--lr", "0px"); return; }
      var k = 1 + Math.sin(t / 90) * 0.035 + Math.sin(t / 37) * 0.025 + (Math.random() - 0.5) * 0.03;
      room.style.setProperty("--lx", st.x.toFixed(1) + "px");
      room.style.setProperty("--ly", st.y.toFixed(1) + "px");
      room.style.setProperty("--lr", (st.r * k).toFixed(1) + "px");
      flame.style.transform = "translate(" + st.x.toFixed(1) + "px," + st.y.toFixed(1) + "px)";
      raf = requestAnimationFrame(paint);
    }
    function light() {
      if (lit) return;
      lit = true; room.classList.add("is-lit");
      Sound.duck(true);
      setHudDead(true);
      gsap.to(st, { r: baseR(), duration: 0.9, ease: "expo.out", delay: 0.12, overwrite: "auto" });
      if (!raf) raf = requestAnimationFrame(paint);
    }
    function unlight() {
      if (!lit) return;
      lit = false; room.classList.remove("is-lit");
      Sound.duck(false);
      setHudDead(false);
      gsap.to(st, { r: 0, duration: 0.5, ease: "power2.in", overwrite: "auto" });
    }
    ScrollTrigger.create({ trigger: ".horror", start: "top 55%", end: "bottom 45%", onEnter: light, onEnterBack: light, onLeave: unlight, onLeaveBack: unlight });

    if (FINE_POINTER) {
      var qx = gsap.quickTo(st, "x", { duration: 0.45, ease: "power3.out" });
      var qy = gsap.quickTo(st, "y", { duration: 0.45, ease: "power3.out" });
      room.addEventListener("pointermove", function (e) {
        var r = room.getBoundingClientRect();
        qx(e.clientX - r.left); qy(e.clientY - r.top);
      });
    } else {
      var path = [[0.5, 0.5], [0.27, 0.28], [0.73, 0.3], [0.27, 0.78], [0.73, 0.8], [0.5, 0.5]];
      ScrollTrigger.create({
        trigger: ".horror", start: "top top", end: "bottom bottom",
        onUpdate: function (s) {
          var f = s.progress * (path.length - 1), i = Math.min(Math.floor(f), path.length - 2), k = f - i;
          k = k * k * (3 - 2 * k);
          gsap.to(st, {
            x: (path[i][0] + (path[i + 1][0] - path[i][0]) * k) * room.clientWidth,
            y: (path[i][1] + (path[i + 1][1] - path[i][1]) * k) * room.clientHeight,
            duration: 0.6, ease: "power2.out", overwrite: "auto"
          });
        }
      });
    }
  }

  function gameplayScene() {
    var imgs = qa(".gp__frame img"), steps = qa(".gp__step"), current = 0;
    function activate(i) {
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      if (i === current) return;
      var prev = imgs[current], next = imgs[i];
      current = i;
      if (REDUCED) { prev.classList.remove("is-active"); next.classList.add("is-active"); return; }
      gsap.to(prev, { opacity: 0, scale: 1.04, duration: 0.7, ease: "power2.out", overwrite: true });
      gsap.fromTo(next, { opacity: 0, scale: 1.14, clipPath: "inset(0% 0% 100% 0%)" }, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.out", overwrite: true });
    }
    steps[0].classList.add("is-active");
    steps.forEach(function (s, i) {
      ScrollTrigger.create({ trigger: s, start: "top 60%", end: "bottom 60%", onToggle: function (st) { if (st.isActive) activate(i); } });
    });
  }

  function trailers() {
    var modal = document.createElement("div");
    modal.className = "modal"; modal.hidden = true;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", "Трейлер");
    modal.innerHTML = '<div class="modal__backdrop"></div><div class="modal__box"><button class="modal__close" type="button" aria-label="Закрыть трейлер">✕</button><div class="trailer-embed"></div></div>';
    document.body.appendChild(modal);
    var embed = q(".trailer-embed", modal), lastFocus = null;
    function close() { embed.innerHTML = ""; modal.hidden = true; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); }
    q(".modal__close", modal).addEventListener("click", close);
    q(".modal__backdrop", modal).addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
    qa("[data-yt]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-yt");

        if (location.protocol === "file:") { window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener"); return; }
        lastFocus = btn;
        embed.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + btn.getAttribute("data-title") + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
        modal.hidden = false;
        if (lenis) lenis.stop();
        q(".modal__close", modal).focus();
      });
    });
  }

  function metroLineScene() {
    var list = q(".metro-line__stations");
    var stations = qa("li", list);
    var fill = document.createElement("span");
    fill.className = "metro-line__fill";
    list.prepend(fill);

    if (REDUCED) {
      stations.forEach(function (s) { s.classList.add("is-passed"); });
      gsap.set(fill, { scaleY: 1 });
      return;
    }
    var trig = { trigger: list, start: "top 60%", end: "bottom 60%", scrub: 0.6 };
    gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: Object.assign({}, trig) });
    stations.forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: "top 60%", onEnter: function () { s.classList.add("is-passed"); }, onLeaveBack: function () { s.classList.remove("is-passed"); } });
    });
  }

  function finaleScene() {
    var days = q(".metro-clock__window--days .seg"), time = q(".metro-clock__window--time .seg"), live = q("#countdown-text");
    var RELEASE = new Date(2027, 1, 4, 0, 0, 0).getTime(), booting = false;
    function tick() {
      if (booting) return;
      var d = Math.max(0, RELEASE - Date.now()), s = Math.floor(d / 1000);
      var dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      Seg.render(days, String(dd).padStart(3, "0"));
      Seg.render(time, String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0"));
      live.textContent = d > 0 ? "До выхода " + dd + " дн. " + h + " ч. " + m + " мин." : "METRO 2039 уже вышла";
    }
    tick();
    setInterval(tick, 1000);

    function finaleMode(on) { hud.classList.toggle("is-hidden", on); Sound.setTrack(on ? "theme" : "city"); }
    ScrollTrigger.create({
      trigger: ".finale", start: "top 80%",
      onEnter: function () { finaleMode(true); }, onLeaveBack: function () { finaleMode(false); }
    });
    if (REDUCED) return;

    gsap.from(".metro-clock", { yPercent: -160, ease: "power2.out", scrollTrigger: { trigger: ".finale", start: "top bottom", end: "top 20%", scrub: 1 } });
    ScrollTrigger.create({
      trigger: ".metro-clock", start: "top 70%", once: true,
      onEnter: function () {
        booting = true;
        var seq = [["   ", "  :  :  "], ["888", "88:88:88"], ["   ", "  :  :  "], ["888", "88:88:88"]], i = 0;
        (function step() {
          Seg.render(days, seq[i][0]); Seg.render(time, seq[i][1]);
          if (++i < seq.length) setTimeout(step, 110); else setTimeout(function () { booting = false; tick(); }, 160);
        })();
      }
    });
  }

  function parallax() {
    if (REDUCED) return;
    qa(".about__strip img, .stranger__media img, .hunter__media img, .reich__hall img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  function init() {
    var mm = gsap.matchMedia();
    heroIntro();
    doorScene();
    filmScene(mm);
    reichScene();
    locationsScene();
    horrorScene();
    gameplayScene();
    trailers();
    metroLineScene();
    finaleScene();
    parallax();

    qa("main > section").forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 55%",
        onToggle: function (s) {
          if (!s.isActive) return;
          if (sec.id) setCurrentNav(sec.id);
          if (sec.classList.contains("world")) return;
          applyTheme(sec.getAttribute("data-theme"), sec.getAttribute("data-rad"));
        }
      });
    });

    var topbar = q(".topbar");
    ScrollTrigger.create({ start: 80, end: "max", onToggle: function (s) { topbar.classList.toggle("is-solid", s.isActive); } });
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (s) {
        updateHud(s.progress);
        needle += s.getVelocity() * 0.004;
        watch.setNeedle(needle + s.progress * 540);
      }
    });

    applyTheme("ash", "high");
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  function warmImages() {
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    var imgs = qa("img[loading='lazy']");
    var idle = window.requestIdleCallback
      ? function (fn) { requestIdleCallback(fn, { timeout: 2000 }); }
      : function (fn) { setTimeout(fn, 120); };
    function next() {
      var img = imgs.shift();
      if (!img) return;
      img.loading = "eager";
      var decoded = img.decode ? img.decode() : Promise.resolve();
      decoded.catch(function () { }).then(function () { idle(next); });
    }
    idle(next);
  }

  var started = false;
  function start() { if (started) return; started = true; init(); }

  Promise.all([document.fonts.load("800 64px 'Alumni Sans'"), document.fonts.ready]).then(start, start);
  setTimeout(start, 2000);
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
    setTimeout(warmImages, 600);
  });
})();
