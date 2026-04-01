import { ColumnConfig } from "@/lib/dynamic-table-form";
import { Channel, MEETING_CHANNEL_OPTIONS } from "../../types";

  export const INVITEE_COLUMNS: ColumnConfig[] = [
    {
      key: "email",
      label: "البريد الإلكتروني",
      type: "email",
      placeholder: "example@mail.com",
      required: true,
      minWidth: "min-w-[200px]",
      autoFillFromSearch: true,
      searchable: true,
    },
    {
      key: "name",
      label: "الاسم",
      type: "text",
      placeholder: "الاسم",
      minWidth: "min-w-[180px]",
      autoFillFromSearch: true,
    },
    {
      key: "position",
      label: "المنصب",
      type: "text",
      placeholder: "المنصب",
      minWidth: "min-w-[200px]",
      maxWidth: "max-w-[200px]",
    },
    {
      key: "mobile",
      label: "الجوال",
      type: "phone",
      placeholder: "05xxxxxxxx",
      minWidth: "min-w-[120px]",
      autoFillFromSearch: true,
    },
    {
      key: "sector",
      label: "الجهة",
      type: "text",
      placeholder: "الجهة",
      minWidth: "min-w-[180px]",
    },
    {
      key: "attendance_mechanism",
      label: "آلية الحضور",
      type: "select",
      placeholder: "آلية الحضور",
      required: true,
      minWidth: "min-w-[120px]",
      options: MEETING_CHANNEL_OPTIONS.filter(
        (option) => option.value !== Channel.HYBRID
      ),
    },
    {
      key: "access_permission",
      label: "صلاحية الاطلاع",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "is_consultant",
      label: "مستشار",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "meeting_owner",
      label: "مالك الاجتماع",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "is_presence_required",
      label: "الحضور إجباري",
      type: "checkbox",
      defaultValue: false,
    },
  ];