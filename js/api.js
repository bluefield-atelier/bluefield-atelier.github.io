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

const DEFAULT_MOCK_FEEDBACKS = [
  {
    id: 'fb-1001',
    appId: 'hojumeoni',
    appName: '호주머니',
    category: 'feature',
    title: '폴더별로 생체인증(지문) 잠금 기능이 추가되면 좋겠어요!',
    content: '호주머니 앱 정말 유용하게 매일 쓰고 있습니다. 특히 웹서핑하다가 공유버튼으로 1초만에 보관하는 기능이 최고예요!\n\n혹시 개인적인 메모나 중요한 영수증 사진을 보관하는 폴더에 생체인식(지문) 잠금 기능이 들어가면 더 안심하고 쓸 수 있을 것 같습니다. 검토 부탁드립니다!',
    author: '스마트수집가',
    email: 'user1@example.com',
    deviceInfo: 'Galaxy S24 / Android 14',
    appVersion: '1.2.4',
    status: 'resolved',
    adminReply: '안녕하세요 스마트수집가님! 따뜻한 피드백 감사합니다. 폴더별 생체인증 잠금 기능은 다음 1.3.0 업데이트 로드맵에 반영되어 현재 개발 및 테스트 중입니다. 곧 선보여 드리겠습니다!',
    replyDate: '2026-10-14',
    likes: 24,
    createdAt: '2026-10-12 14:20'
  },
  {
    id: 'fb-1002',
    appId: 'musahi',
    appName: '무사히',
    category: 'bug',
    title: '홈 위젯에서 D-Day 퍼센트 갱신이 간혹 늦어지는 현상',
    content: '항상 무사히 앱으로 남은 복무일 확인하면서 힘내고 있습니다.\n홈 화면에 2x2 위젯을 꺼내두었는데, 자정이 지나도 퍼센트가 바로 안 바뀌고 앱을 한번 실행해야 갱신되는 경우가 종종 있습니다. 확인 부탁드려요!',
    author: '일병_김철수',
    email: '',
    deviceInfo: 'Galaxy A54 / Android 13',
    appVersion: '2.0.1',
    status: 'reviewing',
    adminReply: '충성! 소중한 제보 감사합니다. 안드로이드 백그라운드 배터리 최적화 정책으로 인해 위젯 알람 갱신 주기가 지연되는 현상을 확인하였으며, 정확한 정시 갱신 로직을 보완 중입니다.',
    replyDate: '2026-10-15',
    likes: 18,
    createdAt: '2026-10-14 09:15'
  },
  {
    id: 'fb-1003',
    appId: 'hojumeoni',
    appName: '호주머니',
    category: 'praise',
    title: '공유하기 버튼 1초 저장은 진짜 신의 한 수입니다 👍',
    content: '유튜브나 기사 읽다가 나중에 보려고 카톡 나에게 보내기 쓰던 습관이 있었는데 호주머니 쓰고 나서는 싹 정리됐습니다. 검색도 초성으로 바로 찾아서 너무 편해요!',
    author: '호주머니애용자',
    email: '',
    deviceInfo: 'Galaxy S23 / Android 14',
    appVersion: '1.2.0',
    status: 'resolved',
    adminReply: '소중한 사용 후기 감사합니다! 앞으로도 군더더기 없이 가장 빠르고 쾌적한 보관함이 되도록 계속 다듬어가겠습니다 :)',
    replyDate: '2026-10-13',
    likes: 31,
    createdAt: '2026-10-13 16:40'
  },
  {
    id: 'fb-1004',
    appId: 'musahi',
    appName: '무사히',
    category: 'feature',
    title: '진급일 D-Day 디데이 알림 기능도 함께 볼 수 있으면 좋겠습니다',
    content: '전역일 뿐만 아니라 일병, 상병, 병장 진급일도 디데이 위젯으로 한눈에 보고 싶어요! 군 생활의 소소한 낙이라 추가해주시면 너무 감사하겠습니다.',
    author: '곰신_예비꽃신',
    email: 'gomshin@gmail.com',
    deviceInfo: 'iPhone 15 / Web',
    appVersion: '2.0.0',
    status: 'received',
    adminReply: null,
    replyDate: null,
    likes: 15,
    createdAt: '2026-10-15 11:30'
  }
];

class FeedbackApi {
  constructor() {
    this.apiBase = '/api';
    this.storageKey = 'bluefield_feedbacks_db_v2';
    this.isBackendAvailable = null;
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(DEFAULT_MOCK_FEEDBACKS));
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

  getAppNameById(appId) {
    const app = APPS_METADATA.find(a => a.id === appId);
    return app ? app.name : '기타 앱';
  }
}

// Global instance
window.feedbackApi = new FeedbackApi();
