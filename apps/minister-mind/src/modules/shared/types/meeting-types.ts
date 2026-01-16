
export enum MeetingStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SCHEDULED = 'SCHEDULED',
  SCHEDULED_ADDITIONAL_INFO = 'SCHEDULED_ADDITIONAL_INFO',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
  RETURNED_FROM_SCHEDULING_MANAGER = 'RETURNED_FROM_SCHEDULING_MANAGER',
  RETURNED_FROM_CONTENT_MANAGER = 'RETURNED_FROM_CONTENT_MANAGER',
}

export const MeetingStatusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.DRAFT]: 'مسودة',
  [MeetingStatus.UNDER_REVIEW]: 'قيد المراجعة',
  [MeetingStatus.SCHEDULED]: 'مجدول',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: 'مجدول - معلومات إضافية',
  [MeetingStatus.REJECTED]: 'مرفوض',
  [MeetingStatus.CANCELLED]: 'ملغي',
  [MeetingStatus.CLOSED]: 'مغلق',
  [MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER]: 'معاد من مسؤول الجدولة',
  [MeetingStatus.RETURNED_FROM_CONTENT_MANAGER]: 'معاد من مسؤول المحتوى',
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

