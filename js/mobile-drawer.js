/**
 * Mobile Drawer (Sidebar) Navigation Module
 * Palestinian Souls (Remember Gaza)
 */

(function () {
  function createDrawerHTML() {
    if (document.getElementById('mobile-drawer-overlay')) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

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
          <button class="mobile-drawer-close" onclick="closeMobileDrawer()" title="إغلاق">✕</button>
        </div>

        <div class="mobile-drawer-body">
          <!-- Section 1: Navigation -->
          <div class="mobile-drawer-section">
            <div class="mobile-drawer-title" data-i18n="drawer_sections_pages">أقسام المنصة</div>
            <nav class="mobile-drawer-nav">
              <a href="index.html" class="mobile-drawer-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}" id="drawer-tab-souls">
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
                <img src="images/edit.png" class="w-4 h-4 object-contain" alt="edit">
                <span data-i18n="add_comment">إضافة شهادة أو توثيق</span>
              </button>

              <button onclick="handleDrawerAction('donate')" class="mobile-drawer-action-btn donate">
                <img src="images/donation.png" class="w-4 h-4 object-contain" alt="donate">
                <span data-i18n="donate">تبرع للأرشيف</span>
              </button>

              <button onclick="handleDrawerAction('share')" class="mobile-drawer-action-btn share">
                <img src="images/share.png" class="w-4 h-4 object-contain" alt="share">
                <span data-i18n="share_platform">مشاركة المنصة</span>
              </button>
            </div>
          </div>

          <!-- Section 3: Social Links -->
          <div class="mobile-drawer-section">
            <div class="mobile-drawer-title" data-i18n="drawer_sections_social">حسابات المنصة</div>
            <div class="flex items-center justify-between px-2 pt-1">
              <a href="https://x.com" target="_blank" rel="noopener" class="mobile-social-icon" title="X (Twitter)">
                <img src="images/x.png" class="w-4 h-4 object-contain" alt="X">
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" class="mobile-social-icon" title="Facebook">
                <img src="images/facebook.png" class="w-4 h-4 object-contain" alt="Facebook">
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" class="mobile-social-icon" title="Instagram">
                <img src="images/instagram.png" class="w-4 h-4 object-contain" alt="Instagram">
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
    hamburgerBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

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
      const modal = document.getElementById('crowdsource-modal-overlay');
      if (modal) {
        modal.style.display = 'flex';
      } else {
        window.location.href = 'index.html#crowdsource';
      }
    } else if (action === 'donate') {
      const modal = document.getElementById('donation-modal-overlay');
      if (modal) {
        modal.style.display = 'flex';
      } else {
        window.open('https://gofundme.com', '_blank');
      }
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
