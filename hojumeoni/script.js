/**
 * Hojumeoni App Page - Interactive Logic
 */

function initHojumeoni() {
  const APP_NAME = '호주머니';

  // DOM
  const writeModal = document.getElementById('writeModal');
  const writeForm = document.getElementById('writeForm');
  const btnOpenWrite = document.getElementById('btnOpenWrite');
  const heroBtnFeedback = document.getElementById('heroBtnFeedback');
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

  if (btnOpenWrite) btnOpenWrite.addEventListener('click', () => openModal());
  if (heroBtnFeedback) heroBtnFeedback.addEventListener('click', () => openModal());

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
    });
  });

  if (writeModal) {
    writeModal.addEventListener('click', (e) => {
      if (e.target === writeModal) closeModal();
    });
  }

  // Copy Extension Link for Mobile / PC Users
  const btnCopyExtensionLink = document.getElementById('btnCopyExtensionLink');
  if (btnCopyExtensionLink) {
    btnCopyExtensionLink.addEventListener('click', async () => {
      const extensionUrl = 'https://chromewebstore.google.com/detail/gclcnpcigkcdfmfmdjmhfjbflaicoejd';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(extensionUrl);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = extensionUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          tempInput.remove();
        }
        showToast('스토어 링크가 복사되었습니다! PC나 나에게 전달해 보세요.');
      } catch (err) {
        prompt('아래 링크를 복사하여 PC에서 열어보세요:', extensionUrl);
      }
    });
  }

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

  // Form Submit (Direct Developer Email Submission via FormSubmit)
  if (writeForm) {
    writeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('formTitle').value.trim();
      const content = document.getElementById('formContent').value.trim();
      const author = document.getElementById('formAuthor').value.trim() || '익명의 사용자';
      const email = document.getElementById('formEmail').value.trim();
      const catInput = document.querySelector('input[name="category"]:checked');
      const category = catInput ? catInput.value : 'feature';
      const appVersion = document.getElementById('formAppVersion') ? document.getElementById('formAppVersion').value : '1.2.4';

      if (!title || !content) {
        showToast('제목과 내용을 모두 입력해주세요.');
        return;
      }

      const categoryNames = {
        feature: '💡 기능 제안',
        bug: '🐛 버그 제보',
        inquiry: '💬 사용 문의',
        praise: '✨ 응원/칭찬'
      };

      const submitBtn = document.getElementById('btnSubmitFeedback') || writeForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<span>개발팀으로 전달하기 ✉️</span>';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>메일 전달 중... ⏳</span>';
      }

      try {
        const response = await fetch('https://formsubmit.co/ajax/tedd.devteam@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `[${APP_NAME} 피드백 전달] ${title}`,
            _cc: "bluefield.works@gmail.com",
            _template: "table",
            "앱 이름": APP_NAME,
            "앱 버전": appVersion || '1.2.4',
            "분류": categoryNames[category] || category,
            "작성자": author,
            "회신 받을 이메일": email || '미입력 (이메일 없음)',
            "제목": title,
            "피드백 / 개선 제안 내용": content,
            "전송 일시": new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          })
        });

        if (response.ok) {
          showToast('소중한 피드백이 개발팀 메일로 안전하게 전달되었습니다! 감사합니다 ❤️');
          closeModal();
          writeForm.reset();
        } else {
          throw new Error('전송 응답 오류: ' + response.status);
        }
      } catch (err) {
        console.error('Feedback submit error:', err);
        showToast('전송 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  // Scroll locking & modal helpers
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

  function openModal() {
    lockBodyScroll();
    if (writeModal) writeModal.classList.add('active');
  }

  function closeModal() {
    if (writeModal) writeModal.classList.remove('active');
    unlockBodyScroll();
  }

  if (writeModal) {
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
  }

  function showToast(msg) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

// Ensure execution whether DOMContentLoaded has already fired or not
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHojumeoni);
} else {
  initHojumeoni();
}
