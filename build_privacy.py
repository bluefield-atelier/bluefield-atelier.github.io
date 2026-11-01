#!/usr/bin/env python3
"""
BlueField Atelier Privacy Policy Builder
----------------------------------------
각 앱의 내용 파일(`privacy_contents/{app}_{lang}.html`)을 기반으로:
1. 통합 페이지: `privacy.html`
2. 개별 단독 페이지: `privacy_{app}.html` 및 `privacy-{app}.html`
를 자동으로 일괄 조립/동기화 생성합니다.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENTS_DIR = os.path.join(BASE_DIR, 'privacy_contents')

APPS = [
    {
        'key': 'hojumeoni',
        'name_ko': '호주머니',
        'name_en': 'Hojumeoni',
        'icon': '🧺',
        'desc': '호주머니 (Hojumeoni) 앱의 공식 개인정보처리방침입니다.',
        'show_tab': True,
    },
    {
        'key': 'musahi',
        'name_ko': '무사히',
        'name_en': 'Musahi',
        'icon': '🎖️',
        'desc': '무사히 (Musahi) 앱의 공식 개인정보처리방침입니다.',
        'show_tab': True,
    },
    {
        'key': 'waku',
        'name_ko': 'Waku 일본어',
        'name_en': 'Waku Japanese',
        'icon': '🇯🇵',
        'desc': 'Waku 일본어 (Waku Japanese) 앱의 공식 개인정보처리방침입니다.',
        'show_tab': True,
    },
    {
        'key': 'youthcare',
        'name_ko': '상담노트',
        'name_en': 'Counseling Notes',
        'icon': '📒',
        'desc': '상담노트 (Counseling Notes / YouthCare Scheduler) 앱의 공식 개인정보처리방침입니다.',
        'show_tab': True,
    },
    {
        'key': 'oneul',
        'name_ko': '오늘',
        'name_en': 'O-NEUL',
        'icon': '🎙️',
        'desc': '오늘 (O-NEUL) 앱의 공식 개인정보처리방침입니다.',
        'show_tab': False,  # 탭 숨김 처리
    },
]

COMMON_CSS = """
    .privacy-container {
      max-width: 920px;
      margin: 0 auto;
      padding: 36px 20px 80px 20px;
    }

    .app-selector-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
      align-items: center;
    }

    .app-tab-btn {
      padding: 9px 18px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-glass);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .app-tab-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    .app-tab-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 14px var(--primary-glow);
    }

    .lang-switch-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .lang-tab {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-glass);
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-dim);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .lang-tab:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.08);
    }

    .lang-tab.active {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .privacy-card {
      background: var(--bg-card);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-lg);
      padding: 40px 36px;
      box-shadow: var(--shadow-glass);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    @media (max-width: 640px) {
      .privacy-card {
        padding: 24px 18px;
      }
      .privacy-container {
        padding: 20px 14px 60px 14px;
      }
    }

    .privacy-header {
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .privacy-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .privacy-meta-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .policy-section {
      margin-bottom: 32px;
    }

    .policy-section h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .policy-section h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: #e2e8f0;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    .policy-section p {
      color: var(--text-muted);
      line-height: 1.75;
      margin-bottom: 12px;
      font-size: 0.94rem;
    }

    .policy-section ul, .policy-section ol {
      padding-left: 20px;
      margin-bottom: 14px;
      color: var(--text-muted);
      line-height: 1.75;
      font-size: 0.94rem;
    }

    .policy-section li {
      margin-bottom: 6px;
    }

    .policy-section a {
      color: #60a5fa;
      text-decoration: underline;
    }

    .highlight-box {
      background: rgba(59, 130, 246, 0.08);
      border-left: 4px solid var(--primary);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      padding: 14px 18px;
      margin: 16px 0;
      font-size: 0.9rem;
      color: #cbd5e1;
      line-height: 1.65;
    }

    .contact-box {
      background: rgba(13, 19, 32, 0.7);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-md);
      padding: 20px 24px;
      margin-top: 16px;
    }

    .contact-box dt {
      font-weight: 700;
      color: var(--text-main);
      margin-top: 10px;
      font-size: 0.9rem;
    }

    .contact-box dd {
      margin-left: 0;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .nav-back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 20px;
      transition: all var(--transition-fast);
    }

    .nav-back-link:hover {
      color: #93c5fd;
      transform: translateX(-3px);
    }
