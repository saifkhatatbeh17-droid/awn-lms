# عون — وثيقة التكامل مع الخادم الخلفي (Backend Handoff Guide)
## مواصفات واجهات البرمجة (ASP.NET Core Web API Specifications)

تهدف هذه الوثيقة إلى توجيه مهندسي تطوير الواجهات الخلفية (Backend Engineers) لربط واجهات منصة **عون** التعليمية بخادم **ASP.NET Core 8 / 9** المبني بلغة C#.

---

### 1. إعدادات بيئة التشغيل والمصافحة (Runtime Handshake)

تعتمد الواجهة الأمامية على إعدادات محقونة في وسوم `<meta>` داخل ترويسة HTML:
```html
<meta name="awn-api-base-url" content="https://api.awn.moe.gov.jo">
<meta name="awn-demo-mode" content="false">
```
- عند تعيين `awn-api-base-url`: تقوم الواجهة تلقائيًا بتوجيه جميع استدعاءات الخدمات (`auth`, `admin`, `assignments`, `apiService`) إلى نقطة النهاية المحددة عبر بروتوكول HTTPS.
- يدعم الخادم سياسة CORS مع تمكين ملفات تعريف الارتباط:
  ```csharp
  builder.Services.AddCors(options => {
      options.AddPolicy("AwnFrontendPolicy", policy => {
          policy.WithOrigins("https://awn.moe.gov.jo", "http://localhost:8000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
      });
  });
  ```

---

### 2. عقد الاستجابة الموحد (Unified API Response Wrapper)

يجب أن تلتزم كافة وحدات التحكم (Controllers) في ASP.NET Core بنموذج الاستجابة الموحد:

```csharp
namespace Awn.Core.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string Message { get; set; } = string.Empty;

        public static ApiResponse<T> Ok(T data, string message = "تمت العملية بنجاح") =>
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message) =>
            new() { Success = false, Data = default, Message = message };
    }
}
```

---

### 3. مواصفات نقاط النهاية ونماذج البيانات (Endpoints & DTOs)

#### أ. المصادقة والجلسات (`/api/auth`)
*جميع طلبات المصادقة تستخدم ملفات تعريف الارتباط الآمنة `HttpOnly`, `SameSite=Strict`, `Secure`.*

- **تسجيل الدخول:** `POST /api/auth/login`
  - **الطلب:**
    ```json
    {
      "username": "teacher",
      "password": "SecurePassword123"
    }
    ```
  - **الاستجابة:**
    ```json
    {
      "success": true,
      "data": {
        "username": "teacher",
        "name": "أ. رامي الحمد",
        "role": "teacher",
        "redirect": "teacher-dashboard.html"
      },
      "message": "تم تسجيل الدخول بنجاح"
    }
    ```
- **التحقق من الجلسة:** `GET /api/auth/me`
- **تسجيل الخروج:** `POST /api/auth/logout`

---

#### ب. إدارة المستخدمين للآدمن (`/api/admin/users`)
*تتطلب صلاحية `[Authorize(Roles = "admin")]`.*

- **استعراض المستخدمين:** `GET /api/admin/users`
- **إنشاء مستخدم جديد:** `POST /api/admin/users`
  - **الطلب:**
    ```json
    {
      "username": "new_teacher",
      "name": "أ. أحمد المجالي",
      "role": "teacher",
      "organization": "مدرسة الملك عبدالله الثاني"
    }
    ```
- **تعديل بيانات الحساب:** `PATCH /api/admin/users/{id}`
- **تغيير حالة التفعيل:** `PATCH /api/admin/users/{id}/status`
  - **الطلب:** `{ "isActive": false }`
- **سجل التدقيق الإداري:** `GET /api/admin/audit`

---

#### ج. الواجبات المدرسية (`/api/assignments`)

- **استعراض الواجبات:** `GET /api/assignments`
- **إضافة واجب جديد:** `POST /api/assignments`
  - **الطلب:**
    ```json
    {
      "title": "حل تمارين الوحدة الرابعة",
      "subject": "اللغة العربية",
      "dueDate": "2026-10-25"
    }
    ```
- **تحديث حالة إنجاز الواجب:** `PATCH /api/assignments/{id}/status`
  - **الطلب:** `{ "status": "completed" }`

---

#### د. الحضور والغياب والسلوك (`/api/attendance`, `/api/behavior`)

- **تسجيل الحضور:** `POST /api/attendance`
  - **الطلب:**
    ```json
    {
      "date": "2026-10-15",
      "className": "العاشر (أ)",
      "period": "الحصة الأولى",
      "records": [
        { "name": "عمر خالد بني صخر", "status": "present" },
        { "name": "زيد محمود", "status": "absent" }
      ]
    }
    ```
- **استعلام الحضور:** `GET /api/attendance?date=2026-10-15&className=العاشر (أ)&period=الحصة الأولى`
- **تسجيل نقطة سلوك:** `POST /api/behavior`
  - **الطلب:** `{ "student": "عمر خالد", "points": 1, "note": "مشاركة صفية متميزة" }`

---

#### هـ. طلبات الإجازات والمرفقات (`/api/leaves`)

- **إرسال طلب إجازة:** `POST /api/leaves`
  - **النوع:** `multipart/form-data`
  - **الحقول:** `teacherId`, `type` (`medical`, `contingent`, `departure`), `startDate`, `endDate`, `reason`, `attachment` (`IFormFile` بصيغة PDF فقط).
- **اتخاذ قرار المدير:** `PATCH /api/leaves/{id}/decision`
  - **الطلب:** `{ "status": "approved", "decisionNote": "تمت الموافقة وتكليف معلم بديل" }`

---

### 4. الأمان وتفويض الصلاحيات (Security & RBAC)

1. **التحقق المستند إلى المطالبات (Claims-based Authorization):**
   ```csharp
   [Authorize(Roles = "teacher")]
   [HttpPost("api/attendance")]
   public async Task<IActionResult> SaveAttendance([FromBody] AttendanceDto dto) { ... }
   ```
2. **الحماية ضد XSS و CSRF:**
   - الواجهة الأمامية تعتمد `textContent` للحد من مخاطر الحقن النصي.
   - تفعيل كعكات مضادة للتزوير `Antiforgery` في ASP.NET Core وإرسال التوكن في الترويسة `X-XSRF-TOKEN`.
3. **تجريد البيانات الحساسة:**
   - لا يتم إرجاع كلمات المرور أو التجزئات (Hashes) مطلقًا في أي استجابة برمجية للعميل.
