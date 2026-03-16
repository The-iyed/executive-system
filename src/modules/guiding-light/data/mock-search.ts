import type {
  SearchOption,
  RecentSearch,
  MeetingClassification,
  SearchResult,
} from "@gl/types/search";

export const MOCK_SEARCH_OPTIONS: SearchOption[] = [
  {
    id: "opt-1",
    label: "اجتماعات معالي الوزير",
    snippet: {
      id: "s-1",
      title: "زيارة وكالة تنمية القدرات البشرية",
      badge: "تقدّم",
      badgeVariant: "success",
      time: "08:00-12:00",
      avatarUrl: "https://i.pravatar.cc/40?img=10",
      avatarName: "منى العمري",
    },
  },
  {
    id: "opt-2",
    label: "القرارات",
    snippet: {
      id: "s-2",
      title: "تنظيم والتحضير للاجتماعات الرسمية",
      badge: "مقبل",
      badgeVariant: "default",
      subtitle: "يجب بدأت الاجتماعات مسبقاً وإشعار جميع المشاركين قبل",
    },
  },
  {
    id: "opt-3",
    label: "الالتزامات متأخرة",
    snippet: {
      id: "s-3",
      title: "زيارة وكالة تنمية القدرات البشرية",
      badge: "مقبل",
      badgeVariant: "warning",
      time: "08:00-12:00",
      avatarUrl: "https://i.pravatar.cc/40?img=5",
      avatarName: "+5",
    },
  },
  {
    id: "opt-4",
    label: "التوجيهات المعتمدة",
    snippet: {
      id: "s-4",
      title: "تنظيم والتحضير للاجتماعات الرسمية",
      subtitle: "يجب بدأت الاجتماعات مسبقاً وإشعار جميع المشاركين قبل",
    },
  },
  {
    id: "opt-5",
    label: "أداء الجهات والموظفين",
    snippet: {
      id: "s-5",
      title: "أحمد الشريف",
      subtitle: "أداء الشريفة",
      avatarUrl: "https://i.pravatar.cc/40?img=12",
      avatarName: "أحمد الشريف",
    },
  },
  {
    id: "opt-6",
    label: "ملخصات الاجتماعات",
    snippet: {
      id: "s-6",
      title: "اجتماع مع لجنة التطوير حول إدارة الالتزامات",
      badge: "ذكي",
      badgeVariant: "success",
      subtitle: "مناقشة آليات تحسين متابعة الالتزامات وتطوير أدوات الرقابة",
    },
  },
];

export const MOCK_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: "rs-1",
    query: "اجتماع مع قيادات الوزارة",
    timestamp: "3 مارس 2026، الساعة العاشرة صباحاً",
  },
  {
    id: "rs-2",
    query: "مراجعة مبادرات التحول الرقمي",
    timestamp: "21 يونيو 2026، الساعة الثانية بعد الظهر",
  },
];

export const MOCK_CLASSIFICATIONS: MeetingClassification[] = [
  { id: "c-1", label: "تشغيلي", type: "operational" },
  { id: "c-2", label: "استراتيجي", type: "strategic" },
  { id: "c-3", label: "خاص", type: "special" },
  { id: "c-4", label: "تشغيلي", type: "operational" },
  { id: "c-5", label: "استراتيجي", type: "strategic" },
  { id: "c-6", label: "خاص", type: "special" },
  { id: "c-7", label: "تشغيلي", type: "operational" },
  { id: "c-8", label: "استراتيجي", type: "strategic" },
  { id: "c-9", label: "خاص", type: "special" },
];

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
  { id: "sr-1", title: "اجتماع مع قيادات الوزارة", category: "قسم الاجتماعات" },
  { id: "sr-2", title: "مراجعة مبادرات التحول الرقمي", category: "قسم الاجتماعات" },
  { id: "sr-3", title: "لقاء تنسيقي مع الجهات الحكومية", category: "قسم الاجتماعات" },
  { id: "sr-4", title: "اجتماع مع قيادات الوزارة", category: "قسم الاجتماعات" },
  { id: "sr-5", title: "مراجعة مبادرات التحول الرقمي", category: "قسم الاجتماعات" },
  { id: "sr-6", title: "لقاء تنسيقي مع الجهات الحكومية", category: "قسم الاجتماعات" },
  { id: "sr-7", title: "لقاء تنسيقي مع الجهات الحكومية", category: "قسم الاجتماعات" },
];

