# BlueField Atelier 사용자 Feedback 연동 & 백엔드 가이드

본 문서는 **BlueField Atelier**의 각 모바일 앱(호주머니, 무사히, 오늘, 와쿠와쿠 일본어/중국어 등)과 **공개 Feedback 포털(게시판)** 사이의 백엔드 처리 규격 및 연동 방법을 안내합니다.

---

## 1. 아키텍처 구조

```
[ 모바일 앱 (Android / iOS) ]
      │
      ├─ 1) 인앱 직접 전송 (REST API POST)
      │     └─► [ Backend API Server ] ──► [ feedbacks.db (SQLite) ]
      │                                                ▲
      └─ 2) 웹뷰 / 브라우저 열기 (?mode=write)          │
            └─► [ Feedback Web Portal (GitHub Pages) ] ─┘
```

- **웹 포털 (`FeedbackPage`)**:
  - 누구나 브라우저에서 앱별 피드백/제안을 **게시판처럼 열람, 검색, 필터링, 공감**할 수 있는 웹 프론트엔드입니다.
  - 백엔드가 없거나 오프라인일 때도 `LocalStorage` 기반으로 완벽하게 동작하며, 백엔드 API가 활성화되면 자동으로 실제 DB와 동기화됩니다.
- **백엔드 서버 (`server.py`)**:
  - 피드백 등록, 조회, 공감 카운트, 답변 기능을 담당하는 가볍고 빠른 Python 내장 서버입니다.
  - 표준 라이브러리인 `sqlite3`를 사용하여 별도 DB 설치 없이 즉시 실행 가능합니다.

---

## 2. 데이터베이스 스키마 (`feedbacks.db`)

```sql
CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,            -- 예: "fb-1729000000000"
    app_id TEXT NOT NULL,           -- 앱 고유 식별자 (예: hojumeoni, musahi, oneul)
    app_name TEXT NOT NULL,         -- 표시용 앱 이름 (예: 호주머니, 무사히)
    category TEXT NOT NULL,         -- feature(기능제안), bug(버그), inquiry(문의), praise(칭찬)
    title TEXT NOT NULL,            -- 제목
    content TEXT NOT NULL,          -- 내용 (줄바꿈 포함)
    author TEXT NOT NULL,           -- 작성자 / 닉네임
    email TEXT,                     -- 답변 알림용 이메일 (선택)
    device_info TEXT,               -- 기기 모델 및 OS 버전 (예: "Galaxy S24 / Android 14")
    app_version TEXT,               -- 앱 버전 (예: "1.2.4")
    status TEXT DEFAULT 'received', -- 상태: received(접수), reviewing(검토중), resolved(반영완료)
    admin_reply TEXT,               -- 개발팀 공식 답변 내용
    reply_date TEXT,                -- 답변 일자 (YYYY-MM-DD)
    likes INTEGER DEFAULT 0,        -- 공감(좋아요) 수
    created_at TEXT NOT NULL        -- 등록일시 (YYYY-MM-DD HH:MM)
);
```

---

## 3. 백엔드 REST API 규격

기본 포트: `http://localhost:8085` (또는 운영 서버 도메인)

### 3.1. 피드백 등록 (앱에서 "전송하기" 누를 때 호출)
- **Method**: `POST`
- **Endpoint**: `/api/feedbacks`
- **Headers**: `Content-Type: application/json`

#### 요청 Payload (Request Body):
```json
{
  "appId": "hojumeoni",
  "appName": "호주머니",
  "category": "feature",
  "title": "폴더 잠금 기능 제안",
  "content": "개인적인 메모 폴더에 지문 인식 잠금 기능이 추가되면 좋겠습니다.",
  "author": "홍길동",
  "email": "user@example.com",
  "deviceInfo": "Galaxy S24 / Android 14",
  "appVersion": "1.2.0"
}
```

> **필수 필드**: `title`, `content`  
> 나머지 필드는 누락 시 기본값("익명의 사용자", "other" 등)으로 자동 처리됩니다.

