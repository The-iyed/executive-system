import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { MinisterCalendarView } from '../../UC02/components/MinisterCalendarView';
import { PATH as UC04_PATH } from '../routes/paths';

const Evaluation: React.FC = () => {
  const { user } = useAuth();
  const isExecutiveOfficeManager =
    user?.roles?.some((r) => r.code === 'EXECUTIVE_OFFICE_MANAGER') ?? false;
  if (isExecutiveOfficeManager) {
    return <Navigate to={UC04_PATH.GUIDANCE_REQUESTS} replace />;
  }
  return <MinisterCalendarView />;
};

export default Evaluation;