
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
}

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  // Draft/Initial States
  [MeetingStatus.DRAFT]: 'جديد',
  [MeetingStatus.NEW]: 'جديد',
  // Review States
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.UNDER_CONSULTATION_SCHEDULING]: 'قيد المراجعة - استشارة الجدولة',
  [MeetingStatus.UNDER_GUIDANCE]: 'قيد المراجعة - المكتب التنفيذي',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: 'قيد المراجعة - محتوى',
  [MeetingStatus.UNDER_CONTENT_CONSULTATION]: 'قيد المراجعة - استشارة المحتوى',
  // Scheduled States
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_SCHEDULING]: 'مجدول - الجدولة',
  [MeetingStatus.SCHEDULED_CONTENT]: 'مجدول - المحتوى',
  [MeetingStatus.SCHEDULED_CONTENT_CONSULTATION]: 'مجدول - استشارة المحتوى',
  [MeetingStatus.SCHEDULED_UPDATE_CONTENT]: 'مجدول - تحديث المحتوى',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
  [MeetingStatus.SCHEDULED_DELAYED]: 'مجدول - متأخر',
  // Returned States
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: 'معاد من مسؤول الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT]: 'معاد من مسؤول المحتوى',
  // Legacy returned states (kept for backward compatibility)
  [MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER]: 'معاد من مسؤول الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT_MANAGER]: 'معاد من مسؤول المحتوى',
  // Final States
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
}

/**
 * Meeting Type Labels (Arabic)
 */
export const MeetingTypeLabels: Record<MeetingType, string> = {
  [MeetingType.INTERNAL]: 'داخلي',
  [MeetingType.EXTERNAL]: 'خارجي',
};

/**
 * Helper function to get meeting status label
 */
export const getMeetingStatusLabel = (status: MeetingStatus): string => {
  return MeetingStatusLabels[status] || status;
};

/**
 * Helper function to get meeting classification label
 */
export const getMeetingClassificationLabel = (classification: MeetingClassification): string => {
  return MeetingClassificationLabels[classification] || classification;
};

/**
 * Helper function to get meeting classification type label
 */
export const getMeetingClassificationTypeLabel = (type: MeetingClassificationType): string => {
  return MeetingClassificationTypeLabels[type] || type;
};

/**
 * Helper function to get meeting confidentiality label
 */
export const getMeetingConfidentialityLabel = (confidentiality: MeetingConfidentiality): string => {
  return MeetingConfidentialityLabels[confidentiality] || confidentiality;
};

/**
 * Helper function to get meeting type label
 */
export const getMeetingTypeLabel = (type: MeetingType): string => {
  return MeetingTypeLabels[type] || type;
};

