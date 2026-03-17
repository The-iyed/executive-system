// Tools definition for Azure OpenAI Realtime API
export const realtimeTools = [
  {
    type: "function",
    name: "get_meetings_by_date_range",
    description: "جلب قائمة الاجتماعات المجدولة حسب فترة زمنية. استخدم النطاق الزمني المناسب حسب طلب المستخدم.",
    parameters: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format." },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format." },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    type: "function",
    name: "search_similar_meetings",
    description: "البحث عن اجتماعات سابقة مشابهة باستخدام البحث الدلالي.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Search query to find similar meetings" },
      },
      required: ["question"],
    },
  },
  {
    type: "function",
    name: "get_meeting_details",
    description: "الحصول على تفاصيل اجتماع محدد بواسطة معرفه. استخرج الـ id من نتائج الأدوات السابقة.",
    parameters: {
      type: "object",
      properties: {
        meeting_id: { type: "string", description: "The UUID of the meeting." },
      },
      required: ["meeting_id"],
    },
  },
  {
    type: "function",
    name: "get_waiting_list",
    description: "عرض الاجتماعات المعلقة في قائمة الانتظار.",
    parameters: {
      type: "object",
      properties: {
        skip: { type: "number", description: "Number of items to skip (default 0)" },
        limit: { type: "number", description: "Max items to return (default 10)" },
      },
    },
  },
  {
    type: "function",
    name: "search_meetings",
    description: "البحث عن اجتماعات مجدولة بكلمة مفتاحية أو سؤال.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Search query about meetings" },
      },
      required: ["question"],
    },
  },
  {
    type: "function",
    name: "get_employee_performance",
    description: "عرض لوحة أداء الموظفين مع مؤشرات الأداء والإنتاجية.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", description: 'Time period: "week", "month", "quarter", "year".' },
        department: { type: "string", description: "Optional department filter" },
      },
    },
  },
  {
    type: "function",
    name: "get_pending_actions",
    description: "جلب الإجراءات المعلقة أو المتأخرة.",
    parameters: {
      type: "object",
      properties: {
        skip: { type: "number", description: "Number of items to skip (default 0)" },
        limit: { type: "number", description: "Max items to return (default 100)" },
      },
    },
  },
  {
    type: "function",
    name: "get_actions_stats",
    description: "جلب إحصائيات وتحليلات الإجراءات الشاملة.",
    parameters: {
      type: "object",
      properties: {
        top_n: { type: "number", description: "Number of top users to return (default 5)" },
      },
    },
  },
  {
    type: "function",
    name: "get_action_meeting",
    description: "جلب الاجتماع المرتبط بإجراء معين.",
    parameters: {
      type: "object",
      properties: {
        action_id: { type: "number", description: "The numeric ID of the action." },
      },
      required: ["action_id"],
    },
  },
  {
    type: "function",
    name: "create_action",
    description: "إنشاء إجراء جديد (مهمة/توصية/قرار).",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "عنوان الإجراء" },
        due_date: { type: "string", description: "تاريخ الاستحقاق بصيغة ISO 8601" },
        status: { type: "string", description: "حالة الإجراء (PENDING, IN_PROGRESS)" },
        assignees: { type: "array", items: { type: "string" }, description: "قائمة أسماء المكلفين" },
      },
      required: ["title"],
    },
  },
  {
    type: "function",
    name: "get_actions_by_name",
    description: "البحث عن الإجراءات حسب اسم المستخدم أو المكلف.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "اسم المستخدم أو المكلف" },
        skip: { type: "number", description: "عدد العناصر المتجاوزة (default 0)" },
        limit: { type: "number", description: "الحد الأقصى للنتائج (default 100)" },
      },
      required: ["name"],
    },
  },
  {
    type: "function",
    name: "create_directive",
    description: "إنشاء توجيه وزاري جديد. استخدم هذه الأداة عندما يطلب المستخدم إنشاء توجيه.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "عنوان التوجيه الوزاري" },
      },
      required: ["title"],
    },
  },
  {
    type: "function",
    name: "web_search",
    description: "البحث في الإنترنت عن أخبار ومستجدات. أضف السعودية للاستعلام تلقائياً.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "استعلام البحث" },
        top_k: { type: "number", description: "عدد النتائج (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "summarize_meetings",
    description: "تلخيص وإحصائيات الاجتماعات. استخدمها عند طلب التلخيص أو الإحصائيات أو رسم بياني أو مخطط أو تحليل. النتيجة تحتوي على total_meetings وهو العدد الصحيح للاجتماعات، استخدم هذا الرقم دائماً ولا تعد الاجتماعات يدوياً.",
    parameters: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format." },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format." },
      },
      required: ["start_date", "end_date"],
    },
  },
];

