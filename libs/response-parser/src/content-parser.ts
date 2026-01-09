import type { DocumentReference, ParsedContent } from '@sanad-ai/api';

/**
 * Placeholder values to ignore when parsing documents
 */
const DOCUMENT_PLACEHOLDERS = [
  'N/A',
  'NA',
  'undefined',
  'لا توجد وثائق مستخدمة',
  'الرجاء توفير سياق أكثر',
  '(No specific document referenced in the context provided.)',
];

/**
 * Check if a DMS ID is valid (numeric and not a placeholder)
 */
function isValidDmsId(id: string | undefined): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (!trimmed || trimmed === '') return false;
  if (DOCUMENT_PLACEHOLDERS.includes(trimmed)) return false;
  // Check if it's numeric
  return /^\d+$/.test(trimmed);
}

/**
 * Parse documents from XML tags in content
 * Format:
 * <documents>
 * filename1.pdf
 * dms_id_1
 * filename2.pdf
 * dms_id_2
 * </documents>
 */
export function parseDocuments(content: string): DocumentReference[] {
  const documents: DocumentReference[] = [];
  const documentsMatch = content.match(/<documents>([\s\S]*?)<\/documents>/i);

  if (!documentsMatch) {
    return documents;
  }

  const documentsContent = documentsMatch[1].trim();
  const lines = documentsContent.split('\n').map((line) => line.trim()).filter((line) => line);

  // Process in pairs: filename, then dms_id
  for (let i = 0; i < lines.length; i += 2) {
    const filename = lines[i];
    const dmsId = lines[i + 1];

    if (!filename) continue;

    // Skip if filename is a placeholder
    if (DOCUMENT_PLACEHOLDERS.some((placeholder) => filename.includes(placeholder))) {
      continue;
    }

    const document: DocumentReference = {
      document_title: filename.replace(/\.pdf$/i, ''),
      file_name: filename,
    };

    // Only include dmsdocid_1 if it's a valid numeric value
    if (isValidDmsId(dmsId)) {
      document.dmsdocid_1 = dmsId.trim();
    }

    documents.push(document);
  }

  return documents;
}

/**
 * Parse related questions from XML tags in content
 * Format 1 (newline-separated):
 * <related_questions>
 * Question 1?
 * Question 2?
 * </related_questions>
 *
 * Format 2 (question mark-separated):
 * <related_questions>
 * Question 1? Question 2? Question 3?
 * </related_questions>
 */
export function parseRelatedQuestions(content: string): string[] {
  const questions: string[] = [];
  const questionsMatch = content.match(/<related_questions>([\s\S]*?)<\/related_questions>/i);

  if (!questionsMatch) {
    return questions;
  }

  const questionsContent = questionsMatch[1].trim();

  // If content contains newlines, split by newlines
  if (questionsContent.includes('\n')) {
    questions.push(
      ...questionsContent
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
    );
  } else {
    // Otherwise, split by question mark and append ? back
    const parts = questionsContent.split('?').map((q) => q.trim()).filter((q) => q.length > 0);
    questions.push(...parts.map((q) => (q.endsWith('?') ? q : `${q}?`)));
  }

  return questions;
}

/**
 * Remove XML tags from content
 */
export function removeXmlTags(content: string): string {
  return content
    .replace(/<documents>[\s\S]*?<\/documents>/gi, '')
    .replace(/<related_questions>[\s\S]*?<\/related_questions>/gi, '')
    .trim();
}

/**
 * Parse content to extract text, documents, and related questions
 */
export function parseContent(content: string): ParsedContent {
  const documents = parseDocuments(content);
  const relatedQuestions = parseRelatedQuestions(content);
  const text = removeXmlTags(content);

  return {
    text,
    documents,
    relatedQuestions,
  };
}

