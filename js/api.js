/**
 * BlueField Atelier Feedback Portal - API Client Layer
 * Handles communication with Backend API with seamless LocalStorage/Mock fallback
 */

const APPS_METADATA = [
  { id: 'all', name: '전체 앱', icon: '🌐' },
  { id: 'hojumeoni', name: '호주머니', icon: '📁', pkg: 'com.bluefield.atelier.hojumeoni' },
  { id: 'musahi', name: '무사히', icon: '🎖️', pkg: 'com.bluefield.atelier.musahi' },
  { id: 'oneul', name: '오늘', icon: '📅', pkg: 'com.bluefield.atelier.oneul' },
  { id: 'waku_jpn', name: '와쿠와쿠 일본어', icon: '🌸', pkg: 'com.bluefield.atelier.waku_jpn' },
  { id: 'waku_chn', name: '와쿠와쿠 중국어', icon: '🎋', pkg: 'com.bluefield.atelier.waku_chn' },
  { id: 'jlpt', name: 'JLPT 모의시험', icon: '📝', pkg: 'com.bluefield.atelier.jlpt' },
  { id: 'maze', name: '미로 탈출', icon: '🧩', pkg: 'com.bluefield.atelier.maze' },
  { id: 'other', name: '기타/공통', icon: '💡', pkg: 'com.bluefield.atelier.general' }
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
    title: '폴더별로 비밀번호나 생체인증 잠금 기능이 추가되면 좋겠어요!',
    content: '호주머니 앱 정말 유용하게 매일 쓰고 있습니다. 특히 웹서핑하다가 공유버튼으로 1초만에 보관하는 기능이 최고예요!\n\n혹시 개인적인 메모나 중요한 영수증 사진을 보관하는 폴더에 생체인식(지문) 잠금 기능이 들어가면 더 안심하고 쓸 수 있을 것 같습니다. 검토 부탁드립니다!',
    author: '스마트수집가',
    email: 'user1@example.com',
    deviceInfo: 'Galaxy S24 / Android 14',
    appVersion: '1.2.4',
    status: 'resolved', // received, reviewing, resolved
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
    appId: 'oneul',
    appName: '오늘',
    category: 'praise',
    title: '디자인도 깔끔하고 위젯도 너무 예쁩니다 ❤️',
    content: '하루 일정과 디데이를 한눈에 볼 수 있어서 다른 일정관리 앱 다 지우고 이것만 씁니다. 광고도 거슬리지 않고 UI가 너무 정갈해요. 오래오래 업데이트 해주세요!',
    author: '오늘도화이팅',
    email: '',
    deviceInfo: 'Pixel 8 / Android 14',
    appVersion: '1.1.0',
    status: 'resolved',
    adminReply: '기분 좋은 응원 말씀에 큰 힘을 얻습니다! 앞으로도 더욱 쾌적하고 편리한 앱이 되도록 정성껏 발전시켜 나가겠습니다. 감사합니다 :)',
    replyDate: '2026-10-13',
    likes: 35,
    createdAt: '2026-10-11 18:42'
  },
  {
    id: 'fb-1004',
    appId: 'waku_jpn',
    appName: '와쿠와쿠 일본어',
    category: 'feature',
    title: '단어장 발음 연속 재생(듣기 모드) 지원 요청',
    content: '출퇴근길에 화면을 보지 않고 이어폰으로 단어와 예문 발음을 쭉 연속해서 들을 수 있는 백그라운드 오디오 재생 모드가 있으면 출퇴근 학습에 정말 큰 도움이 될 것 같습니다!',
    author: 'JLPT_N2도전',
    email: 'jlpt_pass@gmail.com',
    deviceInfo: 'Galaxy S23 / Android 14',
    appVersion: '1.0.5',
    status: 'received',
    adminReply: null,
    likes: 12,
    createdAt: '2026-10-15 11:30'
  }
];

class FeedbackApi {
  constructor() {
    this.apiBase = '/api';
    this.storageKey = 'bluefield_feedbacks_db';
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

  getAppNameById(appId) {
    const app = APPS_METADATA.find(a => a.id === appId);
    return app ? app.name : '기타 앱';
  }
}

// Global instance
window.feedbackApi = new FeedbackApi();
