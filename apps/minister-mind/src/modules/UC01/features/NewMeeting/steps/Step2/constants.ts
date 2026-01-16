import type { FormTableColumn } from '../Step1/components';

export const INVITEES_TABLE_COLUMNS: FormTableColumn[] = [
  {
    id: 'itemNumber',
    header: 'رقم البند',
    width: 'w-[70px]',
  },
  {
    id: 'name',
    header: 'الإسم',
    type: 'text',
    placeholder: '-------',
  },
  {
    id: 'position',
    header: 'المنصب',
    type: 'text',
    placeholder: '-------',
  },
  {
    id: 'mobile',
    header: 'الجوال',
    type: 'text',
    placeholder: '-------',
  },
  {
    id: 'email',
    header: 'البريد الإلكتروني',
    type: 'text',
    placeholder: '-------',
  },
  {
    id: 'isMainAttendee',
    header: 'الحضور أساسي',
    type: 'switch',
    label: false,
    width: 'w-[110px]',
  },
  {
    id: 'action',
    header: 'إجراء',
    width: 'w-[60px]',
  },
];

export const INVITEES_TABLE_TITLE = 'قائمة المدعوين';
export const ADD_INVITEE_BUTTON_LABEL = 'إضافة مدعو جديد';
