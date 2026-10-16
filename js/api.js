/**
 * BlueField Atelier Feedback Portal - API Client Layer
 * Handles communication with Backend API with seamless LocalStorage/Mock fallback
 */

const APPS_METADATA = [
  { id: 'all', name: '전체 앱', icon: '🌐' },
  { id: 'hojumeoni', name: '호주머니', icon: '📁', pkg: 'com.bluefield.atelier.hojumeoni' },
  { id: 'musahi', name: '무사히', icon: '🎖️', pkg: 'com.bluefield.atelier.musahi' }
];

const CATEGORIES = {
  feature: { label: '기능 제안', icon: '💡', badgeClass: 'badge-cat-feature' },
  bug: { label: '버그 제보', icon: '🐛', badgeClass: 'badge-cat-bug' },
  inquiry: { label: '사용 문의', icon: '💬', badgeClass: 'badge-cat-inquiry' },
  praise: { label: '응원/칭찬', icon: '✨', badgeClass: 'badge-cat-praise' }
};

const DEFAULT_MOCK_FEEDBACKS = [];

class FeedbackApi {
  constructor() {
    this.apiBase = '/api';
    this.storageKey = 'bluefield_feedbacks_db_v2';
    this.isBackendAvailable = null;
    this.initStorage();
  }

  initStorage() {
    let raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      localStorage.setItem(this.storageKey, '[]');
      return;
    }
    try {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.some(item => item.id && item.id.startsWith('fb-100'))) {
        localStorage.setItem(this.storageKey, '[]');
      }
    } catch (e) {
      localStorage.setItem(this.storageKey, '[]');
    }
  }

  async checkBackend() {
    if (this.isBackendAvailable !== null) return this.isBackendAvailable;
    try {
      const res = await fetch(`${this.apiBase}/health`, { method: 'GET', cache: 'no-cache' });
      this.isBackendAvailable = res.ok;
    } catch (e) {
      this.isBackendAvailable = false;
    }
    return this.isBackendAvailable;
  }

  // 피드백 목록 가져오기
  async getFeedbacks(filters = {}) {
    const backendOk = await this.checkBackend();

    if (backendOk) {
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${this.apiBase}/feedbacks?${query}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend fetch failed, falling back to local storage:', err);
      }
    }

    // Fallback: LocalStorage
    let list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');

    // 1. 앱 필터
    if (filters.app && filters.app !== 'all') {
      list = list.filter(item => item.appId === filters.app);
    }

    // 2. 카테고리 필터
    if (filters.category && filters.category !== 'all') {
      list = list.filter(item => item.category === filters.category);
    }

    // 3. 검색어 필터 (제목, 내용, 작성자)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.author && item.author.toLowerCase().includes(q))
      );
    }

    // 4. 정렬
    if (filters.sort === 'likes') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // 최신순 (기본)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }

  // 피드백 제출하기
  async createFeedback(feedbackData) {
    const backendOk = await this.checkBackend();

    if (backendOk) {
      try {
        const res = await fetch(`${this.apiBase}/feedbacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend submit failed, falling back to local storage:', err);
      }
    }

    // Fallback: LocalStorage 저장
    const list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord = {
      id: 'fb-' + Date.now(),
      appId: feedbackData.appId || 'other',
      appName: feedbackData.appName || this.getAppNameById(feedbackData.appId),
      category: feedbackData.category || 'feature',
      title: feedbackData.title.trim(),
      content: feedbackData.content.trim(),
      author: feedbackData.author.trim() || '익명의 사용자',
      email: feedbackData.email ? feedbackData.email.trim() : '',
      deviceInfo: feedbackData.deviceInfo || 'Web Browser',
      appVersion: feedbackData.appVersion || 'Web',
      status: 'received',
      adminReply: null,
      replyDate: null,
      likes: 0,
      createdAt: dateStr
    };

    list.unshift(newRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(list));

    // Send direct developer notification email
    try {
      fetch('https://formsubmit.co/ajax/tedd.devteam@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: `[${newRecord.appName} 피드백 전달] ${newRecord.title}`,
          _cc: "bluefield.works@gmail.com",
          _template: "table",
          "앱 이름": newRecord.appName,
          "앱 버전": newRecord.appVersion || 'Web',
          "분류": CATEGORIES[newRecord.category]?.label || newRecord.category,
          "작성자": newRecord.author,
          "회신 받을 이메일": newRecord.email || '미입력 (이메일 없음)',
          "제목": newRecord.title,
          "피드백 / 개선 제안 내용": newRecord.content,
          "전송 일시": newRecord.createdAt
        })
      }).catch(e => console.warn('FormSubmit background send notice:', e));
    } catch (e) {}

    return newRecord;
  }

  // 피드백 공감/좋아요
  async likeFeedback(feedbackId) {
    const backendOk = await this.checkBackend();

    if (backendOk) {
      try {
        const res = await fetch(`${this.apiBase}/feedbacks/${feedbackId}/like`, { method: 'POST' });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend like failed:', err);
      }
    }

    // LocalStorage 처리
    const list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const target = list.find(item => item.id === feedbackId);
    if (target) {
      target.likes = (target.likes || 0) + 1;
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      return { id: feedbackId, likes: target.likes };
    }
    return null;
  }

  // 관리자 답변 등록 및 상태 갱신
  async updateAdminReply(feedbackId, replyText, status = 'resolved') {
    const backendOk = await this.checkBackend();
    const todayStr = new Date().toISOString().split('T')[0];

    if (backendOk) {
      try {
        const res = await fetch(`${this.apiBase}/feedbacks/${feedbackId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: replyText, status: status })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend reply update failed:', err);
      }
    }

    // LocalStorage 처리
    const list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const target = list.find(item => item.id === feedbackId);
    if (target) {
      target.adminReply = replyText.trim() || null;
      target.replyDate = replyText.trim() ? todayStr : null;
      if (status) target.status = status;
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      return target;
    }
    return null;
  }

  // 관리자 피드백 삭제
  async deleteFeedback(feedbackId) {
    const backendOk = await this.checkBackend();

    if (backendOk) {
      try {
        const res = await fetch(`${this.apiBase}/feedbacks/${feedbackId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          return true;
        }
      } catch (err) {
        console.warn('Backend delete failed:', err);
      }
    }

    // LocalStorage 처리
    let list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    list = list.filter(item => item.id !== feedbackId);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return true;
  }

  getAppNameById(appId) {
    const app = APPS_METADATA.find(a => a.id === appId);
    return app ? app.name : '기타 앱';
  }
}

// Global instance
window.feedbackApi = new FeedbackApi();
