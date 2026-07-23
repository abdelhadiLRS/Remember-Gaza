
$(document).on('click', '.menuBTN', function(e){
	$(".headMenu").toggleClass("active");
	$(".menuBTN").toggleClass("opened");
	$(".mob-overlay").toggleClass("active");
	e.preventDefault();
	return;
});
$(document).on('click', '.mob-overlay', function(){
	$(".headMenu").removeClass("active");
	$(".menuBTN").removeClass("opened");
	$(".mob-overlay").removeClass("active");
});
$(document).on('touchstart', '.headMenu>li:not(.active),.MenuArrow' , function(e) {
	if($(this).hasClass('MenuArrow'))
	{
		$(this).parent().toggleClass('active');
		$("li.active").not($(this).parent()).removeClass('active');
		e.stopPropagation();
		return;
	}
	else
	{
		$(this).toggleClass('active');
		$("li.active").not(this).removeClass('active');
	}
});
// IS_EN comes from layout/main.php (centralized 2026-05-04). No redeclaration here.

// ─── Small helpers used as data-action targets ─────────────────────────────
// Named so they can be referenced by `data-action="…"` on buttons that used
// to call these statements inline.
function setLocaleCookie(name, value, maxAge) {
    document.cookie = name + '=' + encodeURIComponent(value) + ';path=/;max-age=' + maxAge;
}
function historyBack() { history.back(); }
// Sentinel no-op. Used on modal bodies to stop click bubbling up to an
// overlay whose data-action would close the modal — the dispatcher picks
// up the innermost `data-action` via .closest, so any element with
// data-action="noop" swallows the click before the ancestor's handler runs.
function noop() {}

// ─── <img> error helpers (CSP replacement for inline onerror=) ─────────────
//   <img data-onerror="hide">                              → hide on load error
//   <img data-onerror="fallback" data-fallback-src="...">  → swap src on error
function bindImageErrorHandlers(root) {
    root = root || document;
    root.querySelectorAll('img[data-onerror="hide"]').forEach(function (img) {
        var hide = function () { img.style.display = 'none'; };
        img.addEventListener('error', hide, { once: true });
        if (img.complete && img.naturalWidth === 0) hide(); // cached miss
    });
    root.querySelectorAll('img[data-onerror="fallback"]').forEach(function (img) {
        var swap = function () {
            var fb = img.getAttribute('data-fallback-src');
            if (fb && img.src !== fb) {
                img.removeAttribute('data-fallback-src');
                img.src = fb;
            }
        };
        img.addEventListener('error', swap, { once: true });
        if (img.complete && img.naturalWidth === 0) swap();
    });
}
document.addEventListener('DOMContentLoaded', function () { bindImageErrorHandlers(document); });

// ─── data-action dispatcher (replaces inline onclick=) ─────────────────────
// Replaces `onclick="foo(123, 'x')"` with
//   <btn data-action="foo" data-args='[123,"x"]'>
// Steppingstone for strict CSP (script-src 'self' — no 'unsafe-inline').
// The element becomes `this`; args come from JSON in data-args.
// The dispatcher does NOT preventDefault — same semantics as inline onclick:
// navigation / submit still happens unless the handler calls e.preventDefault().
document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-action]');
    if (!el) return;
    var name = el.dataset.action;
    var fn   = window[name];
    if (typeof fn !== 'function') return;
    var args = [];
    if (el.dataset.args) {
        try { args = JSON.parse(el.dataset.args); } catch (err) { args = []; }
    }
    fn.apply(el, args);
});

// Keyboard parity: when a non-native-button [data-action] has role="button"
// and is focused, Enter / Space must fire the handler too. (Native <button>
// and <a> already convert these to click events; div/li with role do not.)
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('[data-action][role="button"]');
    if (!el) return;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') return; // browser handles
    e.preventDefault();
    el.click();
});
var martArr = [];
var martUnkownArr = [];
$(document).ready(function() {

	// .counter animation is handled by js/counter-up.js (native IntersectionObserver).
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
	return new bootstrap.Tooltip(tooltipTriggerEl,{
	  html: true ,
	  customClass : 'tooltip_text'
	})
	})
