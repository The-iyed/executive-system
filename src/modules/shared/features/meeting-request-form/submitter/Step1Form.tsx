import { FormProvider } from "react-hook-form";
import { useMemo } from "react";
import { useSubmitterStep1Form } from "./hooks/useStep1Form";
import { addDays, startOfDay } from "date-fns";
import {
  MeetingTitleField, DescriptionField, SectorField, MeetingTypeField,
  IsUrgentField, UrgentReasonField, MeetingDateField, MeetingChannelField,
  LocationField, LocationCustomField, MeetingCategoryField, MeetingJustificationField,
  ConfidentialityField, ClassificationTypeField, SubCategoryField,
  RelatedTopicField, DeadlineField, NoteField, OnBehalfField, MeetingOwnerField,
  DirectiveSection, AgendaSection,
  MeetingNatureField,
  PreviousMeetingField,
} from "../shared";
import { BOOL } from "../enums";
import type { SubmitterStep1Values } from "./schema";
import { scrollToFirstError } from "../shared/utils/scrollToFirstError";

interface Step1FormProps {
  onSubmit: (data: SubmitterStep1Values) => void;
  initialValues?: Partial<SubmitterStep1Values> & { meeting_manager_name?: string };
}

export function SubmitterStep1Form({ onSubmit, initialValues }: Step1FormProps) {
  const { form, visibility, watched } = useSubmitterStep1Form(initialValues);

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
          <OnBehalfField />
          {visibility.meeting_owner_id && <MeetingOwnerField name="meeting_owner_id" initialLabel={initialValues?.meeting_manager_name} />}
          <MeetingTitleField />

          <DescriptionField />
          {visibility.sector && <SectorField />}
          <MeetingTypeField />

          <IsUrgentField />
          {visibility.urgent_reason && <UrgentReasonField />}
          <MeetingDateField startName="meeting_start_date" endName="meeting_end_date" required minDate={minDate} />
          <MeetingChannelField />

          {visibility.meeting_location && (
            <>
              <LocationField />
              {visibility.meeting_location_custom && <LocationCustomField />}
            </>
          )}

          <MeetingCategoryField meetingType={watched.meeting_type} />
          {visibility.meeting_justification && <MeetingJustificationField />}
          {visibility.meeting_classification_type && <ClassificationTypeField />}
          {visibility.meetingSubCategory && <SubCategoryField />}
          {visibility.related_topic && <RelatedTopicField />}
          {visibility.deadline && <DeadlineField />}
          <ConfidentialityField />
        </div>

        <div className="mt-6">
          <AgendaSection form={form} />
        </div>

        <DirectiveSection
          showMethod={visibility.directive_method}
          showFile={visibility.previous_meeting_minutes_file_content}
          showText={visibility.directive_text}
        />

        <div className="mt-6">
          <NoteField />
        </div>
      </form>
    </FormProvider>
  );
}