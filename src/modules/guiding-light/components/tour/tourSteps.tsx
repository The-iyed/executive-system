import type { TourStep } from "./ProductTour";

export const scheduleTourSteps: TourStep[] = [
  {
    target: "schedule-title",
    title: "جدول أعمال الوزير",
    description: "هنا يمكنك التبديل بين العرض اليومي والأسبوعي وتصدير الجدول كملف PDF.",
    placement: "bottom",
  },
  {
    target: "schedule-month-picker",
    title: "اختيار الشهر",
    description: "انتقل بين الأشهر لاستعراض جدول الاجتماعات في أي شهر تريده.",
    placement: "bottom",
  },
  {
    target: "schedule-day-strip",
    title: "شريط الأيام",
    description: "اضغط على أي يوم لعرض اجتماعاته. اليوم المحدد يظهر بلون مميز.",
    placement: "bottom",
  },
  {
    target: "schedule-charts",
    title: "التنقل بين الرسوم البيانية",
    description: "اضغط على الأسهم للتبديل بين عرض الاجتماعات حسب التصنيف أو النوع أو الفئة أو القطاع.",
    placement: "bottom",
  },
  {
    target: "schedule-donut",
    title: "الرسم البياني الدائري",
    description: "يعرض توزيع الاجتماعات بصريًا. مرر الماوس على أي جزء لمعرفة التفاصيل والنسبة المئوية.",
    placement: "left",
  },
  {
    target: "schedule-meetings",
    title: "بطاقات الاجتماعات",
    description: "كل بطاقة تعرض تفاصيل الاجتماع مع الأجندة والحضور والإجراءات السريعة والشريط الذكي.",
    placement: "top",
  },
  {
    target: "schedule-smart-bar",
    title: "الشريط الذكي",
    description: "يعرض نسبة أهمية الاجتماع وتوصية الذكاء الاصطناعي بالإنابة مع شعار المساعد الذكي.",
    placement: "top",
  },
  {
    target: "schedule-card-actions",
    title: "إجراءات الاجتماع",
    description: "استخدم هذه الأزرار لتمرير الاجتماع أو إنابته لشخص آخر أو إلغائه. زر الشعار يعرض تقييم الاجتماع.",
    placement: "top",
  },
];

export const assistantTourSteps: TourStep[] = [
  {
    target: "assistant-orb",
    title: "المساعد الذكي",
    description: "اضغط على زر الاتصال لبدء محادثة صوتية مع المساعد الذكي.",
    placement: "bottom",
  },
  {
    target: "assistant-status",
    title: "حالة المساعد",
    description: "يعرض حالة الاتصال الحالية: مستمع، يتحدث، أو في انتظار الأمر.",
    placement: "top",
  },
  {
    target: "assistant-input",
    title: "الإدخال النصي",
    description: "يمكنك أيضاً إرسال أوامر نصية بدلاً من الصوت.",
    placement: "top",
  },
];

export const requestsTourSteps: TourStep[] = [
  {
    target: "requests-header",
    title: "إدارة التوجيهات",
    description: "هنا تجد جميع التوجيهات الوزارية مع إمكانية التصفية حسب الحالة.",
    placement: "bottom",
  },
  {
    target: "requests-tabs",
    title: "تبديل الحالة",
    description: "انتقل بين التوجيهات المعلقة والمجدولة لمتابعة كل حالة.",
    placement: "bottom",
  },
  {
    target: "requests-list",
    title: "قائمة التوجيهات",
    description: "كل بطاقة تعرض تفاصيل التوجيه مع أزرار الإجراءات المتاحة.",
    placement: "top",
  },
];

export const agentsTourSteps: TourStep[] = [
  {
    target: "agents-header",
    title: "الوكلاء الأذكياء",
    description: "أنشئ وكلاء ذكاء اصطناعي مخصصين لأتمتة مهامك اليومية.",
    placement: "bottom",
  },
  {
    target: "agents-add-btn",
    title: "إضافة وكيل",
    description: "اضغط هنا لإنشاء وكيل جديد وتحديد تعليماته وملفاته المرجعية.",
    placement: "bottom",
  },
  {
    target: "agents-list",
    title: "قائمة الوكلاء",
    description: "استعرض وكلاءك الحاليين. يمكنك تعديلهم أو حذفهم أو بدء محادثة.",
    placement: "top",
  },
];

export const dashboardTourSteps: TourStep[] = [
  {
    target: "dashboard-title",
    title: "لوحة التحكم",
    description: "مرحباً بك في المنصة الموحدة. من هنا يمكنك الوصول لجميع الأدوات.",
    placement: "bottom",
  },
];
