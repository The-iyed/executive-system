
interface CaseDocument {
  name: string;
  size: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'analyzing' | 'completed';
  documents: CaseDocument[];
  progress?: number;
  conversation_id: string;
}

// Mock data - replace with API call later
export const mockCases: Case[] = [
    {
      id: '1',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'analyzing',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      progress: 45,
      conversation_id: 'conv-1',
    },
    {
      id: '2',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'analyzing',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      progress: 60,
      conversation_id: 'conv-2',
    },
    {
      id: '3',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-3',
    },
    {
      id: '4',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-4',
    },
    {
      id: '5',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-5',
    },
    {
      id: '6',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-6',
    },
    {
      id: '7',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-7',
    },
    {
      id: '8',
      title: 'عنوان القضية',
      description: 'إدراج موضوع القضية باختصار في هذا الحقل.',
      status: 'completed',
      documents: [
        { name: 'حكم المحكمة العليا', size: '5.3MB' },
        { name: 'الحكم الابتدائي', size: '3.2MB' },
        { name: 'حكم الاستئناف', size: '4.1MB' },
      ],
      conversation_id: 'conv-8',
    },
  ];