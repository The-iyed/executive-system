
export enum MeetingStatusUnCommitted {
  DRAFT_UNCOMMITTED = "DRAFT_UNCOMMITTED",
}

export enum MeetingStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RETURNED_FROM_CONTENT = 'RETURNED_FROM_CONTENT',
  UNDER_GUIDANCE = 'UNDER_GUIDANCE',
  UNDER_CONTENT_REVIEW = 'UNDER_CONTENT_REVIEW',
  REJECTED = 'REJECTED',
  WAITING = 'WAITING',
  SCHEDULED = 'SCHEDULED',
  SCHEDULED_DELAYED = 'SCHEDULED_DELAYED',
  RETURNED_FROM_SCHEDULING = 'RETURNED_FROM_SCHEDULING',
  CANCELLED = 'CANCELLED',
  SCHEDULED_ADDITIONAL_INFO = 'SCHEDULED_ADDITIONAL_INFO',
  SCHEDULED_ADDITIONAL_INFO_CONTENT = 'SCHEDULED_ADDITIONAL_INFO_CONTENT',
  SCHEDULED_CONTENT = 'SCHEDULED_CONTENT',
  SCHEDULED_SCHEDULING = 'SCHEDULED_SCHEDULING',
  SCHEDULED_DELEGATED = 'SCHEDULED_DELEGATED',
  CLOSED_PASS = 'CLOSED_PASS',
  CLOSED = 'CLOSED',
}

/**
 * UC01 (request submitter) cannot edit while the request is in any of these statuses:
 * under review, closed, cancelled, rejected, or scheduled variants other than SCHEDULED and SCHEDULED_ADDITIONAL_INFO(*).
 * Submitter may edit when status is SCHEDULED (مجدول) or SCHEDULED_ADDITIONAL_INFO / SCHEDULED_ADDITIONAL_INFO_CONTENT (مجدول - معلومات إضافية).
 */
const SUBMITTER_NON_EDITABLE_STATUSES = new Set<string>([
  MeetingStatus.UNDER_REVIEW,
  MeetingStatus.UNDER_GUIDANCE,
  MeetingStatus.UNDER_CONTENT_REVIEW,
  MeetingStatus.REJECTED,
  MeetingStatus.CANCELLED,
  MeetingStatus.CLOSED,
  MeetingStatus.CLOSED_PASS,
  MeetingStatus.SCHEDULED_DELAYED,
  MeetingStatus.SCHEDULED_CONTENT,
  MeetingStatus.SCHEDULED_SCHEDULING,
  MeetingStatus.SCHEDULED_DELEGATED,
]);

export function isSubmitterEditBlockedStatus(
  status: MeetingStatus | string | null | undefined
): boolean {
  if (status == null || status === '') return false;
  return SUBMITTER_NON_EDITABLE_STATUSES.has(String(status));
}

/** Arabic message when submitter edit is blocked by status */
export const SUBMITTER_EDIT_BLOCKED_MESSAGE =
  'لا يمكن تعديل طلب الاجتماع في حالته الحالية (قيد المراجعة، مرفوض، ملغى، مغلق، أو بعض حالات المجدول).';

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.DRAFT]: 'جديد',
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.RETURNED_FROM_CONTENT]: 'معلومات إضافية',
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: 'معلومات إضافية',
  [MeetingStatus.UNDER_GUIDANCE]: 'قيد المراجعة -  استشارة',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: 'قيد المراجعة - محتوى',
  [MeetingStatus.REJECTED]: 'مرفوض',
  [MeetingStatus.WAITING]: 'قيد الانتظار',
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_DELAYED]: 'مجدول - متأخر',
  [MeetingStatus.CANCELLED]: 'ملغي',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT]: 'مجدول - معلومات إضافية',
  [MeetingStatus.SCHEDULED_CONTENT]: 'مجدول - المحتوى',
  [MeetingStatus.SCHEDULED_SCHEDULING]: 'مجدول - الجدولة',
  [MeetingStatus.SCHEDULED_DELEGATED]: 'مجدول - إنابة',
  [MeetingStatus.CLOSED_PASS]: 'مغلق - تمرير',
  [MeetingStatus.CLOSED]: 'مغلق',
};

