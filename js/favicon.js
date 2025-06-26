(function() {
    const favicon = document.getElementById('dynamic-favicon');
    let angle = 0;
    function drawFavicon(angle) {
        const r = 14, cx = 16, cy = 16, stroke = 4;
        const start = angle, end = angle + 270;
        const toRad = a => (a-90) * Math.PI/180;
        const x1 = cx + r * Math.cos(toRad(start));
        const y1 = cy + r * Math.sin(toRad(start));
        const x2 = cx + r * Math.cos(toRad(end));
        const y2 = cy + r * Math.sin(toRad(end));
        const arcSweep = end-start <= 180 ? "0" : "1";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e40af"/>
              <stop offset="20%" stop-color="#2563eb"/>
              <stop offset="40%" stop-color="#3b82f6"/>
              <stop offset="60%" stop-color="#60a5fa"/>
              <stop offset="80%" stop-color="#3b82f6"/>
              <stop offset="90%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#1e40af"/>
            </linearGradient>
          </defs>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#g)" stroke-width="${stroke}" />
        </svg>`;
        return "data:image/svg+xml," + encodeURIComponent(svg);
    }
})();
