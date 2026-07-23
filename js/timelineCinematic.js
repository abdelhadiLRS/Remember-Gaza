/**
 * Martyrs Timeline — Cinematic, "tracker" rev (rev 13)
 *
 * Vanilla port of the GSAP pattern used in
 *   https://codepen.io/emrekuarktek/pen/bGOzYKd
 *
 * Bidirectional binding between page scroll and the horizontal tracker:
 *   - Vertical scroll  → translates the .tlc-tracker-track left.
 *   - Drag the track   → scrolls the page vertically.
 *   - Click a track item → smooth-scrolls the page to that section.
 *   - On release after a drag, an inertia loop carries the throw to a stop.
 *
 * No scroll-jacking, no scroll-snap, no sticky pins inside content
 * sections. Each `.tlc-decade` and `.tlc-scene` is a normal min-height:100vh
 * section in the page flow.
 *
 * Also marks the current item in the tracker, opens the modal on
 * "Read more" click, and is keyboard-accessible (anchor links + tab).
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const root    = document.getElementById('tlc-root');
        if (!root) return;

        const tracker   = root.querySelector('.tlc-tracker');
        const track     = root.querySelector('.tlc-tracker-track');
        const items     = Array.from(root.querySelectorAll('.tlc-tracker-item'));
        const sections  = Array.from(root.querySelectorAll('.tlc-scene, .tlc-decade'));
        const modal     = document.getElementById('tlc-modal');
        const currentEl = root.querySelector('.tlc-tracker-current');
        const tooltipEl = root.querySelector('.tlc-tracker-tooltip');

        if (!tracker || !track || items.length === 0) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ─── Geometry ────────────────────────────────────────────────
           Everything is computed in **viewport coordinates** via
           getBoundingClientRect — that's direction-agnostic (works the
           same for LTR and RTL) and unaffected by which offsetParent each
           element happens to have.

           baselineOffset = trackOffset value at scrollY=0 (first item's
                            centre lines up with the marker).
           draggableWidth = lastItemCentre − firstItemCentre.
                            Signed: positive in LTR (last is to the right
                            of first), negative in RTL (last is to the
                            left of first).
           At any scroll progress p ∈ [0, 1]:
               trackOffset = baselineOffset − p × draggableWidth
           This works for both directions without dirSign conditionals. */
        let baselineOffset = 0;
        let draggableWidth = 0;
        let pageScrollMax  = 0;

        function recalc() {
            // Reset to a clean baseline so measurements aren't polluted
            // by an in-flight transform or the residual CSS padding.
            track.style.setProperty('--tlc-tracker-x', '0px');
            track.style.paddingInlineStart = '0px';
            track.style.paddingInlineEnd   = '0px';
            // Force a synchronous layout pass so getBoundingClientRect
            // reflects the reset state.
            void track.offsetWidth;

            const markerEl = tracker.querySelector('.tlc-tracker-marker');
            if (!markerEl || items.length === 0) return;

            const markerRect = markerEl.getBoundingClientRect();
            const firstRect  = items[0].getBoundingClientRect();
            const lastRect   = items[items.length - 1].getBoundingClientRect();

            const markerCentre = markerRect.left + markerRect.width / 2;
            const firstCentre  = firstRect.left  + firstRect.width  / 2;
            const lastCentre   = lastRect.left   + lastRect.width   / 2;

            baselineOffset = markerCentre - firstCentre;
            draggableWidth = lastCentre - firstCentre;

            pageScrollMax = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

            // Snap the track back to the right offset for current scroll.
            syncFromScroll();
        }
        // Recompute on layout shifts (resize + after images load).
        window.addEventListener('resize', recalc);
        window.addEventListener('load', recalc);

        /* ─── Scroll → track translation ──────────────────────────────── */
        let trackOffset = 0; // current translateX in px (negative)
        let dragging = false;
        let inertiaRaf = 0;

        function applyTrackOffset() {
            track.style.setProperty('--tlc-tracker-x', trackOffset.toFixed(1) + 'px');
        }
        function syncFromScroll() {
            if (dragging || inertiaRaf) return;
            const sy = window.scrollY;
            const progress = pageScrollMax > 0 ? sy / pageScrollMax : 0;
            trackOffset = baselineOffset - progress * draggableWidth;
            applyTrackOffset();
            updateCurrent();
        }

        let scrollPending = false;
        window.addEventListener('scroll', function () {
            if (scrollPending) return;
            scrollPending = true;
            requestAnimationFrame(function () {
                scrollPending = false;
                syncFromScroll();
            });
        }, { passive: true });

        // Initial layout pass — compute baselineOffset / draggableWidth
        // and apply the right translateX for the current scroll position.
        // Defer one frame so the layout is fully settled.
        requestAnimationFrame(recalc);

        /* ─── Drag track → page scroll ───────────────────────────────── */
        let dragStartX = 0;
        let dragStartOffset = 0;
        let dragLastX = 0;
        let dragLastTime = 0;
        let dragVelocity = 0;
        let activePointerId = null;

        function onPointerDown(e) {
            if (e.button !== undefined && e.button !== 0) return; // primary only
            if (reduceMotion) return;
            // Don't hijack clicks on the actual links — let them anchor-jump
            // unless the user actually drags.
            dragging = false; // confirmed only after movement
            if (inertiaRaf) { cancelAnimationFrame(inertiaRaf); inertiaRaf = 0; }
            dragStartX = e.clientX;
            dragStartOffset = trackOffset;
            dragLastX = e.clientX;
            dragLastTime = performance.now();
            dragVelocity = 0;
            activePointerId = e.pointerId;
            track.setPointerCapture(e.pointerId);
        }
        function onPointerMove(e) {
            if (e.pointerId !== activePointerId) return;
            const dx = e.clientX - dragStartX;
            // Distinguish a drag from a click (>4px movement).
            if (!dragging && Math.abs(dx) > 4) {
                dragging = true;
                track.classList.add('is-dragging');
            }
            if (!dragging) return;

            // Drag math: trackOffset ranges from baselineOffset (scrollY=0)
            // to baselineOffset - draggableWidth (scrollY=max). Direction is
            // baked into the sign of draggableWidth, so the same formula
            // works in LTR and RTL.
            const a = baselineOffset;
            const b = baselineOffset - draggableWidth;
            const minOff = Math.min(a, b);
            const maxOff = Math.max(a, b);
            trackOffset = Math.max(minOff, Math.min(maxOff, dragStartOffset + dx));
            applyTrackOffset();

            const progress = draggableWidth !== 0
                ? (baselineOffset - trackOffset) / draggableWidth
                : 0;
            window.scrollTo(0, progress * pageScrollMax);
            updateCurrent();

            const now = performance.now();
            const dt = now - dragLastTime;
            if (dt > 0) {
                // Velocity in px/ms — used by the inertia loop.
                dragVelocity = (e.clientX - dragLastX) / dt;
            }
            dragLastX = e.clientX;
            dragLastTime = now;
        }
        function onPointerUp(e) {
            if (e.pointerId !== activePointerId) return;
            try { track.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
            activePointerId = null;
            if (!dragging) return; // it was just a click — anchor handles it
            dragging = false;
            track.classList.remove('is-dragging');

            // Inertia loop — friction + velocity until below threshold.
            if (Math.abs(dragVelocity) < 0.05) return;
            let v = dragVelocity;
            const friction = 0.94;
            const a = baselineOffset;
            const b = baselineOffset - draggableWidth;
            const minOff = Math.min(a, b);
            const maxOff = Math.max(a, b);
            const tick = function () {
                v *= friction;
                if (Math.abs(v) < 0.05) { inertiaRaf = 0; return; }
                trackOffset = Math.max(minOff, Math.min(maxOff, trackOffset + v * 16));
                applyTrackOffset();
                const progress = draggableWidth !== 0
                    ? (baselineOffset - trackOffset) / draggableWidth
                    : 0;
                window.scrollTo(0, progress * pageScrollMax);
                updateCurrent();
                inertiaRaf = requestAnimationFrame(tick);
            };
            inertiaRaf = requestAnimationFrame(tick);
        }

        track.addEventListener('pointerdown', onPointerDown);
        track.addEventListener('pointermove', onPointerMove);
        track.addEventListener('pointerup',   onPointerUp);
        track.addEventListener('pointercancel', onPointerUp);

        /* ─── Anchor click → smooth scroll ──────────────────────────── */
        items.forEach(function (item) {
            const a = item.querySelector('a');
            if (!a) return;
            a.addEventListener('click', function (e) {
                if (dragging) { e.preventDefault(); return; }
                const href = a.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                // Land the section just below the floating menu (the tracker
                // is now at the bottom — no longer covers the top edge).
                const offset = 80 + 16; // header + a small breathing buffer
                const y = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            });
        });

        /* ─── Current-section tracking + tracker active state ──────── */
        let currentItem = null;
        function updateCurrent() {
            const vh = window.innerHeight;
            const probeY = 80 + 60;
            let bestSection = null;
            let bestDist = Infinity;
            sections.forEach(function (sec) {
                const r = sec.getBoundingClientRect();
                if (r.bottom < 0 || r.top > vh) return;
                const d = Math.abs(r.top - probeY);
                if (d < bestDist) { bestDist = d; bestSection = sec; }
            });
            if (!bestSection) {
                currentItem = null;
                if (currentEl) currentEl.classList.remove('is-visible');
                return;
            }

            const targetId = bestSection.id;
            let matched = null;
            items.forEach(function (item) {
                const a = item.querySelector('a');
                const matches = a && a.getAttribute('href') === '#' + targetId;
                item.classList.toggle('is-current', matches);
                if (matches) matched = item;
            });

            if (matched !== currentItem) {
                currentItem = matched;
                if (currentEl && currentItem) {
                    const a = currentItem.querySelector('a');
                    const txt = a.dataset.tooltip || a.textContent.trim();
                    currentEl.textContent = txt;
                    currentEl.classList.add('is-visible');
                } else if (currentEl) {
                    currentEl.classList.remove('is-visible');
                }
            }
        }

        /* ─── Hover tooltip — JS positions it above the hovered chip ─ */
        function positionTooltipOver(linkEl) {
            if (!tooltipEl) return;
            const r = linkEl.getBoundingClientRect();
            const trackerR = tracker.getBoundingClientRect();
            // Position centred above the link, in coordinates relative to
            // the tracker's content box.
            const x = r.left + r.width / 2 - trackerR.left;
            tooltipEl.style.left = x.toFixed(1) + 'px';
        }
        items.forEach(function (item) {
            const a = item.querySelector('a');
            if (!a || !a.dataset.tooltip || !tooltipEl) return;
            a.addEventListener('mouseenter', function () {
                if (dragging) return;
                tooltipEl.textContent = a.dataset.tooltip;
                positionTooltipOver(a);
                tooltipEl.classList.add('is-visible');
            });
            a.addEventListener('mouseleave', function () {
                tooltipEl.classList.remove('is-visible');
            });
            a.addEventListener('focus', function () {
                tooltipEl.textContent = a.dataset.tooltip;
                positionTooltipOver(a);
                tooltipEl.classList.add('is-visible');
            });
            a.addEventListener('blur', function () {
                tooltipEl.classList.remove('is-visible');
            });
        });

        /* ─── Modal ──────────────────────────────────────────────────── */
        const slots = modal && {
            title:  modal.querySelector('.tlc-modal-title'),
            meta:   modal.querySelector('.tlc-modal-meta'),
            img:    modal.querySelector('.tlc-modal-img'),
            desc:   modal.querySelector('.tlc-modal-desc'),
            stat:   modal.querySelector('.tlc-modal-stat'),
            source: modal.querySelector('.tlc-modal-source'),
            close:  modal.querySelector('.tlc-modal-close')
        };
        function moveInto(dest, src) {
            if (!dest) return;
            if (src) {
                dest.replaceChildren(...src.childNodes);
                dest.style.display = '';
            } else {
                dest.replaceChildren();
                dest.style.display = 'none';
            }
        }
        function openModal(scene) {
            if (!modal || !slots || !scene) return;
            const tpl = scene.querySelector('.tlc-data');
            if (!tpl) return;
            const frag = tpl.content.cloneNode(true);
            const titleSrc = frag.querySelector('.tlc-mdl-title');
            const metaSrc  = frag.querySelector('.tlc-mdl-meta');
            const imgSrc   = frag.querySelector('.tlc-mdl-img');
            const descSrc  = frag.querySelector('.tlc-mdl-desc');
            const statSrc  = frag.querySelector('.tlc-mdl-stat');
            const srcSrc   = frag.querySelector('.tlc-mdl-source');

            moveInto(slots.title, titleSrc);
            moveInto(slots.meta,  metaSrc);
            moveInto(slots.desc,  descSrc);
            moveInto(slots.stat,  statSrc);
            moveInto(slots.source, srcSrc);

            if (imgSrc && slots.img) {
                slots.img.setAttribute('src', imgSrc.getAttribute('src') || '');
                slots.img.setAttribute('alt', imgSrc.getAttribute('alt') || '');
                slots.img.style.display = '';
            } else if (slots.img) {
                slots.img.removeAttribute('src');
                slots.img.style.display = 'none';
            }
            if (typeof modal.showModal === 'function') modal.showModal();
            else modal.setAttribute('open', '');
            const content = modal.querySelector('.tlc-modal-content');
            if (content) content.scrollTop = 0;
        }
        function closeModal() {
            if (!modal) return;
            if (typeof modal.close === 'function') modal.close();
            else modal.removeAttribute('open');
        }
        Array.from(root.querySelectorAll('.tlc-scene')).forEach(function (scene) {
            const btn = scene.querySelector('.tlc-more');
            if (btn) btn.addEventListener('click', function () { openModal(scene); });
        });
        if (slots && slots.close) slots.close.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });
        }

        /* ─── Decade-card click → smooth scroll ─────────────────────── */
        Array.from(root.querySelectorAll('.tlc-decade-card')).forEach(function (card) {
            card.addEventListener('click', function (e) {
                const href = card.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                const offset = 80 + 16;
                const y = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            });
        });

        /* ─── Arrow keys → next / previous panel ─────────────────────── */
        // ↓ advances to the next decade or milestone in document order;
        // ↑ goes back. Skips when the modal is open or focus is in a form
        // field, so the keys still behave normally there.
        function findCurrentPanelIdx() {
            // The "current" panel is the last section whose top edge has
            // crossed the anchor line (just below the floating menu).
            const probeY = 80 + 60;
            let curIdx = 0;
            for (let i = 0; i < sections.length; i++) {
                const r = sections[i].getBoundingClientRect();
                if (r.top <= probeY + 5) curIdx = i;
            }
            return curIdx;
        }
        window.addEventListener('keydown', function (e) {
            if (modal && modal.open) return;
            if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
            const isNext = (e.key === 'ArrowDown');
            const isPrev = (e.key === 'ArrowUp');
            if (!isNext && !isPrev) return;
            if (sections.length === 0) return;

            const cur = findCurrentPanelIdx();
            const target = isNext
                ? Math.min(sections.length - 1, cur + 1)
                : Math.max(0, cur - 1);
            if (target === cur) return;

            e.preventDefault();
            const offset = 80 + 16;
            const y = sections[target].getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });

        // initial paint
        updateCurrent();
    });
})();
