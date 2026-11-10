(function () {
  "use strict";

  var OW = 3.0, OH = 3.8;
  var FT = 0.34, FD = 0.5;
  var DT = 0.3;
  var HOLE_W = OW + FT * 2, HOLE_H = OH + FT;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }

  function grime(ctx, w, h, n, alpha) {
    for (var i = 0; i < n; i++) {
      var x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * (w / 10);
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(40,24,10," + (Math.random() * alpha) + ")");
      g.addColorStop(1, "rgba(40,24,10,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  function hazardTexture() {
    var c = document.createElement("canvas"); c.width = 256; c.height = 1024;
    var x = c.getContext("2d");
    x.fillStyle = "#c79a17"; x.fillRect(0, 0, 256, 1024);
    x.fillStyle = "#16130f";
    for (var i = -4; i < 14; i++) {
      x.beginPath();
      x.moveTo(0, i * 128); x.lineTo(256, i * 128 - 256); x.lineTo(256, i * 128 - 192); x.lineTo(0, i * 128 + 64);
      x.closePath(); x.fill();
    }
    grime(x, 256, 1024, 160, 0.55);

    for (var k = 0; k < 220; k++) {
      x.fillStyle = "rgba(70,60,50," + (0.3 + Math.random() * 0.5) + ")";
      x.fillRect(Math.random() * 256, Math.random() * 1024, 1 + Math.random() * 6, 1 + Math.random() * 3);
    }
    return c;
  }
  function stencilTexture() {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 420;
    var x = c.getContext("2d");
    x.fillStyle = "rgba(226,220,204,0.92)";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "700 128px 'Alumni Sans', 'Arial Narrow', sans-serif";
    x.fillText("ГЕРМОЗАТВОР", 512, 120);
    x.font = "700 150px 'Alumni Sans', 'Arial Narrow', sans-serif";
    x.fillText("ГЗ-2039", 512, 290);

    x.globalCompositeOperation = "destination-out";
    for (var i = 0; i < 1600; i++) {
      x.fillStyle = "rgba(0,0,0," + Math.random() + ")";
      var s = Math.random() * 9;
      x.fillRect(Math.random() * 1024, Math.random() * 420, s, s * 0.6);
    }
    for (var j = 0; j < 40; j++) {
      x.fillStyle = "rgba(0,0,0,0.8)";
      x.fillRect(Math.random() * 1024, Math.random() * 420, 2 + Math.random() * 40, 2 + Math.random() * 6);
    }
    return c;
  }
  function warningTexture() {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 160;
    var x = c.getContext("2d");
    x.fillStyle = "rgba(170,28,18,0.9)";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "700 92px 'Alumni Sans', 'Arial Narrow', sans-serif";
    x.fillText("ОТКРЫВАТЬ ПО КОМАНДЕ", 512, 84);
    x.globalCompositeOperation = "destination-out";
    for (var i = 0; i < 900; i++) {
      x.fillStyle = "rgba(0,0,0," + Math.random() + ")";
      var s = Math.random() * 7;
      x.fillRect(Math.random() * 1024, Math.random() * 160, s, s);
    }
    return c;
  }

  function create(canvas) {
    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return null; }
    if (!renderer.getContext()) return null;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070706, 10, 30);
    var camera = new THREE.PerspectiveCamera(40, 1, 0.05, 80);

    var manager = new THREE.LoadingManager();
    var texturesReady = new Promise(function (res) { manager.onLoad = res; manager.onError = res; });
    var loader = new THREE.TextureLoader(manager);
    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    var allTextures = [];
    function tex(src, repX, repY, srgb) {
      var t = loader.load(src);
      allTextures.push(t);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX, repY);
      t.anisotropy = maxAniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    var T = window.DOOR_TEX;

    var doorMat = new THREE.MeshStandardMaterial({
      map: tex(T.doorDiff, 1.1, 1.4, true), normalMap: tex(T.doorNor, 1.1, 1.4),
      roughnessMap: tex(T.doorRough, 1.1, 1.4), metalness: 0.55, roughness: 1, color: 0xb9c2b0
    });
    doorMat.normalScale.set(1.4, 1.4);
    var ribMat = doorMat.clone();
    ribMat.color = new THREE.Color(0x9aa595);
    var wallMat = new THREE.MeshStandardMaterial({
      map: tex(T.wallDiff, 6, 3, true), normalMap: tex(T.wallNor, 6, 3), roughness: 0.95, metalness: 0, color: 0x8d8a82
    });
    var floorMat = new THREE.MeshStandardMaterial({
      map: tex(T.wallDiff, 8, 8, true), normalMap: tex(T.wallNor, 8, 8), roughness: 0.9, metalness: 0, color: 0x6c6a64
    });
    var rustMat = new THREE.MeshStandardMaterial({
      map: tex(T.rustDiff, 1, 1, true), normalMap: tex(T.rustNor, 1, 1), roughness: 0.85, metalness: 0.6, color: 0x8f8a84
    });
    var steelMat = new THREE.MeshStandardMaterial({
      map: tex(T.rustDiff, 1, 1, true), normalMap: tex(T.rustNor, 1, 1), roughness: 0.5, metalness: 0.85, color: 0x55524c
    });
    var hazTex = new THREE.CanvasTexture(hazardTexture());
    hazTex.colorSpace = THREE.SRGBColorSpace; hazTex.wrapS = hazTex.wrapT = THREE.RepeatWrapping; hazTex.anisotropy = maxAniso;
    allTextures.push(hazTex);
    var hazMat = new THREE.MeshStandardMaterial({ map: hazTex, normalMap: tex(T.rustNor, 0.6, 2.5), roughness: 0.8, metalness: 0.35 });

    function box(w, h, d, mat, x, y, z, parent) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      (parent || scene).add(m);
      return m;
    }
    function cyl(r, h, mat, x, y, z, parent, axis) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), mat);
      if (axis === "z") m.rotation.x = Math.PI / 2;
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      (parent || scene).add(m);
      return m;
    }

    var WALL_W = 34, WALL_H = 16, WALL_D = 1.2;
    var sideW = (WALL_W - HOLE_W) / 2;
    box(sideW, WALL_H, WALL_D, wallMat, -(HOLE_W / 2 + sideW / 2), WALL_H / 2, -WALL_D / 2);
    box(sideW, WALL_H, WALL_D, wallMat, HOLE_W / 2 + sideW / 2, WALL_H / 2, -WALL_D / 2);
    box(HOLE_W, WALL_H - HOLE_H, WALL_D, wallMat, 0, HOLE_H + (WALL_H - HOLE_H) / 2, -WALL_D / 2);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, 24), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 12); floor.receiveShadow = true;
    scene.add(floor);

    box(HOLE_W + 0.4, 0.08, 0.6, rustMat, 0, 0.04, 0.1);

    var fz = FD / 2 - 0.2;
    var frL = box(FT, HOLE_H, FD, hazMat, -(OW / 2 + FT / 2), HOLE_H / 2, fz);
    var frR = box(FT, HOLE_H, FD, hazMat, OW / 2 + FT / 2, HOLE_H / 2, fz);
    var frT = box(HOLE_W, FT, FD, hazMat, 0, OH + FT / 2, fz);
    frT.material = hazMat.clone(); frT.material.map = hazTex.clone(); frT.material.map.needsUpdate = true;
    frT.material.map.rotation = Math.PI / 2; frT.material.map.repeat.set(1, 4);
    allTextures.push(frT.material.map);

    for (var b = 0; b < 7; b++) {
      var by = 0.35 + b * (HOLE_H - 0.5) / 6;
      cyl(0.035, 0.06, steelMat, -(OW / 2 + FT / 2), by, fz + FD / 2 + 0.02, null, "z");
      cyl(0.035, 0.06, steelMat, OW / 2 + FT / 2, by, fz + FD / 2 + 0.02, null, "z");
    }

    var pivot = new THREE.Group();
    pivot.position.set(-OW / 2, 0, 0.1);
    scene.add(pivot);
    var faceZ = DT / 2;
    box(OW - 0.04, OH - 0.02, DT, doorMat, OW / 2, OH / 2, 0, pivot);

    box(OW - 0.1, 0.16, 0.08, ribMat, OW / 2, 0.14, faceZ + 0.04, pivot);
    box(OW - 0.1, 0.16, 0.08, ribMat, OW / 2, OH - 0.14, faceZ + 0.04, pivot);
    box(0.16, OH - 0.1, 0.08, ribMat, 0.14, OH / 2, faceZ + 0.04, pivot);
    box(0.16, OH - 0.1, 0.08, ribMat, OW - 0.14, OH / 2, faceZ + 0.04, pivot);
    var r1 = OH * 0.36, r2 = OH * 0.66;
    box(OW - 0.3, 0.12, 0.11, ribMat, OW / 2, r1, faceZ + 0.055, pivot);
    box(OW - 0.3, 0.12, 0.11, ribMat, OW / 2, r2, faceZ + 0.055, pivot);
    box(0.12, r2 - 0.2, 0.11, ribMat, OW / 2, (r2 + 0.12) / 2, faceZ + 0.055, pivot);

    for (var rv = 0; rv < 12; rv++) {
      var rx = 0.3 + rv * (OW - 0.6) / 11;
      cyl(0.022, 0.03, steelMat, rx, r1, faceZ + 0.12, pivot, "z");
      cyl(0.022, 0.03, steelMat, rx, r2, faceZ + 0.12, pivot, "z");
    }

    var stTex = new THREE.CanvasTexture(stencilTexture()); stTex.colorSpace = THREE.SRGBColorSpace; stTex.anisotropy = maxAniso;
    var st = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.94),
      new THREE.MeshStandardMaterial({ map: stTex, transparent: true, roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
    st.position.set(OW / 2, (r2 + OH - 0.22) / 2, faceZ + 0.003); st.receiveShadow = true;
    pivot.add(st);
    allTextures.push(stTex);
    var wTex = new THREE.CanvasTexture(warningTexture()); wTex.colorSpace = THREE.SRGBColorSpace;
    var wn = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.2),
      new THREE.MeshStandardMaterial({ map: wTex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
    allTextures.push(wTex);
    wn.position.set(OW * 0.27, r1 * 0.5, faceZ + 0.003);
    pivot.add(wn);

    var wheel = new THREE.Group();
    wheel.position.set(OW / 2, (r1 + r2) / 2, faceZ + 0.26);
    pivot.add(wheel);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 16, 64), steelMat);
    rim.castShadow = true; wheel.add(rim);
    for (var sp = 0; sp < 5; sp++) {
      var spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.42, 12), steelMat);
      var a = (sp / 5) * Math.PI * 2;
      spoke.position.set(Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0);
      spoke.rotation.z = a - Math.PI / 2;
      spoke.castShadow = true; wheel.add(spoke);
    }
    cyl(0.09, 0.16, steelMat, 0, 0, 0, wheel, "z");
    cyl(0.04, 0.26, steelMat, OW / 2, (r1 + r2) / 2, faceZ + 0.13, pivot, "z");
    var knob = cyl(0.03, 0.14, steelMat, 0.42, 0, 0.07, wheel, "z");

    var clamps = [];
    function clamp(x, y, dir) {
      cyl(0.08, 0.1, rustMat, x, y, faceZ + 0.05, pivot, "z");
      var g = new THREE.Group();
      g.position.set(x, y, faceZ + 0.12);
      pivot.add(g);
      var h = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.075, 0.07), steelMat);
      h.position.x = 0.22; h.castShadow = true; g.add(h);
      var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), rustMat);
      grip.rotation.x = Math.PI / 2; grip.position.set(0.44, 0, 0.08); g.add(grip);
      g.rotation.z = dir;
      clamps.push({ g: g, base: dir, open: dir + Math.PI / 2 });
    }
    clamp(OW - 0.32, 0.75, 0);
    clamp(OW - 0.32, OH / 2, 0);
    clamp(OW - 0.32, OH - 0.75, 0);
    clamp(OW * 0.3, OH - 0.3, Math.PI / 2);
    clamp(OW * 0.7, OH - 0.3, Math.PI / 2);
    clamp(OW * 0.3, 0.3, -Math.PI / 2);
    clamp(OW * 0.7, 0.3, -Math.PI / 2);

    [0.55, OH / 2, OH - 0.55].forEach(function (y) {
      cyl(0.1, 0.5, rustMat, -OW / 2 - 0.02, y, faceZ + 0.12);
      box(0.32, 0.4, 0.05, rustMat, -OW / 2 - 0.16, y, faceZ + 0.06);
    });

    scene.add(new THREE.HemisphereLight(0x22303e, 0x070504, 0.6));

    var work = new THREE.SpotLight(0xffb27a, 160, 0, 0.85, 0.75, 2);
    work.position.set(-2.7, 4.6, 1.8);
    work.target.position.set(0.4, 1.4, 0);
    work.castShadow = true;
    work.shadow.mapSize.set(1024, 1024);
    work.shadow.bias = -0.0004;
    work.shadow.camera.near = 0.5; work.shadow.camera.far = 14;
    scene.add(work, work.target);

    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0x221a10, emissive: 0xffc58a, emissiveIntensity: 3 }));
    bulb.position.copy(work.position); scene.add(bulb);
    var cage = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.22, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1a18, wireframe: true }));
    cage.position.copy(work.position); scene.add(cage);
    box(0.06, 0.05, 1.8, steelMat, -2.7, 4.72, 0.9);
    var glow = new THREE.PointLight(0xffa860, 6, 0, 2);
    glow.position.set(-2.7, 4.55, 1.6); scene.add(glow);

    var fill = new THREE.SpotLight(0x7d93ad, 320, 0, 0.45, 1, 2);
    fill.position.set(4, 3.5, 12); fill.target.position.set(0, 1.8, 0);
    scene.add(fill, fill.target);

    var beaconY = HOLE_H + 0.55;
    box(0.46, 0.1, 0.32, steelMat, 0, beaconY - 0.08, 0.16);
    var domeMat = new THREE.MeshStandardMaterial({ color: 0x3a0804, emissive: 0xff2a10, emissiveIntensity: 0.15, roughness: 0.3, transparent: true, opacity: 0.92 });
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(0, beaconY - 0.03, 0.18); scene.add(dome);
    var beaconRig = new THREE.Group();
    beaconRig.position.set(0, beaconY + 0.04, 0.18);
    scene.add(beaconRig);
    var beams = [0, Math.PI].map(function (off) {
      var s = new THREE.SpotLight(0xff2412, 0, 0, 0.38, 0.6, 2);
      s.position.set(0, 0, 0);
      var t = new THREE.Object3D(); t.position.set(Math.cos(off) * 3, -0.6, Math.sin(off) * 3);
      beaconRig.add(s, t); s.target = t;
      return s;
    });
    var beaconGlow = new THREE.PointLight(0xff2a14, 0, 0, 2);
    beaconGlow.position.set(0, beaconY + 0.1, 0.5); scene.add(beaconGlow);

    var DUST = 220, pos = new Float32Array(DUST * 3), vel = [];
    for (var d = 0; d < DUST; d++) {
      pos[d * 3] = -2.4 + Math.random() * 3.6;
      pos[d * 3 + 1] = Math.random() * 4.6;
      pos[d * 3 + 2] = 0.4 + Math.random() * 3.2;
      vel.push((Math.random() - 0.5) * 0.002, -0.0008 - Math.random() * 0.0015, (Math.random() - 0.5) * 0.002);
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd9c7a4, size: 0.012, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);

    var progress = 0, active = false, clock = new THREE.Clock();
    var camFar = 12.5, camNear = 7.4;

    function fit() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      var hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      camFar = Math.max(12.5, (HOLE_W / 2 + 1.4) / Math.tan(hfov / 2));
      camNear = Math.max(7.4, (HOLE_W / 2 + 0.6) / Math.tan(hfov / 2));
      camera.updateProjectionMatrix();
    }

    function frame() {
      var t = clock.getElapsedTime(), p = progress;

      var approach = easeOut(seg(p, 0, 0.36));
      var through = easeIn(seg(p, 0.82, 1));
      var z = camFar + (camNear - camFar) * approach;
      z = z + (-1.6 - z) * through;
      var sway = (1 - through) * 0.03;
      camera.position.set(Math.sin(t * 0.6) * sway, 1.62 + Math.sin(t * 0.9) * sway * 0.6, z);
      camera.lookAt(0, 2.05 - 0.25 * through, z - 10);

      var on = seg(p, 0.2, 0.28);
      beaconRig.rotation.y = t * 4.2;
      beams.forEach(function (s) { s.intensity = on * 90; });
      beaconGlow.intensity = on * (2.5 + Math.sin(t * 8.4) * 1.5);
      domeMat.emissiveIntensity = 0.15 + on * (2.2 + Math.sin(t * 8.4) * 0.8);

      clamps.forEach(function (c, i) {
        var k = easeInOut(seg(p, 0.38 + i * 0.024, 0.38 + i * 0.024 + 0.05));
        c.g.rotation.z = c.base + (c.open - c.base) * k;
      });

      var wk = easeInOut(seg(p, 0.5, 0.64));
      wheel.rotation.z = -wk * Math.PI * 3;

      var dk = easeInOut(seg(p, 0.64, 0.84));
      var shake = dk > 0 && dk < 0.12 ? Math.sin(t * 60) * 0.004 : 0;
      pivot.rotation.y = -dk * 1.95 + shake;

      var arr = dustGeo.attributes.position.array;
      for (var i = 0; i < DUST; i++) {
        arr[i * 3] += vel[i * 3]; arr[i * 3 + 1] += vel[i * 3 + 1]; arr[i * 3 + 2] += vel[i * 3 + 2];
        if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 5;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    fit();
    window.addEventListener("resize", fit);

    var warmed = null;
    function idle(fn) {
      if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1200 });
      else setTimeout(fn, 60);
    }
    function warm() {
      if (warmed) return warmed;
      warmed = texturesReady.then(function () {
        return new Promise(function (done) {
          var i = 0;
          (function next() {
            if (i < allTextures.length) {
              renderer.initTexture(allTextures[i++]);
              idle(next);
              return;
            }
            var compiled = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera));
            compiled.catch(function () { }).then(function () {
              idle(function () { if (!active) frame(); done(); });
            });
          })();
        });
      });
      return warmed;
    }

    return {
      setProgress: function (p) { progress = p; if (!active) frame(); },
      setActive: function (on) {
        if (on === active) return;
        active = on;
        renderer.setAnimationLoop(on ? frame : null);
      },
      resize: fit,
      renderOnce: frame,
      warm: warm
    };
  }

  window.Door3D = { create: create };
})();
