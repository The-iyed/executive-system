
export enum MeetingStatus {
  // Draft/Initial States
  DRAFT = 'DRAFT',
  NEW = 'NEW',
  // Review States
  UNDER_REVIEW = 'UNDER_REVIEW',
  UNDER_CONSULTATION_SCHEDULING = 'UNDER_CONSULTATION_SCHEDULING',
  UNDER_GUIDANCE = 'UNDER_GUIDANCE',
  UNDER_CONTENT_REVIEW = 'UNDER_CONTENT_REVIEW',
  UNDER_CONTENT_CONSULTATION = 'UNDER_CONTENT_CONSULTATION',
  // Scheduled States
  SCHEDULED = 'SCHEDULED',
  SCHEDULED_SCHEDULING = 'SCHEDULED_SCHEDULING',
  SCHEDULED_CONTENT = 'SCHEDULED_CONTENT',
  SCHEDULED_CONTENT_CONSULTATION = 'SCHEDULED_CONTENT_CONSULTATION',
  SCHEDULED_UPDATE_CONTENT = 'SCHEDULED_UPDATE_CONTENT',
  SCHEDULED_ADDITIONAL_INFO = 'SCHEDULED_ADDITIONAL_INFO',
  SCHEDULED_DELAYED = 'SCHEDULED_DELAYED',
  // Returned States
  RETURNED_FROM_SCHEDULING = 'RETURNED_FROM_SCHEDULING',
  RETURNED_FROM_CONTENT = 'RETURNED_FROM_CONTENT',
  // Legacy returned states (kept for backward compatibility)
  RETURNED_FROM_SCHEDULING_MANAGER = 'RETURNED_FROM_SCHEDULING_MANAGER',
  RETURNED_FROM_CONTENT_MANAGER = 'RETURNED_FROM_CONTENT_MANAGER',
  // Final States
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
  // Waiting State
  WAITING = 'WAITING',
  READY = 'READY',
}

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  // Draft/Initial States
  [MeetingStatus.DRAFT]: 'مسودة',
  [MeetingStatus.NEW]: 'جديد',
  // Review States
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.UNDER_CONSULTATION_SCHEDULING]: 'تحت استشارة الجدولة',
  [MeetingStatus.UNDER_GUIDANCE]: 'تحت التوجيه',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: 'تحت مراجعة المحتوى',
  [MeetingStatus.UNDER_CONTENT_CONSULTATION]: 'تحت استشارة المحتوى',
  // Scheduled States
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_SCHEDULING]: 'مجدول - جدولة',
  [MeetingStatus.SCHEDULED_CONTENT]: 'مجدول - محتوى',
  [MeetingStatus.SCHEDULED_CONTENT_CONSULTATION]: 'مجدول - استشارة محتوى',
  [MeetingStatus.SCHEDULED_UPDATE_CONTENT]: 'مجدول - تحديث محتوى',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
  [MeetingStatus.SCHEDULED_DELAYED]: 'مجدول - مؤجل',
  // Returned States
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: 'مرجع من الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT]: 'مرجع من المحتوى',
  // Legacy returned states (kept for backward compatibility)
  [MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER]: 'معاد من مسؤول الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT_MANAGER]: 'معاد من مسؤول المحتوى',
  // Waiting State
  [MeetingStatus.WAITING]: 'قيد الانتظار',
  [MeetingStatus.READY]: 'جاهز',
  // Final States
  [MeetingStatus.REJECTED]: 'مرفوض',
  [MeetingStatus.CANCELLED]: 'ملغى',
  [MeetingStatus.CLOSED]: 'منتهي',
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
}

/**
 * Meeting Classification Labels (Arabic)
 */
export const MeetingClassificationLabels: Record<MeetingClassification, string> = {
  [MeetingClassification.COUNCILS_AND_COMMITTEES]: 'المجالس واللجان',
  [MeetingClassification.EVENTS_AND_VISITS]: 'الفعاليات والزيارات',
  [MeetingClassification.BILATERAL_MEETING]: 'لقاء ثنائي',
  [MeetingClassification.PRIVATE_MEETING]: 'لقاء خاص',
  [MeetingClassification.BUSINESS]: 'أعمال',
  [MeetingClassification.GOVERNMENT_CENTER_TOPICS]: 'مواضيع مركز الحكومة',
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

