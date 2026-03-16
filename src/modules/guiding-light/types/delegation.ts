export interface Delegatee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface AiRecommendation {
  delegateeId: string;
  delegateeName: string;
}
