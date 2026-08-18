/**
 * Palestinian Souls (Remember Gaza) - Submissions Handler
 * Manages community contributions and redirects to unified edit page
 */

async function handleSubmissionFormSubmit(event) {
  if (event) event.preventDefault();

  const payload = {
    submitterName: document.getElementById('cs-submitter-name')?.value || 'زائر متضامن',
    submitterContact: document.getElementById('cs-submitter-contact')?.value || '',
    martyrName: document.getElementById('cs-martyr-name')?.value || '',
    city: document.getElementById('cs-city')?.value || '',
    notes: document.getElementById('cs-notes')?.value || '',
    sources: document.getElementById('cs-sources')?.value || '',
    photoUrl: document.getElementById('cs-photo-url')?.value || ''
  };

  if (!payload.martyrName) {
    alert('يرجى إدخال اسم الشهيد.');
    return;
  }

  if (window.BackendAPI) {
    const res = await window.BackendAPI.submitContribution(payload);
    if (res.success) {
      alert('تم إرسال المساهمة بنجاح وهي قيد المراجعة والاعتماد الآن.');
      window.location.href = 'index.html';
    } else {
      alert(res.message || 'تعذر إرسال المساهمة حالياً.');
    }
  }
}

function openCrowdsourceModal() {
  window.location.href = 'edit-martyr.html';
}

function closeCrowdsourceModal() {
  // Safe stub for legacy event bindings
}
