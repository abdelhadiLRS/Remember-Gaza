/**
 * Palestinian Souls - Crowdsourced Submissions Engine
 */

class SubmissionsEngine {
  constructor() {
    this.storageKey = 'martyr_submissions';
  }

  getSubmissions() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('[Submissions] Storage read error:', e);
      return [];
    }
  }

  saveSubmissions(submissionsList) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(submissionsList));
    } catch (e) {
      console.error('[Submissions] Storage write error:', e);
    }
  }

  addSubmission(submissionData) {
    const list = this.getSubmissions();
    const newEntry = {
      id: 'sub_' + Date.now(),
      status: 'pending', // 'pending', 'approved', 'rejected'
      createdAt: new Date().toISOString(),
      ...submissionData
    };
    list.unshift(newEntry);
    this.saveSubmissions(list);
    return newEntry;
  }

  getApprovedSubmissions() {
    return this.getSubmissions().filter(s => s.status === 'approved');
  }
}

window.submissionsEngine = new SubmissionsEngine();

window.applyApprovedSubmissions = function(originalList = []) {
  if (!window.submissionsEngine) return originalList;
  const approved = window.submissionsEngine.getApprovedSubmissions();
  if (!approved || approved.length === 0) return originalList;

  const merged = [...originalList];
  approved.forEach(item => {
    merged.unshift({
      id: item.id,
      name: item.name || item.fullName,
      age: item.age,
      city: item.city || item.location,
      photo: item.photo || item.image,
      isUserSubmitted: true
    });
  });
  return merged;
};
