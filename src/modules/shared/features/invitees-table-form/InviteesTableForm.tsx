import React, { useState, useCallback, useRef, useEffect } from "react";
import { DynamicTableFormHandle, InputTableRow, SearchApiUser, TableFormSection, TableRow, TableValidation } from "@/lib/dynamic-table-form";
import { searchUsersByEmail } from "../meeting-request-form/api"
import { useSuggestAttendees } from "./useSuggestAttendees";
import type { UseSuggestMeetingAttendeesParams } from "./api";
import InviteeCardList from "./InviteeCardList";
import { INVITEE_COLUMNS } from "./columns";

export type InviteesTableForm = TableRow[]

export type InviteesViewLayout = "table" | "cards";

const InviteesTableForm = ({
  tableValidation = { required: true, minItems: 1 },
  tableRef = useRef<DynamicTableFormHandle>(null),
  initialInvitees = [],
  mode = "create",
  meetingParams,
  excludeColumns = [],
  meetingChannel,
  viewLayout = "table",
  showAiSuggest = true,
}: {
  tableValidation?: TableValidation;
  tableRef?: React.RefObject<DynamicTableFormHandle>;
  initialInvitees?: TableRow[];
  mode?: "create" | "edit" | "view";
  meetingParams?: UseSuggestMeetingAttendeesParams["meeting"];
  excludeColumns?: string[];
  /** When PHYSICAL or VIRTUAL, the attendance_mechanism column is auto-hidden */
  meetingChannel?: string;
  viewLayout?: InviteesViewLayout;
  showAiSuggest?: boolean;
}) => {
  const normalizeInvitees = (rows: TableRow[]) => rows.map(r => ({
    ...r,
    is_presence_required: r.is_presence_required ?? false,
  }));

  const [invitees, setInvitees] = useState<TableRow[]>(normalizeInvitees(initialInvitees ?? []));

  useEffect(() => {
    setInvitees(normalizeInvitees(initialInvitees ?? []));
  }, [initialInvitees]);

  // Hide attendance_mechanism when channel is fixed (PHYSICAL or VIRTUAL)
  const isFixedChannel = meetingChannel === 'PHYSICAL' || meetingChannel === 'VIRTUAL'
    || meetingChannel === 'حضوري' || meetingChannel === 'عن بعد';
  const effectiveExclude = isFixedChannel
    ? [...new Set([...excludeColumns, "attendance_mechanism"])]
    : excludeColumns;

  const filteredColumns = effectiveExclude.length > 0
    ? INVITEE_COLUMNS.filter(col => !effectiveExclude.includes(col.key))
    : INVITEE_COLUMNS;

  const { mutateAsync: suggestAttendees } = useSuggestAttendees();

  const handleAiGenerate = useCallback(async (count: number): Promise<TableRow[]> => {
    if (!meetingParams) return [];
    const result = await suggestAttendees({ count, meeting: meetingParams });
    return result.suggestions.map((s) => ({
      _id: `ai-${s.employee_id.toString()}`,
      name: s.name_ar || s.name_en || `${s.first_name} ${s.last_name}`.trim(),
      email: s.email,
      position: s.position_name,
      mobile: s.phone,
      sector: s.department_name,
      access_permission: false,
      is_consultant: false,
      meeting_owner: false,
      is_presence_required: false,
      isExternal: false,
      _aiSuggestionReason: s.suggestion_reason,
      _aiImportanceLevel: s.importance_level,
    }));
  }, [meetingParams, suggestAttendees]);

  const handleSearchResultToRow = useCallback((result: SearchApiUser): Partial<InputTableRow> => ({
    email: result.mail || "",
    name: result.displayNameAR || result.displayName || result.displayNameEN || result.givenName || "",
    mobile: result.mobile || "",
    sector: result.department || "",
    position: result.title || "",
    object_guid: result.objectGUID || null,
  }), []);

  // In view mode with cards layout, render card list if there are invitees
  if (mode === "view" && viewLayout === "cards" && invitees?.length > 0) {
    return <InviteeCardList invitees={invitees} columns={filteredColumns} />;
  }

  return (
    <TableFormSection
      ref={tableRef}
      title="قائمة المدعوين"
      entityKey="invitees"
      mode={mode}
      value={invitees}
      onChange={setInvitees}
      columns={filteredColumns}
      tableValidation={tableValidation}
      emptyStateTitle="لا يوجد مدعوون بعد"
      emptyStateDescription="ابدأ بإضافة مدعو جديد لحضور الاجتماع"
      addButtonLabel="إضافة مدعو جديد"
      searchFn={async (query) => {
        const result = await searchUsersByEmail(query, 0);
        return result.items.map((item) => ({
          label: item.mail,
          value: item.objectGUID || "",
          raw: item as unknown as SearchApiUser,
        }));
      }}
      mapSearchResultToRow={handleSearchResultToRow}
      maxHeight="360px"
      aiGenerateFn={showAiSuggest ? handleAiGenerate : undefined}
      aiGenerateLabel={showAiSuggest ? "إضافة مدعوين آليًا" : undefined}
    />
  )
}

export default InviteesTableForm