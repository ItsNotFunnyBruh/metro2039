(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var MAP = {
    "0": "1111110", "1": "0110000", "2": "1101101", "3": "1111001", "4": "0110011",
    "5": "1011011", "6": "1011111", "7": "1110000", "8": "1111111", "9": "1111011",
    "-": "0000001", " ": "0000000"
  };
  var SEGS = [
    "4,1 16,1 13.5,4 6.5,4", "17,2 17,17 14,15 14,5", "17,19 17,34 14,31 14,21",
    "4,35 16,35 13.5,32 6.5,32", "3,19 6,21 6,31 3,34", "3,2 6,5 6,15 3,17",
    "4,18 6.5,16.5 13.5,16.5 16,18 13.5,19.5 6.5,19.5"
  ];
  var uid = 0;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function polar(cx, cy, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }
  function ridges(g, cx, cy, r1, r2, from, to, step, stroke, width) {
    for (var d = from; d <= to; d += step) {
      var a = polar(cx, cy, r1, d), b = polar(cx, cy, r2, d);
      el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: stroke, "stroke-width": width, "stroke-linecap": "round" }, g);
    }
  }

  function mount(host) {
    var id = "w" + (++uid);
    var svg = el("svg", { viewBox: "0 0 220 240", class: "watch-svg", "aria-hidden": "true" });
    var defs = el("defs", {}, svg);
    function radial(name, stops, cx, cy) {
      var g = el("radialGradient", { id: id + name, cx: cx || "40%", cy: cy || "35%", r: "70%" }, defs);
      stops.forEach(function (s) { el("stop", { offset: s[0], "stop-color": s[1] }, g); });
    }
    radial("Dark", [["0%", "#8b877e"], ["45%", "#4d4a44"], ["100%", "#191816"]]);
    radial("Mid", [["0%", "#cfcbc1"], ["50%", "#7c786f"], ["100%", "#2c2a26"]]);
    radial("Glass", [["0%", "#151b0c"], ["70%", "#090c05"], ["100%", "#030402"]], "50%", "40%");
    radial("Lamp", [["0%", "#fff1b0"], ["45%", "#ffb52e"], ["100%", "#8a3d00"]], "50%", "45%");
    radial("Blue", [["0%", "#e6f3ff"], ["40%", "#7ab6ff"], ["100%", "#1b3d7a"]], "50%", "45%");
    var knurl = el("pattern", { id: id + "Knurl", width: 3, height: 3, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 3, height: 3, fill: "#6f6b63" }, knurl);
    el("path", { d: "M0 0H3M0 0V3", stroke: "#2b2925", "stroke-width": 1 }, knurl);
    var noise = el("filter", { id: id + "Grit", x: 0, y: 0, width: "100%", height: "100%" }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "1.4", numOctaves: "2", seed: "7" }, noise);
    el("feColorMatrix", { values: "0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0 0.04  0 0 0 0.9 -0.25" }, noise);
    var glow = el("filter", { id: id + "Glow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    el("feGaussianBlur", { stdDeviation: "1.6", result: "b" }, glow);
    var merge = el("feMerge", {}, glow);
    el("feMergeNode", { in: "b" }, merge); el("feMergeNode", { in: "SourceGraphic" }, merge);

    var C = [122, 130];

    var strap = el("g", { class: "w-strap" }, svg);
    [[88, 0, 68, 46], [88, 196, 68, 44]].forEach(function (r) {
      el("rect", { x: r[0], y: r[1], width: r[2], height: r[3], rx: 5, fill: "#1f1a15" }, strap);
      el("rect", { x: r[0] + 6, y: r[1] + 3, width: r[2] - 12, height: r[3] - 6, rx: 3, fill: "none", stroke: "#3b3128", "stroke-width": 1, "stroke-dasharray": "3 3" }, strap);
    });

    var body = el("g", {}, svg);
    el("circle", { cx: C[0], cy: C[1], r: 72, fill: "url(#" + id + "Dark)", stroke: "#0c0b0a", "stroke-width": 2 }, body);
    ridges(body, C[0], C[1], 60, 71, -62, 58, 4, "#b2aea4", 2.4);
    ridges(body, C[0], C[1], 61, 69, 198, 262, 5, "#8f8b82", 2.2);
    el("circle", { cx: C[0], cy: C[1], r: 57, fill: "url(#" + id + "Mid)", stroke: "#1a1916", "stroke-width": 1.5 }, body);
    [74, 98, 122, 146].forEach(function (d) {
      var p = polar(C[0], C[1], 64, d);
      el("circle", { cx: p[0], cy: p[1], r: 3.4, fill: "#24221f", stroke: "#8f8b82", "stroke-width": 0.8 }, body);
    });

    [[46, 66], [226, 66]].forEach(function (b) {
      var p = polar(C[0], C[1], b[1], b[0]);
      el("rect", { x: -12, y: -6, width: 24, height: 12, rx: 5, fill: "url(#" + id + "Knurl)", stroke: "#1b1a17", "stroke-width": 1.2, transform: "translate(" + p[0] + " " + p[1] + ") rotate(" + (b[0] + 90) + ")" }, body);
    });

    var rb = polar(C[0], C[1], 72, 134);
    el("circle", { cx: rb[0], cy: rb[1], r: 9, fill: "url(#" + id + "Mid)", stroke: "#141311", "stroke-width": 1.2 }, body);
    el("path", { d: "M" + (rb[0] - 4) + " " + rb[1] + "a4 4 0 0 1 7-2.5M" + (rb[0] + 4) + " " + rb[1] + "a4 4 0 0 1-7 2.5", fill: "none", stroke: "#2a2824", "stroke-width": 1.4 }, body);
    el("circle", { cx: C[0], cy: C[1], r: 72, fill: "#000", filter: "url(#" + id + "Grit)", opacity: 0.55, "pointer-events": "none" }, body);

    el("circle", { cx: C[0], cy: C[1] - 6, r: 45, fill: "#12110e", stroke: "url(#" + id + "Mid)", "stroke-width": 4 }, svg);
    el("circle", { cx: C[0], cy: C[1] - 6, r: 41, fill: "url(#" + id + "Glass)" }, svg);
    var pcb = el("g", { stroke: "#1d2614", "stroke-width": 0.8, fill: "none" }, svg);
    el("path", { d: "M92 104h14v-8h22M136 102h14M96 142h20l6-6h22", }, pcb);
    el("circle", { cx: 144, cy: 98, r: 6.5, fill: "#1a1e13", stroke: "#2a3120" }, pcb);
    for (var t = 0; t < 4; t++) el("rect", { x: 86 + t * 19, y: 132, width: 9, height: 3, fill: "#172012", stroke: "none" }, pcb);

    var digitsG = el("g", { class: "w-digits", filter: "url(#" + id + "Glow)" }, svg);
    var cells = [];
    var startX = 85, y = 110, sc = 0.82;
    for (var i = 0; i < 5; i++) {
      var g = el("g", { transform: "translate(" + startX + " " + y + ") scale(" + sc + ") skewX(-6)" }, digitsG);
      if (i === 2) {
        el("circle", { cx: 3, cy: 12, r: 1.9, class: "w-colon" }, g);
        el("circle", { cx: 3, cy: 25, r: 1.9, class: "w-colon" }, g);
        startX += 7;
        cells.push(null);
        continue;
      }
      var polys = SEGS.map(function (pts) { return el("polygon", { points: pts, class: "w-seg" }, g); });
      cells.push(polys);
      startX += 18;
    }

    var pl = el("g", {}, svg);
    var a1 = polar(C[0], C[1] - 6, 39, 118), a2 = polar(C[0], C[1] - 6, 39, 242);
    el("path", { d: "M" + a1[0] + " " + a1[1] + " A39 39 0 0 1 " + a2[0] + " " + a2[1] + " Q" + C[0] + " " + (C[1] + 14) + " " + a1[0] + " " + a1[1] + "Z", fill: "url(#" + id + "Mid)", stroke: "#1a1916", "stroke-width": 1 }, pl);
    var leds = [];
    [-28, -14, 0, 14, 28].forEach(function (d) {
      var p = polar(C[0], C[1] + 2, 25, 180 + d);
      leds.push(el("rect", { x: -1.8, y: -4.5, width: 3.6, height: 9, rx: 1.8, class: "w-led", transform: "translate(" + p[0] + " " + p[1] + ") rotate(" + (-d) + ")" }, pl));
    });

    var L = [C[0], C[1] + 50];
    var lamp = el("g", {}, svg);
    el("circle", { cx: L[0], cy: L[1], r: 18, fill: "url(#" + id + "Dark)", stroke: "#0e0d0b", "stroke-width": 1.5 }, lamp);
    ridges(lamp, L[0], L[1], 14.5, 18, 0, 355, 10, "#9a968c", 1.4);
    var lampGlass = el("circle", { cx: L[0], cy: L[1], r: 12.5, fill: "url(#" + id + "Lamp)", class: "w-lamp" }, lamp);
    var tre = el("g", { fill: "#2a1300", opacity: 0.85 }, lamp);
    [0, 120, 240].forEach(function (d) {
      var p1 = polar(L[0], L[1], 3, d - 30), p2 = polar(L[0], L[1], 10, d - 30), p3 = polar(L[0], L[1], 10, d + 30), p4 = polar(L[0], L[1], 3, d + 30);
      el("path", { d: "M" + p1 + "L" + p2 + "A10 10 0 0 1 " + p3 + "L" + p4 + "A3 3 0 0 0 " + p1 + "Z" }, tre);
    });
    el("circle", { cx: L[0], cy: L[1], r: 1.8 }, tre);

    el("circle", { cx: 116, cy: 46, r: 12, fill: "url(#" + id + "Dark)", stroke: "#0c0b0a", "stroke-width": 1.5 }, svg);
    el("circle", { cx: 116, cy: 46, r: 5.5, fill: "url(#" + id + "Blue)", filter: "url(#" + id + "Glow)" }, svg);

    var K = [60, 66];
    var comp = el("g", {}, svg);
    el("circle", { cx: K[0], cy: K[1], r: 42, fill: "url(#" + id + "Dark)", stroke: "#0c0b0a", "stroke-width": 2 }, comp);
    el("circle", { cx: K[0], cy: K[1], r: 34, fill: "#cdc6b4", stroke: "#3a3833", "stroke-width": 1 }, comp);
    for (var k = 0; k < 360; k += 10) {
      var o = polar(K[0], K[1], 33, k), n = polar(K[0], K[1], k % 30 ? 29.5 : 27.5, k);
      el("line", { x1: o[0], y1: o[1], x2: n[0], y2: n[1], stroke: "#22201c", "stroke-width": k % 30 ? 0.8 : 1.4 }, comp);
    }
    el("circle", { cx: K[0], cy: K[1], r: 24, fill: "#121211" }, comp);
    var needle = el("g", { transform: "translate(" + K[0] + " " + K[1] + ")" }, comp);
    var needleInner = el("g", {}, needle);
    el("polygon", { points: "0,-20 7,0 -7,0", fill: "#c4362c" }, needleInner);
    el("polygon", { points: "0,20 7,0 -7,0", fill: "#d9d4c8" }, needleInner);
    el("circle", { cx: 0, cy: 0, r: 3.2, fill: "#3a3833", stroke: "#8f8b82", "stroke-width": 0.8 }, needleInner);
    el("circle", { cx: K[0], cy: K[1], r: 42, fill: "#000", filter: "url(#" + id + "Grit)", opacity: 0.4, "pointer-events": "none" }, comp);

    host.appendChild(svg);

    var dead = false;
    function setTime(text) {
      if (dead) return;
      for (var i = 0; i < 5; i++) {
        if (!cells[i]) continue;
        var bits = MAP[text[i]] || MAP[" "];
        for (var k = 0; k < 7; k++) cells[i][k].classList.toggle("on", bits[k] === "1");
      }
    }
    function setLeds(n) {
      leds.forEach(function (l, i) { l.classList.toggle("on", !dead && i < n); });
    }
    return {
      el: svg,
      setTime: setTime,
      setLeds: setLeds,
      setRad: function (level) { svg.setAttribute("data-rad", level); },
      setNeedle: function (deg) { needleInner.setAttribute("transform", "rotate(" + deg.toFixed(1) + ")"); },
      setDead: function (on, text) {
        dead = false;
        if (text) setTime(text);
        dead = on;
        svg.classList.toggle("is-dead", on);
        if (on) leds.forEach(function (l) { l.classList.remove("on"); });
      }
    };
  }

  window.Watch = { mount: mount };
})();
