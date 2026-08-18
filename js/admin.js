/**
 * Palestinian Souls (Remember Gaza) - Refactored Admin Control Panel
 * Secure RBAC Access Control, Purged Hardcoded Secrets, Server-Side Authorization Workflows
 */

function openAdminReviewPanel() {
  if (!window.BackendAPI || !window.BackendAPI.isAuthenticated()) {
    promptAdminLoginModal();
    return;
  }
  renderAdminOverlay();
}

function promptAdminLoginModal() {
  let modal = document.getElementById('admin-login-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-login-modal';
    modal.className = 'fixed inset-0 z-[1008] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-["Cairo"] text-white';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-[#121212] border border-red-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-red-400 text-sm">تسجيل دخول الإدارة والمشرفين</h3>
        <button onclick="document.getElementById('admin-login-modal').style.display='none'" class="text-gray-400 hover:text-white"></button>
      </div>
      <div class="space-y-3 text-right text-xs">
        <div>
          <label class="text-gray-300 block mb-1">اسم المستخدم:</label>
          <input type="text" id="admin-login-username" placeholder="admin" class="w-full bg-black/60 border border-white/20 text-white px-3 py-2 rounded-xl outline-none focus:border-red-500 text-center font-mono">
        </div>
        <div>
          <label class="text-gray-300 block mb-1">كلمة المرور:</label>
          <input type="password" id="admin-login-password" placeholder="••••••••" class="w-full bg-black/60 border border-white/20 text-white px-3 py-2 rounded-xl outline-none focus:border-red-500 text-center font-mono">
        </div>
        <div id="admin-login-error" class="text-red-500 text-[11px] text-center hidden"></div>
        <button onclick="handleAdminLoginSubmit()" class="w-full bg-red-600 hover:bg-red-700 font-bold py-2 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">تسجيل الدخول الآمن</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

async function handleAdminLoginSubmit() {
  const u = document.getElementById('admin-login-username').value.trim();
  const p = document.getElementById('admin-login-password').value.trim();
  const errEl = document.getElementById('admin-login-error');

  if (errEl) errEl.classList.add('hidden');

  const res = await window.BackendAPI.login(u, p);
  if (res.success) {
    if (window.AuditLogger) window.AuditLogger.log('LOGIN', `User ${u} logged in as ${res.role}`);
    const loginModal = document.getElementById('admin-login-modal');
    if (loginModal) loginModal.style.display = 'none';
    renderAdminOverlay();
  } else {
    if (errEl) {
      errEl.innerText = res.message || 'بيانات الدخول غير صحيحة';
      errEl.classList.remove('hidden');
    }
  }
}

async function renderAdminOverlay() {
  const overlay = document.getElementById('admin-review-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  const role = window.BackendAPI.getUserRole();
  const container = document.getElementById('admin-submissions-list');
  if (!container) return;

  container.innerHTML = `<div class="text-gray-400 text-center py-4">جاري تحميل البيانات والمساهمات...</div>`;

  const list = await window.BackendAPI.getSubmissions('ALL');

  if (list.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-6">لا توجد مساهمات معلقة للمراجعة حالياً.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="flex justify-between items-center mb-3 bg-black/40 p-2 rounded-xl border border-white/10 text-xs">
      <span class="text-red-400 font-bold">الصلاحية الحالية: ${window.Utils ? window.Utils.escapeHTML(role) : role}</span>
      <button onclick="window.BackendAPI.logout(); document.getElementById('admin-review-overlay').style.display='none';" class="text-gray-400 hover:text-white underline text-[11px]">تسجيل الخروج </button>
    </div>
    <div class="space-y-3">
      ${list.map(item => `
        <div class="bg-black/60 border border-white/10 p-3 rounded-xl space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <strong class="text-white">${window.Utils ? window.Utils.escapeHTML(item.martyrName || 'اسم غير محدد') : item.martyrName}</strong>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.status === 'APPROVED' ? 'bg-green-950 text-green-400 border border-green-600/30' :
              item.status === 'REJECTED' ? 'bg-red-950 text-red-400 border border-red-600/30' :
              'bg-amber-950 text-amber-400 border border-amber-600/30'
            }">${item.status || 'PENDING'}</span>
          </div>
          <p class="text-gray-300 text-[11px]"><strong>المدينة:</strong> ${window.Utils ? window.Utils.escapeHTML(item.city || '-') : item.city}</p>
          <p class="text-gray-300 text-[11px]"><strong>المقدم:</strong> ${window.Utils ? window.Utils.escapeHTML(item.submitterName || '-') : item.submitterName}</p>
          <p class="text-gray-400 text-[11px] bg-black/40 p-2 rounded-lg border border-white/5">${window.Utils ? window.Utils.escapeHTML(item.notes || '') : item.notes}</p>
          ${item.photoUrl ? `<p class="text-[10px] text-blue-400 underline truncate"><a href="${window.Utils ? window.Utils.sanitizeUrl(item.photoUrl) : item.photoUrl}" target="_blank">رابط المرفق / الصورة</a></p>` : ''}
          <div class="flex gap-2 pt-2 border-t border-white/5">
            <button onclick="handleSubmissionStatusChange('${item.id}', 'APPROVED')" class="flex-1 bg-green-600/20 border border-green-500/40 text-green-400 py-1 rounded-lg text-[10px] hover:bg-green-600 hover:text-white font-bold transition-all">اعتماد </button>
            <button onclick="handleSubmissionStatusChange('${item.id}', 'REJECTED')" class="flex-1 bg-red-600/20 border border-red-500/40 text-red-400 py-1 rounded-lg text-[10px] hover:bg-red-600 hover:text-white font-bold transition-all">رفض </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function handleSubmissionStatusChange(id, newStatus) {
  const res = await window.BackendAPI.updateSubmissionStatus(id, newStatus);
  if (res.success) {
    renderAdminOverlay();
  } else {
    alert(res.message || 'تعذر تحديث حالة المساهمة');
  }
}