export enum MeetingClassification {
  COUNCILS_AND_COMMITTEES_EXTERNAL = 'COUNCILS_AND_COMMITTEES_EXTERNAL',
  COUNCILS_AND_COMMITTEES_INTERNAL = 'COUNCILS_AND_COMMITTEES_INTERNAL',
  EVENTS_AND_VISITS = 'EVENTS_AND_VISITS',
  BILATERAL_MEETING = 'BILATERAL_MEETING',
  PRIVATE_MEETING = 'PRIVATE_MEETING',
  BUSINESS = 'BUSINESS',
  GOVERNMENT_CENTER_TOPICS = 'GOVERNMENT_CENTER_TOPICS',
  WORKSHOP = 'WORKSHOP',
  DISCUSSION_WITHOUT_PRESENTATION = 'DISCUSSION_WITHOUT_PRESENTATION',
}

export const MeetingClassificationLabels: Record<MeetingClassification, string> = {
  [MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL]: 'المجالس واللجان الخارجية',
  [MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL]: 'المجالس واللجان الداخلية',
  [MeetingClassification.EVENTS_AND_VISITS]: 'الفعاليات والزيارات',
  [MeetingClassification.BILATERAL_MEETING]: 'لقاء ثنائي',
  [MeetingClassification.PRIVATE_MEETING]: 'لقاء خاص',
  [MeetingClassification.BUSINESS]: 'اجتماعات الأعمال',
  [MeetingClassification.GOVERNMENT_CENTER_TOPICS]: 'مواضيع مركز الحكومة',
  [MeetingClassification.WORKSHOP]: 'ورشة عمل',
  [MeetingClassification.DISCUSSION_WITHOUT_PRESENTATION]: 'مناقشة (بدون عرض تقديمي)',
};

export const MEETING_CATEGORY_OPTIONS = [
  {
    value: MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL,
    label: MeetingClassificationLabels[MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL],
  },
  {
    value: MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL,
    label: MeetingClassificationLabels[MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL],
  },
  {
    value: MeetingClassification.EVENTS_AND_VISITS,
    label: MeetingClassificationLabels[MeetingClassification.EVENTS_AND_VISITS],
  },
  {
    value: MeetingClassification.BILATERAL_MEETING,
    label: MeetingClassificationLabels[MeetingClassification.BILATERAL_MEETING],
  },
  {
    value: MeetingClassification.PRIVATE_MEETING,
    label: MeetingClassificationLabels[MeetingClassification.PRIVATE_MEETING],
  },
  {
    value: MeetingClassification.BUSINESS,
    label: MeetingClassificationLabels[MeetingClassification.BUSINESS],
  },
  {
    value: MeetingClassification.GOVERNMENT_CENTER_TOPICS,
    label: MeetingClassificationLabels[MeetingClassification.GOVERNMENT_CENTER_TOPICS],
  },
  {
    value: MeetingClassification.WORKSHOP,
    label: MeetingClassificationLabels[MeetingClassification.WORKSHOP],
  },
  {
    value: MeetingClassification.DISCUSSION_WITHOUT_PRESENTATION,
    label: MeetingClassificationLabels[MeetingClassification.DISCUSSION_WITHOUT_PRESENTATION],
  },
] as const;

export enum MeetingSubCategory {
  BASIC = 'BASIC',
  EXTERNAL_PREPARATORY = 'EXTERNAL_PREPARATORY',
  INTERNAL_PREPARATORY = 'INTERNAL_PREPARATORY',
  EMERGENT = 'EMERGENT',
  NOTIFICATION = 'NOTIFICATION',
}

export const MeetingSubCategoryLabels: Record<MeetingSubCategory, string> = {
  [MeetingSubCategory.BASIC]: 'أساسي',
  [MeetingSubCategory.EXTERNAL_PREPARATORY]: 'تحضيري خارجي',
  [MeetingSubCategory.INTERNAL_PREPARATORY]: 'تحضيري داخلي',
  [MeetingSubCategory.EMERGENT]: 'منبثق',
  [MeetingSubCategory.NOTIFICATION]: 'تبليغ',
};