"""

def read_article(app_key, lang):
    file_path = os.path.join(CONTENTS_DIR, f"{app_key}_{lang}.html")
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found!")
        return ""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def build_combined_page():
    """Build unified privacy.html with all app articles."""
    articles_html = []
    tabs_html = []

    for app in APPS:
        app_key = app['key']
        hide_attr = ' style="display: none;"' if not app['show_tab'] else ''
        tabs_html.append(f"""      <button class="app-tab-btn" data-app="{app_key}" onclick="selectApp('{app_key}')"{hide_attr}>
        <span>{app['icon']} {app['name_ko']} ({app['name_en']})</span>
      </button>""")

        ko_art = read_article(app_key, 'ko')
        en_art = read_article(app_key, 'en')

        # Add initial inline styles for visibility switching
        if app_key == 'hojumeoni':
            ko_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}Ko" class="privacy-card app-privacy-content">', ko_art, count=1)
            en_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}En" class="privacy-card app-privacy-content" style="display: none;">', en_art, count=1)
        else:
            ko_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}Ko" class="privacy-card app-privacy-content" style="display: none;">', ko_art, count=1)
            en_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}En" class="privacy-card app-privacy-content" style="display: none;">', en_art, count=1)

        articles_html.append(f"    <!-- {app['name_en']} Articles -->\n{ko_art}\n\n{en_art}")

    tabs_str = "\n".join(tabs_html)
    articles_str = "\n\n".join(articles_html)

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 (Privacy Policy) | BlueField Atelier</title>
  <meta name="description" content="BlueField Atelier 대표 앱(호주머니, 무사히, Waku 일본어, 상담노트)의 공식 개인정보처리방침(Privacy Policy) 페이지입니다.">
  <link rel="icon" type="image/png" href="assets/atelier_logo.png">
  <link rel="stylesheet" href="css/style.css?v=20261018_2030">
  <style>{COMMON_CSS}  </style>
</head>
<body>

  <!-- Ambient Background Glows -->
  <div class="bg-glow-layer">
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="brand-wrapper">
        <img src="assets/atelier_logo.png" alt="BlueField Atelier 로고" class="brand-logo-img">
        <div class="brand-info">
          <h1>BlueField Atelier</h1>
          <p>Mobile Apps & Community</p>
        </div>
      </a>

      <div class="header-actions">
        <a href="index.html" class="btn btn-hub" title="블루필드 아틀리에 메인 허브로 이동">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>메인 허브</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="privacy-container">
    <a href="index.html" class="nav-back-link">← BlueField Atelier 메인 허브로 돌아가기</a>

    <!-- App Selector Tabs -->
    <div class="app-selector-bar">
{tabs_str}
    </div>

    <!-- Language Switcher Bar -->
    <div class="lang-switch-bar">
      <button id="tabKo" class="lang-tab active" onclick="switchLanguage('ko')">🇰🇷 한국어 (Korean)</button>
      <button id="tabEn" class="lang-tab" onclick="switchLanguage('en')">🌐 English</button>
    </div>

{articles_str}

  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;">
        <img src="assets/atelier_logo.png" alt="BlueField Atelier" style="width: 24px; height: 24px; border-radius: 4px;">
        <span style="font-weight: 700; color: #fff;">BlueField Atelier</span>
      </div>
      <p style="margin-bottom: 8px;">소소하지만 필요한 가치를 정성껏 빚어내는 BlueField Atelier</p>
      <p style="margin-bottom: 12px;">
        <a href="index.html" style="color: #94a3b8; text-decoration: none; margin: 0 10px;">메인 포털</a>
        <a href="privacy.html" style="color: var(--primary); font-weight: 600; text-decoration: underline; margin: 0 10px;">개인정보처리방침</a>
      </p>
      <p style="font-size: 0.78rem; color: #64748b;">© 2026 BlueField Atelier. All rights reserved.</p>
    </div>
  </footer>

  <script>
    let currentApp = 'hojumeoni';
    let currentLang = 'ko';

    function renderPolicy() {{
      // Hide all articles
      document.querySelectorAll('.app-privacy-content').forEach(el => {{
        el.style.display = 'none';
      }});

      // Show current app and lang article
      const targetId = currentApp + (currentLang === 'ko' ? 'Ko' : 'En');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {{
        targetEl.style.display = 'block';
      }}

      // Update app tab active states
      document.querySelectorAll('.app-tab-btn').forEach(btn => {{
        if (btn.getAttribute('data-app') === currentApp) {{
          btn.classList.add('active');
        }} else {{
          btn.classList.remove('active');
        }}
      }});

      // Update lang tab active states
      const tabKo = document.getElementById('tabKo');
      const tabEn = document.getElementById('tabEn');
      if (currentLang === 'ko') {{
        tabKo.classList.add('active');
        tabEn.classList.remove('active');
        document.documentElement.lang = 'ko';
      }} else {{
        tabKo.classList.remove('active');
        tabEn.classList.add('active');
        document.documentElement.lang = 'en';
      }}
    }}

    function selectApp(app) {{
      currentApp = app;
      const url = new URL(window.location);
      url.searchParams.set('app', app);
      history.replaceState(null, '', url.toString());
      renderPolicy();
    }}

    function switchLanguage(lang) {{
      currentLang = lang;
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.toString());
      renderPolicy();
    }}

    // Initialize from URL params or hash
    (function init() {{
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace('#', '').toLowerCase();
      
      const appParam = params.get('app') || hash;
      const validApps = {repr([a['key'] for a in APPS])};
      if (appParam && validApps.includes(appParam)) {{
        currentApp = appParam;
      }}

      const langParam = params.get('lang');
      if (langParam && (langParam === 'en' || langParam === 'ko')) {{
        currentLang = langParam;
      }}

      renderPolicy();
    }})();
  </script>
</body>
</html>"""

    out_file = os.path.join(BASE_DIR, "privacy.html")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html)
    print("Built unified page: privacy.html")

