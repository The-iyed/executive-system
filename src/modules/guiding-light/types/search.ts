export interface MeetingSnippet {
  id: string;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning";
  time?: string;
  avatarUrl?: string;
  avatarName?: string;
  subtitle?: string;
}

export interface SearchOption {
  id: string;
  label: string;
  snippet: MeetingSnippet;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
}

export interface MeetingClassification {
  id: string;
  label: string;
  type: "strategic" | "operational" | "special";
}

export interface SearchResult {
  id: string;
  title: string;
  category: string;
}

