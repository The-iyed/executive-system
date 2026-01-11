import type { ExtractionResult } from '../../hooks/use-cases';
import type { CaseDetailsTabType } from '../../components/case-details-tabs';
import type { AgentResponse } from '../../hooks/use-conversation-splits';

export interface CaseDetail {
    id: string;
    title: string;
    description: string;
}
export const getFieldValue = (
  result: ExtractionResult | null | undefined,
  fieldPath: string,
  fallback: string = 'غير متوفر'
): string => {
  if (!result || !fieldPath) {
    return fallback;
  }
  
  try {
    const parts = fieldPath.split('.');
    let value: any = result;
    
    // Navigate through the nested object path using bracket notation
    for (const part of parts) {
      // Check if we can continue navigating
      if (value === null || value === undefined) {
        return fallback;
      }
      
      // Access property using bracket notation (works for any property, even if not in TypeScript interface)
      if (typeof value === 'object') {
        value = (value as Record<string, any>)[part];
      } else {
        // Can't navigate further if not an object
        return fallback;
      }
    }
    
    // Handle null, undefined values
    if (value === null || value === undefined) {
      return fallback;
    }
    
    // Convert to string
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Return trimmed value, or fallback if empty
      return trimmed || fallback;
    }
    
    // Convert other primitive types to string
    if (typeof value !== 'object') {
      return String(value);
    }
    
    // If still an object, return fallback
    return fallback;
  } catch (error) {
    console.error(`[getFieldValue] Error extracting "${fieldPath}":`, error);
    return fallback;
  }
};

export const getCaseDetailsFromApi = (
  splits: ExtractionResult[] | null | undefined,
  tab: CaseDetailsTabType,
  splitMetadata?: Map<string, { id?: string; result?: string; agent_response?: AgentResponse }>
): CaseDetail[] => {
  if (!splits || splits.length === 0) {
    return getEmptyCaseDetails(tab);
  }

  // Find the appropriate result based on document_category and tab
  const getResultForTab = (): ExtractionResult | null => {
    switch (tab) {
      case 'primary':
        return splits.find(r => r.document_category === 'حكم إبتدائي') || splits[0] || null;
      case 'appeal':
        return splits.find(r => r.document_category === 'حكم إستئناف') || splits[0] || null;
      case 'supreme':
        return splits.find(r => r.document_category === 'حكم المحكمة العليا') || splits[0] || null;
      case 'analysis':
        return splits[0] || null;
      default:
        return splits[0] || null;
    }
  };

  const result = getResultForTab();
  
  // Get the case details template for this tab
  const template = getCaseDetailsTemplate(tab);
  
  // Map template to actual data from API
  return template.map((detail) => ({
    ...detail,
    description: getDescriptionForField(detail.id, result, tab, splitMetadata),
  }));
};