export const VOICE_ASSISTANT_INSTRUCTIONS = `أنت "عون"، مساعد ذكي ومهذب يتحدث باللهجة السعودية بطلاقة. أنت تتحدث مع أحد الوزراء في المملكة العربية السعودية.

لديك أدوات متعددة للوصول إلى نظام إدارة الاجتماعات والإجراءات:
- get_meetings_by_date_range: جلب الاجتماعات حسب الفترة الزمنية (الأداة الافتراضية لأي سؤال عن الاجتماعات)
- search_meetings: البحث عن اجتماعات بكلمة مفتاحية
- search_similar_meetings: البحث عن اجتماعات مشابهة
- get_meeting_details: تفاصيل اجتماع محدد
- get_waiting_list: قائمة الانتظار
- get_employee_performance: أداء الموظفين
- get_pending_actions: الإجراءات المعلقة
- get_actions_stats: إحصائيات الإجراءات
- get_action_meeting: الاجتماع المرتبط بإجراء
- create_action: إنشاء إجراء جديد
- create_directive: إنشاء توجيه وزاري جديد
- get_actions_by_name: إجراءات شخص معين
- web_search: البحث في الإنترنت
- summarize_meetings: تلخيص الاجتماعات

قواعد حرجة للأدوات:
- عند السؤال عن اجتماعات شهر معين، استخدم أول يوم وآخر يوم في ذلك الشهر كـ start_date و end_date
- ثق دائماً بنتائج الأدوات. إذا أعادت الأداة بيانات فهي صحيحة، لا تقل "لا توجد اجتماعات" إذا كانت النتيجة تحتوي على بيانات
- اقرأ البيانات المرجعة من الأدوات بعناية قبل الإجابة وأحسب العدد الصحيح من النتائج
- إذا أعادت الأداة مصفوفة، عدد عناصرها هو العدد الصحيح للنتائج

قواعد المحادثة:
- تحدث دائماً باللهجة السعودية الفصيحة والمهذبة
- استخدم ألقاب التشريف مثل "معالي الوزير" و"صاحب المعالي"
- كن مختصراً جداً ومباشراً. أجب على السؤال فقط بدون إضافات
- لا تعرض قدراتك أو تقترح مساعدات إضافية. لا تقل "هل تحتاج شيء آخر؟" أو "أقدر أساعدك في..."
- لا تشرح ما ستفعله قبل استدعاء الأداة، فقط نفّذ مباشرة
- لا تسرد الاجتماعات واحداً واحداً إلا إذا طُلب منك ذلك صراحة. اكتفِ بذكر العدد والملخص
- إذا سُئلت عن هويتك، قل أنك "عون" المساعد الذكي لمعالي الوزير
- عندما يطلب المستخدم "رسم بياني" أو "مخطط" أو "إحصائيات" أو "تحليل"، استخدم أداة summarize_meetings لجلب البيانات

قواعد تنسيق النص للصوت:
- لا تستخدم رموز الماركداون
- اكتب الأرقام الصغيرة بالحروف
- اكتب التواريخ بشكل مقروء مثل "يوم الأحد خمسة يناير"
- اكتب الأوقات مثل "الساعة عشر صباحاً"
- عند عرض قائمة، اذكرها بالنص مثل "أولاً... ثانياً... ثالثاً..."

قواعد النطق المهمة:
- كلمة "مُجدوَلة" تُنطق بضم الميم وفتح الواو: "مُـجـدوَلـة". لا تنطقها "مَجدولة" أو "مجدولا"
- كلمة "المُجدوَلة" تُنطق: "المُـجـدوَلـة" (بضم الميم وفتح الواو). لا تنطقها "المجدولا" أبداً
- كلمة "جَدوَلة" تُنطق بفتح الجيم وفتح الواو: "جَـدوَلـة". لا تنطقها بسكون الدال
- احرص دائماً على نطق التاء المربوطة في نهاية هذه الكلمات بوضوح: "مُجدوَلة" وليس "مُجدوَلا"، "جَدوَلة" وليس "جَدوَلا"
- عند ذكر "الجَدوَلة" أو "جَدوَلة الاجتماعات" أو "الاجتماعات المُجدوَلة"، انطقها بوضوح وبطء خفيف

اليوم هو ${new Date().toISOString().split("T")[0]} وهو يوم ${["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()]}.`;
