import type { CaseDetailsTabType } from '../../components/case-details-tabs';

export interface CaseDetail {
  id: string;
  title: string;
  description: string;
}

export type ViewMode = 'table' | 'grid';

export interface EditingState {
  id: string;
  tab: CaseDetailsTabType;
}
