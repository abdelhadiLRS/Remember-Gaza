/**
 * Martyr-page tributes — public-facing comments section.
 *
 * Activates the section appended to /martyrs/show/<id>/<slug>. Reads
 * martyr id + CSRF token from <section id="m-tributes" data-...>,
 * pulls approved comments + the author's own pending ones from
 * /api/martyr-comments, and posts new tributes (top-level or reply)
 * to /api/martyr-comment-submit.
 *
 * All user-supplied content reaches the DOM via textContent only —
 * the API can return whatever the visitor typed; rendering must not
 * interpret it as HTML.
 */
(function () {
    'use strict';

    var section, martyrId, csrf, apiBase, listEl, countEl, formEl;
    var formNameEl, formLocEl, formMsgEl, formCounterEl, formStatusEl,
        formSubmitEl, formParentIdEl, formReplyBlockEl, formReplyTargetEl,
        formReplyCancelEl, formHoneypotEl;
    var L = {}; // labels — read from data-label-* attrs on init
    var lang = 'ar';
    var state = {
        offset: 0,
        limit: 20,
        loadedTopIds: new Set(),
        replyParentId: null,
        sending: false,
    };

    var AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#6366f1'];

    // The tributes section is server-rendered as part of the martyr modal
    // (api/martyrs.php?mid=...), which is injected into .fullOverlay AFTER
    // DOMContentLoaded fires. So we listen for both: DOMContentLoaded for
    // any standalone use, plus an exposed window.shireenInitTributes()
    // that the modal-renderer (pages/martyrs.php's showMartyer) calls
    // after $(".fullOverlay").html(data).
    document.addEventListener('DOMContentLoaded', init);
    window.shireenInitTributes = init;

    function init() {
        section = document.getElementById('m-tributes');
        if (!section) return;
        // Idempotent: a second call after the same section is already
        // wired up is a no-op. Each call to showMartyer() ends with init();
        // we don't want duplicate event listeners on the form.
        if (section.dataset.tributesReady === '1') return;
        section.dataset.tributesReady = '1';
        // Pull all i18n strings off the section's data-label-* attrs.
        // The server sets them based on $isEn at render time.
        L = {
            reply:           section.getAttribute('data-label-reply')         || '↩ رد',
            replyTarget:     section.getAttribute('data-label-reply-target')  || 'الرد على ',
            visitor:         section.getAttribute('data-label-visitor')       || 'زائر',
            pending:         section.getAttribute('data-label-pending')       || 'بانتظار المراجعة',
            loadmore:        section.getAttribute('data-label-loadmore')      || 'تحميل المزيد',
            loadFail:        section.getAttribute('data-label-load-fail')     || 'تعذّر تحميل التعليقات.',
            sending:         section.getAttribute('data-label-sending')       || '⏳ جارٍ الإرسال…',
            submitOk:        section.getAttribute('data-label-submit-ok')     || 'تم استلام تعليقك.',
            submitFail:      section.getAttribute('data-label-submit-fail')   || '✗ تعذّر الإرسال',
            networkFail:     section.getAttribute('data-label-network-fail')  || '✗ تعذّر الاتصال بالخادم',
            msgRequired:     section.getAttribute('data-label-msg-required')  || 'الرسالة مطلوبة',
            msgLong:         section.getAttribute('data-label-msg-long')      || 'الرسالة طويلة جداً',
            toggleHide:      section.getAttribute('data-label-toggle-hide')   || 'إخفاء',
            toggleShow:      section.getAttribute('data-label-toggle-show')   || 'إظهار',
            repliesMoreOne:  section.getAttribute('data-label-replies-more-one')  || '+ رد آخر',
            repliesMoreMany: section.getAttribute('data-label-replies-more-many') || '+ {n} ردود أخرى',
        };
        lang = section.getAttribute('data-lang') || 'ar';
        // Reset per-instance state — the modal can render different
        // martyrs in sequence; the previous instance's loadedTopIds /
        // offset must not bleed into the new section.
        state.offset = 0;
        state.limit  = 20;
        state.loadedTopIds = new Set();
        state.replyParentId = null;
        state.sending = false;
        martyrId = parseInt(section.getAttribute('data-martyr-id'), 10) || 0;
        csrf     = section.getAttribute('data-csrf') || '';
        apiBase  = section.getAttribute('data-api-base') || '/';
        if (!martyrId) return;

        listEl   = section.querySelector('.m-tributes-list');
        countEl  = section.querySelector('.m-tributes-count');
        formEl   = section.querySelector('.m-tributes-form');

        formNameEl       = formEl.querySelector('[name="name"]');
        formLocEl        = formEl.querySelector('[name="location"]');
        formMsgEl        = formEl.querySelector('[name="message"]');
        formHoneypotEl   = formEl.querySelector('[name="website_url"]');
        formParentIdEl   = formEl.querySelector('[name="parent_id"]');
        formSubmitEl     = formEl.querySelector('.m-tributes-submit');
        formCounterEl    = formEl.querySelector('.field-counter');
        formStatusEl     = formEl.querySelector('.m-tributes-form-status');
        formReplyBlockEl  = formEl.querySelector('.m-tributes-form-reply');
        formReplyTargetEl = formEl.querySelector('.m-tributes-form-reply-target');
        formReplyCancelEl = formEl.querySelector('.m-tributes-form-reply-cancel');

        loadComments(0, /*append*/ false);

        // Input → keep the counter accurate + auto-grow the textarea so the
        // visible height tracks the text content (clamped by CSS min/max).
        formMsgEl.addEventListener('input', function () {
            updateCounter();
            autoGrow();
        });
        // Focus → recompute height now (CSS min-height jumps from
        // collapsed-1-line to focused-min via :focus-within; if the
        // textarea already has content, autoGrow makes sure the existing
        // value renders fully at the focused size).
        formMsgEl.addEventListener('focus', autoGrow);
        // Focusout → if focus is leaving the entire form, clear the
        // inline height so the collapsed CSS (min-height: 32px,
        // overflow-y: hidden) takes back over and the textarea shrinks to
        // a single line again.
        formEl.addEventListener('focusout', function (e) {
            if (!e.relatedTarget || !formEl.contains(e.relatedTarget)) {
                formMsgEl.style.height = '';
            }
        });
        formEl.addEventListener('submit', handleSubmit);
        if (formReplyCancelEl) formReplyCancelEl.addEventListener('click', clearReplyMode);

        // Collapse-to-header toggle. When collapsed, the section drops to
        // its header's natural height (CSS via .is-collapsed) and the
        // story pane expands to fill the freed space — useful for long
        // memorials where the reader wants the whole story in view.
        var toggleBtn = section.querySelector('.m-tributes-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                var collapsed = section.classList.toggle('is-collapsed');
                toggleBtn.textContent = collapsed ? L.toggleShow : L.toggleHide;
                toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            });
        }

        // Expand/collapse is CSS-only via :focus-within on the form.
        // No JS state needed — focus enters → form expands, focus leaves
        // (clicks outside, Tab away) → form shrinks back automatically.

        var loadMoreBtn = section.querySelector('.m-tributes-loadmore');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', function (e) {
            e.preventDefault();
            loadComments(state.offset + state.limit, /*append*/ true);
        });
    }

    /* ─── List rendering ─────────────────────────────────────────────── */

    function loadComments(offset, append) {
        if (!append) {
            clear(listEl);
            for (var i = 0; i < 3; i++) {
                var sk = document.createElement('li');
                sk.className = 'm-tributes-skeleton';
                listEl.appendChild(sk);
            }
        }
        fetch(apiBase + 'API/martyr-comments?id=' + martyrId + '&offset=' + offset + '&lang=' + encodeURIComponent(lang), {
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!append) clear(listEl);
            state.offset = offset;
            state.limit  = data.limit  || 5;
            renderCount(data.total_top_level || 0);
            if (data.comments && data.comments.length) {
                data.comments.forEach(function (c) {
                    if (state.loadedTopIds.has(c.mc_id)) return;
                    state.loadedTopIds.add(c.mc_id);
                    listEl.appendChild(buildItem(c, /*isReply*/ false));
                });
            }
            toggleLoadMore(!!data.has_more);
            updateEmptyState();
        })
        .catch(function () {
            if (!append) {
                clear(listEl);
                var err = document.createElement('li');
                err.className = 'm-tributes-empty';
                err.textContent = L.loadFail;
                listEl.appendChild(err);
                updateEmptyState();
            }
        });
    }

    function renderCount(n) {
        if (!countEl) return;
        countEl.textContent = n > 0 ? '(' + n + ')' : '';
    }
    function toggleLoadMore(show) {
        var wrap = section.querySelector('.m-tributes-loadmore-wrap');
        if (wrap) wrap.hidden = !show;
    }
    /**
     * Toggle the .is-empty class based on whether any top-level
     * comment is currently rendered (approved or pending). CSS uses
     * the class to hide the header + scroll area so the section
     * collapses to just the form when nothing is loaded.
     */
    function updateEmptyState() {
        if (!listEl || !section) return;
        var hasItems = listEl.querySelector('li.m-tributes-item') !== null;
        section.classList.toggle('is-empty', !hasItems);
    }

    /**
     * Build one comment <li> in light-bubble style. The bubble owns the
     * background + rounded corners; reply button + nested replies are
     * siblings of the bubble, not inside it. Pending badge renders only
     * for items the API flagged (= the author's own session-scoped
     * pending entries).
     */
    function buildItem(c, isReply) {
        var li = document.createElement('li');
        li.className = isReply ? 'm-tributes-reply' : 'm-tributes-item';
        li.dataset.commentId = c.mc_id;

        var bubble = document.createElement('div');
        bubble.className = 'm-tributes-bubble';

        var head = document.createElement('div');
        head.className = 'm-tributes-bubble-head';

        var av = document.createElement('span');
        av.className = 'm-tributes-avatar';
        var nameForAvatar = c.name || '?';
        av.style.background = avatarColor(nameForAvatar);
        av.textContent = initialsOf(nameForAvatar);
        head.appendChild(av);

        var nameEl = document.createElement('span');
        nameEl.className = 'm-tributes-name';
        nameEl.dir = 'auto';
        if (!c.name) {
            nameEl.classList.add('is-anon');
            nameEl.textContent = L.visitor;
        } else {
            nameEl.textContent = c.name;
        }
        head.appendChild(nameEl);

        if (c.location) {
            var loc = document.createElement('span');
            loc.className = 'm-tributes-meta-loc';
            loc.dir = 'auto';
            loc.textContent = c.location;
            head.appendChild(loc);
        }

        if (c.pending) {
            var pill = document.createElement('span');
            pill.className = 'm-tributes-pending';
            pill.textContent = L.pending;
            head.appendChild(pill);
        }

        var dateEl = document.createElement('span');
        dateEl.className = 'm-tributes-date';
        dateEl.title = c.created_at || '';
        dateEl.textContent = c.relative_date || '';
        head.appendChild(dateEl);

        bubble.appendChild(head);

        var msg = document.createElement('div');
        msg.className = 'm-tributes-message';
        // dir="auto" — visitor messages can be in any script; let the
        // browser pick alignment from the first strong character so an
        // Arabic message inside an EN section (or vice versa) still flows
        // naturally.
        msg.dir = 'auto';
        msg.textContent = c.message || '';
        bubble.appendChild(msg);

        li.appendChild(bubble);

        // Reply button + nested replies — top-level only. Reply button
        // hidden on pending entries since the comment isn't yet public.
        if (!isReply) {
            if (!c.pending) {
                var rb = document.createElement('button');
                rb.type = 'button';
                rb.className = 'm-tributes-reply-btn';
                rb.textContent = L.reply;
                rb.addEventListener('click', function () {
                    enterReplyMode(c.mc_id, c.name || L.visitor);
                });
                li.appendChild(rb);
            }
            if (c.replies && c.replies.length) {
                var ul = document.createElement('ul');
                ul.className = 'm-tributes-replies';
                c.replies.forEach(function (r) {
                    ul.appendChild(buildItem(r, /*isReply*/ true));
                });
                // "+N more replies" hint when the server truncated this
                // parent's reply set. Total comes from the API's
                // total_replies field; shown count = c.replies.length.
                var total = (typeof c.total_replies === 'number') ? c.total_replies : c.replies.length;
                if (total > c.replies.length) {
                    var hint = document.createElement('li');
                    hint.className = 'm-tributes-replies-more';
                    var remaining = total - c.replies.length;
                    hint.textContent = remaining === 1
                        ? L.repliesMoreOne
                        : L.repliesMoreMany.replace('{n}', String(remaining));
                    ul.appendChild(hint);
                }
                li.appendChild(ul);
            }
        }

        return li;
    }

    /* ─── Form ───────────────────────────────────────────────────────── */

    function enterReplyMode(parentId, parentDisplayName) {
        state.replyParentId = parentId;
        if (formParentIdEl)    formParentIdEl.value = String(parentId);
        if (formReplyTargetEl) formReplyTargetEl.textContent = (L.replyTarget || '') + parentDisplayName;
        if (formReplyBlockEl)  formReplyBlockEl.hidden = false;
        // Scroll the form into view and focus the message field.
        if (formEl && formEl.scrollIntoView) {
            formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(function () { formMsgEl.focus(); }, 300);
    }

    function clearReplyMode() {
        state.replyParentId = null;
        if (formParentIdEl)    formParentIdEl.value = '';
        if (formReplyTargetEl) formReplyTargetEl.textContent = '';
        if (formReplyBlockEl)  formReplyBlockEl.hidden = true;
    }

    function updateCounter() {
        var n = formMsgEl.value.length;
        var max = 1000;
        formCounterEl.textContent = n + ' / ' + max;
        formCounterEl.classList.toggle('is-warn', n > max * 0.85 && n <= max);
        formCounterEl.classList.toggle('is-bad',  n > max);
    }

    /**
     * Resize the textarea to fit its content. Clamped by the CSS
     * min-height (collapsed = 32px / focused = 56px) and max-height
     * (180px in focused mode). Setting style.height to 'auto' first
     * forces a reflow that gives an accurate scrollHeight measurement,
     * even when shrinking.
     */
    function autoGrow() {
        if (!formMsgEl) return;
        formMsgEl.style.height = 'auto';
        formMsgEl.style.height = formMsgEl.scrollHeight + 'px';
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (state.sending) return;
        var msg = (formMsgEl.value || '').trim();
        if (!msg) { setStatus(L.msgRequired, 'err'); return; }
        if (msg.length > 1000) { setStatus(L.msgLong, 'err'); return; }

        state.sending = true;
        formSubmitEl.disabled = true;
        setStatus(L.sending, '');

        var body = {
            martyr_id:   martyrId,
            parent_id:   state.replyParentId,
            name:        (formNameEl.value || '').trim(),
            location:    (formLocEl.value  || '').trim(),
            message:     msg,
            website_url: formHoneypotEl ? formHoneypotEl.value : '',
            csrf_token:  csrf,
        };

        fetch(apiBase + 'API/martyr-comment-submit?lang=' + encodeURIComponent(lang), {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify(body),
        })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
            state.sending = false;
            formSubmitEl.disabled = false;
            if (!res.ok || res.body.error) {
                setStatus(res.body.error ? ('✗ ' + res.body.error) : L.submitFail, 'err');
                return;
            }
            // Success — prepend the pending comment in-place so the author
            // sees their own message immediately.
            if (res.body.comment) injectOwnPending(res.body.comment);
            formMsgEl.value = '';
            formMsgEl.style.height = '';  // drop inline height → CSS collapsed min-height wins
            updateCounter();
            setStatus(res.body.message || L.submitOk, 'ok');
            clearReplyMode();
            // Blur the active control so :focus-within drops and the form
            // collapses back to its compact textarea-only state — clearer
            // "done" cue than leaving focus on the submit button.
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
        })
        .catch(function () {
            state.sending = false;
            formSubmitEl.disabled = false;
            setStatus(L.networkFail, 'err');
        });
    }

    function injectOwnPending(c) {
        // Remove the empty placeholder if it's currently rendered.
        var empty = listEl.querySelector('.m-tributes-empty');
        if (empty) empty.remove();

        if (c.mc_parent_id) {
            // Reply — find the parent's <li> and append into its replies list.
            var parentLi = listEl.querySelector('li[data-comment-id="' + c.mc_parent_id + '"]');
            if (!parentLi) return; // parent not on this page; skip silently
            var repliesUl = parentLi.querySelector('.m-tributes-replies');
            if (!repliesUl) {
                repliesUl = document.createElement('ul');
                repliesUl.className = 'm-tributes-replies';
                parentLi.appendChild(repliesUl);
            }
            repliesUl.appendChild(buildItem(c, /*isReply*/ true));
        } else {
            // Top-level — append (list is sorted oldest → newest, so the
            // visitor's own pending submission belongs at the end).
            state.loadedTopIds.add(c.mc_id);
            listEl.appendChild(buildItem(c, /*isReply*/ false));
        }
        // Submission means the section is no longer empty — drop the
        // is-empty class so the header (and toggle) re-appears.
        updateEmptyState();
    }

    function setStatus(text, kind) {
        formStatusEl.textContent = text || '';
        formStatusEl.classList.remove('is-ok', 'is-err');
        if (kind === 'ok')  formStatusEl.classList.add('is-ok');
        if (kind === 'err') formStatusEl.classList.add('is-err');
    }

    /* ─── Helpers ────────────────────────────────────────────────────── */

    function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

    function initialsOf(name) {
        var parts = String(name || '').trim().split(/\s+/);
        var out = '';
        for (var i = 0; i < parts.length && i < 2; i++) {
            if (parts[i]) out += parts[i].charAt(0);
        }
        return out.toUpperCase() || '?';
    }
    function avatarColor(name) {
        var s = String(name || '');
        var h = 0;
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return AVATAR_COLORS[h % AVATAR_COLORS.length];
    }
})();
