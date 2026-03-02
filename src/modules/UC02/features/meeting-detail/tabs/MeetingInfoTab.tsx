/**
 * Meeting info tab – uses shared MeetingInfo.
 * When not editable: read-only fields only (correct fields from data).
 * When canEdit: same fields with optional قابل للتعديل checkbox + editable inputs via renderField.
 */
import { MeetingInfo } from '@/modules/shared';
import type { MeetingInfoData, MeetingInfoFieldSpec, MeetingInfoRenderField } from '@/modules/shared';

export interface MeetingInfoTabProps {
  data: MeetingInfoData;
  canEdit: boolean;
  renderField?: MeetingInfoRenderField;
  /** Optional extra field specs (e.g. UC02: is_sequential, previous_meeting_id) */
  extraGridSpecs?: MeetingInfoFieldSpec[];
}

export function MeetingInfoTab({ data, canEdit, renderField, extraGridSpecs }: MeetingInfoTabProps) {
  return (
    <MeetingInfo
      data={data}
      dir="rtl"
      className="w-full"
      renderField={canEdit ? renderField : undefined}
      extraGridSpecs={extraGridSpecs}
    />
  );
}