export const MEETING_SUB_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: MeetingSubCategory.BASIC, label: MeetingSubCategoryLabels[MeetingSubCategory.BASIC] },
  {
    value: MeetingSubCategory.EXTERNAL_PREPARATORY,
    label: MeetingSubCategoryLabels[MeetingSubCategory.EXTERNAL_PREPARATORY],
  },
  {
    value: MeetingSubCategory.INTERNAL_PREPARATORY,
    label: MeetingSubCategoryLabels[MeetingSubCategory.INTERNAL_PREPARATORY],
  },
  { value: MeetingSubCategory.EMERGENT, label: MeetingSubCategoryLabels[MeetingSubCategory.EMERGENT] },
  { value: MeetingSubCategory.NOTIFICATION, label: MeetingSubCategoryLabels[MeetingSubCategory.NOTIFICATION] },
];

/** Category values hidden when meeting type is EXTERNAL. */
export const EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES: readonly MeetingClassification[] = [
  MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL,
  MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL,
  MeetingClassification.EVENTS_AND_VISITS,
  MeetingClassification.GOVERNMENT_CENTER_TOPICS,
];

export function getMeetingCategoryOptions(meetingType: string) {
  if (meetingType !== 'EXTERNAL') {
    return [...MEETING_CATEGORY_OPTIONS];
  }
  return MEETING_CATEGORY_OPTIONS.filter(
    (opt) => !EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES.includes(opt.value)
  );
}

export enum MeetingClassificationType {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  SPECIAL = 'SPECIAL',
  ORGANIZATIONAL_STRUCTURING = 'ORGANIZATIONAL_STRUCTURING',
}

export const MeetingClassificationTypeLabels: Record<MeetingClassificationType, string> = {
  [MeetingClassificationType.STRATEGIC]: 'استراتيجي',
  [MeetingClassificationType.OPERATIONAL]: 'تشغيلي',
  [MeetingClassificationType.SPECIAL]: 'خاص',
  [MeetingClassificationType.ORGANIZATIONAL_STRUCTURING]: 'بناء تنظيمي',
};

export const MEETING_CLASSIFICATION_TYPE_OPTIONS = [
  { value: MeetingClassificationType.STRATEGIC, label: MeetingClassificationTypeLabels[MeetingClassificationType.STRATEGIC] },
  { value: MeetingClassificationType.OPERATIONAL, label: MeetingClassificationTypeLabels[MeetingClassificationType.OPERATIONAL] },
  { value: MeetingClassificationType.ORGANIZATIONAL_STRUCTURING, label: MeetingClassificationTypeLabels[MeetingClassificationType.ORGANIZATIONAL_STRUCTURING] },
] as const;

/* ═══ Boolean Options ═══ */
export const BOOL = { TRUE: 'true', FALSE: 'false' } as const;

/* ═══ Minister Support Other Value ═══ */
export const MINISTER_SUPPORT_OTHER_VALUE = 'أخرى';

/* ═══ Directive Method Options ═══ */
export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
] as const;

/* ═══ Meeting Managers (placeholder) ═══ */
export const MEETING_MANAGERS = [
  { label: 'tabukm.gov.sa@1002410024', value: 'mgr-1' },
  { label: 'أحمد محمد', value: 'mgr-2' },
  { label: 'فاطمة علي', value: 'mgr-3' },
  { label: 'خالد إبراهيم', value: 'mgr-4' },
  { label: 'نورة عبدالله', value: 'mgr-5' },
] as const;

/* ═══ Meeting Nature (Scheduler) ═══ */
export enum MeetingNature {
  NORMAL = 'NEW',
  SEQUENTIAL = 'SEQUENTIAL',
  PERIODIC = 'PERIODIC',
}

export const MeetingNatureLabels: Record<MeetingNature, string> = {
  [MeetingNature.NORMAL]: 'عادي',
  [MeetingNature.SEQUENTIAL]: 'إلحاقي',
  [MeetingNature.PERIODIC]: 'دوري',
};

export const MEETING_NATURE_OPTIONS = Object.values(MeetingNature).map((v) => ({
  value: v,
  label: MeetingNatureLabels[v],
}));

/**
 * Helper: get meeting sub-category label
 */
