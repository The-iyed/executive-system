/* ─────────────────────────────────────────────
 * Meeting Request — Shared Enums & Options
 * Single source of truth for all select/radio values.
 * ───────────────────────────────────────────── */

/* ═══ Sector ═══ */
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

export const SECTOR_OPTIONS = Object.values(Sector).map((v) => ({
  value: v,
  label: SectorLabels[v],
}));

/* ═══ Meeting Type ═══ */
export enum MeetingType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

export const MeetingTypeLabels: Record<MeetingType, string> = {
  [MeetingType.INTERNAL]: 'داخلي',
  [MeetingType.EXTERNAL]: 'خارجي',
};

export const MEETING_TYPE_OPTIONS = Object.values(MeetingType).map((v) => ({
  value: v,
  label: MeetingTypeLabels[v],
}));

/* ═══ Attendance Mechanism (Channel) ═══ */
export enum AttendanceMechanism {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
  TBD = 'TBD',
}

export const MeetingChannelLabels: Record<string, string> = {
  PHYSICAL: 'حضوري',
  VIRTUAL: 'عن بعد',
  HYBRID: 'حضوري - عن بعد',
  TBD: 'يحدد لاحقًا',
};

/** Shared meeting channel options for forms (UC01 & UC02). */
export const MEETING_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: AttendanceMechanism.PHYSICAL, label: MeetingChannelLabels.PHYSICAL },
  { value: AttendanceMechanism.VIRTUAL, label: MeetingChannelLabels.VIRTUAL },
  { value: AttendanceMechanism.HYBRID, label: MeetingChannelLabels.HYBRID },
  { value: AttendanceMechanism.TBD, label: MeetingChannelLabels.TBD },
];

/* ═══ Meeting Location ═══ */
export const MeetingLocation = {
  ALIYA: 'العليا',
  GHADEER: 'الغدير',
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

/* ═══ Meeting Classification (Category) ═══ */
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

export const MEETING_CATEGORY_OPTIONS = Object.values(MeetingClassification).map((v) => ({
  value: v,
  label: MeetingClassificationLabels[v],
}));

/** Categories excluded when meeting type is EXTERNAL */
export const EXTERNAL_MEETING_EXCLUDED_CATEGORIES: readonly MeetingClassification[] = [
  MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL,
  MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL,
  MeetingClassification.EVENTS_AND_VISITS,
  MeetingClassification.GOVERNMENT_CENTER_TOPICS,
];

/** Returns filtered category options based on meeting type */
export function getMeetingCategoryOptions(meetingType: string) {
  if (meetingType !== MeetingType.EXTERNAL) {
    return [...MEETING_CATEGORY_OPTIONS];
  }
  return MEETING_CATEGORY_OPTIONS.filter(
    (opt) => !EXTERNAL_MEETING_EXCLUDED_CATEGORIES.includes(opt.value)
  );
}

/* ═══ Meeting Sub-Category ═══ */
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

export const MEETING_SUB_CATEGORY_OPTIONS = Object.values(MeetingSubCategory).map((v) => ({
  value: v,
  label: MeetingSubCategoryLabels[v],
}));

/* ═══ Meeting Classification Type ═══ */
export const MEETING_CLASSIFICATION_OPTIONS = [
  { value: 'STRATEGIC', label: 'استراتيجي' },
  { value: 'OPERATIONAL', label: 'تشغيلي' },
  { value: 'ORGANIZATIONAL_STRUCTURING', label: 'بناء تنظيمي' },
] as const;

export enum MeetingConfidentiality {
  NORMAL = 'NORMAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

export const MeetingConfidentialityLabels: Record<MeetingConfidentiality, string> = {
  [MeetingConfidentiality.NORMAL]: 'عادي',
  [MeetingConfidentiality.CONFIDENTIAL]: 'سرّي',
};

/* ═══ Boolean Options (is_urgent, is_on_behalf_of, is_based_on_directive) ═══ */
export const BOOL = { TRUE: 'true', FALSE: 'false' } as const;

/* ═══ Minister Support Type (Agenda) ═══ */
export const MINISTER_SUPPORT_TYPE_OPTIONS = [
  { value: 'إحاطة', label: 'إحاطة' },
  { value: 'تحديث', label: 'تحديث' },
  { value: 'قرار', label: 'قرار' },
  { value: 'توجيه', label: 'توجيه' },
  { value: 'اعتماد', label: 'اعتماد' },
  { value: 'أخرى', label: 'أخرى (يقوم بالإدخال)' },
] as const;

export const MINISTER_SUPPORT_OTHER_VALUE = 'أخرى';

/* ═══ Directive Method ═══ */
export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
] as const;

/* ═══ Meeting Managers (placeholder — replace with API) ═══ */
export const MEETING_MANAGERS = [
  { label: 'tabukm.gov.sa@1002410024', value: 'mgr-1' },
  { label: 'أحمد محمد', value: 'mgr-2' },
  { label: 'فاطمة علي', value: 'mgr-3' },
  { label: 'خالد إبراهيم', value: 'mgr-4' },
  { label: 'نورة عبدالله', value: 'mgr-5' },
] as const;

/* ═══ Meeting Nature (Scheduler) ═══ */
export enum MeetingNature {
  NORMAL = 'NORMAL',
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
