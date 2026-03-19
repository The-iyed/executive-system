import { MeetingOwnerType, MeetingStatus, MeetingStatusLabels } from "@/modules/shared";

  const SubmitterStatusMap: Partial<Record<MeetingStatus, MeetingStatus>> = {
    [MeetingStatus.UNDER_REVIEW]: MeetingStatus.UNDER_REVIEW,
    [MeetingStatus.UNDER_GUIDANCE]: MeetingStatus.UNDER_REVIEW,
    [MeetingStatus.UNDER_CONTENT_REVIEW]: MeetingStatus.UNDER_REVIEW,
    [MeetingStatus.RETURNED_FROM_CONTENT]: MeetingStatus.RETURNED_FROM_SCHEDULING,
    [MeetingStatus.RETURNED_FROM_SCHEDULING]: MeetingStatus.RETURNED_FROM_SCHEDULING,
    [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
    [MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT]: MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
    [MeetingStatus.SCHEDULED]: MeetingStatus.SCHEDULED,
    [MeetingStatus.SCHEDULED_DELAYED]: MeetingStatus.SCHEDULED,
    [MeetingStatus.SCHEDULED_SCHEDULING]: MeetingStatus.SCHEDULED,
    [MeetingStatus.SCHEDULED_CONTENT]: MeetingStatus.SCHEDULED,
    [MeetingStatus.SCHEDULED_DELEGATED]: MeetingStatus.SCHEDULED,
    [MeetingStatus.REJECTED]: MeetingStatus.REJECTED,
    [MeetingStatus.CLOSED_PASS]: MeetingStatus.CLOSED,
    [MeetingStatus.CANCELLED]: MeetingStatus.CANCELLED,
    [MeetingStatus.WAITING]: MeetingStatus.WAITING,
  };

  const SchedulingStatusMap: Partial<Record<MeetingStatus, MeetingStatus>> = {
    [MeetingStatus.DRAFT]: MeetingStatus.DRAFT,
    [MeetingStatus.UNDER_REVIEW]: MeetingStatus.UNDER_REVIEW,
    [MeetingStatus.RETURNED_FROM_CONTENT]: MeetingStatus.RETURNED_FROM_CONTENT,
    [MeetingStatus.UNDER_GUIDANCE]: MeetingStatus.UNDER_GUIDANCE,
    [MeetingStatus.UNDER_CONTENT_REVIEW]: MeetingStatus.RETURNED_FROM_CONTENT,
    [MeetingStatus.REJECTED]: MeetingStatus.REJECTED,
    [MeetingStatus.WAITING]: MeetingStatus.WAITING,
    [MeetingStatus.SCHEDULED]: MeetingStatus.SCHEDULED,
    [MeetingStatus.SCHEDULED_DELAYED]: MeetingStatus.SCHEDULED_DELAYED,
    [MeetingStatus.CANCELLED]: MeetingStatus.CANCELLED,
    [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
    [MeetingStatus.SCHEDULED_CONTENT]: MeetingStatus.SCHEDULED_CONTENT,
    [MeetingStatus.SCHEDULED_SCHEDULING]: MeetingStatus.SCHEDULED_SCHEDULING,
    [MeetingStatus.SCHEDULED_DELEGATED]: MeetingStatus.SCHEDULED_DELEGATED,
    [MeetingStatus.CLOSED_PASS]: MeetingStatus.CLOSED_PASS,
    [MeetingStatus.CLOSED]: MeetingStatus.CLOSED,
  };

  const RoleStatusMap: Record<
    MeetingOwnerType,
    Partial<Record<MeetingStatus, MeetingStatus>>
  > = {
    SUBMITTER: SubmitterStatusMap,
    SCHEDULING: SchedulingStatusMap,
    CONTENT: {},
    MINISTER: {},
  };

  export function meetingStatusByRole(
    status: MeetingStatus,
    role?: MeetingOwnerType
  ): MeetingStatus {
    if (!role) return status;
  
    const map = RoleStatusMap[role];
    return map?.[status] ?? status;
  }

  export function getMeetingStatusLabel(
    status: MeetingStatus | string,
    role?: MeetingOwnerType
  ): string {
    const normalizedStatus = meetingStatusByRole(status as MeetingStatus, role);
    return MeetingStatusLabels[normalizedStatus] ?? status;
  }

  export function getMeetingTabsByRole(role: MeetingOwnerType) {
    const map = RoleStatusMap[role];
    const mappedValues = Object.keys(map) as MeetingStatus[];
  
    const uniqueStatuses = [...new Set(mappedValues.map((status) => map[status]!))]
  
    return uniqueStatuses.map((status) => ({
      id: status,
      label: MeetingStatusLabels[status],
    }));
  }