export const getMeetingSubCategoryLabel = (subCategory: MeetingSubCategory | string | null | undefined): string => {
  if (subCategory == null || subCategory === '') return '-';
  return MeetingSubCategoryLabels[subCategory as MeetingSubCategory] ?? subCategory;
};

export enum MeetingConfidentiality {
  CONFIDENTIAL = 'CONFIDENTIAL',
  NORMAL = 'NORMAL',
}

/**
 * Meeting Confidentiality Labels (Arabic)
 */
export const MeetingConfidentialityLabels: Record<MeetingConfidentiality, string> = {
  [MeetingConfidentiality.CONFIDENTIAL]: 'سرّي',
  [MeetingConfidentiality.NORMAL]: 'عادي',
};

export enum MeetingType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

export const MeetingTypeLabels: Record<MeetingType, string> = {
  [MeetingType.INTERNAL]: 'داخلي',
  [MeetingType.EXTERNAL]: 'خارجي',
};

/** Options for meeting type select (value/label), derived from MeetingType + MeetingTypeLabels. */
export const MEETING_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: MeetingType.INTERNAL, label: MeetingTypeLabels[MeetingType.INTERNAL] },
  { value: MeetingType.EXTERNAL, label: MeetingTypeLabels[MeetingType.EXTERNAL] },
];

export const MINISTER_SUPPORT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'إحاطة', label: 'إحاطة' },
  { value: 'تحديث', label: 'تحديث' },
  { value: 'قرار', label: 'قرار' },
  { value: 'توجيه', label: 'توجيه' },
  { value: 'اعتماد', label: 'اعتماد' },
  { value: 'أخرى', label: 'أخرى (يقوم بالإدخال)' },
];

export const PRESENTATION_DURATION_MINUTES_OPTIONS: { value: string; label: string }[] = [
  { value: '5', label: '5 دقائق' },
  { value: '10', label: '10 دقائق' },
  { value: '15', label: '15 دقيقة' },
  { value: '20', label: '20 دقيقة' },
  { value: '25', label: '25 دقيقة' },
  { value: '30', label: '30 دقيقة' },
  { value: '45', label: '45 دقيقة' },
  { value: '60', label: '60 دقيقة' },
  { value: '90', label: '90 دقيقة' },
  { value: '120', label: '120 دقيقة' },
  { value: '180', label: '180 دقيقة' },
];

/**
 * Sector (القطاع)
 * Ministry sector for the meeting
 */
export enum Sector {
  MUNICIPAL_AFFAIRS = 'MUNICIPAL_AFFAIRS',
  HOUSING_AFFAIRS = 'HOUSING_AFFAIRS',
  EMPOWERMENT_AND_COMPLIANCE = 'EMPOWERMENT_AND_COMPLIANCE',
  PLANNING_AND_DEVELOPMENT = 'PLANNING_AND_DEVELOPMENT',
  SUPPORT_SERVICES = 'SUPPORT_SERVICES',
  MINISTER_AFFILIATED = 'MINISTER_AFFILIATED',
}
export const SectorLabels: Record<Sector, string> = {
  [Sector.MUNICIPAL_AFFAIRS]: 'شؤون البلديات',
  [Sector.HOUSING_AFFAIRS]: 'شؤون الإسكان',
  [Sector.EMPOWERMENT_AND_COMPLIANCE]: 'التمكين والإمتثال',
  [Sector.PLANNING_AND_DEVELOPMENT]: 'التخطيط والتطوير',
  [Sector.SUPPORT_SERVICES]: 'الخدمات المساندة',
  [Sector.MINISTER_AFFILIATED]: 'الجهات التابعة لمعالي الوزير',
};
export const SECTOR_OPTIONS: { value: Sector; label: string }[] = [
  { value: Sector.MUNICIPAL_AFFAIRS, label: SectorLabels[Sector.MUNICIPAL_AFFAIRS] },
  { value: Sector.HOUSING_AFFAIRS, label: SectorLabels[Sector.HOUSING_AFFAIRS] },
  { value: Sector.EMPOWERMENT_AND_COMPLIANCE, label: SectorLabels[Sector.EMPOWERMENT_AND_COMPLIANCE] },
  { value: Sector.PLANNING_AND_DEVELOPMENT, label: SectorLabels[Sector.PLANNING_AND_DEVELOPMENT] },
  { value: Sector.SUPPORT_SERVICES, label: SectorLabels[Sector.SUPPORT_SERVICES] },
  { value: Sector.MINISTER_AFFILIATED, label: SectorLabels[Sector.MINISTER_AFFILIATED] },
];

