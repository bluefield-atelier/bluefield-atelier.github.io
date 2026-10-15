/**
 * Hojumeoni App Page - Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const APP_ID = 'hojumeoni';
  const APP_NAME = '호주머니';
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
    btn.addEventListener('click', () => closeModal());
  });

  writeModal.addEventListener('click', (e) => {
    if (e.target === writeModal) closeModal();
  });

  // Check URL query parameters (App Deep Link)
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'write') {
    openModal();
  }
  if (params.get('version')) {
    document.getElementById('formAppVersion').value = params.get('version');
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

  const ADMIN_PIN = "1209";

  function getStatusBadge(status) {
    switch (status) {
      case 'resolved':
        return `<span style="font-size:0.72rem; font-weight:700; color:#34d399; background:rgba(16,185,129,0.12); padding:2px 7px; border-radius:999px;">● 반영 완료</span>`;
      case 'in_progress':
        return `<span style="font-size:0.72rem; font-weight:700; color:#93c5fd; background:rgba(59,130,246,0.15); padding:2px 7px; border-radius:999px;">● 수정 중</span>`;
      case 'reviewing':
        return `<span style="font-size:0.72rem; font-weight:700; color:#fcd34d; background:rgba(245,158,11,0.15); padding:2px 7px; border-radius:999px;">● 검토 중</span>`;
      case 'answered':
        return `<span style="font-size:0.72rem; font-weight:700; color:#d8b4fe; background:rgba(168,85,247,0.15); padding:2px 7px; border-radius:999px;">● 답변 완료</span>`;
      default:
        return `<span style="font-size:0.72rem; font-weight:700; color:#94a3b8; background:rgba(148,163,184,0.12); padding:2px 7px; border-radius:999px;">● 접수됨</span>`;
    }
  }

  function loadHojumeoniFeedbacks() {
    let list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${escapeHtml(item.content)}</p>

            ${item.adminReply ? `
              <div style="margin-top: 12px; padding: 10px 12px; background: rgba(59, 130, 246, 0.08); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 0.82rem; color: #93c5fd;">
                <strong>🛡️ 개발팀 답변:</strong> ${escapeHtml(item.adminReply)}
                ${item.replyDate ? `<span style="font-size:0.72rem; color:var(--text-dim); margin-left:6px;">(${item.replyDate})</span>` : ''}
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; font-size: 0.8rem; color: var(--text-dim);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span>작성자: <strong style="color: var(--text-main);">${escapeHtml(item.author)}</strong></span>
              <button style="background:none; border:none; color:#64748b; font-size:0.75rem; cursor:pointer; text-decoration:underline;" onclick="adminEditHojumeoni('${item.id}')">🛡️ 관리자</button>
            </div>
            <button style="background:none; border:none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="likeItem('${item.id}', this)">
              <span>❤️</span> <span>${item.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.adminEditHojumeoni = function(id) {
    if (sessionStorage.getItem('bf_admin_auth') !== 'true') {
      const pin = prompt('관리자 PIN 번호를 입력하세요:');
      if (pin !== ADMIN_PIN) {
        alert('PIN 번호가 일치하지 않습니다.');
        return;
      }
      sessionStorage.setItem('bf_admin_auth', 'true');
    }

    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const target = list.find(i => i.id === id);
    if (!target) return;

    const defaultChoice = target.status === 'resolved' ? '4' : (target.status === 'in_progress' ? '3' : (target.status === 'reviewing' ? '2' : (target.status === 'answered' ? '5' : '1')));
    const statusChoice = prompt('상태를 선택하세요:\n1: 접수됨\n2: 검토 중\n3: 수정 중\n4: 반영 완료\n5: 답변 완료', defaultChoice);
    if (statusChoice === '1') target.status = 'received';
    else if (statusChoice === '2') target.status = 'reviewing';
    else if (statusChoice === '3') target.status = 'in_progress';
    else if (statusChoice === '4') target.status = 'resolved';
    else if (statusChoice === '5') target.status = 'answered';

    const newReply = prompt('개발팀 공식 답변을 입력하세요:', target.adminReply || '');
    if (newReply !== null) {
      target.adminReply = newReply.trim() || null;
      target.replyDate = newReply.trim() ? new Date().toISOString().split('T')[0] : null;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    showToast('피드백 상태 및 답변이 저장되었습니다! 🛡️');
    loadHojumeoniFeedbacks();
  };

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
    writeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    writeModal.classList.remove('active');
    document.body.style.overflow = '';
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
});
