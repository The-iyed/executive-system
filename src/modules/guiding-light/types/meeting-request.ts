export type MeetingRequestType =
  | "external"
  | "internal"
  | "private"
  | "new"
  | "councils";

export interface MeetingRequest {
  id: string;
  type: MeetingRequestType;
  title: string;
  description: string;
  goal: string;
}
