import type { FormTableColumn } from './FormTable';

const WIDTH_INDEX = 'min-w-[100px]';
const WIDTH_DATA = 'min-w-[210px]';
const WIDTH_ACTION = 'w-[60px]';

export interface InviteesTableColumnsOptions {
  nameFieldId: string;
  positionFieldId: string;
  sectorFieldId: string;
  mobileFieldId: string;
  emailFieldId: string;
  attendanceFieldId: string;
  attendanceOptions: { value: string; label: string }[];
  includeViewPermission?: boolean;
  viewPermissionFieldId?: string;
}

/**
 * Shared invitees table column definition used by UC01 Step3 and UC02 Step3.
 * Same headers, order, and widths for aligned tables in both flows.
 */
export function getInviteesTableColumns(options: InviteesTableColumnsOptions): FormTableColumn[] {
  const {
    nameFieldId,
    positionFieldId,
    sectorFieldId,
    mobileFieldId,
    emailFieldId,
    attendanceFieldId,
    attendanceOptions,
    includeViewPermission = false,
    viewPermissionFieldId = 'view_permission',
  } = options;

  const columns: FormTableColumn[] = [
    { id: 'itemNumber', header: '#', width: WIDTH_INDEX },
    { id: nameFieldId, header: 'الإسم', type: 'text', placeholder: 'الإسم', width: WIDTH_DATA },
    { id: positionFieldId, header: 'المنصب', type: 'text', placeholder: 'المنصب', width: WIDTH_DATA },
    { id: sectorFieldId, header: 'الجهة', type: 'text', placeholder: 'الجهة', width: WIDTH_DATA },
    { id: mobileFieldId, header: 'الجوال', type: 'text', placeholder: 'الجوال', width: WIDTH_DATA },
    { id: emailFieldId, header: 'البريد الإلكتروني', type: 'text', placeholder: 'البريد الإلكتروني', width: WIDTH_DATA },
    {
      id: attendanceFieldId,
      header: 'آلية الحضور',
      type: 'select',
      selectOptions: attendanceOptions,
      placeholder: 'حضوري / عن بُعد',
      width: WIDTH_DATA,
    },
  ];

  if (includeViewPermission) {
    columns.push({
      id: viewPermissionFieldId,
      header: 'صلاحية الاطلاع',
      type: 'switch',
      label: false,
      width: WIDTH_DATA,
    });
  }

  columns.push({ id: 'action', header: '', width: WIDTH_ACTION });
  return columns;
}
