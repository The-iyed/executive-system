import type { MeetingRequest } from "@gl/types/meeting-request";
import type { DetailedMeeting } from "@gl/types/meeting-detail";

const AGENDA_ITEMS = [
  {
    heading: "استعراض أهداف الاجتماع ومحاوره الرئيسية",
    description:
      "سيتم في بداية الاجتماع استعراض الهدف العام من الانعقاد، وتوضيح المحاور الأساسية المدرجة ضمن جدول الأعمال.",
  },
  {
    heading: "مراجعة تفصيلية لإنجازات اليوم السابق",
    description:
      "عرض شامل للأعمال التي تم إنجازها خلال اليوم السابق، مع بيان نسبة التقدم المحققة مقارنة بالخطة المعتمدة.",
  },
];

const SUPPORT_ITEMS = [
  {
    heading: "تجهيز القاعة والمتطلبات التقنية",
    description:
      "التأكد من جاهزية قاعة الاجتماعات من حيث التجهيزات التقنية والمرئية.",
  },
  {
    heading: "إعداد الوثائق والمستندات المطلوبة",
    description:
      "تحضير جميع الملفات والتقارير والعروض التقديمية التي سيتم استعراضها خلال الاجتماع.",
  },
];

export const MOCK_PENDING_REQUESTS: MeetingRequest[] = [
  {
    id: "1",
    type: "external",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "الاجتماع اليومي للمؤامة مع معا الوزير حول الدول وتحديثات العمل والأعمال",
  },
  {
    id: "2",
    type: "internal",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "الاجتماع اليومي للمؤامة مع معا الوزير حول الدول وتحديثات العمل والأعمال",
  },
  {
    id: "3",
    type: "internal",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "مذكرة تفاهم لدعم تطوير وتعزيز واستثمار الحدائق العامة بالمملكة.",
  },
  {
    id: "4",
    type: "private",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "مذكرة تفاهم لدعم تطوير وتعزيز واستثمار الحدائق العامة بالمملكة.",
  },
  {
    id: "5",
    type: "internal",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "الاجتماع اليومي للمؤامة مع معا الوزير حول الدول وتحديثات العمل والأعمال",
  },
  {
    id: "6",
    type: "new",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "مذكرة تفاهم لدعم تطوير وتعزيز واستثمار الحدائق العامة بالمملكة.",
  },
  {
    id: "7",
    type: "councils",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "الاجتماع اليومي للمؤامة مع معا الوزير حول الدول وتحديثات العمل والأعمال",
  },
  {
    id: "8",
    type: "internal",
    title: "مراجعة الأعمال والجدول اليومية",
    description:
      "رعاية توقيع مذكرة تفاهم بين وزارة البلديات والإسكان وصندوق البنية التحتية وشركة سدكو المالية",
    goal: "مذكرة تفاهم لدعم تطوير وتعزيز واستثمار الحدائق العامة بالمملكة.",
  },
];

export const MOCK_SCHEDULED_REQUESTS: DetailedMeeting[] = [
  {
    id: "s1",
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
  },
  {
    id: "s2",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a3", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=3" },
      { id: "a4", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=4" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
  },
  {
    id: "s3",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a5", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=5" },
      { id: "a6", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=6" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
  },
  {
    id: "s4",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a7", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=7" },
      { id: "a8", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=8" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
  },
  {
    id: "s5",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a9", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=9" },
      { id: "a10", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=10" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
  },
  {
    id: "s6",
    title: "مراجعة الأعمال والجدول اليومية",
    location: "مبنى الغدير - قاعة الاجتماعات",
    category: "internal",
    tags: ["requires-protocol", "has-content"],
    time: "09:00",
    duration: "xx دقيقة",
    attendees: [
      { id: "a11", name: "ظلال القحطاني", avatar: "https://i.pravatar.cc/40?img=11" },
      { id: "a12", name: "ماجد المناع", avatar: "https://i.pravatar.cc/40?img=12" },
    ],
    agenda: AGENDA_ITEMS,
    support: SUPPORT_ITEMS,
  },
];