const getDescriptionForField = (
  fieldId: string,
  result: ExtractionResult | null,
  tab: CaseDetailsTabType,
  splitMetadata?: Map<string, { id?: string; result?: string; agent_response?: AgentResponse }>
): string => {
  if (!result) return 'غير متوفر';

  // Helper function to get metadata
  const getMetadata = (): { id?: string; result?: string; agent_response?: AgentResponse } | undefined => {
    if (!splitMetadata) return undefined;
    
    // Strategy 1: Try by split_id
    if (result.split_id) {
      const metadata = splitMetadata.get(result.split_id);
      if (metadata) return metadata;
    }
    
    // Strategy 2: Find any metadata with agent_response
    const metadataWithResponse = Array.from(splitMetadata.values()).find(m => m.agent_response);
    if (metadataWithResponse) return metadataWithResponse;
    
    // Strategy 3: Use the first available metadata
    if (splitMetadata.size > 0) {
      return Array.from(splitMetadata.values())[0];
    }
    
    return undefined;
  };

  // Special handling for analysis tab fields that use agent_response
  if (tab === 'analysis' && splitMetadata) {
    const metadata = getMetadata();
    const agentResponse = metadata?.agent_response;
    
    if (agentResponse) {
      // Field 1: نتيجة الحكم
      if (fieldId === '1' && agentResponse.result) {
        return agentResponse.result;
      }
      
      // Field 2: تصنيف القضية
      if (fieldId === '2' && agentResponse.case_classification) {
        return agentResponse.case_classification;
      }
      
      // Field 3: موضوع القضية
      if (fieldId === '3' && agentResponse.case_subject) {
        return agentResponse.case_subject;
      }
      
      // Field 4: قيمة القضية
      if (fieldId === '4' && agentResponse.case_value) {
        return agentResponse.case_value;
      }
      
      // Field 5: الأثر المالي الفعلي
      if (fieldId === '5' && agentResponse.actual_financial_impact) {
        return agentResponse.actual_financial_impact;
      }
      
      // Field 6: سبب الكسب أو الخسارة من حيث مضمون الحكم
      if (fieldId === '6' && agentResponse.win_loss_reason_content_type?.classification) {
        return agentResponse.win_loss_reason_content_type.classification;
      }
      
      // Field 7: التصنيف الرئيسي لسبب الكسب أو الخسارة
      if (fieldId === '7' && agentResponse.win_loss_reason_content_type?.sub_classification) {
        return agentResponse.win_loss_reason_content_type.sub_classification;
      }
      
      // Field 8: السبب الفرعي للكسب أو الخسارة
      if (fieldId === '8' && agentResponse.sub_reason_win_loss) {
        return agentResponse.sub_reason_win_loss;
      }
      
      // Field 9: السبب الجذري للكسب أو الخسارة
      if (fieldId === '9' && agentResponse.root_cause_win_loss) {
        return agentResponse.root_cause_win_loss;
      }
      
      // Field 10: الوصف الفعلي للسبب الجذري للربح أو الخسارة
      if (fieldId === '10' && agentResponse.actual_description_root_cause) {
        return agentResponse.actual_description_root_cause;
      }
      
      // Field 11: وصف خطوات العمل برحلة الترافع
      if (fieldId === '11' && agentResponse.workflow_steps_description) {
        return agentResponse.workflow_steps_description;
      }
      
      // Field 12: وصف الحل الجذري المقترح
      if (fieldId === '12' && agentResponse.proposed_solution_description) {
        return agentResponse.proposed_solution_description;
      }
      
      // Field 13: تصنيف فرعي للحل الجذري
      if (fieldId === '13' && agentResponse.proposed_solution_sub_classification) {
        return agentResponse.proposed_solution_sub_classification;
      }
      
      // Field 14: تصنيف رئيسي للحل الجذري
      if (fieldId === '14' && agentResponse.proposed_solution_main_classification) {
        return agentResponse.proposed_solution_main_classification;
      }
    }
  }

  const fieldMap: Record<string, Record<CaseDetailsTabType, string>> = {
    '1': {
      primary: 'hukm_1_fields.entity_name', // إسم الجهة
      appeal: 'part_0.court_name',
      supreme: 'part_0.court_name',
      analysis: '', // نتيجة الحكم (fallback)
    },
    '2': {
      primary: 'hukm_1_fields.municipality', // الأمانة
      appeal: 'hukm_2_fields.appeal_court_region', // المنطقة
      supreme: 'hukm_3_fields.case_number_3', // رقم القضية 3
      analysis: '', // تصنيف القضية
    },
    '3': {
      primary: 'hukm_1_fields.region', // المنطقة
      appeal: 'hukm_2_fields.appeal_court_municipality', // الأمانة
      supreme: 'hukm_3_fields.year_3', // السنة 3
      analysis: '', // موضوع القضية
    },
    '4': {
      primary: 'part_0.court_name', // المحكمة الابتدائية
      appeal: 'hukm_2_fields.case_number_2', // رقم القضية 2
      supreme: 'hukm_3_fields.case_registration_date_3', // تاريخ قيد القضية 3 (fixed id from 'تاريخ قيد القضية 3' to '4')
      analysis: '', // قيمة القضية
    },
    '5': {
      primary: 'hukm_1_fields.primary_court_region', // المنطقة
      appeal: 'hukm_2_fields.year_2', // السنة 2
      supreme: 'hukm_3_fields.status_3', // الصفة 3
      analysis: '', // الأثر المالي الفعلي
    },
    '6': {
      primary: 'hukm_1_fields.primary_court_municipality', // الأمانة
      appeal: 'hukm_2_fields.case_registration_date_2', // تاريخ قيد القضية 2
      supreme: 'hukm_3_fields.ruling_date_3', // تاريخ الحكم 3
      analysis: '', // سبب الكسب أو الخسارة
    },
    '7': {
      primary: 'hukm_1_fields.case_number_1', // رقم القضية 1
      appeal: 'hukm_2_fields.status_2', // الصفة 2
      supreme: '', // Empty for supreme
      analysis: '', // التصنيف الرئيسي
    },
    '8': {
      primary: 'hukm_1_fields.year_1', // السنة 1
      appeal: 'hukm_2_fields.ruling_date_2', // تاريخ الحكم 2
      supreme: '', // Empty for supreme
      analysis: '', // السبب الفرعي
    },
    '9': {
      primary: 'hukm_1_fields.case_registration_date_1', // تاريخ قيد القضية 1
      appeal: 'hukm_2_fields.ruling_value_2', // قيمة الحكم 2
      supreme: '', // Empty for supreme
      analysis: '', // السبب الجذري
    },
    '10': {
      primary: 'hukm_1_fields.status_1', // الصفة 1
      appeal: '', // Empty for appeal
      supreme: '', // Empty for supreme
      analysis: '', // الوصف الفعلي
    },
    '11': {
      primary: 'hukm_1_fields.ruling_date_1', // تاريخ الحكم 1
      appeal: '', // Empty for appeal
      supreme: '', // Empty for supreme
      analysis: '', // وصف خطوات العمل
    },
    '12': {
      primary: 'hukm_1_fields.ruling_value_1', // قيمة الحكم 1
      appeal: '', // Empty for appeal
      supreme: '', // Empty for supreme
      analysis: '', // وصف الحل الجذري
    },
    '13': {
      primary: '', // Empty for primary
      appeal: '', // Empty for appeal
      supreme: '', // Empty for supreme
      analysis: '', // تصنيف فرعي
    },
    '14': {
      primary: '', // Empty for primary
      appeal: '', // Empty for appeal
      supreme: '', // Empty for supreme
      analysis: '', // تصنيف رئيسي
    },
  };

  const fieldPath = fieldMap[fieldId]?.[tab];
  
  if (!fieldPath) {
    return 'غير متوفر';
  }
  
  // Debug: Check what's actually in the result
  console.log(`[getDescriptionForField] Extracting:`, {
    fieldId,
    tab,
    fieldPath,
    resultType: typeof result,
    hasExtractedParts: result && 'extracted_parts' in result,
    hasHukm1Fields: result && 'hukm_1_fields' in result,
    hasPart0: result && 'part_0' in result,
    extractedPartsKeys: result?.extracted_parts ? Object.keys(result.extracted_parts) : [],
    hukm1FieldsKeys: result?.hukm_1_fields ? Object.keys(result.hukm_1_fields) : [],
  });
  
  const extractedValue = getFieldValue(result, fieldPath);
  
  console.log(`[getDescriptionForField] Extracted value for "${fieldPath}":`, extractedValue);
  
  return extractedValue;
};

