// Step 1: Basic Info (معلومات الاجتماع)
export {
  step1BasicInfoBaseSchema,
  validateStep1BasicInfo,
  extractStep1BasicInfoErrors,
  isStep1BasicInfoFieldRequired,
  createStep1BasicInfoSchema,
  type Step1BasicInfoFormData,
} from './step1BasicInfo.schema';

// Step 2: Content (المحتوى)
export {
  step2ContentBaseSchema,
  createStep2ContentSchema,
  isPresentationHidden,
  isPresentationRequired,
  isAttachmentTimingRequired,
  isAttachmentTimingVisible,
  type Step2ContentFormData,
  type Step2ContentSchemaOptions,
} from './step2Content.schema';

// Step 3: Invitees (قائمة المدعوين)
export {
  step3InviteesSchema,
  createStep3InviteesSchema,
  type Step3InviteesFormData,
} from './step3Invitees.schema';

// Step 4: Scheduling (موعد الاجتماع)
export {
  step4SchedulingSchema,
  type Step4SchedulingFormData,
} from './step4Scheduling.schema';