def build_standalone_pages():
    """Build standalone privacy_{app}.html and privacy-{app}.html for each app."""
    for app in APPS:
        app_key = app['key']
        ko_art = read_article(app_key, 'ko')
        en_art = read_article(app_key, 'en')

        # Ensure correct initial display state
        ko_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}Ko" class="privacy-card app-privacy-content">', ko_art, count=1)
        en_art = re.sub(r'<article id="[^"]+"[^>]*>', f'<article id="{app_key}En" class="privacy-card app-privacy-content" style="display: none;">', en_art, count=1)

        html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 - {app['name_ko']} ({app['name_en']}) | BlueField Atelier</title>
  <meta name="description" content="{app['desc']}">
  <link rel="icon" type="image/png" href="assets/atelier_logo.png">
  <link rel="stylesheet" href="css/style.css?v=20261018_2030">
  <style>{COMMON_CSS}  </style>
</head>
<body>

  <!-- Ambient Background Glows -->
  <div class="bg-glow-layer">
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="brand-wrapper">
        <img src="assets/atelier_logo.png" alt="BlueField Atelier 로고" class="brand-logo-img">
        <div class="brand-info">
          <h1>BlueField Atelier</h1>
          <p>Mobile Apps & Community</p>
        </div>
      </a>

      <div class="header-actions">
        <a href="index.html" class="btn btn-hub" title="블루필드 아틀리에 메인 허브로 이동">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>메인 허브</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="privacy-container">
    <a href="index.html" class="nav-back-link">← BlueField Atelier 메인 허브로 돌아가기</a>

    <!-- Language Switcher Bar -->
    <div class="lang-switch-bar">
      <button id="tabKo" class="lang-tab active" onclick="switchLanguage('ko')">🇰🇷 한국어 (Korean)</button>
      <button id="tabEn" class="lang-tab" onclick="switchLanguage('en')">🌐 English</button>
    </div>

    <!-- Article Content -->
{ko_art}

{en_art}

  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;">
        <img src="assets/atelier_logo.png" alt="BlueField Atelier" style="width: 24px; height: 24px; border-radius: 4px;">
        <span style="font-weight: 700; color: #fff;">BlueField Atelier</span>
      </div>
      <p style="margin-bottom: 8px;">소소하지만 필요한 가치를 정성껏 빚어내는 BlueField Atelier</p>
      <p style="margin-bottom: 12px;">
        <a href="index.html" style="color: #94a3b8; text-decoration: none; margin: 0 10px;">메인 포털</a>
        <a href="privacy.html" style="color: #94a3b8; text-decoration: none; margin: 0 10px;">통합 개인정보처리방침</a>
      </p>
      <p style="font-size: 0.78rem; color: #64748b;">© 2026 BlueField Atelier. All rights reserved.</p>
    </div>
  </footer>

  <script>
    let currentLang = 'ko';

    function renderPolicy() {{
      const koEl = document.getElementById('{app_key}Ko');
      const enEl = document.getElementById('{app_key}En');
      const tabKo = document.getElementById('tabKo');
      const tabEn = document.getElementById('tabEn');

      if (currentLang === 'ko') {{
        if (koEl) koEl.style.display = 'block';
        if (enEl) enEl.style.display = 'none';
        tabKo.classList.add('active');
        tabEn.classList.remove('active');
        document.documentElement.lang = 'ko';
      }} else {{
        if (koEl) koEl.style.display = 'none';
        if (enEl) enEl.style.display = 'block';
        tabKo.classList.remove('active');
        tabEn.classList.add('active');
        document.documentElement.lang = 'en';
      }}
    }}

    function switchLanguage(lang) {{
      currentLang = lang;
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.toString());
      renderPolicy();
    }}

    (function init() {{
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      if (langParam === 'en' || langParam === 'ko') {{
        currentLang = langParam;
      }}
      renderPolicy();
    }})();
  </script>
</body>
</html>"""

        # Generate both privacy_{app}.html and privacy-{app}.html for link compatibility
        for filename in [f"privacy_{app_key}.html", f"privacy-{app_key}.html"]:
            out_file = os.path.join(BASE_DIR, filename)
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"Built standalone page: {filename}")

if __name__ == "__main__":
    print("Building privacy policy pages...")
    build_combined_page()
    build_standalone_pages()
    print("Done! All privacy pages successfully built and synchronized.")
