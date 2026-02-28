import { MeetingStatus, MeetingStatusLabels } from "@shared";

  const SUBMITTER_REVIEW_STATUSES: MeetingStatus[] = [
    MeetingStatus.UNDER_REVIEW,
    MeetingStatus.UNDER_CONTENT_REVIEW,
    MeetingStatus.ADDITIONAL_INFO,
  ];  

  export function normalizeMeetingStatus(
    status: MeetingStatus,
    role?: 'SUBMITTER'
  ): MeetingStatus {
      if (role === 'SUBMITTER' && SUBMITTER_REVIEW_STATUSES.includes(status)) {
        return MeetingStatus.UNDER_REVIEW;
      }
      return status;  
    }  

  export function getMeetingStatusLabel(
    status: MeetingStatus,
    role?: 'SUBMITTER'
  ): string {
    const normalized = normalizeMeetingStatus(status, role);
    return MeetingStatusLabels[normalized];
  }

  export function matchMeetingStatus(
    meetingStatus: MeetingStatus,
    filterStatus: MeetingStatus,
    role?: 'SUBMITTER'
  ): boolean {
    const normalizedMeetingStatus = normalizeMeetingStatus(meetingStatus, role);
    const normalizedFilterStatus = normalizeMeetingStatus(filterStatus, role);
  
    return normalizedMeetingStatus === normalizedFilterStatus;
  }