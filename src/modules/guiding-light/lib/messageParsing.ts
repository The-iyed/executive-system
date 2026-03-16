import type { ChatMessage, ApiMessage, DocumentWithId } from "@gl/api/types";

// Helper: check if a string is a URL (matches super-agent-v1)
export function isUrl(str: string | unknown): boolean {
  if (typeof str !== "string") return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("www.") && trimmed.includes(".")) return true;
  if (/^[a-z]+:\/\//i.test(trimmed)) return true;
  if (trimmed.includes("%") && /%[0-9A-Fa-f]{2}/.test(trimmed)) {
    if (
      trimmed.startsWith("/") ||
      trimmed.includes(".com/") ||
      trimmed.includes(".net/") ||
      trimmed.includes(".org/") ||
      trimmed.includes(".gov/") ||
      trimmed.includes(".edu/") ||
      trimmed.includes(".mr/") ||
      trimmed.includes(".business/") ||
      /[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)
    )
      return true;
    if (trimmed.startsWith("/") && (trimmed.match(/%[0-9A-Fa-f]{2}/g) || []).length >= 2)
      return true;
  }
  const domainPattern =
    /\.(com|net|org|gov|edu|io|co|me|info|biz|us|uk|ca|au|de|fr|es|it|jp|cn|ru|br|in|mx|za|ae|sa|eg|ma|tn|dz|ly|sd|so|dj|km|mr|et|er|ye|om|qa|bh|kw|jo|lb|sy|iq|ir|tr|az|ge|am|il|ps|cy|mt|gr|al|mk|rs|ba|hr|si|sk|cz|pl|hu|ro|bg|md|ua|by|lt|lv|ee|fi|se|no|dk|is|ie|pt|lu|be|nl|ch|at|li|mc|ad|sm|va)\//i;
  if (domainPattern.test(trimmed)) return true;
  if (trimmed.startsWith("/")) {
    if (trimmed.includes("%") || trimmed.includes("?") || trimmed.includes("&") || trimmed.includes("#"))
      return true;
    if ((trimmed.match(/\//g) || []).length >= 2 && trimmed.length > 10) return true;
  }
  if (
    (trimmed.includes("?") || trimmed.includes("#") || trimmed.includes("&")) &&
    (trimmed.startsWith("/") || trimmed.match(/^[a-z0-9.-]+\.[a-z]{2,}/i))
  )
    return true;
  if (/[a-z0-9.-]+\.[a-z]{2,}\//i.test(trimmed)) return true;
  if (/[a-z0-9.-]+\.(com|net|org|gov|edu|io|co|me|info|biz|mr|business)\//i.test(trimmed))
    return true;
  if (trimmed.startsWith("/") && trimmed.length > 50) return true;
  return false;
}

export function splitConcatenatedUrls(input: string | string[] | unknown): string[] {
  if (Array.isArray(input)) {
    const result: string[] = [];
    for (const item of input) {
      if (typeof item === "string") result.push(...splitConcatenatedUrls(item));
    }
    return result;
  }
  if (typeof input !== "string") return [];
  const urls: string[] = [];
  const protocolPattern = /https?:\/\//gi;
  let match: RegExpExecArray | null;
  const protocolMatches: number[] = [];
  protocolPattern.lastIndex = 0;
  while ((match = protocolPattern.exec(input)) !== null) protocolMatches.push(match.index);
  if (protocolMatches.length > 0) {
    for (let i = 0; i < protocolMatches.length; i++) {
      const start = protocolMatches[i];
      const end = i < protocolMatches.length - 1 ? protocolMatches[i + 1] : input.length;
      const urlText = input.substring(start, end).replace(/[\s<>"{}|\\^`[\]]+$/, "");
      if (urlText.length > 0 && isUrl(urlText)) urls.push(urlText);
    }
  } else if (input.trim().length > 0) {
    urls.push(input);
  }
  return urls;
}

/** Safe message id so merge never drops a message; backend may send message_id or _id. */
function safeMessageId(apiMessage: ApiMessage, index?: number): string {
  const raw =
    apiMessage.message_id ??
    (apiMessage as unknown as Record<string, unknown>)._id ??
    (typeof index === "number" ? `api-${index}` : `api-${apiMessage.conversation_id ?? ""}-${apiMessage.created_at ?? Date.now()}`);
  const id = String(raw ?? "").trim();
  if (id) return id;
  return typeof index === "number" ? `api-${index}` : `api-${apiMessage.conversation_id ?? "c"}-${Date.now()}`;
}

/** Safe timestamp so we never pass invalid Date. */
function safeTimestamp(createdAt: string | undefined | null): Date {
  if (createdAt == null || createdAt === "") return new Date();
  try {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

export function convertApiMessageToChatMessage(
  apiMessage: ApiMessage,
  index?: number
): ChatMessage {
  const isSent = apiMessage.role === "user";
  const id = safeMessageId(apiMessage, index);
  const timestamp = safeTimestamp(apiMessage.created_at as string | undefined);
  if (isSent) {
    return {
      id,
      text: apiMessage.content ?? "",
      isSent: true,
      timestamp,
    };
  }
  const toolUsed = apiMessage.tool_used ?? "";
  const content = apiMessage.content ?? "";
  const { cleanContent, documentNames, documents, relatedQuestions } =
    parseStreamingContent(content, toolUsed);
  const finalSourcesDocuments =
    (apiMessage.sources_documents?.length ?? 0) > 0
      ? apiMessage.sources_documents
      : documentNames;
  const meta = (apiMessage.response_metadata as Record<string, unknown>) ?? {};
  const altMeta = (apiMessage as unknown as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
  const persistedThinking =
    (typeof meta.thinking === "string" ? meta.thinking : undefined) ??
    (altMeta && typeof altMeta.thinking === "string" ? altMeta.thinking : undefined);

  return {
    id,
    text: cleanContent,
    isSent: false,
    timestamp,
    thinkingText: persistedThinking || undefined,
    isThinkingCompleted: persistedThinking ? true : undefined,
    response: {
      response: cleanContent,
      related: null,
      tool_used: toolUsed,
      sources_documents: finalSourcesDocuments,
      documents: documents.length > 0 ? documents : undefined,
      related_questions:
        (apiMessage.related_questions?.length ?? 0) > 0
          ? apiMessage.related_questions
          : relatedQuestions,
      conversation_id: apiMessage.conversation_id ?? "",
      thread_id: apiMessage.thread_id ?? "",
      agent_run_id: apiMessage.agent_run_id ?? "",
      processing_time_seconds: apiMessage.processing_time_seconds ?? 0,
      is_new_thread: false,
      debug_info:
        apiMessage.response_metadata &&
        typeof apiMessage.response_metadata === "object" &&
        Object.keys(apiMessage.response_metadata).length > 0
          ? apiMessage.response_metadata
          : null,
      has_chart_data: apiMessage.has_chart_data ?? false,
    },
  };
}

function stripCodeBlockMarkers(text: string): string {
  if (!text) return text;
  const startsWithCodeBlock = /^```(?:markdown|lang-markdown|language-markdown|md)?\s*\n?/i.test(text);
  const endsWithCodeBlock = /\n?```\s*$/i.test(text);
  if (startsWithCodeBlock) {
    let stripped = text.replace(/^```(?:markdown|lang-markdown|language-markdown|md)?\s*\n?/i, "");
    if (endsWithCodeBlock) stripped = stripped.replace(/\n?```\s*$/i, "");
    const looksLikeMarkdown =
      /^\s*(#{1,6}\s|[*\-+]\s|\d+\.\s|>\s|\*\*|__|\[|```)/m.test(stripped) ||
      /(^|\n)(#{1,6}\s|[*\-+]\s|\d+\.\s|>\s|\*\*|__|\[.*\]\(.*\))/m.test(stripped);
    if (looksLikeMarkdown) return stripped;
    const looksLikeCode = /(function|class|import|export|const|let|var|def|return|if|else|for|while|\(\)|=>|#include|#define)/.test(stripped);
    if (!looksLikeCode) return stripped;
    return text;
  }
  const codeBlockRegex = /^```(?:markdown|lang-markdown|language-markdown|md)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = text.match(codeBlockRegex);
  if (match?.[1]) return match[1];
  const simpleCodeBlockRegex = /^```\s*\n?([\s\S]*?)\n?```$/i;
  const simpleMatch = text.match(simpleCodeBlockRegex);
  if (simpleMatch?.[1]) {
    const content = simpleMatch[1];
    const hasMarkdownFeatures = /(^|\n)(#{1,6}\s|[*\-+]\s|\d+\.\s|>\s|\*\*|__|\[.*\]\(.*\)|`[^`]+`)/m.test(content);
    if (hasMarkdownFeatures) return content;
    const looksLikeCode = /(function|class|import|export|const|let|var|def|return|if|else|for|while|\(\)|=>|#include|#define)/.test(content);
    if (!looksLikeCode && content.length > 10) return content;
  }
  return text;
}

/** Only treat a line as a related question if it looks like one (avoid paragraphs under "أسئلة ذات صلة:") */
function isQuestionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t === "N/A") return false;
  const sectionHeaders = /^(أسئلة ذات صلة|استفسارات متعلقة|المصادر)\s*:?\s*$/;
  if (sectionHeaders.test(t)) return false;
  if (/؟|\?$/.test(t)) return t.length <= 400;
  const questionStarts = /^(ما|كيف|هل|أين|متى|لماذا|من|ماذا)\s/;
  return questionStarts.test(t) && t.length <= 400;
}

function parseRelatedQuestions(questionsText: string): string[] {
  if (!questionsText?.trim()) return [];
  const normalized = questionsText.replace(/\\n/g, "\n");
  return normalized
    .split("\n")
    .map((q) => q?.trim())
    .filter((q) => q.length > 0 && q !== "N/A" && isQuestionLine(q));
}

function extractUrlsFromLine(line: string): string[] {
  const foundUrls: string[] = [];
  const protocolPattern = /https?:\/\//gi;
  const protocolMatches: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = protocolPattern.exec(line)) !== null) protocolMatches.push(match.index);
  if (protocolMatches.length > 0) {
    for (let i = 0; i < protocolMatches.length; i++) {
      const startIndex = protocolMatches[i];
      const nextStartIndex = i < protocolMatches.length - 1 ? protocolMatches[i + 1] : line.length;
      const urlText = line.substring(startIndex, nextStartIndex).replace(/[\s<>"{}|\\^`[\]]+$/, "");
      if (urlText.length > 0 && isUrl(urlText)) foundUrls.push(urlText);
    }
    let remainingLine = line;
    foundUrls.forEach((url) => {
      remainingLine = remainingLine.replace(url, " ")?.trim();
    });
    if (remainingLine.length > 0) {
      const parts = remainingLine.split(/\s+/).filter((p) => p.length > 0);
      for (const part of parts) {
        if (/^(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(part)) {
          const url =
            part.startsWith("http://") || part.startsWith("https://") ? part : `https://${part}`;
          foundUrls.push(url);
        }
      }
    }
  } else {
    const parts = line.split(/\s+/).filter((p) => p.length > 0);
    for (const part of parts) {
      if (isUrl(part)) {
        foundUrls.push(part);
      } else if (/^(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(part)) {
        const url =
          part.startsWith("http://") || part.startsWith("https://") ? part : `https://${part}`;
        foundUrls.push(url);
      }
    }
  }
  return foundUrls;
}

/**
 * Merge filename fragments split across newlines (e.g. "...عام 1440" + "1440.pdf" -> one line).
 * A line that is only digits + extension (e.g. "1440.pdf") is treated as continuation of previous line.
 */
function mergeSplitDocumentLines(lines: string[]): string[] {
  const result: string[] = [];
  const fragmentRegex = /^(\d+)\.(pdf|doc|docx|txt|xls|xlsx)$/i;
  const isStandaloneId = (s: string) => /^\d+$/.test(s) || (/^[A-Za-z0-9_-]+$/.test(s) && !s.includes("."));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(fragmentRegex);
    if (match && result.length > 0) {
      const digits = match[1];
      const ext = match[2];
      const prev = result[result.length - 1];
      if (prev.endsWith(digits)) {
        result[result.length - 1] = prev + "." + ext;
        continue;
      }
      // Previous line is e.g. "...عام " (space) or text without .pdf – treat fragment as continuation
      if (!isStandaloneId(prev) && !/\.(pdf|doc|docx|txt|xls|xlsx)$/i.test(prev)) {
        result[result.length - 1] = prev.endsWith(" ") ? prev + line : prev + " " + line;
        continue;
      }
    }
    result.push(line);
  }
  return result;
}

/**
 * Parse documents from text (same logic as super-agent-v1):
 * 1. filename.pdf200536550 (filename with ID appended)
 * 2. filename.pdf\n200536550 (filename on one line, ID on next)
 * 3. 200536550\nfilename.pdf (ID on one line, filename on next)
 * Also merges filename fragments split across lines (e.g. "...عام 1440" + "1440.pdf").
 * Skips URLs. Only pushes document names to names[] (IDs are paired, not listed as separate items).
 */
function parseDocuments(
  documentsText: string,
  toolUsed?: string
): { names: string[]; documents: DocumentWithId[] } {
  if (!documentsText?.trim()) return { names: [], documents: [] };
  // Normalize literal \n (backslash-n) to real newline so "name\n12345" becomes two lines
  const normalized = documentsText.replace(/\\n/g, "\n");
  let lines = normalized
    .split("\n")
    .map((line) => line?.trim())
    .filter((line) => line.length > 0);
  lines = mergeSplitDocumentLines(lines);
  const names: string[] = [];
  const documents: DocumentWithId[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "N/A") continue;
    if (isUrl(line)) continue;

    const isNumericId = /^\d+$/.test(line);
    const isAlphanumericId = /^[A-Za-z0-9_-]+$/.test(line) && !line.includes(".");
    const isHashId = /^[a-f0-9]{40}$/i.test(line);
    const isId = isNumericId || isAlphanumericId || isHashId;

    const isFilename =
      line.includes(".") &&
      (line.endsWith(".pdf") ||
        line.endsWith(".doc") ||
        line.endsWith(".docx") ||
        line.endsWith(".txt") ||
        line.endsWith(".xls") ||
        line.endsWith(".xlsx"));

    let documentName: string | undefined;
    let documentId: string | undefined;

    const filenameWithIdMatch = line.match(/^(.+\.(pdf|doc|docx|txt|xls|xlsx))\s*(\d+)$/);
    if (filenameWithIdMatch) {
      documentName = filenameWithIdMatch[1]?.trim();
      documentId = filenameWithIdMatch[3];
    } else if (isId && !isFilename) {
      documentId = line;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (isUrl(nextLine)) {
          documentName = line;
        } else {
          const nextIsNumericId = /^\d+$/.test(nextLine);
          const nextIsAlphanumericId = /^[A-Za-z0-9_-]+$/.test(nextLine) && !nextLine.includes(".");
          const nextIsHashId = /^[a-f0-9]{40}$/i.test(nextLine);
          const nextIsId = nextIsNumericId || nextIsAlphanumericId || nextIsHashId;
          if (!nextIsId && nextLine !== "N/A") {
            documentName = nextLine;
            i++;
          } else {
            documentName = line;
          }
        }
      } else {
        documentName = line;
      }
    } else if (isFilename || (line.length > 0 && !isId)) {
      documentName = line;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!isUrl(nextLine)) {
          const nextIsNumericId = /^\d+$/.test(nextLine);
          const nextIsAlphanumericId = /^[A-Za-z0-9_-]+$/.test(nextLine) && !nextLine.includes(".") && nextLine !== "N/A";
          const nextIsHashId = /^[a-f0-9]{40}$/i.test(nextLine);
          if (nextIsNumericId || nextIsAlphanumericId || nextIsHashId) {
            documentId = nextLine;
            i++;
          }
        }
      }
    }

    // Never emit fragment-only names (e.g. "1440.pdf") as standalone documents – they are merged above
    const isFragmentOnly = /^\d+\.(pdf|doc|docx|txt|xls|xlsx)$/i.test(documentName);
    if (documentName && !isUrl(documentName) && !isFragmentOnly) {
      names.push(documentName);
      documents.push({ name: documentName, id: documentId, tool_used: toolUsed });
    }
  }

  return { names, documents };
}

/** Detect if a line looks like the start of related questions (Arabic question) */
function looksLikeQuestionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/؟/.test(t)) return true;
  const questionStarts = /^(ما|كيف|هل|أين|متى|لماذا|من|ماذا)\s/;
  return questionStarts.test(t);
}

/** Stream often uses 6+ digit IDs; treat as ID line for document pairing */
function isNumericIdLine(line: string): boolean {
  return /^\d{6,}$/.test(line.trim());
}

/** Line that could be a document name (title or filename), not a question and not only digits */
function isDocNameLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 2) return false;
  if (/^\d+$/.test(t)) return false;
  if (isQuestionLine(t)) return false;
  if (/^(أسئلة ذات صلة|استفسارات متعلقة|المصادر)\s*:?\s*$/.test(t)) return false;
  if (isUrl(t)) return false;
  return true;
}

/**
 * Parse streaming plain content: find document blocks and question lines *anywhere* in the text
 * (not only at the start). Handles: main body, then questions, then title\\nID doc list, then more questions.
 */
function parseStreamingPlainContent(
  content: string,
  toolUsed?: string
): { documents: DocumentWithId[]; documentNames: string[]; relatedQuestions: string[]; cleanContent: string } {
  const normalized = content.replace(/\\n/g, "\n").trim();
  const lines = normalized.split("\n").map((l) => l.trim());
  const documentNames: string[] = [];
  const documents: DocumentWithId[] = [];
  const relatedQuestions: string[] = [];
  const skipIndex = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (skipIndex.has(i)) continue;
    const line = lines[i];
    const next = i + 1 < lines.length ? lines[i + 1] : "";
    if (!line) continue;

    if (isNumericIdLine(line) && isDocNameLine(next)) {
      documents.push({ name: next, id: line.trim(), tool_used: toolUsed });
      documentNames.push(next);
      skipIndex.add(i);
      skipIndex.add(i + 1);
      continue;
    }
    if (isDocNameLine(line) && isNumericIdLine(next)) {
      const name = line;
      const id = next.trim();
      const isFragmentOnly = /^\d+\.(pdf|doc|docx|txt|xls|xlsx)$/i.test(name);
      if (!isFragmentOnly) {
        documents.push({ name, id, tool_used: toolUsed });
        documentNames.push(name);
      }
      skipIndex.add(i);
      skipIndex.add(i + 1);
      continue;
    }

    if (isQuestionLine(line)) {
      relatedQuestions.push(line);
      skipIndex.add(i);
    }
  }

  const sectionHeader = /^(أسئلة ذات صلة|استفسارات متعلقة|المصادر)\s*:?\s*$/;
  const cleanLines = lines
    .map((l, idx) => (skipIndex.has(idx) ? "" : l))
    .filter((l, idx) => {
      if (skipIndex.has(idx)) return false;
      if (sectionHeader.test(l)) return false;
      return true;
    });
  let cleanContent = cleanLines.join("\n").replace(/\n\n+/g, "\n").trim();
  return {
    documents,
    documentNames,
    relatedQuestions,
    cleanContent,
  };
}

/** Parse content that has no XML tags: document lines then optional question block (e.g. get-conversation or streamed plain format). */
function parsePlainDocumentsAndQuestions(
  content: string,
  toolUsed?: string
): { documents: DocumentWithId[]; documentNames: string[]; relatedQuestions: string[]; cleanContent: string } {
  const documentNames: string[] = [];
  const documents: DocumentWithId[] = [];
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let documentEndIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (looksLikeQuestionLine(line) || (line.includes("؟") && line.length > 10)) break;
    const isOnlyDigits = /^\d+$/.test(line);
    const hasPdfOrExt = /\.(pdf|doc|docx|txt|xls|xlsx)/i.test(line);
    const idThenFile = /^\d+[^\d].*\.(pdf|doc|docx|txt|xls|xlsx)/i.test(line);
    const docLike = isOnlyDigits || hasPdfOrExt || idThenFile;
    if (docLike) documentEndIndex = i + 1;
  }
  const documentLines = lines.slice(0, documentEndIndex);
  const restLines = lines.slice(documentEndIndex);
  if (documentLines.length > 0) {
    const parsed = parseDocuments(documentLines.join("\n"), toolUsed);
    documentNames.push(...parsed.names);
    documents.push(...parsed.documents);
  }
  const questionsBlock = restLines.join("\n");
  const relatedQuestions = parseRelatedQuestions(questionsBlock);
  const stripped = content
    .replace(documentLines.join("\n"), "")
    .replace(questionsBlock, "")
    .replace(/\n\n+/g, "\n")
    .trim();
  return {
    documents,
    documentNames,
    relatedQuestions,
    cleanContent: stripped,
  };
}

/**
 * During streaming, return only the main body for display: strip everything from
 * the first related_questions/documents section onward so the UI doesn't show
 * partial lists and avoids weird rerenders. Call parseStreamingContent on completion.
 */
export function getStreamingDisplayContent(content: string, _toolUsed?: string): string {
  if (!content || !content.trim()) return "";
  let main = stripCodeBlockMarkers(content);
  const patterns: RegExp[] = [
    /<related_questions[\s>]/i,
    /<documents[\s>]/i,
    /<resources[\s>]/i,
    /\n\s*(أسئلة ذات صلة|استفسارات متعلقة|المصادر)\s*:?\s*$/m,
    /\n\s*(أسئلة ذات صلة|استفسارات متعلقة|المصادر)\s*:?\s*\n/m,
  ];
  let cutIndex = main.length;
  for (const re of patterns) {
    const m = main.match(re);
    if (m && m.index != null && m.index < cutIndex) cutIndex = m.index;
  }
  // Also cut at partial streaming tag at end (e.g. "<rel", "<doc")
  const partialTag = main.slice(0, cutIndex).match(/<[a-z_]*$/i);
  if (partialTag && partialTag.index != null) {
    const tagStart = partialTag.index;
    const fragment = partialTag[0].toLowerCase();
    if (fragment.length < 25 && (/<r/.test(fragment) || /<d/.test(fragment) || /<re/.test(fragment))) {
      cutIndex = Math.min(cutIndex, tagStart);
    }
  }
  main = main.slice(0, cutIndex);
  // Remove trailing partial tag or stray <
  main = main.replace(/<[a-z_]*\s*$/i, (s) => (s.length < 20 ? "" : s));
  main = main.replace(/<\s*$/, (match) => {
    const before = main.slice(0, main.length - match.length).trim();
    return before === "" || /[\s\n]$/.test(before) ? "" : match;
  });
  return main.replace(/\n\n+/g, "\n").trim();
}

export function parseStreamingContent(
  content: string,
  toolUsed?: string
): {
  cleanContent: string;
  documentNames: string[];
  documents: DocumentWithId[];
  relatedQuestions: string[];
  urls: string[];
} {
  let documentNames: string[] = [];
  let documents: DocumentWithId[] = [];
  let relatedQuestions: string[] = [];
  const urls: string[] = [];
  let cleanContent = stripCodeBlockMarkers(content);

  const relatedMatch = cleanContent.match(/<related_questions>([\s\S]*?)(?:<\/related_questions>|<\/>)/i);
  if (relatedMatch) {
    relatedQuestions = parseRelatedQuestions(relatedMatch[1]);
    cleanContent = cleanContent.replace(/<related_questions>[\s\S]*?(?:<\/related_questions>|<\/>)/gi, "");
  } else {
    if (/<related_questions>/i.test(cleanContent)) {
      relatedQuestions = parseRelatedQuestions(cleanContent.match(/<related_questions>([\s\S]*)$/i)?.[1] || "");
      cleanContent = cleanContent.replace(/<related_questions>[\s\S]*$/gi, "");
    }
    const isPartialTag = (text: string): boolean => {
      if (!text || text.length === 0) return false;
      const trimmed = text.trim();
      return (
        trimmed.length < 20 &&
        !trimmed.includes("؟") &&
        !trimmed.includes("?") &&
        /^[<\s]*[rR]?[eE]?[lL]?[aA]?[tT]?[eE]?[dD]?[_]?[qQ]?[uU]?[eE]?[sS]?[tT]?[iI]?[oO]?[nN]?[sS]?[\s>]*$/.test(trimmed)
      );
    };
    const partialOpeningMatch = cleanContent.match(/<r?e?l?a?t?e?d?_?q?u?e?s?t?i?o?n?s?\s*$/i);
    if (partialOpeningMatch && isPartialTag(partialOpeningMatch[0])) {
      cleanContent = cleanContent.replace(/<r?e?l?a?t?e?d?_?q?u?e?s?t?i?o?n?s?\s*$/i, "");
    }
    const partialContentMatch = cleanContent.match(/(?:^|[\s<])(related_?q?u?e?s?t?i?o?n?s?)\s*$/i);
    if (partialContentMatch?.[1] && isPartialTag(partialContentMatch[1])) {
      const beforeMatch = cleanContent.substring(0, cleanContent.length - partialContentMatch[0].length).trim();
      if (beforeMatch.endsWith("<") || beforeMatch === "") {
        cleanContent = cleanContent.replace(/(?:^|[\s<])(related_?q?u?e?s?t?i?o?n?s?)\s*$/i, beforeMatch || "");
      }
    }
    const underscoreMatch = cleanContent.match(/_q?u?e?s?t?i?o?n?s?\s*$/i);
    if (underscoreMatch && isPartialTag(underscoreMatch[0])) {
      const beforeMatch = cleanContent.substring(0, cleanContent.length - underscoreMatch[0].length).trim();
      if (beforeMatch === "" || /[\s<]$/.test(beforeMatch)) {
        cleanContent = cleanContent.replace(/_q?u?e?s?t?i?o?n?s?\s*$/i, beforeMatch || "");
      }
    }
    if (/<\s*$/.test(cleanContent)) {
      const beforeBracket = cleanContent.substring(0, cleanContent.length - 1).trim();
      if (beforeBracket === "" || /[\s\n]$/.test(beforeBracket)) {
        cleanContent = cleanContent.replace(/<\s*$/, "");
      }
    }
    if (/^\s*>/.test(cleanContent)) {
      const afterBracket = cleanContent.substring(1).trim();
      if (afterBracket === "" || /^[\s\n]/.test(afterBracket)) {
        cleanContent = cleanContent.replace(/^\s*>/, "");
      }
    }
    const standaloneRelatedMatch = cleanContent.match(/related_questions\s*([\s\S]*?)(?=\s*>|$)/i);
    if (standaloneRelatedMatch?.[1]) {
      const potentialQuestions = standaloneRelatedMatch[1];
      if (
        potentialQuestions.length > 0 &&
        (potentialQuestions.includes("؟") ||
          potentialQuestions.includes("?") ||
          potentialQuestions.split("\n").length > 1)
      ) {
        relatedQuestions = parseRelatedQuestions(potentialQuestions);
        cleanContent = cleanContent.replace(/related_questions\s*[\s\S]*?(?=\s*>|$)\s*>/gi, "");
        cleanContent = cleanContent.replace(/related_questions\s*[\s\S]*$/gi, "");
      }
    }
  }

  const documentsMatch = cleanContent.match(/<documents>([\s\S]*?)(?:<\/documents>|<\/>)/i);
  if (documentsMatch) {
    const documentsText = documentsMatch[1];
    const lines = documentsText.split("\n").filter((line) => line.length > 0);
    for (const line of lines) {
      urls.push(...extractUrlsFromLine(line));
    }
    const parsed = parseDocuments(documentsText, toolUsed);
    documentNames = parsed.names;
    documents = parsed.documents;
    cleanContent = cleanContent.replace(/<documents>[\s\S]*?(?:<\/documents>|<\/>)/gi, "");
  } else {
    if (/<documents>/i.test(cleanContent)) {
      cleanContent = cleanContent.replace(/<documents>[\s\S]*$/gi, "");
    }
  }

  cleanContent = cleanContent
    .replace(/<resources>[\s\S]*?(?:<\/resources>|<\/>)/gi, "")
    .replace(/<resources>[\s\S]*$/gi, "");

  cleanContent = cleanContent
    .replace(/<\/?documents[^>]*>/gi, "")
    .replace(/<\/?related_questions[^>]*>/gi, "")
    .replace(/<\/?resources[^>]*>/gi, "")
    .replace(/<\/>\s*$/gi, "")
    .replace(/\n\s*documents>[\s\S]*$/gi, "")
    .replace(/\n\s*related_questions[\s\S]*$/gi, "")
    .replace(/\n\s*resources>[\s\S]*$/gi, "")
    .replace(/related_questions\s*[\s\S]*?\s*>?\s*$/gi, "")
    .replace(/<\/>\s*/g, "")
    .replace(/<r?e?l?a?t?e?d?_?q?u?e?s?t?i?o?n?s?\s+$/i, "")
    .replace(/<r?e?l?a?t?e?d?_?q?u?e?s?t?i?o?n?s?\s*$/i, (match) => (match.trim().length < 20 ? "" : match))
    .replace(/<\s+$/, "")
    .replace(/<\s*$/, (match: string, _offset: number, string: string) => {
      const before = string.substring(0, _offset);
      return before.trim() === "" || /[\s\n]$/.test(before) ? "" : match;
    })
    .replace(/^\s*>\s*/, (match: string, offset: number, string: string) => {
      const after = string.substring(offset + match.length);
      return after.trim() === "" || /^[\s\n]/.test(after) ? "" : match;
    })
    .replace(/([^\n>])\s*>+\s*$/g, "$1")
    .trim();

  // Strip malformed streaming block: ---documents> or -documents> (partial tag) and everything after to end
  cleanContent = cleanContent.replace(/-{2,}\s*documents>\s*[\s\S]*$/gi, "").trim();
  cleanContent = cleanContent.replace(/(?:^|\n)\s*documents>\s*[\s\S]*$/gi, "").trim();

  // Strip trailing streaming artifact: filename.pdf> or filename_something.pdf> followed by Arabic/question fragment
  cleanContent = cleanContent.replace(
    /\s*\S+\.(pdf|doc|docx|txt|xls|xlsx)\s*>[\s\u0600-\u06FF؟?\n]*$/gi,
    ""
  ).trim();

  // Strip trailing garbage: digits + "documents" + rest of line (e.g. "208428021documents هي أبرز...")
  cleanContent = cleanContent.replace(/\s*\d+documents\s*[\s\S]*$/gi, "").trim();

  // Strip trailing line that is only concatenated filenames + digits (streaming garbage)
  cleanContent = cleanContent.replace(
    /\n\s*[^\n]*\.(pdf|doc|docx|txt|xls|xlsx)[^\n]*\d{6,}[^\n]*$/gi,
    ""
  ).trim();

  // Fallback: no tags but content has document list and/or questions (streamed plain or get-conversation)
  // Skip for stats and for empty tool_used: stats-v2 sends tool_used: null for chitchat; plain Arabic
  // (e.g. "مرحبًا! كيف يمكنني مساعدتك اليوم؟ 😊") must not have lines stripped as "related questions".
  const hasDocLikeLines = /\.(pdf|doc|docx|txt|xls|xlsx)/i.test(cleanContent) || /^\d{6,}$/m.test(cleanContent);
  const hasQuestionLike = /؟/.test(cleanContent) || /\n(ما|كيف|هل|أين|متى|لماذا|من|ماذا)\s/m.test(cleanContent);
  const isPlainTextTool = !toolUsed || toolUsed === "stats";
  if (
    !isPlainTextTool &&
    documentNames.length === 0 &&
    documents.length === 0 &&
    relatedQuestions.length === 0 &&
    (hasDocLikeLines || hasQuestionLike)
  ) {
    const streaming = parseStreamingPlainContent(cleanContent, toolUsed);
    if (
      streaming.documents.length > 0 ||
      streaming.relatedQuestions.length > 0 ||
      streaming.documentNames.length > 0
    ) {
      documentNames.push(...streaming.documentNames);
      documents.push(...streaming.documents);
      relatedQuestions.push(...streaming.relatedQuestions);
      cleanContent = streaming.cleanContent;
    } else {
      const plain = parsePlainDocumentsAndQuestions(cleanContent, toolUsed);
      if (
        plain.documents.length > 0 ||
        plain.relatedQuestions.length > 0 ||
        plain.documentNames.length > 0
      ) {
        documentNames.push(...plain.documentNames);
        documents.push(...plain.documents);
        relatedQuestions.push(...plain.relatedQuestions);
        cleanContent = plain.cleanContent;
      }
    }
  }

  // Remove trailing fragment-only lines (e.g. "1440.pdf") from display
  cleanContent = cleanContent.replace(/\n\s*\d+\.(pdf|doc|docx|txt|xls|xlsx)\s*$/gi, "").trim();

  // Strip "المصادر :" and everything after (duplicate body often appears after sources header when streaming)
  cleanContent = cleanContent.replace(/\n\s*المصادر\s*:\s*[\s\S]*$/g, "").trim();

  const allSources = [...documentNames, ...urls];
  return {
    cleanContent,
    documentNames: allSources,
    documents,
    relatedQuestions,
    urls,
  };
}
