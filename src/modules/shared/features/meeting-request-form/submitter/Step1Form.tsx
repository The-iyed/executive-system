import { useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { addDays, startOfDay } from "date-fns";
import { useSubmitterStep1Form } from "./hooks/useStep1Form";
import {
  MeetingTitleField, DescriptionField, SectorField, MeetingTypeField,
  IsUrgentField, UrgentReasonField, MeetingDateField, MeetingChannelField,
  LocationField, LocationCustomField, MeetingCategoryField, MeetingJustificationField,
  ConfidentialityField, ClassificationTypeField, SubCategoryField,
  RelatedTopicField, DeadlineField, NoteField, OnBehalfField, MeetingOwnerField,
  DirectiveSection, AgendaSection,
  MeetingNatureField,
  PreviousMeetingField,
  RequiresProtocolField,
  RelatedDirectiveField,
  MeetingManagerField,
} from "../shared";
import { BOOL } from "../shared/types/enums";
import { MeetingStatus } from "../shared/types/types";
import type { SubmitterStep1Values } from "./schema";
import { scrollToFirstError } from "../shared/utils/scrollToFirstError";

interface Step1FormProps {
  onSubmit: (data: SubmitterStep1Values) => void;
  initialValues?: Partial<SubmitterStep1Values> & { meeting_manager_name?: string };
  isSchedulerEdit?: boolean;
  meetingStatus?: MeetingStatus;
}

export function SubmitterStep1Form({ onSubmit, initialValues, isSchedulerEdit, meetingStatus }: Step1FormProps) {
  const { form, visibility, watched } = useSubmitterStep1Form(initialValues, { isSchedulerEdit });

  const minDate = useMemo(
    () => (watched.is_urgent === BOOL.TRUE ? startOfDay(new Date()) : startOfDay(addDays(new Date(), 7))),
    [watched.is_urgent],
  );

  const handleSubmit = form.handleSubmit(onSubmit, (errors) => scrollToFirstError(form, errors));

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-5">
          <MeetingNatureField />
          {visibility.previous_meeting_id && <PreviousMeetingField />}
          {isSchedulerEdit && (
            <MeetingManagerField
              name="submitter"
              label="مقدّم الطلب"
              placeholder="ابحث عن مقدّم الطلب..."
              disabled={false}
              initialLabel={initialValues?.submitter?.name || initialValues?.submitter?.username || initialValues?.submitter?.displayName || initialValues?.submitter?.mail}
            />
          )}
          <OnBehalfField />
          {visibility.meeting_owner && <MeetingOwnerField
              name="meeting_owner"
              initialLabel={initialValues?.meeting_owner?.name || initialValues?.meeting_owner?.username || initialValues?.meeting_owner?.displayName || initialValues?.meeting_owner?.mail }
            />}
          <MeetingTitleField />

          <DescriptionField />
          {visibility.sector && <SectorField required={!isSchedulerEdit} />}
          <MeetingTypeField required={!isSchedulerEdit} />

          <IsUrgentField />
          {visibility.urgent_reason && <UrgentReasonField required={!isSchedulerEdit} />}
          <MeetingDateField
            startName="meeting_start_date"
            endName="meeting_end_date"
            required={!isSchedulerEdit}
            minDate={isSchedulerEdit ? undefined : minDate}
            disabled={
              !isSchedulerEdit &&
              meetingStatus === MeetingStatus.SCHEDULED &&
            !!initialValues?.meeting_start_date &&
            !!initialValues?.meeting_end_date
            }
          />
          <MeetingChannelField />
          {isSchedulerEdit && <RequiresProtocolField />}

          {visibility.meeting_location && (
            <>
              <LocationField />
              {visibility.meeting_location_custom && <LocationCustomField />}
            </>
          )}

          <MeetingCategoryField meetingType={watched.meeting_type} required={!isSchedulerEdit} />
          {visibility.meeting_justification && <MeetingJustificationField required={!isSchedulerEdit} />}
          {visibility.meeting_classification_type && <ClassificationTypeField required={!isSchedulerEdit} />}
          {visibility.meetingSubCategory && <SubCategoryField />}
          {visibility.related_topic && <RelatedTopicField required={!isSchedulerEdit} />}
          {visibility.deadline && <DeadlineField required={!isSchedulerEdit} />}
          <ConfidentialityField required={!isSchedulerEdit} />
        </div>

        <div className="mt-6">
          <AgendaSection form={form} agendaRequired={!isSchedulerEdit} />
        </div>

        <DirectiveSection
          showMethod={visibility.directive_method}
          showFile={visibility.previous_meeting_minutes_file_content}
          showText={visibility.directive_text}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
          <NoteField />
          {isSchedulerEdit && <RelatedDirectiveField />}
        </div>
      </form>
    </FormProvider>
  );
}