(function () {
  var NS = "http://www.w3.org/2000/svg";

  var MAP = {
    "0": "1111110", "1": "0110000", "2": "1101101", "3": "1111001", "4": "0110011",
    "5": "1011011", "6": "1011111", "7": "1110000", "8": "1111111", "9": "1111011",
    "-": "0000001", " ": "0000000"
  };

  var SEGS = [
    "4,1 16,1 13.5,4 6.5,4",
    "17,2 17,17 14,15 14,5",
    "17,19 17,34 14,31 14,21",
    "4,35 16,35 13.5,32 6.5,32",
    "3,19 6,21 6,31 3,34",
    "3,2 6,5 6,15 3,17",
    "4,18 6.5,16.5 13.5,16.5 16,18 13.5,19.5 6.5,19.5"
  ];

  function digit() {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 20 36");
    svg.style.transform = "skewX(-6deg)";
    for (var i = 0; i < 7; i++) {
      var p = document.createElementNS(NS, "polygon");
      p.setAttribute("points", SEGS[i]);
      p.setAttribute("class", "s");
      svg.appendChild(p);
    }
    return svg;
  }
  function colon() {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 6 36");
    svg.setAttribute("class", "colon");
    [12, 25].forEach(function (y) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "3"); c.setAttribute("cy", String(y)); c.setAttribute("r", "1.9");
      svg.appendChild(c);
    });
    return svg;
  }

  function render(el, text) {
    if (el._segText === text) return;
    if (!el._segCells || el._segCells.length !== text.length) {
      el.textContent = "";
      el._segCells = [];
      for (var i = 0; i < text.length; i++) {
        var node = text[i] === ":" ? colon() : digit();
        el.appendChild(node);
        el._segCells.push(node);
      }
    }
    for (var j = 0; j < text.length; j++) {
      var ch = text[j];
      if (ch === ":") continue;
      var bits = MAP[ch] || MAP[" "];
      var polys = el._segCells[j].children;
      for (var k = 0; k < 7; k++) polys[k].classList.toggle("on", bits[k] === "1");
    }
    el._segText = text;
  }

  window.Seg = { render: render };
})();
