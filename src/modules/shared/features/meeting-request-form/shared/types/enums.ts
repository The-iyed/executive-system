/* ─────────────────────────────────────────────
 * Meeting Request — Shared Enums & Options
 * Re-exports from the single source of truth in shared/types.
 * ───────────────────────────────────────────── */

export {
  /* Sector */
  Sector,
  SectorLabels,
  SECTOR_OPTIONS,

  /* Meeting Type */
  MeetingType,
  MeetingTypeLabels,
  MEETING_TYPE_OPTIONS,

  /* Channel / Attendance Mechanism */
  Channel as AttendanceMechanism,
  MeetingChannelLabels,
  MEETING_CHANNEL_OPTIONS,

  /* Meeting Location */
  MeetingLocation,
  MEETING_LOCATION_OPTIONS,
  type MeetingLocationValue,

  /* Meeting Classification (Category) */
  MeetingClassification,
  MeetingClassificationLabels,
  MEETING_CATEGORY_OPTIONS,
  EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES as EXTERNAL_MEETING_EXCLUDED_CATEGORIES,
  getMeetingCategoryOptions,

  /* Meeting Sub-Category */
  MeetingSubCategory,
  MeetingSubCategoryLabels,
  MEETING_SUB_CATEGORY_OPTIONS,

  /* Meeting Classification Type */
  MeetingClassificationType,
  MeetingClassificationTypeLabels,
  MEETING_CLASSIFICATION_TYPE_OPTIONS as MEETING_CLASSIFICATION_OPTIONS,

  /* Meeting Confidentiality */
  MeetingConfidentiality,
  MeetingConfidentialityLabels,

  /* Minister Support */
  MINISTER_SUPPORT_TYPE_OPTIONS,
  MINISTER_SUPPORT_OTHER_VALUE,

  /* Directive Method */
  DirectiveMethodLabels,
  DIRECTIVE_METHOD_OPTIONS,

  /* Boolean */
  BOOL,

  /* Meeting Nature (Scheduler) */
  MeetingNature,
  MeetingNatureLabels,
  MEETING_NATURE_OPTIONS,

  /* Meeting Managers (placeholder) */
  MEETING_MANAGERS,
} from '../../../../types';
