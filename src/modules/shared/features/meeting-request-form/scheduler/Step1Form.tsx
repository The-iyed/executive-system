import { FormProvider } from "react-hook-form";
import { useSchedulerStep1Form } from "./useStep1Form";
import {
  MeetingTitleField, DescriptionField, SectorField, MeetingTypeField,
  IsUrgentField, UrgentReasonField, MeetingDateField, MeetingChannelField,
  LocationField, LocationCustomField, MeetingCategoryField, MeetingJustificationField,
  ConfidentialityField, ClassificationTypeField, SubCategoryField,
  RelatedTopicField, DeadlineField, NoteField, MeetingManagerField, MeetingOwnerField,
  MeetingNatureField, PreviousMeetingField, RequiresProtocolField,
  RelatedDirectiveField, AgendaSection, OnBehalfField,
} from "../shared";
import type { SchedulerStep1Values } from "./schema";
import { scrollToFirstError } from "../shared/utils/scrollToFirstError";

interface Props {
  onSubmit: (data: SchedulerStep1Values) => void;
  renderActions?: (actions: { submit: () => void; reset: () => void }) => React.ReactNode;
  initialValues?: Partial<SchedulerStep1Values>;
  /** Fallback label for a pre-selected directive before API options load. */
  defaultDirectiveLabel?: string;
}

export function SchedulerStep1Form({ onSubmit, renderActions, initialValues, defaultDirectiveLabel }: Props) {
  const { form, visibility, watched } = useSchedulerStep1Form(initialValues);


  const handleSubmit = form.handleSubmit(
    (data) => {
      console.log("[SchedulerStep1Form] ✅ Validation passed, submitting:", data);
      onSubmit(data);
    },
    (errors) => {
      console.error("[SchedulerStep1Form] ❌ Validation errors:", errors);
      scrollToFirstError(form, errors);
    }
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-5">
          {/* Row 1 */}
          <MeetingNatureField />
          {visibility.previous_meeting_id && <PreviousMeetingField />}
          <MeetingManagerField name="submitter" label="مقدّم الطلب" placeholder="ابحث عن مقدّم الطلب..." />

          {/* On behalf */}
          <OnBehalfField />
          {visibility.meeting_owner && <MeetingOwnerField />}
          <MeetingTitleField />
          <DescriptionField />

          {/* Row 3 */}
          <SectorField />
          <MeetingTypeField />
          <IsUrgentField />

          {/* Conditional */}
          {visibility.urgent_reason && <UrgentReasonField />}

          {/* Dates */}
          <MeetingDateField startName="meeting_start_date" endName="meeting_end_date" required />

          {/* Channel & location */}
          <MeetingChannelField />
          {visibility.meeting_location && (
            <>
              <LocationField />
              {visibility.meeting_location_custom && <LocationCustomField />}
            </>
          )}
          <RequiresProtocolField />

          {/* Category */}
          <MeetingCategoryField meetingType={watched.meeting_type} />
          {visibility.meeting_justification && <MeetingJustificationField />}
          {visibility.meeting_classification_type && <ClassificationTypeField />}
          {visibility.meetingSubCategory && <SubCategoryField />}
          {visibility.related_topic && <RelatedTopicField />}
          {visibility.deadline && <DeadlineField />}
          <ConfidentialityField />
        </div>

        {/* Agenda */}
        <div className="mt-6">
          <AgendaSection form={form} agendaRequired={false} />
        </div>

        {/* Notes + Directive */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <NoteField />
          <RelatedDirectiveField defaultDirectiveLabel={defaultDirectiveLabel} />
        </div>
      </form>

      {renderActions?.({ submit: handleSubmit, reset: () => form.reset() })}
    </FormProvider>
  );
}