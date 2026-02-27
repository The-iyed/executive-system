/**
 * Meeting info tab – uses shared MeetingInfo.
 * When not editable: read-only fields only (correct fields from data).
 * When canEdit: same fields with optional قابل للتعديل checkbox + editable inputs via renderField.
 */
import React from 'react';
import { MeetingInfo } from '@shared';
import type { MeetingInfoData, MeetingInfoRenderField } from '@shared';

export interface MeetingInfoTabProps {
  data: MeetingInfoData;
  canEdit: boolean;
  renderField?: MeetingInfoRenderField;
}

export function MeetingInfoTab({ data, canEdit, renderField }: MeetingInfoTabProps) {
  return (
    <MeetingInfo
      data={data}
      dir="rtl"
      className="w-full"
      renderField={canEdit ? renderField : undefined}
    />
  );
}
