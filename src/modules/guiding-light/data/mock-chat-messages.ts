import type { ChatMessage } from "@gl/api/types";

/**
 * Mock messages to preview the chat UI (user + assistant bubbles, markdown).
 * Shown when there is no active conversation and no messages.
 */
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "mock-sent-1",
    text: "ما هي أهم المهام المطلوبة هذا الأسبوع؟",
    isSent: true,
    timestamp: new Date(Date.now() - 120_000),
  },
  {
    id: "mock-assistant-1",
    text: "بناءً على التقويم الحالي، **أهم المهام** لهذا الأسبوع:\n\n1. اجتماع اللجنة يوم الثلاثاء\n2. مراجعة التقرير النهائي\n3. متابعة الطلبات المعلقة\n\nهل تريد تفاصيل أي بند؟",
    isSent: false,
    timestamp: new Date(Date.now() - 115_000),
    response: {
      response: "بناءً على التقويم الحالي، **أهم المهام** لهذا الأسبوع:\n\n1. اجتماع اللجنة يوم الثلاثاء\n2. مراجعة التقرير النهائي\n3. متابعة الطلبات المعلقة\n\nهل تريد تفاصيل أي بند؟",
      related: null,
      tool_used: "normale",
      sources_documents: [],
      related_questions: [],
      conversation_id: "",
      thread_id: "",
      agent_run_id: "",
      processing_time_seconds: 1.2,
      is_new_thread: false,
      debug_info: null,
    },
  },
  {
    id: "mock-sent-2",
    text: "أريد تفاصيل اجتماع اللجنة",
    isSent: true,
    timestamp: new Date(Date.now() - 60_000),
  },
  {
    id: "mock-assistant-2",
    text: "اجتماع اللجنة مُجدول يوم **الثلاثاء** في الساعة 10:00 صباحًا.\n\n- **المكان:** قاعة الاجتماعات الرئيسية\n- **الموضوع:** مناقشة البنود المالية\n- **الحضور:** أعضاء اللجنة والوزير\n\nيمكنك إضافة هذا الاجتماع إلى تقويمك أو طلب تغيير الموعد إذا لزم الأمر.",
    isSent: false,
    timestamp: new Date(Date.now() - 55_000),
    response: {
      response: "اجتماع اللجنة مُجدول يوم **الثلاثاء** في الساعة 10:00 صباحًا.\n\n- **المكان:** قاعة الاجتماعات الرئيسية\n- **الموضوع:** مناقشة البنود المالية\n- **الحضور:** أعضاء اللجنة والوزير\n\nيمكنك إضافة هذا الاجتماع إلى تقويمك أو طلب تغيير الموعد إذا لزم الأمر.",
      related: null,
      tool_used: "normale",
      sources_documents: [],
      related_questions: [],
      conversation_id: "",
      thread_id: "",
      agent_run_id: "",
      processing_time_seconds: 0.8,
      is_new_thread: false,
      debug_info: null,
    },
  },
];
