import type {
  DetailedMeeting,
  ChartSegment,
} from "@gl/types/meeting-detail";

const AGENDA_ITEMS = [
  {
    heading: "استعراض أهداف الاجتماع ومحاوره الرئيسية",
    description:
      "سيتم في بداية الاجتماع استعراض الهدف العام من الانعقاد، وتوضيح المحاور الأساسية المدرجة ضمن جدول الأعمال، بما يضمن توحيد الرؤية بين جميع الحضور وتحقيق أعلى درجات الكفاءة في إدارة الوقت.",
  },
  {
    heading: "مراجعة تفصيلية لإنجازات اليوم السابق",
    description:
      "عرض شامل للأعمال التي تم إنجازها خلال اليوم السابق، مع بيان نسبة التقدم المحققة مقارنة بالخطة المعتمدة، وتحليل أي انحرافات إن وجدت وأسبابها.",
  },
  {
    heading: "متابعة مؤشرات الأداء الرئيسية وقياس مستوى الالتزام",
    description:
      "مناقشة مؤشرات الأداء المعتمدة، واستعراض التقارير الرقمية ذات الصلة، لتقييم مدى تحقيق الأهداف التشغيلية وفق المعايير المحددة.",
  },
];

const SUPPORT_ITEMS = [
  {
    heading: "تجهيز القاعة والمتطلبات التقنية",
    description:
      "التأكد من جاهزية قاعة الاجتماعات من حيث التجهيزات التقنية والمرئية، وتوفير جميع المستلزمات اللازمة لضمان سير الاجتماع بسلاسة.",
  },
  {
    heading: "إعداد الوثائق والمستندات المطلوبة",
    description:
      "تحضير جميع الملفات والتقارير والعروض التقديمية التي سيتم استعراضها خلال الاجتماع وتوزيعها على الحضور مسبقاً.",
  },
];

export const MOCK_DETAILED_MEETINGS: DetailedMeeting[] = [
  {
    id: "1",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a1", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=1" },
      { id: "a2", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=2" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
    breakAfter: 15,
    isImportant: true,
    isPriority: true,
    relevanceScore: 62,
    aiDelegateeRecommendation: "فيصل عبد العزيز",
  },
  {
    id: "2",
    title: "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    category: "external",
    tags: ["councils", "video-call", "has-content"],
    goal: "مذكرة تفاهم لدعم تطوير وتعزيز واستثمار الحدائق العامة بالمملكة",
    time: "12:30",
    duration: "xx دقيقة",
    attendees: [
      { id: "a3", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=3", group: "الحضور الداخليين" },
      { id: "a4", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=4", group: "الحضور الداخليين" },
      { id: "a5", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=5", group: "الحضور الداخليين" },
      { id: "a5b", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=2", role: "مستشار", group: "الحضور الداخليين" },
      { id: "a6", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=1", group: "الحضور الداخليين" },
      { id: "a7", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=7", group: "الحضور من صندوق البنية التحتية" },
      { id: "a8", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=8", group: "الحضور من صندوق البنية التحتية" },
      { id: "a8b", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=9", role: "مستشار", group: "الحضور من صندوق البنية التحتية" },
      { id: "a9", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=10", group: "الحضور من صندوق البنية التحتية" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
    isImportant: true,
    relevanceScore: 85,
    aiDelegateeRecommendation: "فيصل عبد العزيز",
  },
  {
    id: "3",
    title: "لقاء البنك السعودي الأول.",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "private",
    tags: ["government-center", "has-content"],
    time: "16:30",
    duration: "xx دقيقة",
    attendees: [
      { id: "a6", name: "عبدالله الدوسري", avatar: "https://i.pravatar.cc/40?img=6" },
      { id: "a7", name: "محمد السبيعي", avatar: "https://i.pravatar.cc/40?img=7" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
    breakAfter: 15,
    isImportant: true,
    relevanceScore: 78,
    aiDelegateeRecommendation: "حمد الشريدة",
  },
  {
    id: "4",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "new",
    tags: ["has-content"],
    time: "10:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a8", name: "خالد الغامدي", avatar: "https://i.pravatar.cc/40?img=8" },
    ],
    agenda: AGENDA_ITEMS,
    isPriority: true,
    relevanceScore: 45,
    aiDelegateeRecommendation: "عبدالله الدوسري",
  },
  {
    id: "5",
    title: "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان",
    category: "external",
    tags: ["councils", "video-call", "requires-protocol"],
    time: "14:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a9", name: "أحمد المالكي", avatar: "https://i.pravatar.cc/40?img=9", group: "الحضور الداخليين" },
      { id: "a10", name: "سلطان العنزي", avatar: "https://i.pravatar.cc/40?img=10", group: "الحضور الداخليين" },
      { id: "a10b", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=3", role: "مستشار", group: "الحضور الداخليين" },
      { id: "a10c", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=4", group: "الحضور الداخليين" },
      { id: "a10d", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=5", group: "الحضور الداخليين" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
    isPriority: true,
    isImportant: true,
    relevanceScore: 91,
    aiDelegateeRecommendation: "فيصل عبد العزيز",
  },
  {
    id: "6",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["has-content"],
    time: "08:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a11", name: "يوسف القرني", avatar: "https://i.pravatar.cc/40?img=11" },
      { id: "a12", name: "تركي الشهري", avatar: "https://i.pravatar.cc/40?img=12" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
    breakAfter: 10,
    relevanceScore: 33,
  },
];

export const DONUT_CHART_DATA: ChartSegment[] = [
  { label: "اجتماعات داخلية", value: 4, color: "#0d3d3d" },
  { label: "اجتماعات خارجية", value: 3, color: "#1a6b6b" },
  { label: "مجالس ولجان", value: 2, color: "#2a9d8f" },
  { label: "اجتماعات ثنائية", value: 2, color: "#76c7c0" },
  { label: "اجتماعات خاصة", value: 1, color: "#c8f0ed" },
];

export const BAR_CHART_DATA: ChartSegment[] = [
  { label: "الإسكان", value: 1, color: "#2a9d8f" },
  { label: "الشراكات", value: 1, color: "#76c7c0" },
  { label: "التخطيط", value: 1, color: "#fbbf24" },
  { label: "الاستثمارات", value: 2, color: "#86efac" },
  { label: "الإسكان", value: 3, color: "#fb7185" },
  { label: "البلديات", value: 4, color: "#3b82f6" },
];