$(document).on("mouseup","body", function (e) {
	var l = $(e.target);
	if ($(l[0]).hasClass("tooltip-inner") == false && $(l[0]).parents(".tooltip-inner").length == 0 ) {
		tooltipList.forEach((tooltip) => {tooltip.hide()});
	}
});

});
function addCommas(nStr)
{
	return nStr.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}



/* trans() — EN governorate name → AR display name.
   Now derives from window.SHIREEN_GOVS (emitted by core/Govs.php in
   layout/main.php). lang === 'en' returns the term unchanged. */
function trans(term, lang = "ar") {
    if (lang === "en") return term;
    var catalog = (typeof window !== 'undefined' && window.SHIREEN_GOVS) || [];
    var needle = String(term).toLowerCase().trim();
    for (var i = 0; i < catalog.length; i++) {
        var row = catalog[i];
        if (String(row.en).toLowerCase() === needle) return row.ar;
        if (row.en_full && String(row.en_full).toLowerCase() === needle) return row.ar;
        var aliases = row.en_aliases || [];
        for (var j = 0; j < aliases.length; j++) {
            if (String(aliases[j]).toLowerCase() === needle) return row.ar;
        }
    }
    return term;
}




function showVideo(vid)
{
	$.ajax({
			type: 'GET',
			url: "ajax.php?vid="+vid,
			success:function(data){
				$.confirm({
				title: data.vTitle,
				backgroundDismiss: true,
				columnClass: 'L',
				content: data.vEmbed,
				buttons: {
					[IS_EN ? 'Close' : 'اغلاق']:  {}
				}
			});
		}
	});
}	
var loadingFlag = false;
$(document).bind("ajaxSend", function () {
            $(".ajaxLoading").removeClass("hidden").show();
			loadingFlag = true;
			// Safety hide — used to be 3s, but multipart uploads on the public
			// /mdb form (and the /NotNumbers form that shares it) can hold the
			// connection for 10–20 s when Cloudflare buffers the body. The
			// previous timeout hid the spinner mid-upload and the user saw
			// nothing happening. 60 s comfortably covers the longest expected
			// upload while still releasing the overlay if a request truly hangs.
			// ajaxComplete still hides instantly on normal fast responses.
			setTimeout(function(){ if(loadingFlag) $(".ajaxLoading").hide(); }, 60000);
        }).bind("ajaxComplete", function () {
            $(".ajaxLoading").hide();
			loadingFlag = false;
        });
		
// Legacy inline-Cropper.js code removed (2026-05-04). Kept `initCropper` as
// a no-op stub because filter-bar-home.js still calls it; mobile/admin photo
// flow runs through rebuilt/js/photo-editor/ now. The original handler was
// dead anyway (`.on('change', upload, ...)` with upload as a jQuery object
// instead of a selector string never bound).
var cropper = '';
function initCropper(loadedImg = null) { /* no-op */ }

function paganation(perPage=40,elem=".myrcard")
{
	$('#pages').pagination('destroy');;
	$(elem).show()
	var items = $(elem);
    var numItems =  $(elem).length;

    items.slice(perPage).hide();

    var paging = $('#pages').pagination({
        items:  numItems,
        itemsOnPage: perPage,
		displayedPages: 3,
        hrefTextPrefix: 'martyrs/year/2023/#page-',
        prevText: "&laquo;",
        nextText: "&raquo;",
        onPageClick: function (pageNumber) {
            var showFrom = perPage * (pageNumber - 1);
            var showTo = showFrom + perPage;
            items.fadeOut().delay(400).slice(showFrom, showTo).fadeIn();
			  $('html, body').stop().animate({
	        'scrollTop': $(".hr-text").offset().top
	    }, 600, 'swing', function () {
	        // window.location.hash = target;
	    });
        }
    });
}
