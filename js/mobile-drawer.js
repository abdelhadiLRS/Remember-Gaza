/**
 * Mobile Drawer (Sidebar) Navigation Module
 * Palestinian Souls (Remember Gaza)
 */

(function () {
  function createDrawerHTML() {
    if (document.getElementById('mobile-drawer-overlay')) return;

    const currentPath = window.location.pathname.split('/').pop() || 'gaza.html';

    const overlay = document.createElement('div');
    overlay.id = 'mobile-drawer-overlay';
    overlay.className = 'mobile-drawer-overlay';
    overlay.onclick = function (e) {
      if (e.target === overlay) {
        closeMobileDrawer();
      }
    };

    overlay.innerHTML = `
      <div class="mobile-drawer" id="mobile-drawer-panel" onclick="event.stopPropagation()">
        <div class="mobile-drawer-header">
          <div class="flex items-center gap-2">
            <span class="font-black text-red-500 text-base">أرواح</span>
            <span class="font-black text-white text-base" id="drawer-logo-text">فلسطين</span>
          </div>
          <button class="mobile-drawer-close flex items-center justify-center p-1.5 text-gray-400 hover:text-white transition-colors" onclick="closeMobileDrawer()" title="إغلاق" aria-label="إغلاق"><i class="fas fa-times text-lg"></i></button>
        </div>

        <div class="mobile-drawer-body">
          <!-- Section 1: Navigation -->
          <div class="mobile-drawer-section">
            <div class="mobile-drawer-title" data-i18n="drawer_sections_pages">أقسام المنصة</div>
            <nav class="mobile-drawer-nav">
              <a href="gaza.html" class="mobile-drawer-link ${currentPath === 'gaza.html' || currentPath === 'index.html' || currentPath === '' ? 'active' : ''}" id="drawer-tab-souls">
                <span data-i18n="nav_gaza">شهداء غزة</span>
              </a>
              <a href="journalists.html" class="mobile-drawer-link ${currentPath === 'journalists.html' ? 'active' : ''}" id="drawer-tab-journalists">
                <span data-i18n="nav_journalists">شهداء الصحافة</span>
              </a>
              <a href="westbank.html" class="mobile-drawer-link ${currentPath === 'westbank.html' ? 'active' : ''}" id="drawer-tab-westbank">
                <span data-i18n="nav_westbank">شهداء الضفة</span>
              </a>
              <a href="martyrs48.html" class="mobile-drawer-link ${currentPath === 'martyrs48.html' ? 'active' : ''}" id="drawer-tab-48">
                <span data-i18n="nav_martyrs48">شهداء 48</span>
              </a>
              <a href="milestones.html" class="mobile-drawer-link ${currentPath === 'milestones.html' ? 'active' : ''}" id="drawer-tab-milestones">
                <span data-i18n="nav_milestones">أبرز المحطات</span>
              </a>
              <a href="stats.html" class="mobile-drawer-link ${currentPath === 'stats.html' ? 'active' : ''}" id="drawer-tab-stats">
                <span data-i18n="nav_stats">الإحصائيات</span>
              </a>
              <a href="map.html" class="mobile-drawer-link ${currentPath === 'map.html' ? 'active' : ''}" id="drawer-tab-map">
                <span data-i18n="nav_map">الخريطة التفاعلية</span>
              </a>
            </nav>
          </div>

          <!-- Section 2: Quick Actions -->
          <div class="mobile-drawer-section">
            <div class="mobile-drawer-title" data-i18n="drawer_sections_quick">الخدمات السريعة</div>
            <div class="mobile-drawer-actions">
              <button onclick="handleDrawerAction('crowdsource')" class="mobile-drawer-action-btn crowdsource">
                <i class="fas fa-edit text-sm"></i>
                <span data-i18n="add_comment">إضافة شهادة أو توثيق</span>
              </button>

              <button onclick="handleDrawerAction('donate')" class="mobile-drawer-action-btn donate">
                <i class="fas fa-hand-holding-heart text-sm"></i>
                <span data-i18n="donate">تبرع للأرشيف</span>
              </button>

              <button onclick="handleDrawerAction('share')" class="mobile-drawer-action-btn share">
                <i class="fas fa-share-nodes text-sm"></i>
                <span data-i18n="share_platform">مشاركة المنصة</span>
              </button>
            </div>
          </div>

          <!-- Section 3: Social Links -->
          <div class="mobile-drawer-section">
            <div class="mobile-drawer-title" data-i18n="drawer_sections_social">حسابات المنصة</div>
            <div class="flex items-center justify-between px-2 pt-1 gap-2">
              <a href="https://www.facebook.com/abdelhadilrs" target="_blank" rel="noopener" class="social-btn-premium social-btn-facebook flex-1" title="Facebook" aria-label="Facebook">
                <i class="fab fa-facebook-f text-base"></i>
              </a>
              <a href="https://www.instagram.com/abdelhadilrs" target="_blank" rel="noopener" class="social-btn-premium social-btn-instagram flex-1" title="Instagram" aria-label="Instagram">
                <i class="fab fa-instagram text-base"></i>
              </a>
              <a href="https://x.com/larrasabdelhadi" target="_blank" rel="noopener" class="social-btn-premium social-btn-x flex-1" title="X" aria-label="X">
                <i class="fab fa-x-twitter text-base"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Apply translations if i18n module is loaded
    if (window.i18n && typeof window.i18n.updateDOM === 'function') {
      window.i18n.updateDOM();
    }
  }

  function injectHamburgerButton() {
    const existingBtn = document.getElementById('mobile-menu-btn');
    if (existingBtn) {
      existingBtn.onclick = window.toggleMobileDrawer;
      return;
    }

    const headerRightContainer = document.querySelector('#header > div:first-child');
    if (!headerRightContainer) return;

    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.id = 'mobile-menu-btn';
    hamburgerBtn.className = 'action-circle-btn md:hidden flex items-center justify-center';
    hamburgerBtn.title = 'القائمة الجانبية';
    hamburgerBtn.setAttribute('aria-label', 'فتح القائمة الجانبية');
    hamburgerBtn.onclick = window.toggleMobileDrawer;
    hamburgerBtn.innerHTML = `<i class="fas fa-bars text-base"></i>`;

    headerRightContainer.insertBefore(hamburgerBtn, headerRightContainer.firstChild);
  }

  window.toggleMobileDrawer = function () {
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!overlay) return;
    if (overlay.classList.contains('active')) {
      window.closeMobileDrawer();
    } else {
      window.openMobileDrawer();
    }
  };

  window.openMobileDrawer = function () {
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeMobileDrawer = function () {
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.handleDrawerAction = function (action) {
    window.closeMobileDrawer();
    if (action === 'crowdsource') {
      window.location.href = 'edit-martyr.html';
    } else if (action === 'donate') {
      window.open('https://paypal.me/LRSabdelhadi', '_blank');
    } else if (action === 'share') {
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('تم نسخ رابط المنصة بنجاح!');
      }
    }
  };

  // Close drawer on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.closeMobileDrawer();
    }
  });

  // Setup Touch / Swipe Gesture
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
        // Swiping right in RTL closes menu, swiping left in LTR closes menu
        if ((isRTL && diffX > 50) || (!isRTL && diffX < -50)) {
          window.closeMobileDrawer();
        }
      }
    }
  });

  function initMobileDrawer() {
    createDrawerHTML();
    injectHamburgerButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileDrawer);
  } else {
    initMobileDrawer();
  }
})();
