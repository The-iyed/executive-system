/**
 * Pre-process response text for markdown rendering (aligned with super-agent-v1).
 * Final cleanup only – tag extraction is done by parseStreamingContent.
 */

export interface PreprocessedResponse {
  cleanText: string;
  extractedDocuments: Array<{ title: string; content: string }>;
  extractedQuestions: string[];
}

const extractDocuments = (text: string): {
  cleanText: string;
  documents: Array<{ title: string; content: string }>;
} => {
  const documents: Array<{ title: string; content: string }> = [];
  let cleanText = text;
  const documentRegex = /<document>([\s\S]*?)<\/document>/g;
  let match;
  while ((match = documentRegex.exec(text)) !== null) {
    const documentContent = match[1];
    const titleMatch = documentContent.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "";
    const contentMatch = documentContent.match(/<content>([\s\S]*?)<\/content>/);
    const content = contentMatch ? contentMatch[1] : "";
    if (title || content) documents.push({ title, content });
    cleanText = cleanText.replace(match[0], "");
  }
  return { cleanText, documents };
};

const extractQuestions = (text: string): { cleanText: string; questions: string[] } => {
  const questions: string[] = [];
  let cleanText = text;
  const questionRegex = /<question>([\s\S]*?)<\/question>/g;
  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    const questionText = match[1];
    if (questionText) questions.push(questionText);
    cleanText = cleanText.replace(match[0], "");
  }
  return { cleanText, questions };
};

const stripCodeBlockMarkers = (text: string): string => {
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
  const m = text.match(codeBlockRegex);
  if (m?.[1]) return m[1];
  const simpleCodeBlockRegex = /^```\s*\n?([\s\S]*?)\n?```$/i;
  const sm = text.match(simpleCodeBlockRegex);
  if (sm?.[1]) {
    const content = sm[1];
    const hasMarkdownFeatures = /(^|\n)(#{1,6}\s|[*\-+]\s|\d+\.\s|>\s|\*\*|__|\[.*\]\(.*\)|`[^`]+`)/m.test(content);
    if (hasMarkdownFeatures) return content;
    const looksLikeCode = /(function|class|import|export|const|let|var|def|return|if|else|for|while|\(\)|=>|#include|#define)/.test(content);
    if (!looksLikeCode && content.length > 10) return content;
  }
  return text;
};

const removeModernTags = (text: string): string => {
  let cleanText = text;
  cleanText = cleanText.replace(/<documents>[\s\S]*?(?:<\/documents>|<\/>)/gi, "");
  cleanText = cleanText.replace(/<documents>[\s\S]*$/gi, "");
  cleanText = cleanText.replace(/<related_questions>[\s\S]*?(?:<\/related_questions>|<\/>)/gi, "");
  cleanText = cleanText.replace(/<related_questions>[\s\S]*$/gi, "");
  cleanText = cleanText.replace(/<resources>[\s\S]*?(?:<\/resources>|<\/>)/gi, "");
  cleanText = cleanText.replace(/<resources>[\s\S]*$/gi, "");
  cleanText = cleanText
    .replace(/<\/?documents[^>]*>/gi, "")
    .replace(/<\/?related_questions[^>]*>/gi, "")
    .replace(/<\/?resources[^>]*>/gi, "")
    .replace(/<\/>\s*$/gi, "")
    .replace(/\n\s*documents>[\s\S]*$/gi, "")
    .replace(/\n\s*related_questions[\s\S]*$/gi, "")
    .replace(/\n\s*resources>[\s\S]*$/gi, "")
    .replace(/related_questions\s*[\s\S]*?\s*>?\s*$/gi, "")
    .replace(/<\/>\s*/g, "")
    .replace(/([^\n>])\s*>+\s*$/g, "$1");
  // Strip malformed streaming: ---documents> or documents> and rest to end
  cleanText = cleanText.replace(/-{2,}\s*documents>\s*[\s\S]*$/gi, "").trim();
  cleanText = cleanText.replace(/(?:^|\n)\s*documents>\s*[\s\S]*$/gi, "").trim();
  // Strip trailing garbage: digits + "documents" + rest
  cleanText = cleanText.replace(/\s*\d+documents\s*[\s\S]*$/gi, "").trim();
  // Strip "المصادر :" and everything after (duplicate body after sources when streaming)
  cleanText = cleanText.replace(/\n\s*المصادر\s*:\s*[\s\S]*$/g, "").trim();
  return cleanText;
};

/**
 * Pre-process response text for markdown rendering (same as super-agent-v1).
 * Run on content before passing to ReactMarkdown so leftover tags/code blocks are stripped.
 */
export function preprocessResponse(text: string): PreprocessedResponse {
  if (!text) {
    return { cleanText: text ?? "", extractedDocuments: [], extractedQuestions: [] };
  }
  let processedText = text;
  processedText = stripCodeBlockMarkers(processedText);
  processedText = removeModernTags(processedText);
  const { cleanText: textAfterDocuments, documents } = extractDocuments(processedText);
  const { cleanText: textAfterQuestions, questions } = extractQuestions(textAfterDocuments);
  return {
    cleanText: textAfterQuestions,
    extractedDocuments: documents,
    extractedQuestions: questions,
  };
}
