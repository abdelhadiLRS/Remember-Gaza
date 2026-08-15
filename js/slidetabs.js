/**
 * Palestinian Souls (Remember Gaza) - SlideTabs Navigation System
 * Native Vanilla JS implementation matching Framer Motion SlideTabs behavior.
 */

class SlideTabsEngine {
  constructor() {
    this.tabs = [
      { id: 'home', labelKey: 'nav_gaza', defaultLabel: 'الرئيسية' },
      { id: 'stats', labelKey: 'nav_stats', defaultLabel: 'الإحصائيات' },
      { id: 'journalists', labelKey: 'nav_journalists', defaultLabel: 'الصحفيون' },
      { id: 'westbank', labelKey: 'nav_westbank', defaultLabel: 'شهداء الضفة' },
      { id: 'martyrs48', labelKey: 'nav_martyrs48', defaultLabel: 'شهداء 48' },
      { id: 'milestones', labelKey: 'nav_milestones', defaultLabel: 'المحطات التاريخية' },
      { id: 'map', labelKey: 'nav_map', defaultLabel: 'الخريطة التفاعلية' }
    ];

    this.selectedIndex = 0;
    this.cursorPos = { left: 0, width: 0, opacity: 0 };
    this.observer = null;
    this.isClickScrolling = false;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.initObserver();
      this.handleInitialHash();
    });
  }

  renderTabs() {
    const desktopContainer = document.getElementById('slidetabs-list');
    if (!desktopContainer) return;

    desktopContainer.innerHTML = '';

    this.tabs.forEach((tab, index) => {
      const label = window.i18n ? window.i18n.t(tab.labelKey, tab.defaultLabel) : tab.defaultLabel;
      const li = document.createElement('li');
      li.className = `slidetabs-tab ${index === this.selectedIndex ? 'active' : ''}`;
      li.setAttribute('data-index', index);
      li.setAttribute('data-id', tab.id);
      li.innerText = label;

      li.addEventListener('mouseenter', () => this.setCursorToElement(li));
      li.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectTab(index, true);
      });

      desktopContainer.appendChild(li);
    });

    // Create animated cursor element
    let cursor = document.getElementById('slidetabs-cursor');
    if (!cursor) {
      cursor = document.createElement('li');
      cursor.id = 'slidetabs-cursor';
      cursor.className = 'slidetabs-cursor';
      desktopContainer.appendChild(cursor);
    }

    desktopContainer.addEventListener('mouseleave', () => {
      this.updateCursorToSelected();
    });

    // Initial positioning
    requestAnimationFrame(() => this.updateCursorToSelected());
  }

  renderMobileMenu() {
    const mobileMenu = document.getElementById('slidetabs-mobile-menu');
    if (!mobileMenu) return;

    mobileMenu.innerHTML = this.tabs.map((tab, index) => {
      const label = window.i18n ? window.i18n.t(tab.labelKey, tab.defaultLabel) : tab.defaultLabel;
      const isActive = index === this.selectedIndex;
      return `
        <a href="#${tab.id}" data-index="${index}" class="slidetabs-mobile-item ${isActive ? 'active' : ''}">
          <span>${label}</span>
          ${isActive ? '<span class="text-red-500 font-bold">✓</span>' : ''}
        </a>
      `;
    }).join('');

    mobileMenu.querySelectorAll('.slidetabs-mobile-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(item.getAttribute('data-index'), 10);
        this.selectTab(index, true);
        this.toggleMobileMenu(false);
      });
    });
  }

  setCursorToElement(el) {
    const cursor = document.getElementById('slidetabs-cursor');
    if (!el || !cursor) return;

    const offsetLeft = el.offsetLeft;
    const width = el.offsetWidth;

    cursor.style.left = `${offsetLeft}px`;
    cursor.style.width = `${width}px`;
    cursor.style.opacity = '1';
  }

  updateCursorToSelected() {
    const desktopContainer = document.getElementById('slidetabs-list');
    if (!desktopContainer) return;

    const selectedTab = desktopContainer.querySelector(`.slidetabs-tab[data-index="${this.selectedIndex}"]`);
    if (selectedTab) {
      this.setCursorToElement(selectedTab);
    }
  }

  selectTab(index, scroll = false) {
    if (index < 0 || index >= this.tabs.length) return;
    this.selectedIndex = index;

    const activeTab = this.tabs[index];

    // Update active class on desktop tabs
    const desktopContainer = document.getElementById('slidetabs-list');
    if (desktopContainer) {
      desktopContainer.querySelectorAll('.slidetabs-tab').forEach((tab, idx) => {
        if (idx === index) tab.classList.add('active');
        else tab.classList.remove('active');
      });
      this.updateCursorToSelected();
    }

    // Update mobile menu items
    const mobileMenu = document.getElementById('slidetabs-mobile-menu');
    if (mobileMenu) {
      mobileMenu.querySelectorAll('.slidetabs-mobile-item').forEach((item, idx) => {
        if (idx === index) item.classList.add('active');
        else item.classList.remove('active');
      });
    }

    // Update mobile trigger label
    const mobileLabel = document.getElementById('slidetabs-mobile-label');
    if (mobileLabel) {
      const label = window.i18n ? window.i18n.t(activeTab.labelKey, activeTab.defaultLabel) : activeTab.defaultLabel;
      mobileLabel.innerText = label;
    }

    // Smooth scroll to section if triggered by user click
    if (scroll) {
      this.isClickScrolling = true;
      const sectionEl = document.getElementById(activeTab.id);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without jumping
        if (window.history.pushState) {
          window.history.pushState(null, null, `#${activeTab.id}`);
        } else {
          window.location.hash = `#${activeTab.id}`;
        }
      }
      setTimeout(() => {
        this.isClickScrolling = false;
      }, 800);
    }

    // Trigger subpage mode switch if app.js is present
    if (typeof window.switchMainMode === 'function') {
      window.switchMainMode(activeTab.id);
    }
  }

  toggleMobileMenu(forceState) {
    const menu = document.getElementById('slidetabs-mobile-menu');
    if (!menu) return;

    const isHidden = menu.classList.contains('hidden') || menu.style.display === 'none';
    const show = forceState !== undefined ? forceState : isHidden;

    if (show) {
      this.renderMobileMenu();
      menu.classList.remove('hidden');
      menu.style.display = 'flex';
    } else {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }
  }

  initObserver() {
    const sectionIds = this.tabs.map(t => t.id);
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    this.observer = new IntersectionObserver((entries) => {
      if (this.isClickScrolling) return;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          const id = entry.target.id;
          const index = this.tabs.findIndex(t => t.id === id);
          if (index !== -1 && index !== this.selectedIndex) {
            this.selectTab(index, false);
          }
        }
      });
    }, {
      threshold: [0.3, 0.6],
      rootMargin: '-80px 0px -20% 0px'
    });

    sections.forEach(s => this.observer.observe(s));
  }

  handleInitialHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const index = this.tabs.findIndex(t => t.id === hash);
      if (index !== -1) {
        setTimeout(() => this.selectTab(index, true), 200);
        return;
      }
    }
    this.renderTabs();
    this.renderMobileMenu();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.updateCursorToSelected();
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      const index = this.tabs.findIndex(t => t.id === hash);
      if (index !== -1 && index !== this.selectedIndex) {
        this.selectTab(index, true);
      }
    });

    if (window.i18n) {
      window.i18n.onLanguageChange(() => {
        this.renderTabs();
        this.renderMobileMenu();
      });
    }

    const mobileBtn = document.getElementById('slidetabs-mobile-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });
    }

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('slidetabs-mobile-menu');
      const btn = document.getElementById('slidetabs-mobile-btn');
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        this.toggleMobileMenu(false);
      }
    });
  }
}

window.slideTabs = new SlideTabsEngine();
