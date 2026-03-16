import type { Delegatee, AiRecommendation } from "@gl/types/delegation";

const MOCK_DELEGATEES: Delegatee[] = [
  {
    id: "d1",
    name: "فيصل بن خالد بن عبد العزيز",
    avatar: "https://i.pravatar.cc/40?img=15",
  },
  {
    id: "d2",
    name: "حمد الشريدة",
    avatar: "https://i.pravatar.cc/40?img=16",
  },
  {
    id: "d3",
    name: "عبدالله الدوسري",
    avatar: "https://i.pravatar.cc/40?img=6",
  },
  {
    id: "d4",
    name: "محمد السبيعي",
    avatar: "https://i.pravatar.cc/40?img=7",
  },
  {
    id: "d5",
    name: "خالد الغامدي",
    avatar: "https://i.pravatar.cc/40?img=8",
  },
];

const MOCK_AI_RECOMMENDATIONS: Record<string, AiRecommendation> = {
  "1": {
    delegateeId: "d1",
    delegateeName: "فيصل بن خالد بن عبد العزيز",
  },
  "2": {
    delegateeId: "d1",
    delegateeName: "فيصل بن خالد بن عبد العزيز",
  },
  "3": { delegateeId: "d2", delegateeName: "حمد الشريدة" },
  "4": {
    delegateeId: "d1",
    delegateeName: "فيصل بن خالد بن عبد العزيز",
  },
  "5": {
    delegateeId: "d1",
    delegateeName: "فيصل بن خالد بن عبد العزيز",
  },
  "6": { delegateeId: "d2", delegateeName: "حمد الشريدة" },
};

export { MOCK_DELEGATEES, MOCK_AI_RECOMMENDATIONS };
