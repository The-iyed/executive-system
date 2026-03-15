import { MeetingOwnerType } from "../../types";

export interface RequestInfoData {
  request_number: string;        // رقم الطلب
  request_date: string;          // تاريخ الطلب  — ISO string, formatted on display
  request_status: string;        // حالة الطلب
  submitter_name: string;        // مقدم الطلب
  meeting_owner_name: string;    // مالك الاجتماع
}

export interface RequestInfoProps {
  role?: MeetingOwnerType
  data: RequestInfoData;
  title?: string;
  description?: string;
}

export interface FieldCellProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isStatus?: boolean;
}