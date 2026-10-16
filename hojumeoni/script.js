/**
 * Hojumeoni App Page - Interactive Logic
 */

function initHojumeoni() {
  const APP_ID = 'hojumeoni';
  const APP_NAME = '호주머니';
  const STORAGE_KEY = 'bluefield_feedbacks_db_v2';

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
      adminReply: '안녕하세요 스마트수집가님! 따뜻한 피드백 감사합니다. v1.1 업데이트를 통해 프라이버시 보호를 위한 앱 잠금 기능(4자리 PIN & 지문/생체인식)이 정식 지원되었습니다! 설정 메뉴에서 잠금을 활성화하여 더욱 안심하고 사용해 보세요 :)',
      replyDate: '2026-10-16',
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

  function getFeedbackList() {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_FEEDBACKS));
      return [...DEFAULT_MOCK_FEEDBACKS];
    }
    try {
      let parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_FEEDBACKS));
        return [...DEFAULT_MOCK_FEEDBACKS];
      }
      return parsed;
    } catch (e) {
      return [...DEFAULT_MOCK_FEEDBACKS];
    }
  }

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

  // Load Feedbacks for Hojumeoni
  loadHojumeoniFeedbacks();

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
      deviceInfo: 'Android / Hojumeoni User',
      appVersion: appVersion || '1.2.0',
      status: 'received',
      adminReply: null,
      replyDate: null,
      likes: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Save to LocalStorage (or API if server is up)
    try {
      if (window.parent && window.parent.feedbackApi) {
        await window.parent.feedbackApi.createFeedback(newRecord);
      } else {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        list.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('Storage save fallback', err);
    }

    showToast('소중한 피드백이 등록되었습니다! 감사합니다 ❤️');
    closeModal();
    writeForm.reset();
    loadHojumeoniFeedbacks();
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
    loadHojumeoniFeedbacks();
  }

  function disableAdminMode() {
    sessionStorage.removeItem('bf_admin_auth');
    localStorage.removeItem('bf_admin_mode');
    updateAdminHeaderUI();
    loadHojumeoniFeedbacks();
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
        <span style="font-size: 0.75rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); padding: 3px 8px; border-radius: var(--radius-full);">${cat.icon} ${cat.label}</span>
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
        loadHojumeoniFeedbacks();
      }
    });
  }

  const btnAdminDeleteFeedback = document.getElementById('btnAdminDeleteFeedback');
  if (btnAdminDeleteFeedback) {
    btnAdminDeleteFeedback.addEventListener('click', () => {
      const targetId = document.getElementById('adminTargetFeedbackId').value;
      if (!targetId) return;

      const list = getFeedbackList();
      const target = list.find(i => i.id === targetId);
      const targetTitle = target ? `"${target.title}"` : '이 피드백';

      if (confirm(`${targetTitle}을(를) 정말 삭제하시겠습니까?\n\n삭제된 피드백은 영구적으로 제거되며 복구할 수 없습니다.`)) {
        const updatedList = list.filter(i => i.id !== targetId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        showToast('피드백이 삭제되었습니다. 🗑️');
        closeAdminReplyModal();
        loadHojumeoniFeedbacks();
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

  function loadHojumeoniFeedbacks() {
    let list = getFeedbackList();
    let items = list.filter(item => item.appId === APP_ID);

    if (items.length === 0) {
      feedbackGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-glass);">
          <p style="color: var(--text-muted); margin-bottom: 12px;">아직 등록된 피드백이 없습니다.</p>
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
                <span style="font-size: 0.75rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); padding: 3px 8px; border-radius: var(--radius-full);">${cat.icon} ${cat.label}</span>
                ${getStatusBadge(item.status)}
              </div>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${item.createdAt ? item.createdAt.split(' ')[0] : ''}</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; line-height: 1.4;">${escapeHtml(item.title)}</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; white-space: pre-wrap;">${escapeHtml(item.content)}</p>

            ${item.adminReply ? `
              <div style="margin-top: 14px; padding: 12px 14px; background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; border-radius: 6px; font-size: 0.85rem; color: #cbd5e1; line-height: 1.6;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #60a5fa; font-weight: 700; font-size: 0.8rem;">
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
                <button style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); color:#93c5fd; font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.2s;" onclick="adminOpenReplyModal('${item.id}')">
                  <span>🛡️</span> <span>답변 & 상태 관리</span>
                </button>
              ` : ''}
            </div>
            <button style="background:none; border:none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="likeItem('${item.id}', this)">
              <span>❤️</span> <span>${item.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.likeItem = function(id, btn) {
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
  document.addEventListener('DOMContentLoaded', initHojumeoni);
} else {
  initHojumeoni();
}
