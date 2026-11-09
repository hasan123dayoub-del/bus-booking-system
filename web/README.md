# رحلتي — لوحة الإدارة والاستقبال

واجهة Next.js عربية باتجاه RTL لإدارة رحلات شركة رحلتي وحجوزات المكتب. تغطي لوحة الإدارة الباصات والرحلات والجداول وموظفي الاستقبال والتقارير، وتغطي منصة الاستقبال الحجز السريع وقوائم الركاب وتغيير المقاعد وإلغاء الحجوزات.

تستخدم الواجهة Tailwind CSS 4 مع رموز الألوان والخطوط في `src/app/globals.css`، مستوحاة من لوحة رحلتي في دراسة الحالة: أخضر داكن للتنقل، أخضر أساسي للإجراءات، وخلفيات فاتحة مع جداول وبطاقات واضحة ومتجاوبة.

## التشغيل

```bash
npm install
npm run dev
```

أنشئ ملف `.env.local` عند الحاجة لتغيير عنوان الواجهة الخلفية:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

العنوان الافتراضي هو `http://localhost:4000/api`، ويجب تشغيل الواجهة الخلفية بشكل منفصل. لا تستخدم الواجهة بيانات تجريبية عند تعذر الاتصال؛ تعرض رسالة الخطأ وتتيح إعادة المحاولة.

## الصفحات

- `/login` — دخول الإدارة وموظفي الاستقبال.
- `/admin` — نظرة عامة على الرحلات والإشغال والإيرادات.
- `/admin/buses` — إدارة الباصات ومخطط المقاعد.
- `/admin/trips` — إنشاء الرحلات وتعديلها وإلغاؤها.
- `/admin/schedules` — الجداول اليومية والأسبوعية والشهرية.
- `/admin/receptionists` و`/admin/receptionists/new` — إدارة حسابات الاستقبال.
- `/admin/reports` — تقارير الإيرادات والإشغال بحسب الفترة.
- `/reception/booking` — حجز مقاعد للركاب في المكتب.
- `/reception/bookings` — كشف الركاب وتغيير المقاعد وإلغاء الحجوزات.

## تكامل الواجهة الخلفية

تستخدم الواجهة المسارات الواردة في دراسة الحالة، تحت بادئة `/api`: `/auth/login`, `/cities`, `/staff/trips`, `/staff/bookings`, `/staff/trips/:id/manifest`, `/staff/bookings/:id/change-seat`, `/staff/bookings/:id/cancel`, `/admin/buses`, `/admin/trips`, `/admin/trips/:id/cancel`, `/admin/schedules`, `/admin/receptionists`, `/admin/reports/occupancy`, و`/admin/reports/revenue`.

دراسة الحالة لا تحدد كل تفاصيل الطلبات والاستجابات. تطبق الواجهة افتراضات REST المعتادة: القوائم تُعاد كمصفوفة أو ضمن `{ "data": [...] }`، ويُعاد تسجيل الدخول ضمن `{ "token": "...", "user": { ... } }` أو `{ "accessToken": "...", "user": { ... } }`. تستخدم المعرفات `_id`، وطلبات الإنشاء `POST` والتعديل `PATCH` والحذف `DELETE`. يستخدم حجز الاستقبال `customerName`, `customerPhone`, و`seats: [{ seatNumber, passengerName }]`، ويستخدم تغيير المقعد `seatNumber` و`newSeatNumber`. عدّل هذه الأشكال في `src/lib/api.ts` وصفحات النماذج إذا اختلف عقد الخادم.

يرسل رمز JWT في ترويسة `Authorization: Bearer ...`. تحفظ جلسة الدخول في `localStorage`، وتُقصر مسارات `/admin/*` على دور `ADMIN` ومسارات `/reception/*` على دور `RECEPTIONIST`.
