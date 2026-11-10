(function () {
  "use strict";

  var VOLUME = 0.55;
  var TRACKS = { city: "assets/audio/dead-city.mp3", theme: "assets/audio/main-theme.mp3" };
  var on = false, ducked = false, cur = "city", tracks = {};

  Object.keys(TRACKS).forEach(function (k) {
    var a = new Audio();
    a.src = TRACKS[k];
    a.loop = true;
    a.preload = "metadata";
    a.volume = 0;
    tracks[k] = { el: a, raf: 0 };
  });

  function fade(k, to, ms) {
    var tr = tracks[k], a = tr.el;
    cancelAnimationFrame(tr.raf);
    var from = a.volume, t0 = performance.now();
    if (to > 0 && a.paused) a.play().catch(function () { });
    (function step(t) {
      var p = Math.max(0, Math.min(1, (t - t0) / ms));
      a.volume = Math.max(0, Math.min(1, from + (to - from) * p));
      if (p < 1) tr.raf = requestAnimationFrame(step);
      else if (to === 0) a.pause();
    })(t0);
  }

  function apply() {
    var target = on ? (ducked ? VOLUME * 0.25 : VOLUME) : 0;
    Object.keys(tracks).forEach(function (k) {
      fade(k, k === cur ? target : 0, on ? 1800 : 600);
    });
  }

  window.Sound = {
    toggle: function () {
      on = !on;
      apply();
      return on;
    },
    duck: function (v) {
      if (v === ducked) return;
      ducked = v;
      if (on) apply();
    },
    setTrack: function (k) {
      if (k === cur || !tracks[k]) return;
      cur = k;
      if (on) apply();
    }
  };
})();
