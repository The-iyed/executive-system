import { useMemo } from 'react';
import { getCaseDetailsFromApi } from '../CaseDetailsConstants';
import { formatFileSize } from '../utils';
import type { ExtractionResult } from '../../../hooks/use-cases';
import type { AgentResponse } from '../../../hooks/use-conversation-splits';
import type { CaseDetailsTabType } from '../../../components/case-details-tabs';

interface CaseFile {
  id: string;
  name: string;
  size: string;
}

interface SplitMetadata {
  id?: string;
  result?: string;
  agent_response?: AgentResponse;
}

export const useCaseData = (
  splits: ExtractionResult[] | undefined,
  selectedTab: CaseDetailsTabType
) => {
  const caseFiles = useMemo<CaseFile[]>(() => {
    if (!splits || !Array.isArray(splits) || splits.length === 0) return [];
    
    return splits.map((split) => {
      const rawTextLength = split.raw_text_length ?? null;
      return {
        id: split.split_id || '',
        name: split.pdf_filename || 'مستند غير معروف',
        size: formatFileSize(rawTextLength),
      };
    });
  }, [splits]);

  const caseDetails = useMemo(() => {
    if (!splits || !Array.isArray(splits)) {
      return [];
    }
    const metadata = (splits as any)._splitMetadata as Map<string, SplitMetadata> | undefined;
    // Cast to ExtractionResult[] to satisfy getCaseDetailsFromApi signature
    const extractionResults: ExtractionResult[] = splits;
    return getCaseDetailsFromApi(extractionResults, selectedTab, metadata);
  }, [splits, selectedTab]);

  return { caseFiles, caseDetails };
};
