#!/usr/bin/env python3
"""
BlueField Atelier Feedback Portal - Standalone Python Backend & Static Server
Provides REST API for feedback submission, listing, and storage via SQLite.
"""

import http.server
import socketserver
import socket
import json
import os
import sys
import sqlite3
import urllib.parse
from datetime import datetime

PORT = 8085
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "feedbacks.db")

class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, 'SO_REUSEPORT'):
            try:
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            except Exception:
                pass
        super().server_bind()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS feedbacks (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        app_name TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        email TEXT,
        device_info TEXT,
        app_version TEXT,
        status TEXT DEFAULT 'received',
        admin_reply TEXT,
        reply_date TEXT,
        likes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # Seed initial data if empty
    cur.execute("SELECT COUNT(*) FROM feedbacks")
    if cur.fetchone()[0] == 0:
        seed_data = [
            (
                'fb-1001', 'hojumeoni', '호주머니', 'feature',
                '폴더별로 생체인증(지문) 잠금 기능이 추가되면 좋겠어요!',
                '호주머니 앱 정말 유용하게 매일 쓰고 있습니다. 특히 웹서핑하다가 공유버튼으로 1초만에 보관하는 기능이 최고예요!\n\n중요한 개인 메모나 영수증 사진을 보관하는 특정 폴더에 생체인식 잠금 기능이 들어가면 더 안심하고 쓸 수 있을 것 같습니다.',
                '스마트수집가', 'user1@example.com', 'Galaxy S24 / Android 14', '1.2.4',
                'resolved', '안녕하세요 스마트수집가님! 따뜻한 피드백 감사합니다. 폴더별 생체인증 잠금 기능은 다음 1.3.0 업데이트 로드맵에 반영되어 현재 테스트 중입니다.',
                '2026-10-14', 24, '2026-10-12 14:20'
            ),
            (
                'fb-1002', 'musahi', '무사히', 'bug',
                '홈 위젯에서 D-Day 퍼센트 갱신이 간혹 늦어지는 현상',
                '항상 무사히 앱으로 남은 복무일 확인하면서 힘내고 있습니다.\n홈 화면 위젯에서 자정이 지나도 퍼센트가 바로 안 바뀌고 앱을 한번 실행해야 갱신되는 경우가 종종 있습니다. 확인 부탁드려요!',
                '일병_김철수', '', 'Galaxy A54 / Android 13', '2.0.1',
                'reviewing', '충성! 소중한 제보 감사합니다. 안드로이드 백그라운드 배터리 최적화 정책으로 인해 발생하는 지연을 확인하였으며 보완 조치 중입니다.',
                '2026-10-15', 18, '2026-10-14 09:15'
            ),
            (
                'fb-1003', 'oneul', '오늘', 'praise',
                '디자인도 깔끔하고 위젯도 너무 예쁩니다 ❤️',
                '하루 일정과 디데이를 한눈에 볼 수 있어서 다른 일정관리 앱 다 지우고 이것만 씁니다. 오래오래 업데이트 해주세요!',
                '오늘도화이팅', '', 'Pixel 8 / Android 14', '1.1.0',
                'resolved', '기분 좋은 응원 말씀에 큰 힘을 얻습니다! 앞으로도 더욱 정성껏 만들어가겠습니다.',
                '2026-10-13', 35, '2026-10-11 18:42'
            )
        ]
        cur.executemany("""
        INSERT INTO feedbacks (
            id, app_id, app_name, category, title, content, author, email,
            device_info, app_version, status, admin_reply, reply_date, likes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_data)
        conn.commit()

    conn.close()

class FeedbackRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for cross-origin API calls from mobile apps or other domains
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Health Check
        if path == "/api/health":
            self.send_json(200, {"status": "ok", "time": datetime.now().isoformat()})
            return

        # Feedback List API
        if path == "/api/feedbacks":
            self.handle_get_feedbacks(query)
            return

        # Fallback to static file server
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Create Feedback API
        if path == "/api/feedbacks":
            self.handle_create_feedback()
            return

        # Like Feedback API: /api/feedbacks/<id>/like
        if path.startswith("/api/feedbacks/") and path.endswith("/like"):
            parts = path.split("/")
            if len(parts) >= 4:
                feedback_id = parts[3]
                self.handle_like_feedback(feedback_id)
                return

        self.send_json(404, {"error": "Not Found"})

    def handle_get_feedbacks(self, query):
        app = query.get('app', [None])[0]
        cat = query.get('category', [None])[0]
        search = query.get('search', [None])[0]
        sort = query.get('sort', ['latest'])[0]

        sql = "SELECT id, app_id, app_name, category, title, content, author, email, device_info, app_version, status, admin_reply, reply_date, likes, created_at FROM feedbacks WHERE 1=1"
        params = []

        if app and app != 'all':
            sql += " AND app_id = ?"
            params.append(app)

        if cat and cat != 'all':
            sql += " AND category = ?"
            params.append(cat)

        if search:
            sql += " AND (title LIKE ? OR content LIKE ? OR author LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        if sort == 'likes':
            sql += " ORDER BY likes DESC, created_at DESC"
        else:
            sql += " ORDER BY created_at DESC"

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "appId": r["app_id"],
                "appName": r["app_name"],
                "category": r["category"],
                "title": r["title"],
                "content": r["content"],
                "author": r["author"],
                "email": r["email"],
                "deviceInfo": r["device_info"],
                "appVersion": r["app_version"],
                "status": r["status"],
                "adminReply": r["admin_reply"],
                "replyDate": r["reply_date"],
                "likes": r["likes"],
                "createdAt": r["created_at"]
            })
        conn.close()

        self.send_json(200, result)

    def handle_create_feedback(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            self.send_json(400, {"error": "Empty body"})
            return

        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
        except Exception:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        title = data.get("title", "").strip()
        content = data.get("content", "").strip()
        author = data.get("author", "").strip() or "익명의 사용자"
        app_id = data.get("appId", "other")
        app_name = data.get("appName", "기타")
        category = data.get("category", "feature")
        email = data.get("email", "")
        device_info = data.get("deviceInfo", "")
        app_version = data.get("appVersion", "")

        if not title or not content:
            self.send_json(400, {"error": "Title and content are required"})
            return

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_id = f"fb-{int(datetime.now().timestamp() * 1000)}"

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO feedbacks (
            id, app_id, app_name, category, title, content, author, email,
            device_info, app_version, status, admin_reply, reply_date, likes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', NULL, NULL, 0, ?)
        """, (new_id, app_id, app_name, category, title, content, author, email, device_info, app_version, now_str))
        conn.commit()
        conn.close()

        res_obj = {
            "id": new_id,
            "appId": app_id,
            "appName": app_name,
            "category": category,
            "title": title,
            "content": content,
            "author": author,
            "email": email,
            "deviceInfo": device_info,
            "appVersion": app_version,
            "status": "received",
            "adminReply": None,
            "replyDate": None,
            "likes": 0,
            "createdAt": now_str
        }

        self.send_json(201, res_obj)

    def handle_like_feedback(self, feedback_id):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("UPDATE feedbacks SET likes = likes + 1 WHERE id = ?", (feedback_id,))
        conn.commit()
        cur.execute("SELECT likes FROM feedbacks WHERE id = ?", (feedback_id,))
        row = cur.fetchone()
        conn.close()

        if row:
            self.send_json(200, {"id": feedback_id, "likes": row[0]})
        else:
            self.send_json(404, {"error": "Feedback not found"})

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run():
    init_db()
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    server_address = ('', port)
    httpd = ReusableTCPServer(server_address, FeedbackRequestHandler)
    print(f"🚀 BlueField Feedback Server is running on: http://localhost:{port}")
    print(f"📁 Serving static files from: {BASE_DIR}")
    print(f"💾 SQLite Database: {DB_FILE}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    run()
