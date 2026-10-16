/**
 * BlueField Atelier Feedback Portal - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    selectedApp: 'all',
    selectedCategory: 'all',
    searchQuery: '',
    sortBy: 'latest',
    feedbacks: [],
    currentDetail: null
  };

  // DOM Elements
  const appTabsContainer = document.getElementById('appTabs');
  const categoryChipsContainer = document.getElementById('categoryChips');
  const feedbackGrid = document.getElementById('feedbackGrid');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const totalCountEl = document.getElementById('totalCount');
  const resolvedCountEl = document.getElementById('resolvedCount');
  const writeModalBtn = document.getElementById('btnOpenWriteModal');
  const heroWriteBtn = document.getElementById('heroWriteBtn');
  const btnOpenWriteSection = document.getElementById('btnOpenWriteSection');

  // Modals
  const writeModal = document.getElementById('writeModal');
  const detailModal = document.getElementById('detailModal');
  const pinModal = document.getElementById('pinModal');
  const writeForm = document.getElementById('writeForm');
  const formAppSelect = document.getElementById('formAppSelect');
  const formTitle = document.getElementById('formTitle');
  const formContent = document.getElementById('formContent');
  const formAuthor = document.getElementById('formAuthor');
  const formEmail = document.getElementById('formEmail');
  const formAppVersion = document.getElementById('formAppVersion');
  const formDeviceInfo = document.getElementById('formDeviceInfo');
  const charCounter = document.getElementById('charCounter');
  const submitBtn = document.getElementById('btnSubmitFeedback');

  // Admin PIN & Reply Elements
  const ADMIN_PIN = "1209";
  const btnOpenAdminAuth = document.getElementById('btnOpenAdminAuth');
  const btnSubmitPin = document.getElementById('btnSubmitPin');
  const pinInput = document.getElementById('pinInput');
  const adminEditorSection = document.getElementById('adminEditorSection');
  const adminReplyInput = document.getElementById('adminReplyInput');
  const adminStatusSelect = document.getElementById('adminStatusSelect');
  const btnSaveAdminReply = document.getElementById('btnSaveAdminReply');
  const btnCancelAdminReply = document.getElementById('btnCancelAdminReply');

  // Toast container
  const toastContainer = document.getElementById('toastContainer');

  // 1. Initialize
  initApp();

  async function initApp() {
    if (appTabsContainer) renderAppTabs();
    populateFormAppSelect();
    setupEventListeners();
    parseUrlParams();
    if (feedbackGrid) await loadFeedbacks();
  }

  // URL Query Parameters Handling (App Deep Linking)
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    const modeParam = params.get('mode');
    const authorParam = params.get('author');
    const titleParam = params.get('title');
    const categoryParam = params.get('category');
    const versionParam = params.get('version');
    const deviceParam = params.get('device');

    if (appParam && APPS_METADATA.some(a => a.id === appParam)) {
      state.selectedApp = appParam;
      formAppSelect.value = appParam;
      updateActiveTab();
    }

    if (authorParam) formAuthor.value = authorParam;
    if (titleParam) formTitle.value = titleParam;
    if (versionParam) formAppVersion.value = versionParam;
    if (deviceParam) formDeviceInfo.value = deviceParam;

    if (categoryParam && CATEGORIES[categoryParam]) {
      const radio = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
      if (radio) radio.checked = true;
    }

    // If opened directly with mode=write from an app button
    if (modeParam === 'write') {
      openModal(writeModal);
    }
  }

  // Render App Filter Tabs
  function renderAppTabs() {
    appTabsContainer.innerHTML = APPS_METADATA.map(app => `
      <button class="app-tab-btn ${app.id === state.selectedApp ? 'active' : ''}" data-app="${app.id}">
        <span>${app.icon}</span>
        <span>${app.name}</span>
      </button>
    `).join('');
  }

  function updateActiveTab() {
    document.querySelectorAll('.app-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.app === state.selectedApp);
    });
  }

  // Populate App select in Write Form
  function populateFormAppSelect() {
    formAppSelect.innerHTML = APPS_METADATA
      .filter(a => a.id !== 'all')
      .map(app => `<option value="${app.id}">${app.icon} ${app.name}</option>`)
      .join('');
  }

  // Fetch and Render Feedbacks
  async function loadFeedbacks() {
    feedbackGrid.innerHTML = `
      <div class="empty-state">
        <p>피드백을 불러오는 중입니다...</p>
      </div>
    `;

    try {
      const list = await window.feedbackApi.getFeedbacks({
        app: state.selectedApp,
        category: state.selectedCategory,
        search: state.searchQuery,
        sort: state.sortBy
      });

      state.feedbacks = list;
      renderFeedbacks(list);
      updateStats(list);
    } catch (err) {
      console.error(err);
      feedbackGrid.innerHTML = `
        <div class="empty-state">
          <p>피드백을 불러오지 못했습니다.</p>
        </div>
      `;
    }
  }

  function updateStats(list) {
    if (totalCountEl) totalCountEl.textContent = list.length;
    if (resolvedCountEl) {
      const resolved = list.filter(i => i.status === 'resolved').length;
      resolvedCountEl.textContent = resolved;
    }
  }

  // Render Card Grid
  function renderFeedbacks(items) {
    if (!items || items.length === 0) {
      feedbackGrid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <h3>등록된 피드백이 없습니다</h3>
          <p>첫 번째 소중한 의견을 남겨주시면 개발팀에 큰 도움이 됩니다!</p>
          <button class="btn btn-primary" id="btnEmptyWrite">첫 피드백 작성하기</button>
        </div>
      `;
      const btnEmpty = document.getElementById('btnEmptyWrite');
      if (btnEmpty) {
        btnEmpty.addEventListener('click', () => openModal(writeModal));
      }
      return;
    }

    feedbackGrid.innerHTML = items.map(item => {
      const cat = CATEGORIES[item.category] || CATEGORIES.feature;
      const statusHtml = getStatusBadge(item.status);
      const appMeta = APPS_METADATA.find(a => a.id === item.appId) || { name: item.appName || '앱', icon: '📱' };
      const hasReply = !!item.adminReply;

      return `
        <div class="feedback-card" data-id="${item.id}">
          <div>
            <div class="card-meta-top">
              <div class="badge-group">
                <span class="badge badge-app">${appMeta.icon} ${appMeta.name}</span>
                <span class="badge ${cat.badgeClass}">${cat.icon} ${cat.label}</span>
              </div>
              ${statusHtml}
            </div>

            <div class="card-content" style="margin-top: 14px;">
              <h3 class="card-title">${escapeHtml(item.title)}</h3>
              <p class="card-snippet">${escapeHtml(item.content)}</p>

              ${hasReply ? `
                <div class="admin-reply-callout">
                  <span>💬</span>
                  <span><strong>개발팀 답변:</strong> ${escapeHtml(item.adminReply.substring(0, 48))}...</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="card-footer">
            <div class="card-author-info">
              <div class="card-author-avatar">${escapeHtml(item.author.charAt(0).toUpperCase())}</div>
              <div>
                <span>${escapeHtml(item.author)}</span>
                <span style="margin: 0 4px; color: var(--border-glass);">•</span>
                <span>${item.createdAt ? item.createdAt.split(' ')[0] : ''}</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="like-btn" data-id="${item.id}" title="공감하기">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span class="like-num">${item.likes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to card clicks & like buttons
    document.querySelectorAll('.feedback-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent opening modal when clicking like button
        if (e.target.closest('.like-btn')) return;
        const id = card.dataset.id;
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const res = await window.feedbackApi.likeFeedback(id);
        if (res) {
          const numEl = btn.querySelector('.like-num');
          if (numEl) numEl.textContent = res.likes;
          btn.classList.add('liked');
          showToast('피드백에 공감했습니다 ❤️');
        }
      });
    });
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'resolved':
        return `<span class="status-indicator status-resolved">● 반영 완료</span>`;
      case 'in_progress':
        return `<span class="status-indicator status-in_progress">● 수정 중</span>`;
      case 'reviewing':
        return `<span class="status-indicator status-reviewing">● 검토 중</span>`;
      case 'answered':
        return `<span class="status-indicator status-answered">● 답변 완료</span>`;
      default:
        return `<span class="status-indicator status-received">● 접수됨</span>`;
    }
  }

  // Open Detail Modal
  function openDetailModal(id) {
    const item = state.feedbacks.find(f => f.id === id);
    if (!item) return;

    state.currentDetail = item;
    const cat = CATEGORIES[item.category] || CATEGORIES.feature;
    const appMeta = APPS_METADATA.find(a => a.id === item.appId) || { name: item.appName || '앱', icon: '📱' };

    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailAppBadge').textContent = `${appMeta.icon} ${appMeta.name}`;
    document.getElementById('detailCategoryBadge').textContent = `${cat.icon} ${cat.label}`;
    document.getElementById('detailCategoryBadge').className = `badge ${cat.badgeClass}`;
    document.getElementById('detailStatusBadge').outerHTML = `<div id="detailStatusBadge">${getStatusBadge(item.status)}</div>`;
    document.getElementById('detailAuthor').textContent = item.author;
    document.getElementById('detailDate').textContent = item.createdAt;
    document.getElementById('detailContent').textContent = item.content;

    // Admin Reply section
    const replySection = document.getElementById('detailAdminSection');
    if (item.adminReply) {
      replySection.style.display = 'block';
      document.getElementById('detailAdminText').textContent = item.adminReply;
      document.getElementById('detailAdminDate').textContent = item.replyDate ? `(${item.replyDate})` : '';
    } else {
      replySection.style.display = 'none';
    }

    // Reset Admin Editor Form
    if (adminEditorSection) {
      adminEditorSection.style.display = 'none';
      if (adminReplyInput) adminReplyInput.value = item.adminReply || '';
      if (adminStatusSelect) adminStatusSelect.value = item.status || 'received';
    }

    openModal(detailModal);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // App Filter Tabs
    appTabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.app-tab-btn');
      if (!tab) return;
      state.selectedApp = tab.dataset.app;
      updateActiveTab();
      loadFeedbacks();
    });

    // Category Filter Chips
    categoryChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedCategory = chip.dataset.category;
      loadFeedbacks();
    });

    // Search Input (Debounced)
    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        loadFeedbacks();
      }, 250);
    });

    // Sort Select
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      loadFeedbacks();
    });

    // Open Write Modal
    if (writeModalBtn) writeModalBtn.addEventListener('click', () => openModal(writeModal));
    if (heroWriteBtn) heroWriteBtn.addEventListener('click', () => openModal(writeModal));
    if (btnOpenWriteSection) btnOpenWriteSection.addEventListener('click', () => openModal(writeModal));

    // Content Length Counter
    formContent.addEventListener('input', () => {
      const len = formContent.value.length;
      charCounter.textContent = `${len} / 1000`;
    });

    // Form Submission
    writeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedCatInput = document.querySelector('input[name="category"]:checked');
      const feedbackPayload = {
        appId: formAppSelect.value,
        appName: APPS_METADATA.find(a => a.id === formAppSelect.value)?.name || '기타',
        category: selectedCatInput ? selectedCatInput.value : 'feature',
        title: formTitle.value,
        content: formContent.value,
        author: formAuthor.value || '익명의 사용자',
        email: formEmail.value,
        appVersion: formAppVersion.value,
        deviceInfo: formDeviceInfo.value
      };

      if (!feedbackPayload.title.trim() || !feedbackPayload.content.trim()) {
        showToast('제목과 내용을 모두 입력해 주세요.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>메일 전달 중... ⏳</span>`;

      try {
        await window.feedbackApi.createFeedback(feedbackPayload);
        showToast('소중한 피드백이 개발팀 메일로 안전하게 전달되었습니다! 감사합니다 ❤️');
        closeModal(writeModal);
        writeForm.reset();
        charCounter.textContent = '0 / 1000';
        if (feedbackGrid) await loadFeedbacks();
      } catch (err) {
        console.error(err);
        showToast('피드백 전송에 실패했습니다. 다시 시도해 주세요.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>개발팀으로 전달하기 ✉️</span>`;
      }
    });

    // Admin PIN Auth Button
    if (btnOpenAdminAuth) {
      btnOpenAdminAuth.addEventListener('click', () => {
        if (sessionStorage.getItem('bf_admin_auth') === 'true') {
          // Already authenticated: toggle editor
          if (adminEditorSection) {
            adminEditorSection.style.display = adminEditorSection.style.display === 'none' ? 'block' : 'none';
          }
        } else {
          // Open PIN modal
          if (pinInput) pinInput.value = '';
          openModal(pinModal);
          setTimeout(() => pinInput && pinInput.focus(), 100);
        }
      });
    }

    // Submit PIN
    if (btnSubmitPin) {
      btnSubmitPin.addEventListener('click', handlePinVerification);
    }
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handlePinVerification();
      });
    }

    function handlePinVerification() {
      const entered = pinInput.value.trim();
      if (entered === ADMIN_PIN) {
        sessionStorage.setItem('bf_admin_auth', 'true');
        closeModal(pinModal);
        if (adminEditorSection) adminEditorSection.style.display = 'block';
        showToast('관리자 인증 완료 🛡️');
      } else {
        showToast('PIN 번호가 일치하지 않습니다.', 'error');
        pinInput.value = '';
        pinInput.focus();
      }
    }

    // Cancel Admin Reply
    if (btnCancelAdminReply) {
      btnCancelAdminReply.addEventListener('click', () => {
        if (adminEditorSection) adminEditorSection.style.display = 'none';
      });
    }

    // Save Admin Reply
    if (btnSaveAdminReply) {
      btnSaveAdminReply.addEventListener('click', async () => {
        if (!state.currentDetail) return;
        const replyText = adminReplyInput.value;
        const statusVal = adminStatusSelect.value;

        btnSaveAdminReply.disabled = true;
        btnSaveAdminReply.textContent = '저장 중...';

        try {
          const updated = await window.feedbackApi.updateAdminReply(state.currentDetail.id, replyText, statusVal);
          showToast('관리자 답변이 저장되었습니다! 🛡️');
          if (adminEditorSection) adminEditorSection.style.display = 'none';

          // Refresh current item detail & reload list
          state.currentDetail.adminReply = replyText.trim() || null;
          state.currentDetail.replyDate = replyText.trim() ? new Date().toISOString().split('T')[0] : null;
          state.currentDetail.status = statusVal;

          openDetailModal(state.currentDetail.id);
          await loadFeedbacks();
        } catch (err) {
          console.error(err);
          showToast('답변 저장 중 오류가 발생했습니다.', 'error');
        } finally {
          btnSaveAdminReply.disabled = false;
          btnSaveAdminReply.textContent = '답변 등록/저장';
        }
      });
    }

    // Delete Feedback (Admin)
    const btnAdminDeleteMain = document.getElementById('btnAdminDeleteMain');
    if (btnAdminDeleteMain) {
      btnAdminDeleteMain.addEventListener('click', async () => {
        if (!state.currentDetail) return;
        const targetTitle = state.currentDetail.title ? `"${state.currentDetail.title}"` : '이 피드백';

        if (confirm(`${targetTitle}을(를) 정말 삭제하시겠습니까?\n\n삭제된 피드백은 영구적으로 제거되며 복구할 수 없습니다.`)) {
          btnAdminDeleteMain.disabled = true;
          try {
            await window.feedbackApi.deleteFeedback(state.currentDetail.id);
            showToast('피드백이 삭제되었습니다. 🗑️');
            closeModal(detailModal);
            await loadFeedbacks();
          } catch (err) {
            console.error(err);
            showToast('삭제 중 오류가 발생했습니다.', 'error');
          } finally {
            btnAdminDeleteMain.disabled = false;
          }
        }
      });
    }

    // Close Modals
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) closeModal(modal);
      });
    });

    // Close on background click
    [writeModal, detailModal, pinModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(writeModal);
        closeModal(detailModal);
        closeModal(pinModal);
      }
    });
  }

  let savedScrollY = 0;
  function openModal(modalEl) {
    if (!modalEl) return;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }

  [writeModal, detailModal, pinModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('touchmove', (e) => {
        if (!e.target.closest('.modal-body') && !e.target.closest('.detail-body-text')) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  });

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
      <span>${type === 'error' ? '⚠️' : '✅'}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
