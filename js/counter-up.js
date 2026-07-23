/**
 * Lightweight number-count-up animation for `.counter` elements.
 * Replaces waypoints 2.0.3 + jquery.counterup.js (incompatible with jQuery 3).
 * No dependencies.
 */
(function () {
    if (!('IntersectionObserver' in window) || !('requestAnimationFrame' in window)) return;

    var DURATION_MS = 1000;

    function formatNumber(n, decimals, hasCommas) {
        var s = decimals > 0 ? n.toFixed(decimals) : String(Math.floor(n));
        if (hasCommas) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return s;
    }

    function countUp(el) {
        var raw = (el.textContent || '').trim();
        var hasCommas = /[0-9],[0-9]/.test(raw);
        var cleaned = raw.replace(/,/g, '');
        if (!/^\d+(\.\d+)?$/.test(cleaned)) return;
        var target = parseFloat(cleaned);
        var decimals = cleaned.indexOf('.') >= 0 ? cleaned.split('.')[1].length : 0;
        var start = performance.now();

        function frame(now) {
            var t = Math.min(1, (now - start) / DURATION_MS);
            var eased = 1 - (1 - t) * (1 - t);
            el.textContent = formatNumber(eased * target, decimals, hasCommas);
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = formatNumber(target, decimals, hasCommas);
        }
        requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                io.unobserve(e.target);
                countUp(e.target);
            }
        });
    }, { threshold: 0.1 });

    function scan() {
        var els = document.querySelectorAll('.counter');
        for (var i = 0; i < els.length; i++) io.observe(els[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }
})();