/**
 * Meeting Channel (آلية انعقاد الاجتماع / قناة الاجتماع)
 * Shared labels for forms and display.
 */
export const MeetingChannelLabels: Record<string, string> = {
  PHYSICAL: 'حضوري',
  VIRTUAL: 'عن بعد',
  HYBRID: 'حضوري - عن بعد',
  TBD: 'يحدد لاحقًا',
};

export enum Channel {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
  TBD = 'TBD',
}
/** Shared meeting channel options for forms (UC01 & UC02). Same options and labels everywhere. */
export const MEETING_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: Channel.PHYSICAL, label: MeetingChannelLabels.PHYSICAL },
  { value: Channel.VIRTUAL, label: MeetingChannelLabels.VIRTUAL },
  { value: Channel.HYBRID, label: MeetingChannelLabels.HYBRID },
  { value: Channel.TBD, label: MeetingChannelLabels.TBD },
];

/**
 * Meeting Location (موقع الاجتماع) — shared options for UC01 & UC02.
 */
export const MeetingLocation = {
  ALIYA: 'مبنى العليا',
  GHADEER: 'مبنى الغدير',
  REAL_ESTATE_DEV_FUND: 'صندوق التنمية العقاري',
  REAL_ESTATE_AUTHORITY: 'الهيئة العامة للعقار',
  OTHER: 'موقع آخر',
} as const;

export type MeetingLocationValue = (typeof MeetingLocation)[keyof typeof MeetingLocation];

/** Preset locations (no free-text "other" input). */
const MEETING_LOCATION_PRESETS: readonly MeetingLocationValue[] = [
  MeetingLocation.ALIYA,
  MeetingLocation.GHADEER,
  MeetingLocation.REAL_ESTATE_DEV_FUND,
  MeetingLocation.REAL_ESTATE_AUTHORITY,
];

export const MEETING_LOCATION_OPTIONS: { value: MeetingLocationValue; label: string }[] = [
  { value: MeetingLocation.ALIYA, label: MeetingLocation.ALIYA },
  { value: MeetingLocation.GHADEER, label: MeetingLocation.GHADEER },
  { value: MeetingLocation.REAL_ESTATE_DEV_FUND, label: MeetingLocation.REAL_ESTATE_DEV_FUND },
  { value: MeetingLocation.REAL_ESTATE_AUTHORITY, label: MeetingLocation.REAL_ESTATE_AUTHORITY },
  { value: MeetingLocation.OTHER, label: MeetingLocation.OTHER },
];

export function isPresetMeetingLocation(value: string | undefined): value is MeetingLocationValue {
  return MEETING_LOCATION_PRESETS.includes(value as MeetingLocationValue);
}

export function getMeetingLocationDropdownValue(
  meeting_location: string | undefined,
  meeting_location_option: string | undefined
): '' | MeetingLocationValue {
  const loc = meeting_location?.trim() ?? '';
  if (MEETING_LOCATION_PRESETS.includes(loc as MeetingLocationValue)) return loc as MeetingLocationValue;
  if (loc !== '') return MeetingLocation.OTHER;
  return (meeting_location_option as '' | MeetingLocationValue) ?? '';
}

export function showMeetingLocationOtherInput(
  meeting_location: string | undefined,
  meeting_location_option: string | undefined
): boolean {
  const loc = meeting_location?.trim() ?? '';
  if (isPresetMeetingLocation(loc)) return false;
  if (loc !== '') return true;
  return meeting_location_option === MeetingLocation.OTHER;
}

/**
 * Attendance Mechanism (آلية الحضور) for invitees
 * Values are sent as Arabic strings per UC01 Step 2 requirement.
 */
export enum AttendanceMechanism {
  PHYSICAL = 'حضوري',
  VIRTUAL = 'عن بعد',
}

/**
 * Invitee Response Status (حالة رد المدعو)
 */
