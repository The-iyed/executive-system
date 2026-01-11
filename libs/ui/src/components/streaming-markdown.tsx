"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MarkdownStreamParser } from '@lixpi/markdown-stream-parser';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

export interface StreamingMarkdownProps {
  content: string;
  mode?: 'static' | 'streaming';
  className?: string;
  instanceId?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

type ParsedSegment = {
  segment: string;
  styles: string[];
  type: string;
  isBlockDefining: boolean;
  isProcessingNewLine: boolean;
};

type ParsedOutput = {
  status: 'STREAMING' | 'END_STREAM';
  segment?: ParsedSegment;
};

// Fix incomplete markdown during streaming - more aggressive approach
function fixIncompleteMarkdown(content: string): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  let fixed = content;
  const lines = fixed.split('\n');
  const fixedLines: string[] = [];
  
  let inTable = false;
  let tableStartIndex = -1;
  let hasHeaderSeparator = false;
  let firstTableRow: string | null = null;
  let expectedColumns = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // More robust table detection - check for | at start and end
    const startsWithPipe = trimmedLine.startsWith('|');
    const endsWithPipe = trimmedLine.endsWith('|');
    const pipeCount = (trimmedLine.match(/\|/g) || []).length;
    const isTableRow = startsWithPipe && (endsWithPipe || pipeCount >= 2);
    
    // Check if it's a header separator
    const isHeaderSeparator = trimmedLine.match(/^\|[\s\-:]+\|$/);

    if (isTableRow) {
      if (!inTable) {
        // Starting a new table
        inTable = true;
        tableStartIndex = fixedLines.length;
        hasHeaderSeparator = false;
        firstTableRow = trimmedLine;
        // Calculate expected columns from first row
        expectedColumns = trimmedLine.split('|').filter(c => c.trim().length > 0).length;
        fixedLines.push(line);
      } else if (isHeaderSeparator) {
        // This is the header separator
        hasHeaderSeparator = true;
        fixedLines.push(line);
        // Update expected columns from separator if needed
        const sepColumns = trimmedLine.split('|').length - 1;
        if (sepColumns > 0) {
          expectedColumns = sepColumns;
        }
      } else {
        // Regular table row
        const currentColumns = trimmedLine.split('|').filter(c => c.trim().length > 0).length;
        
        // Fix column count mismatch
        if (currentColumns < expectedColumns) {
          // Add missing columns
          const missing = expectedColumns - currentColumns;
          let fixedRow = line.trim();
          // Ensure it ends with |
          if (!fixedRow.endsWith('|')) {
            fixedRow += ' |';
          }
          // Add missing columns
          fixedRow += ' |'.repeat(missing - 1);
          fixedLines.push(fixedRow);
        } else if (currentColumns > expectedColumns) {
          // Too many columns - truncate (shouldn't happen often)
          const parts = trimmedLine.split('|');
          const fixedParts = parts.slice(0, expectedColumns + 1);
          fixedLines.push(fixedParts.join('|'));
        } else {
          // Correct number of columns
          fixedLines.push(line);
        }
      }
    } else {
      // Not a table row
      if (inTable) {
        // We were in a table, but this line doesn't look like a table row
        // If we don't have a header separator yet, add one immediately after first row
        if (!hasHeaderSeparator && firstTableRow && expectedColumns > 0) {
          // Create header separator with proper column count
          const separator = '|' + ' --- |'.repeat(expectedColumns);
          // Insert right after the first row
          fixedLines.splice(tableStartIndex + 1, 0, separator);
          hasHeaderSeparator = true;
        }
        inTable = false;
        tableStartIndex = -1;
        hasHeaderSeparator = false;
        firstTableRow = null;
        expectedColumns = 0;
      }
      fixedLines.push(line);
    }
  }

  // If we're still in a table at the end (streaming incomplete table), ensure it has a header separator
  if (inTable && !hasHeaderSeparator && firstTableRow && expectedColumns > 0) {
    const separator = '|' + ' --- |'.repeat(expectedColumns);
    // Insert right after the first row
    fixedLines.splice(tableStartIndex + 1, 0, separator);
  }

  fixed = fixedLines.join('\n');

  // Fix incomplete code blocks - if there's an opening ``` without closing, treat as text
  const codeBlockOpenCount = (fixed.match(/```/g) || []).length;
  if (codeBlockOpenCount % 2 !== 0) {
    // Odd number means incomplete - remove the last opening
    const lastIndex = fixed.lastIndexOf('```');
    if (lastIndex >= 0) {
      fixed = fixed.substring(0, lastIndex) + fixed.substring(lastIndex + 3);
    }
  }

  // Fix incomplete headers - remove headers without content
  fixed = fixed.replace(/(^#{1,6})\s*$/gm, '');

  // Fix incomplete bold/italic - remove unmatched markers at the end
  const boldCount = (fixed.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    // Remove the last **
    const lastIndex = fixed.lastIndexOf('**');
    if (lastIndex >= 0) {
      fixed = fixed.substring(0, lastIndex) + fixed.substring(lastIndex + 2);
    }
  }

  // Ensure proper line endings
  fixed = fixed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return fixed;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  mode = 'static',
  className,
  instanceId = 'default',
  dir = 'rtl',
}) => {
  // Preprocess content for streaming mode to fix incomplete markdown
  const processedContent = React.useMemo(() => {
    if (mode === 'streaming') {
      return fixIncompleteMarkdown(content);
    }
    return content;
  }, [content, mode]);

  return (
    <MarkdownRenderer
      content={processedContent}
      className={className}
      dir={dir}
      isStreaming={mode === 'streaming'}
    />
  );
};
