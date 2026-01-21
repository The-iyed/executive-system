import type { FormTableColumn } from '@shared';

export const INVITEES_TABLE_COLUMNS: FormTableColumn[] = [
  {
    id: 'itemNumber',
    header: 'رقم البند',
    width: 'w-[100px]',
  },
  {
    id: 'name',
    header: 'الإسم',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'position',
    header: 'المنصب',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'mobile',
    header: 'الجوال',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'email',
    header: 'البريد الإلكتروني',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'is_required',
    header: 'الحضور أساسي',
    type: 'switch',
    label: false,
    width: 'min-w-[210px]',
  },
  {
    id: 'justification',
    header: 'تبرير الاضافة',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'can_view',
    header: 'يمكن الاطلاع',
    type: 'switch',
    label: false,
    width: 'min-w-[210px]',
  },
  {
    id: 'action',
    header: 'إجراء',
    width: 'w-[60px]',
  },
];

export const INVITEES_TABLE_TITLE = 'قائمة المدعوين (الوزير)';
export const ADD_INVITEE_BUTTON_LABEL = 'إضافة مدعو جديد';
