import { FormProvider } from "react-hook-form";
import { useMemo } from "react";
import { useSchedulerStep1Form } from "./useStep1Form";
import { addDays, startOfDay } from "date-fns";
import {
  MeetingTitleField, DescriptionField, SectorField, MeetingTypeField,
  IsUrgentField, UrgentReasonField, MeetingDateField, MeetingChannelField,
  LocationField, LocationCustomField, MeetingCategoryField, MeetingJustificationField,
  ConfidentialityField, ClassificationTypeField, SubCategoryField,
  RelatedTopicField, DeadlineField, NoteField, MeetingManagerField, MeetingOwnerField,
  MeetingNatureField, PreviousMeetingField, RequiresProtocolField,
  RelatedDirectiveField, AgendaSection,
} from "../shared";
import { BOOL } from "../enums";
import type { SchedulerStep1Values } from "./schema";
import { scrollToFirstError } from "../shared/utils/scrollToFirstError";

interface Props {
  onSubmit: (data: SchedulerStep1Values) => void;
  renderActions?: (actions: { submit: () => void; reset: () => void }) => React.ReactNode;
  initialValues?: Partial<SchedulerStep1Values>;
}

export function SchedulerStep1Form({ onSubmit, renderActions, initialValues }: Props) {
  const { form, visibility, watched, isFieldDisabled } = useSchedulerStep1Form(initialValues);

  const minDate = useMemo(() => {
    return watched.is_urgent === BOOL.TRUE ? startOfDay(new Date()) : startOfDay(addDays(new Date(), 7));
  }, [watched.is_urgent]);

  const handleSubmit = form.handleSubmit(onSubmit, (errors) => scrollToFirstError(form, errors));

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-5">
          {/* Row 1 */}
          <MeetingNatureField />
          {visibility.previous_meeting_id && <PreviousMeetingField />}
          <MeetingManagerField name="submitter_id" label="مقدّم الطلب" placeholder="ابحث عن مقدّم الطلب..." />

          {/* Row 2 */}
          <MeetingOwnerField disabled={isFieldDisabled("owner_id")} />
          <MeetingTitleField />
          <DescriptionField disabled={isFieldDisabled("description")} />

          {/* Row 3 */}
          <SectorField required disabled={isFieldDisabled("sector")} />
          <MeetingTypeField disabled={isFieldDisabled("meeting_type")} />
          <IsUrgentField />

          {/* Conditional */}
          {visibility.urgent_reason && <UrgentReasonField />}

          {/* Dates */}
          <MeetingDateField startName="meeting_start_date" endName="meeting_end_date" required minDate={minDate} />

          {/* Channel & location */}
          <MeetingChannelField />
          {visibility.meeting_location && (
            <>
              <LocationField />
              {visibility.meeting_location_custom && <LocationCustomField />}
            </>
          )}
          <RequiresProtocolField disabled={isFieldDisabled("requires_protocol")} />

          {/* Category */}
          <MeetingCategoryField meetingType={watched.meeting_type} disabled={isFieldDisabled("meeting_classification")} />
          {visibility.meeting_justification && <MeetingJustificationField disabled={isFieldDisabled("meeting_justification")} />}
          {visibility.meeting_classification_type && <ClassificationTypeField disabled={isFieldDisabled("meeting_classification_type")} />}
          {visibility.meetingSubCategory && <SubCategoryField disabled={isFieldDisabled("meeting_sub_category")} />}
          {visibility.related_topic && <RelatedTopicField disabled={isFieldDisabled("related_topic")} />}
          {visibility.deadline && <DeadlineField disabled={isFieldDisabled("deadline")} />}
          <ConfidentialityField disabled={isFieldDisabled("meeting_confidentiality")} />
        </div>

        {/* Agenda */}
        <div className="mt-6">
          <AgendaSection form={form} agendaRequired={false} />
        </div>

        {/* Notes + Directive */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <NoteField disabled={isFieldDisabled("note")} />
          <RelatedDirectiveField disabled={isFieldDisabled("related_directive")} />
        </div>
      </form>

      {renderActions?.({ submit: handleSubmit, reset: () => form.reset() })}
    </FormProvider>
  );
}