const getEmptyCaseDetails = (tab: CaseDetailsTabType): CaseDetail[] => {
  const templates = {
    primary: CaseDetailsPrimary,
    appeal: CaseDetailsAppeal,
    supreme: CaseDetailsSupreme,
    analysis: CaseDetailsAnalysis,
  };
  return templates[tab] || [];
};


const getCaseDetailsTemplate = (tab: CaseDetailsTabType): CaseDetail[] => {
  return getEmptyCaseDetails(tab);
};

export const CaseDetailsPrimary: CaseDetail[] = [
  {
    id: '1',
    title:"إسم الجهة",
    description:"", // Will be populated from API: hukm_1_fields.entity_name
  },
  {
    id: '2',
    title:"الأمانة",
    description:"", // Will be populated from API: hukm_1_fields.municipality
  },
  {
    id: '3',
    title:"المنطقة",
    description:"", // Will be populated from API: hukm_1_fields.region
  },
  {
    id: '4',
    title:"المحكمة الابتدائية",
    description:"", // Will be populated from API: hukm_1_fields.primary_court
  },
  {
    id: '5',
    title:"المنطقة",
    description:"", // Will be populated from API: hukm_1_fields.primary_court_region
  },
  {
    id: '6',
    title:"الأمانة",
    description:"", // Will be populated from API: hukm_1_fields.primary_court_municipality
  },
  {
    id: '7',
    title:"رقم القضية 1",
    description:"", // Will be populated from API: hukm_1_fields.case_number_1
  },
  {
    id: '8',
    title:"السنة 1",
    description:"", // Will be populated from API: hukm_1_fields.year_1
  },
  {
    id: '9',
    title:"تاريخ قيد القضية 1",
    description:"", // Will be populated from API: hukm_1_fields.case_registration_date_1
  },
  {
    id: '10',
    title:"الصفة 1",
    description:"", // Will be populated from API: hukm_1_fields.status_1
  },
  {
    id: '11',
    title:"تاريخ الحكم 1",
    description:"", // Will be populated from API: hukm_1_fields.ruling_date_1
  },
  {
    id: '12',
    title:"قيمة الحكم 1",
    description:"", // Will be populated from API: hukm_1_fields.ruling_value_1
  },
];

