import { useMemo } from "react";
import { MeetingClassification, MeetingConfidentiality, BOOL } from "../types/enums";

export interface Step1Context {
  meeting_classification: string;
  meeting_confidentiality: string;
  is_urgent: string;
}
export interface Step2Visibility {
  showPresentation: boolean;
  presentationRequired: boolean;
}

export function useStep2Visibility(step1Data: Step1Context): Step2Visibility {
  return useMemo(() => {
    const hidePresentation =
      step1Data.meeting_classification === MeetingClassification.DISCUSSION_WITHOUT_PRESENTATION;

    const exemptCategories: string[] = [
      MeetingClassification.BILATERAL_MEETING,
      MeetingClassification.PRIVATE_MEETING,
      MeetingClassification.WORKSHOP,
    ];

    const isExemptCategory = exemptCategories.includes(step1Data.meeting_classification);
    const isUrgent = step1Data.is_urgent === BOOL.TRUE;

    const presentationRequired =
      !hidePresentation &&
      !isExemptCategory &&
      !isUrgent;
    return { showPresentation: !hidePresentation, presentationRequired };
  }, [step1Data.meeting_classification, step1Data.meeting_confidentiality, step1Data.is_urgent]);
}
