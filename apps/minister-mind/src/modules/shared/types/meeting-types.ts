
export enum MeetingStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  UNDER_CONSULTATION_SCHEDULING = 'UNDER_CONSULTATION_SCHEDULING',
  UNDER_GUIDANCE = 'UNDER_GUIDANCE',
  UNDER_CONTENT_REVIEW = 'UNDER_CONTENT_REVIEW',
  UNDER_CONTENT_CONSULTATION = 'UNDER_CONTENT_CONSULTATION',
  SCHEDULED = 'SCHEDULED',
  SCHEDULED_SCHEDULING = 'SCHEDULED_SCHEDULING',
  SCHEDULED_CONTENT = 'SCHEDULED_CONTENT',
  SCHEDULED_CONTENT_CONSULTATION = 'SCHEDULED_CONTENT_CONSULTATION',
  SCHEDULED_UPDATE_CONTENT = 'SCHEDULED_UPDATE_CONTENT',
  SCHEDULED_ADDITIONAL_INFO = 'SCHEDULED_ADDITIONAL_INFO',
  SCHEDULED_DELAYED = 'SCHEDULED_DELAYED',
  RETURNED_FROM_SCHEDULING = 'RETURNED_FROM_SCHEDULING',
  RETURNED_FROM_CONTENT = 'RETURNED_FROM_CONTENT',
  WAITING = 'WAITING',
  READY = 'READY',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.DRAFT]: 'جديد',
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.UNDER_CONSULTATION_SCHEDULING]: 'قيد المراجعة - استشارة الجدولة',
  [MeetingStatus.UNDER_GUIDANCE]: 'قيد المراجعة - المكتب التنفيذي',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: 'قيد المراجعة - محتوى',
  [MeetingStatus.UNDER_CONTENT_CONSULTATION]: 'قيد المراجعة - استشارة المحتوى',
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_SCHEDULING]: 'مجدول - الجدولة',
  [MeetingStatus.SCHEDULED_CONTENT]: 'مجدول - المحتوى',
  [MeetingStatus.SCHEDULED_CONTENT_CONSULTATION]: 'مجدول - استشارة المحتوى',
  [MeetingStatus.SCHEDULED_UPDATE_CONTENT]: 'مجدول - تحديث المحتوى',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
  [MeetingStatus.SCHEDULED_DELAYED]: 'مجدول - متأخر',
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: 'معاد من مسؤول الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT]: 'معاد من مسؤول المحتوى',
  [MeetingStatus.WAITING]: 'قيد الانتظار',
  [MeetingStatus.READY]: 'جاهز',
  [MeetingStatus.REJECTED]: 'مرفوض',
  [MeetingStatus.CANCELLED]: 'ملغي',
  [MeetingStatus.CLOSED]: 'مغلق',
};

/**
 * Meeting Classification (فئة الاجتماع)
 * Category/Classification of the meeting
 */
export enum MeetingClassification {
  COUNCILS_AND_COMMITTEES = 'COUNCILS_AND_COMMITTEES',
  EVENTS_AND_VISITS = 'EVENTS_AND_VISITS',
  BILATERAL_MEETING = 'BILATERAL_MEETING',
  PRIVATE_MEETING = 'PRIVATE_MEETING',
  BUSINESS = 'BUSINESS',
  GOVERNMENT_CENTER_TOPICS = 'GOVERNMENT_CENTER_TOPICS',
  WORKSHOP = 'WORKSHOP',
  DISCUSSION_WITHOUT_PRESENTATION = 'DISCUSSION_WITHOUT_PRESENTATION',
}

/**
 * Meeting Classification Labels (Arabic)
 */
export const MeetingClassificationLabels: Record<MeetingClassification, string> = {
  [MeetingClassification.COUNCILS_AND_COMMITTEES]: 'المجالس واللجان',
  [MeetingClassification.EVENTS_AND_VISITS]: 'الفعاليات والزيارات',
  [MeetingClassification.BILATERAL_MEETING]: 'لقاء ثنائي',
  [MeetingClassification.PRIVATE_MEETING]: 'لقاء خاص',
  [MeetingClassification.BUSINESS]: 'اجتماعات الأعمال',
  [MeetingClassification.GOVERNMENT_CENTER_TOPICS]: 'مواضيع مركز الحكومة',
  [MeetingClassification.WORKSHOP]: 'ورشة عمل',
  [MeetingClassification.DISCUSSION_WITHOUT_PRESENTATION]: 'مناقشة (بدون عرض تقديمي)',
};

/**
 * Meeting Classification Type (تصنيف الاجتماع)
 * Type of classification for the meeting
 */
export enum MeetingClassificationType {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  SPECIAL = 'SPECIAL',
}

/**
 * Meeting Classification Type Labels (Arabic)
 */
export const MeetingClassificationTypeLabels: Record<MeetingClassificationType, string> = {
  [MeetingClassificationType.STRATEGIC]: 'استراتيجي',
  [MeetingClassificationType.OPERATIONAL]: 'تشغيلي',
  [MeetingClassificationType.SPECIAL]: 'خاص',
};

/**
 * Meeting Confidentiality (سريّة الاجتماع)
 * Confidentiality level of the meeting
 */
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

/**
 * Meeting Type (نوع الاجتماع)
 * Type of meeting (internal or external)
 */
export enum MeetingType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
}

/**
 * Meeting Type Labels (Arabic)
 */
export const MeetingTypeLabels: Record<MeetingType, string> = {
  [MeetingType.INTERNAL]: 'داخلي',
  [MeetingType.EXTERNAL]: 'خارجي',
  [MeetingType.BUSINESS_OWNER]: 'مالك أعمال',
};

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

/**
 * Sector Labels (Arabic)
 */
export const SectorLabels: Record<Sector, string> = {
  [Sector.MUNICIPAL_AFFAIRS]: 'شؤون البلديات',
  [Sector.HOUSING_AFFAIRS]: 'شؤون الإسكان',
  [Sector.EMPOWERMENT_AND_COMPLIANCE]: 'التمكين والإمتثال',
  [Sector.PLANNING_AND_DEVELOPMENT]: 'التخطيط والتطوير',
  [Sector.SUPPORT_SERVICES]: 'الخدمات المساندة',
  [Sector.MINISTER_AFFILIATED]: 'الجهات التابعة لمعالي الوزير',
};

/** Dropdown options for القطاع (Sector) */
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

/**
 * Invitee Source (مصدر المدعو)
 */
export const InviteeSourceLabels: Record<string, string> = {
  SUBMITTER: 'مقدم الطلب',
  MINISTER: 'الوزير',
};

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
 * Helper: get meeting status label (accepts enum or API string)
 */
export const getMeetingStatusLabel = (status: MeetingStatus | string): string => {
  return MeetingStatusLabels[status as MeetingStatus] ?? status;
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
 * Helper: get invitee source label
 */
export const getInviteeSourceLabel = (source: string | null | undefined): string => {
  if (!source) return '-';
  return InviteeSourceLabels[String(source).toUpperCase()] ?? source;
};

/**
 * Helper: get directive method label
 */
export const getDirectiveMethodLabel = (method: string | null | undefined): string => {
  if (!method) return '-';
  return DirectiveMethodLabels[String(method).toUpperCase()] ?? method;
};