#### 응답 Payload (Response Body - 201 Created):
```json
{
  "id": "fb-1729001234567",
  "appId": "hojumeoni",
  "appName": "호주머니",
  "category": "feature",
  "title": "폴더 잠금 기능 제안",
  "content": "개인적인 메모 폴더에 지문 인식 잠금 기능이 추가되면 좋겠습니다.",
  "author": "홍길동",
  "email": "user@example.com",
  "deviceInfo": "Galaxy S24 / Android 14",
  "appVersion": "1.2.0",
  "status": "received",
  "adminReply": null,
  "replyDate": null,
  "likes": 0,
  "createdAt": "2026-10-15 21:05"
}
```

---

### 3.2. 피드백 목록 조회 (게시판 화면에서 호출)
- **Method**: `GET`
- **Endpoint**: `/api/feedbacks`
- **Query Parameters (선택)**:
  - `app`: 특정 앱 ID 필터 (`hojumeoni`, `musahi`, `oneul`, `all` 등)
  - `category`: 카테고리 필터 (`feature`, `bug`, `inquiry`, `praise`, `all`)
  - `search`: 검색어 (제목, 내용, 작성자 대상 검색)
  - `sort`: 정렬 기준 (`latest`: 최신순, `likes`: 공감순)

---

### 3.3. 피드백 공감 (좋아요)
- **Method**: `POST`
- **Endpoint**: `/api/feedbacks/{id}/like`
- **응답 (200 OK)**:
```json
{
  "id": "fb-1001",
  "likes": 25
}
```

---

## 4. 안드로이드 앱에서 피드백 보내는 2가지 연동 방법

### 방법 A. 앱에서 직접 HTTP API 호출하기 (추천)
앱 내 다이얼로그나 화면에서 **작성자, 제목, 내용**을 입력받아 백엔드로 바로 전송합니다.

#### Kotlin + OkHttp 예제:
```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

fun sendFeedback(
    appId: String,
    appName: String,
    title: String,
    content: String,
    author: String,
    onSuccess: () -> Unit,
    onError: (String) -> Unit
) {
    val client = OkHttpClient()
    val url = "https://your-api-domain.com/api/feedbacks" // 운영 서버 URL

    val json = JSONObject().apply {
        put("appId", appId)
        put("appName", appName)
        put("category", "feature") // 또는 사용자가 선택한 카테고리
        put("title", title)
        put("content", content)
        put("author", author.ifBlank { "익명의 사용자" })
        put("appVersion", BuildConfig.VERSION_NAME)
        put("deviceInfo", "${android.os.Build.MODEL} / Android ${android.os.Build.VERSION.RELEASE}")
    }

    val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
    val request = Request.Builder()
        .url(url)
        .post(requestBody)
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            onError(e.localizedMessage ?: "전송 실패")
        }

        override fun onResponse(call: Call, response: Response) {
            if (response.isSuccessful) {
                onSuccess()
            } else {
                onError("서버 오류: ${response.code}")
            }
        }
    })
}
```

---

### 방법 B. 딥링크 / 웹뷰로 작성창 띄우기 (간편 방식)
앱의 "피드백 남기기" 버튼을 누르면 브라우저(CustomTabs) 또는 웹뷰로 웹페이지를 바로 열어줍니다. URL 쿼리 파라미터를 통해 앱 이름과 버전이 자동으로 채워지고 작성 모달이 바로 뜹니다.

```kotlin
// 예시: 버튼 클릭 시 인앱 브라우저 실행
val feedbackUrl = "https://bluefield-atelier.github.io/?" +
    "app=hojumeoni" +
    "&mode=write" +
    "&version=${BuildConfig.VERSION_NAME}" +
    "&device=${android.os.Build.MODEL}"

val intent = CustomTabsIntent.Builder().build()
intent.launchUrl(context, Uri.parse(feedbackUrl))
```

---

## 5. 로컬 서버 실행 및 관리 방법

포털 폴더([`/home/tedd/MyWork/GitHub-Server/BlueField-Atelier`](file:///home/tedd/MyWork/GitHub-Server/BlueField-Atelier))에서 아래 명령어로 서버를 즉시 구동할 수 있습니다:

```bash
# 기본 8085 포트로 실행
python3 server.py

# 다른 포트로 실행하고 싶을 경우
python3 server.py 9000
```

실행 후 브라우저에서 `http://localhost:8085`에 접속하면 모던한 다크 글래스모피즘 디자인의 피드백 게시판을 바로 확인할 수 있습니다.