export const CaseDetailsAppeal: CaseDetail[] = [
  {
    id: '1',
    title:"محكمة الاستئناف",
    description:"", // Will be populated from API: part_0.court_name
  },
  {
    id: '2',
    title:"المنطقة",
    description:"", // Will be populated from API: hukm_2_fields.appeal_court_region
  },
  {
    id: '3',
    title:"الأمانة",
    description:"", // Will be populated from API: hukm_2_fields.appeal_court_municipality
  },
  {
    id: '4',
    title:"رقم القضية 2",
    description:"", // Will be populated from API: hukm_2_fields.case_number_2
  },
  {
    id: '5',
    title:"السنة 2",
    description:"", // Will be populated from API: hukm_2_fields.year_2
  },
  {
    id: '6',
    title:"تاريخ قيد القضية 2",
    description:"", // Will be populated from API: hukm_2_fields.case_registration_date_2
  },  
  {
    id: '7',
    title:"الصفة 2",
    description:"", // Will be populated from API: hukm_2_fields.status_2
  },
  {
    id: '8',
    title:"تاريخ الحكم 2",
    description:"", // Will be populated from API: hukm_2_fields.ruling_date_2
  },
  {
    id: '9',
    title:"قيمة الحكم 2",
    description:"", // Will be populated from API: hukm_2_fields.ruling_value_2
  },
];

export const CaseDetailsSupreme: CaseDetail[] = [
  {
    id: '1',
    title:"المحكمة العليا",
    description:"", // Will be populated from API: part_0.court_name
  },
  {
    id: '2',
    title:"رقم القضية 3",
    description:"", // Will be populated from API: hukm_3_fields.case_number_3
  },
  {
    id: '3',
    title:"السنة 3",
    description:"", // Will be populated from API: hukm_3_fields.year_3
  },
  {
    id: '4',
    title:"تاريخ قيد القضية 3",
    description:"", // Will be populated from API: hukm_3_fields.case_registration_date_3
  },
  {
    id: '5',
    title:"الصفة 3",
    description:"", // Will be populated from API: hukm_3_fields.status_3
  },
  {
    id: '6',
    title:"تاريخ الحكم 3",
    description:"", // Will be populated from API: hukm_3_fields.ruling_date_3
  },
];

export const CaseDetailsAnalysis: CaseDetail[] = [
  {
    id: '1',
    title:"نتيجة الحكم",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '2',
    title:"تصنيف القضية",
    description:"", // Will be populated from API: document_category
  },
  {
    id: '3',
    title:"موضوع القضية",
    description:"", // Will be populated from API: extracted_parts.part_1_case_info
  },
  {
    id: '4',
    title:"قيمة القضية",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '5',
    title:"الأثر المالي الفعلي",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '6',
    title:"سبب الكسب أو الخسارة من حيث مضمون الحكم",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '7',
    title:"التصنيف الرئيسي لسبب الكسب أو الخسارة",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '8',
    title:"السبب الفرعي للكسب أو الخسارة",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '9',
    title:"السبب الجذري للكسب أو الخسارة",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '10',
    title:"الوصف الفعلي للسبب الجذري للربح أو الخسارة",
    description:"", // Will be populated from API: extracted_parts.part_6_verdict
  },
  {
    id: '11',
    title:"وصف خطوات العمل برحلة الترافع",
    description:"", // Will be populated from API: extracted_parts.part_4_facts
  },
  {
    id: '12',
    title:"وصف الحل الجذري المقترح",
    description:"", // Will be populated from API: extracted_parts.part_5_reasons
  },
  {
    id: '13',
    title:"تصنيف فرعي للحل الجذري",
    description:"", // Will be populated from API: extracted_parts.part_5_reasons
  },
  {
    id: '14',
    title:"تصنيف رئيسي للحل الجذري",
    description:"", // Will be populated from API: extracted_parts.part_5_reasons
  },
]