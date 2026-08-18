/**
 * Palestinian Souls (Remember Gaza) - Community Submissions Engine
 * Secure Submission Handler, Anti-Spam Honeypots, Input Sanitization & Staging
 */

async function submitCrowdsourceForm(event) {
  event.preventDefault();

  const submitter = document.getElementById('cs-submitter').value.trim();
  const martyrName = document.getElementById('cs-martyr-name').value.trim();
  const city = document.getElementById('cs-martyr-city').value.trim();
  const notes = document.getElementById('cs-notes').value.trim();
  const photo = document.getElementById('cs-photo').value.trim();
  const answer = document.getElementById('cs-captcha-answer').value.trim();
  const honeypot = document.getElementById('cs-honeypot') ? document.getElementById('cs-honeypot').value : '';

  if (honeypot) {
    console.warn('[AntiSpam] Bot submission blocked via Honeypot.');
    alert('تم رفض الطلب كإجراء حماية تلقائي.');
    return;
  }

  if (answer !== '8') {
    alert('إجابة سؤال الأمان غير صحيحة، يرجى المحاولة مرة أخرى.');
    return;
  }

  if (!submitter || !martyrName || !city || !notes) {
    alert('يرجى ملء كافة الحقول المطلوبة.');
    return;
  }

  const payload = {
    submitterName: submitter,
    martyrName: martyrName,
    city: city,
    notes: notes,
    photoUrl: photo,
    honeypot: honeypot
  };

  if (window.BackendAPI) {
    const res = await window.BackendAPI.submitContribution(payload);
    if (res.success) {
      alert('شكرًا لمساهمتك العظيمة! تم إرسال معلومات الشهيد وسيرته بنجاح وهي قيد المراجعة والاعتماد من قبل فريق التوثيق.');
      event.target.reset();
    } else {
      alert(res.message || 'تعذر إرسال المساهمة حالياً.');
    }
  }
}

function openCrowdsourceModal() {
  window.location.href = 'edit-martyr.html';
}
