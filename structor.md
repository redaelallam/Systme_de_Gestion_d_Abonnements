src/
├── api/
│   └── axiosConfig.js          # إعدادات Axios للربط مع Laravel API
├── assets/
│   └── images/                 # الشعارات والأيقونات الخاصة بنظام SGA
├── components/
│   └── common/                 # مكونات عامة قابلة لإعادة الاستخدام
│       ├── Sidebar.jsx         # القائمة الجانبية (Admin/Employee)
│       ├── Navbar.jsx          # شريط التنقل العلوي
│       ├── StatCard.jsx        # بطاقات الإحصائيات السريعة
│       ├── DataTable.jsx       # جدول البيانات الديناميكي
│       ├── StatusBadge.jsx     # تمييز حالة الاشتراك (Active/Canceled)
│       └── CustomModal.jsx     # النوافذ المنبثقة للتأكيد والإضافة
├── features/                   # الميزات الأساسية بناءً على Use Cases
│   ├── auth/
│   │   ├── authSlice.js        # إدارة حالة تسجيل الدخول (Redux)
│   │   ├── LoginForm.jsx       # واجهة seConnecter
│   │   └── ProtectedRoute.jsx  # حماية المسارات بناءً على الـ Role
│   ├── clients/
│   │   ├── clientsSlice.js     # إدارة بيانات العملاء (Redux)
│   │   ├── ClientList.jsx      # عرض قائمة العملاء
│   │   ├── ClientForm.jsx      # إضافة/تعديل عميل (Manage Clients)
│   │   └── ClientDetails.jsx   # تفاصيل العميل والاشتراكات
│   ├── subscriptions/
│   │   ├── subSlice.js         # إدارة حالات الاشتراكات (Redux)
│   │   ├── subService.js       # طلبات الـ API الخاصة بالاشتراكات
│   │   ├── SubscriptionCard.jsx # عرض بيانات الاشتراك الفردي
│   │   ├── RenewalForm.jsx      # واجهة تجديد الاشتراك (Renew)
│   │   ├── SubscriptionActions.jsx # أزرار (Suspend/Cancel)
│   │   └── PaymentRecorder.jsx  # تسجيل الدفعات (Record Payment)
│   └── reports/
│       ├── RevenueChart.jsx    # رسم بياني للمداخيل (Admin)
│       ├── ExpirationAlerts.jsx # تنبيهات انتهاء الصلاحية (Filter)
│       └── UserManagementTable.jsx # إدارة الموظفين (Manage Users)
├── hooks/
│   └── useAuth.js              # Hook مخصص للتحقق من صلاحيات المستخدم
├── pages/                      # الصفحات الكاملة التي تجمع المكونات
│   ├── Dashboard.jsx           # لوحة التحكم الرئيسية
│   ├── ClientsPage.jsx         # صفحة إدارة العملاء
│   ├── SubscriptionsPage.jsx   # صفحة إدارة الاشتراكات
│   ├── ReportsPage.jsx         # صفحة التقارير الإدارية
│   ├── LoginPage.jsx           # صفحة تسجيل الدخول
│   └── NotFound.jsx            # صفحة الخطأ 404
├── store/
│   └── index.js                # إعداد الـ Redux Store الرئيسي
├── utils/
│   └── formatDate.js           # دوال مساعدة لتنسيق التواريخ (Date)
├── App.js                      # إعدادات المسارات (Routes)
└── main.jsx                    # نقطة الانطلاق وربط الـ Store