export const InviteeResponseStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبول',
  DECLINED: 'مرفوض',
};

export enum MeetingOwnerType {
  SUBMITTER = 'SUBMITTER',
  SCHEDULING = 'SCHEDULING',
  CONTENT = 'CONTENT',
  MINISTER = 'MINISTER',
}
export const MeetingOwnerTypeLabels: Record<MeetingOwnerType, string> = {
  [MeetingOwnerType.SUBMITTER]: 'مقدم الطلب',
  [MeetingOwnerType.SCHEDULING]: 'مسؤول الجدولة',
  [MeetingOwnerType.CONTENT]: 'مسؤول المحتوى',
  [MeetingOwnerType.MINISTER]: 'الوزير',
};
export function getMeetingOwnerTypeLabel(
  ownerType?: MeetingOwnerType
): string {
  if (!ownerType) return '';
  return MeetingOwnerTypeLabels[ownerType];
}
export const isSubmitter = (ownerType?: MeetingOwnerType) =>
  ownerType === MeetingOwnerType.SUBMITTER;

export const isScheduling = (ownerType?: MeetingOwnerType) =>
  ownerType === MeetingOwnerType.SCHEDULING;

export const isContent = (ownerType?: MeetingOwnerType) =>
  ownerType === MeetingOwnerType.CONTENT;

export const isMinister = (ownerType?: MeetingOwnerType) =>
  ownerType === MeetingOwnerType.MINISTER;


/**
 * Directive Method (طريقة التوجيه)
 */
export const DirectiveMethodLabels: Record<string, string> = {
  DIRECT_DIRECTIVE: 'توجيه مباشر',
  PREVIOUS_MEETING: 'اجتماع سابق',
};

/**
 * Meeting Classification extra values (optional from API)
 */
export const MeetingClassificationLabelsExtra: Record<string, string> = {
  WORKSHOP: 'ورشة عمل',
  DISCUSSION: 'مناقشة (بدون عرض تقديمي)',
  DISCUSSION_WITHOUT_PRESENTATION: 'مناقشة (بدون عرض تقديمي)',
};

/**
 * Helper: get meeting classification label (accepts enum or API string)
 */
export const getMeetingClassificationLabel = (classification: MeetingClassification | string | null | undefined): string => {
  if (classification == null || classification === '') return '-';
  return MeetingClassificationLabels[classification as MeetingClassification]
    ?? MeetingClassificationLabelsExtra[String(classification)]
    ?? classification;
};

/**
 * Helper: get meeting classification type label (accepts enum or API string)
 */
export const getMeetingClassificationTypeLabel = (type: MeetingClassificationType | string | null | undefined): string => {
  if (type == null || type === '') return '-';
  return MeetingClassificationTypeLabels[type as MeetingClassificationType] ?? type;
};

/**
 * Helper: get meeting confidentiality label (accepts enum or API string)
 */
export const getMeetingConfidentialityLabel = (confidentiality: MeetingConfidentiality | string | null | undefined): string => {
  if (confidentiality == null || confidentiality === '') return '-';
  return MeetingConfidentialityLabels[confidentiality as MeetingConfidentiality] ?? confidentiality;
};

/**
 * Helper: get meeting type label (accepts enum or API string)
 */
export const getMeetingTypeLabel = (type: MeetingType | string | null | undefined): string => {
  if (type == null || type === '') return '-';
  return MeetingTypeLabels[type as MeetingType] ?? type;
};

/**
 * Helper: get meeting channel label (قناة الاجتماع / آلية انعقاد الاجتماع)
 */
export const getMeetingChannelLabel = (channel: string | null | undefined): string => {
  if (!channel) return '-';
  return MeetingChannelLabels[String(channel).toUpperCase()] ?? channel;
};

/**
 * Helper: get invitee response status label
 */
export const getInviteeResponseStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '-';
  return InviteeResponseStatusLabels[String(status).toUpperCase()] ?? status;
};

/**
 * Helper: get directive method label
 */
export const getDirectiveMethodLabel = (method: string | null | undefined): string => {
  if (!method) return '-';
  return DirectiveMethodLabels[String(method).toUpperCase()] ?? method;
};

