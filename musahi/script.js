/**
 * Musahi App Page - Interactive Logic
 */

function initMusahi() {
  const APP_ID = 'musahi';
  const APP_NAME = '무사히';
  const STORAGE_KEY = 'bluefield_feedbacks_db_v2';

  // DOM
  const writeModal = document.getElementById('writeModal');
  const writeForm = document.getElementById('writeForm');
  const btnOpenWrite = document.getElementById('btnOpenWrite');
  const heroBtnFeedback = document.getElementById('heroBtnFeedback');
  const feedbackGrid = document.getElementById('feedbackGrid');
  const toastContainer = document.getElementById('toastContainer');

  // Screenshot Lightbox
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');

  document.querySelectorAll('.screenshot-item').forEach(item => {
    item.addEventListener('click', () => {
      const fullSrc = item.dataset.full;
      if (fullSrc && lightboxImg) {
        lightboxImg.src = fullSrc;
        lightboxModal.classList.add('active');
      }
    });
  });

  if (lightboxModal) {
    lightboxModal.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  // Modal open/close
  if (btnOpenWrite) btnOpenWrite.addEventListener('click', () => openModal());
  if (heroBtnFeedback) heroBtnFeedback.addEventListener('click', () => openModal());

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.modal-overlay');
      if (parentModal) {
        parentModal.classList.remove('active');
        unlockBodyScroll();
      } else {
        closeModal();
      }
    });
  });

  writeModal.addEventListener('click', (e) => {
    if (e.target === writeModal) closeModal();
  });

  // Check URL query parameters or hash (App Deep Link)
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const href = window.location.href;
  if (params.get('mode') === 'write' || hash === '#write' || href.includes('mode=write')) {
    setTimeout(() => {
      openModal();
    }, 100);
  }
  const versionParam = params.get('version');
  if (versionParam) {
    const vEl = document.getElementById('formAppVersion');
    if (vEl) vEl.value = versionParam;
  }

  // Load Feedbacks for Musahi
  loadMusahiFeedbacks();

  // Form Submit
  writeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('formTitle').value.trim();
    const content = document.getElementById('formContent').value.trim();
    const author = document.getElementById('formAuthor').value.trim() || '익명의 사용자';
    const email = document.getElementById('formEmail').value.trim();
    const catInput = document.querySelector('input[name="category"]:checked');
    const category = catInput ? catInput.value : 'feature';
    const appVersion = document.getElementById('formAppVersion').value;

    if (!title || !content) {
      showToast('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newRecord = {
      id: 'fb-' + Date.now(),
      appId: APP_ID,
      appName: APP_NAME,
      category: category,
      title: title,
      content: content,
      author: author,
      email: email,
      deviceInfo: 'Android / Musahi User',
      appVersion: appVersion || '2.0.1',
      status: 'received',
      adminReply: null,
      replyDate: null,
      likes: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      list.unshift(newRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Storage save fallback', err);
    }

    showToast('소중한 피드백이 등록되었습니다! 충성! 🫡');
    closeModal();
    writeForm.reset();
    loadMusahiFeedbacks();
  });

  // Admin PIN & Authentication
  const ADMIN_PIN = "1209";

  function isAdminAuthenticated() {
    return sessionStorage.getItem('bf_admin_auth') === 'true' || localStorage.getItem('bf_admin_mode') === 'true';
  }

  function enableAdminMode() {
    sessionStorage.setItem('bf_admin_auth', 'true');
    localStorage.setItem('bf_admin_mode', 'true');
    updateAdminHeaderUI();
    loadMusahiFeedbacks();
  }

  function disableAdminMode() {
    sessionStorage.removeItem('bf_admin_auth');
    localStorage.removeItem('bf_admin_mode');
    updateAdminHeaderUI();
    loadMusahiFeedbacks();
    showToast('관리자 모드가 해제되었습니다.');
  }

  function updateAdminHeaderUI() {
    const badgeContainer = document.getElementById('adminHeaderBadge');
    if (!badgeContainer) return;
    if (isAdminAuthenticated()) {
      badgeContainer.innerHTML = `
        <button class="admin-mode-pill" id="btnExitAdminMode" title="클릭 시 관리자 모드를 종료합니다">
          <span>🛡️</span> <span>관리자 ON</span> <span style="opacity:0.6; font-size:0.7rem;">(종료)</span>
        </button>
      `;
      const btnExit = document.getElementById('btnExitAdminMode');
      if (btnExit) {
        btnExit.onclick = (e) => {
          e.preventDefault();
          if (confirm('관리자 모드를 종료하시겠습니까?')) {
            disableAdminMode();
          }
        };
      }
    } else {
      badgeContainer.innerHTML = '';
    }
  }

  // Brand Logo Click: 1 click = Refresh page, 5 fast clicks = Hidden Admin PIN Modal
  const brandWrapper = document.getElementById('brandWrapper') || document.querySelector('.brand-wrapper');
  if (brandWrapper) {
    let tapCount = 0;
    let tapTimer = null;
    let singleClickTimer = null;

    brandWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      tapCount++;

      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, 2500);

      if (tapCount >= 5) {
        tapCount = 0;
        clearTimeout(tapTimer);
        if (singleClickTimer) clearTimeout(singleClickTimer);

        if (isAdminAuthenticated()) {
          showToast('🛡️ 이미 관리자 모드로 활성화되어 있습니다.');
        } else {
          openAdminPinModal();
        }
        return;
      }

      if (tapCount === 1) {
        singleClickTimer = setTimeout(() => {
          if (tapCount === 1) {
            tapCount = 0;
            window.location.reload();
          }
        }, 350);
      }
    });
  }

  // Admin PIN Modal Controls
  const adminPinModal = document.getElementById('adminPinModal');
  const adminPinForm = document.getElementById('adminPinForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminPinError = document.getElementById('adminPinError');

  let savedScrollY = 0;

  function lockBodyScroll() {
    savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.body.classList.add('modal-open');
  }

  function unlockBodyScroll() {
    document.body.classList.remove('modal-open');
    if (typeof savedScrollY === 'number') {
      window.scrollTo(0, savedScrollY);
    }
  }

  function openAdminPinModal() {
    if (!adminPinModal) return;
    if (adminPinInput) adminPinInput.value = '';
    if (adminPinError) adminPinError.textContent = '';
    lockBodyScroll();
    adminPinModal.classList.add('active');
    setTimeout(() => {
      if (adminPinInput) adminPinInput.focus({ preventScroll: true });
    }, 200);
  }

  function closeAdminPinModal() {
    if (!adminPinModal) return;
    adminPinModal.classList.remove('active');
    unlockBodyScroll();
  }

  if (adminPinForm) {
    adminPinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = adminPinInput ? adminPinInput.value.trim() : '';
      if (enteredPin === ADMIN_PIN) {
        closeAdminPinModal();
        enableAdminMode();
        showToast('🛡️ 관리자 모드가 활성화되었습니다!');
      } else {
        if (adminPinError) adminPinError.textContent = 'PIN 번호가 일치하지 않습니다.';
        if (adminPinInput) {
          adminPinInput.value = '';
          adminPinInput.focus();
        }
      }
    });
  }

  if (adminPinModal) {
    adminPinModal.addEventListener('click', (e) => {
      if (e.target === adminPinModal) closeAdminPinModal();
    });
  }

  // Admin Reply & Status Modal Controls
  const adminReplyModal = document.getElementById('adminReplyModal');
  const adminReplyForm = document.getElementById('adminReplyForm');

  function openAdminReplyModal(item) {
    if (!adminReplyModal) return;
    document.getElementById('adminTargetFeedbackId').value = item.id;
    document.getElementById('adminModalTitle').textContent = item.title;
    document.getElementById('adminModalContent').textContent = item.content;
    document.getElementById('adminModalAuthor').textContent = item.author || '익명 사용자';
    document.getElementById('adminModalDate').textContent = item.createdAt ? item.createdAt.split(' ')[0] : '';

    const catMap = {
      feature: { label: '기능 제안', icon: '💡' },
      bug: { label: '버그 제보', icon: '🐛' },
      inquiry: { label: '사용 문의', icon: '💬' },
      praise: { label: '응원/칭찬', icon: '✨' }
    };
    const cat = catMap[item.category] || catMap.feature;
    const badgesEl = document.getElementById('adminModalBadges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span style="font-size: 0.75rem; font-weight: 700; color: #34d399; background: rgba(16,185,129,0.12); padding: 3px 8px; border-radius: var(--radius-full);">${cat.icon} ${cat.label}</span>
        ${getStatusBadge(item.status)}
      `;
    }

    const currentStatus = item.status || 'received';
    const radio = document.querySelector(`input[name="adminStatus"][value="${currentStatus}"]`);
    if (radio) radio.checked = true;

    const replyInput = document.getElementById('adminModalReplyText');
    if (replyInput) replyInput.value = item.adminReply || '';

    lockBodyScroll();
    adminReplyModal.classList.add('active');
    setTimeout(() => {
      if (replyInput) replyInput.focus({ preventScroll: true });
    }, 200);
  }

  function closeAdminReplyModal() {
    if (!adminReplyModal) return;
    adminReplyModal.classList.remove('active');
    unlockBodyScroll();
  }

  if (adminReplyForm) {
    adminReplyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetId = document.getElementById('adminTargetFeedbackId').value;
      const statusInput = document.querySelector('input[name="adminStatus"]:checked');
      const newStatus = statusInput ? statusInput.value : 'received';
      const replyInput = document.getElementById('adminModalReplyText');
      const newReply = replyInput ? replyInput.value.trim() : '';

      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const target = list.find(i => i.id === targetId);
      if (target) {
        target.status = newStatus;
        target.adminReply = newReply || null;
        target.replyDate = newReply ? new Date().toISOString().split('T')[0] : null;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        showToast('피드백 상태 및 답변이 저장되었습니다! 🛡️');
        closeAdminReplyModal();
        loadMusahiFeedbacks();
      }
    });
  }

  if (adminReplyModal) {
    adminReplyModal.addEventListener('click', (e) => {
      if (e.target === adminReplyModal) closeAdminReplyModal();
    });
  }

  window.adminOpenReplyModal = function(id) {
    if (!isAdminAuthenticated()) {
      openAdminPinModal();
      return;
    }
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const target = list.find(i => i.id === id);
    if (target) {
      openAdminReplyModal(target);
    }
  };

  // URL admin parameter check (e.g. ?admin=1209)
  if (params.get('admin') === ADMIN_PIN || params.get('admin') === 'true') {
    enableAdminMode();
  } else {
    updateAdminHeaderUI();
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'resolved':
        return `<span style="font-size:0.72rem; font-weight:700; color:#34d399; background:rgba(16,185,129,0.12); padding:2px 7px; border-radius:999px;">● 반영 완료</span>`;
      case 'in_progress':
        return `<span style="font-size:0.72rem; font-weight:700; color:#fcd34d; background:rgba(245,158,11,0.15); padding:2px 7px; border-radius:999px;">● 수정 중</span>`;
      case 'reviewing':
        return `<span style="font-size:0.72rem; font-weight:700; color:#d8b4fe; background:rgba(168,85,247,0.15); padding:2px 7px; border-radius:999px;">● 검토 중</span>`;
      case 'answered':
        return `<span style="font-size:0.72rem; font-weight:700; color:#67e8f9; background:rgba(6,182,212,0.15); padding:2px 7px; border-radius:999px;">● 답변 완료</span>`;
      default:
        return `<span style="font-size:0.72rem; font-weight:700; color:#94a3b8; background:rgba(148,163,184,0.12); padding:2px 7px; border-radius:999px;">● 접수됨</span>`;
    }
  }

  function loadMusahiFeedbacks() {
    let list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let items = list.filter(item => item.appId === APP_ID);

    if (items.length === 0) {
      feedbackGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-glass);">
          <p style="color: var(--text-muted); margin-bottom: 12px;">아직 등록된 무사히 피드백이 없습니다.</p>
          <button class="btn btn-primary" onclick="document.getElementById('writeModal').classList.add('active')">첫 번째 의견 남기기</button>
        </div>
      `;
      return;
    }

    const isAdm = isAdminAuthenticated();
    const catMap = {
      feature: { label: '기능 제안', icon: '💡' },
      bug: { label: '버그 제보', icon: '🐛' },
      inquiry: { label: '사용 문의', icon: '💬' },
      praise: { label: '응원/칭찬', icon: '✨' }
    };

    feedbackGrid.innerHTML = items.map(item => {
      const cat = catMap[item.category] || catMap.feature;
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="display:flex; gap:6px; align-items:center;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #34d399; background: rgba(16,185,129,0.12); padding: 3px 8px; border-radius: var(--radius-full);">${cat.icon} ${cat.label}</span>
                ${getStatusBadge(item.status)}
              </div>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${item.createdAt ? item.createdAt.split(' ')[0] : ''}</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; line-height: 1.4;">${escapeHtml(item.title)}</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; white-space: pre-wrap;">${escapeHtml(item.content)}</p>

            ${item.adminReply ? `
              <div style="margin-top: 14px; padding: 12px 14px; background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; border-radius: 6px; font-size: 0.85rem; color: #cbd5e1; line-height: 1.6;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #34d399; font-weight: 700; font-size: 0.8rem;">
                  <span>🛡️ BlueField Atelier 개발팀 공식 답변</span>
                  ${item.replyDate ? `<span style="font-size:0.72rem; color:var(--text-dim); margin-left:auto;">${item.replyDate}</span>` : ''}
                </div>
                <div style="white-space: pre-wrap;">${escapeHtml(item.adminReply)}</div>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; font-size: 0.8rem; color: var(--text-dim);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span>작성자: <strong style="color: var(--text-main);">${escapeHtml(item.author)}</strong></span>
              ${isAdm ? `
                <button style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#6ee7b7; font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.2s;" onclick="adminOpenReplyModal('${item.id}')">
                  <span>🛡️</span> <span>답변 & 상태 관리</span>
                </button>
              ` : ''}
            </div>
            <button style="background:none; border:none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="likeMusahiItem('${item.id}', this)">
              <span>❤️</span> <span>${item.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.likeMusahiItem = function(id, btn) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const target = list.find(i => i.id === id);
    if (target) {
      target.likes = (target.likes || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      btn.querySelector('span:last-child').textContent = target.likes;
      showToast('공감했습니다 ❤️');
    }
  };

  function openModal() {
    lockBodyScroll();
    writeModal.classList.add('active');
  }

  function closeModal() {
    writeModal.classList.remove('active');
    unlockBodyScroll();
  }

  writeModal.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.modal-body')) {
      e.preventDefault();
    }
  }, { passive: false });

  const modalBody = writeModal.querySelector('.modal-body');
  if (modalBody) {
    modalBody.addEventListener('touchstart', () => {
      const top = modalBody.scrollTop;
      const totalScroll = modalBody.scrollHeight;
      const currentScroll = top + modalBody.offsetHeight;
      if (top === 0) {
        modalBody.scrollTop = 1;
      } else if (currentScroll === totalScroll) {
        modalBody.scrollTop = top - 1;
      }
    }, { passive: true });
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Ensure execution whether DOMContentLoaded has already fired or not
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusahi);
} else {
  initMusahi();
}
