
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
  SCHEDULED_CONTENT = 'SCHEDULED_CONTENT',
  SCHEDULED_SCHEDULING = 'SCHEDULED_SCHEDULING',
  SCHEDULED_DELEGATED = 'SCHEDULED_DELEGATED',
  CLOSED_PASS = 'CLOSED_PASS',
  CLOSED = 'CLOSED',
}

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.DRAFT]: 'جديد',
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.RETURNED_FROM_CONTENT]: 'معلومات إضافية',
  [MeetingStatus.UNDER_GUIDANCE]: 'قيد المراجعة -  استشارة',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: 'قيد المراجعة - محتوى',
  [MeetingStatus.REJECTED]: 'مرفوض',
  [MeetingStatus.WAITING]: 'قيد الانتظار',
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_DELAYED]: 'مجدول - متأخر',
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: 'معلومات إضافية',
  [MeetingStatus.CANCELLED]: 'ملغي',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
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
}

export const MeetingClassificationTypeLabels: Record<MeetingClassificationType, string> = {
  [MeetingClassificationType.STRATEGIC]: 'استراتيجي',
  [MeetingClassificationType.OPERATIONAL]: 'تشغيلي',
  [MeetingClassificationType.SPECIAL]: 'خاص',
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
 */
export const MeetingChannelLabels: Record<string, string> = {
  PHYSICAL: 'حضوري',
  PHYSICAL_LOCATION_1: 'حضوري (الموقع1)',
  PHYSICAL_LOCATION_2: 'حضوري (الموقع2)',
  PHYSICAL_LOCATION_3: 'حضوري (الموقع3)',
  VIRTUAL: 'عن بعد',
  HYBRID: 'مختلط',
};

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

