"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/ui/lib/utils';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  disableCodeBlocks?: boolean; // If true, never render code blocks - unwrap all code blocks
  isStreaming?: boolean; // If true, content is being streamed and already preprocessed
}

// Preprocess content to extract markdown from code blocks and handle tables
// ALWAYS removes all code blocks - never render as <code> or <pre>
function preprocessMarkdown(content: string, _disableCodeBlocks: boolean = false, isStreaming: boolean = false): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  let processedContent = content;
  
  // ALWAYS remove ALL code block wrappers - never render as code/pre
  // Remove all code block markers (```...```)
  // Handle code blocks at the start/end
  processedContent = processedContent.replace(/^```[a-zA-Z]*\s*\n?/gm, '');
  processedContent = processedContent.replace(/\n?```\s*$/gm, '');
  // Handle full content wrapped in code blocks
  const fullCodeBlockMatch = processedContent.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/m);
  if (fullCodeBlockMatch && fullCodeBlockMatch[1]) {
    processedContent = fullCodeBlockMatch[1];
  }
  // Remove any remaining code block markers
  processedContent = processedContent.replace(/```[a-zA-Z]*\s*\n/g, '');
  processedContent = processedContent.replace(/\n```\s*/g, '\n');
  // Remove inline code backticks (single backticks) - but preserve the content
  processedContent = processedContent.replace(/`([^`]+)`/g, '$1');
  
  // For streaming content, skip additional preprocessing as it's already handled
  if (isStreaming) {
    return processedContent;
  }
  
  // Handle markdown code blocks that contain tables - unwrap them
  const markdownCodeBlockRegex = /```markdown\s*\n([\s\S]*?)```/g;
  
  if (markdownCodeBlockRegex.test(processedContent)) {
    // Reset regex lastIndex
    markdownCodeBlockRegex.lastIndex = 0;
    
    processedContent = processedContent.replace(markdownCodeBlockRegex, (_match, codeContent: string) => {
      // Check if the code content contains a table (has | characters in a table-like pattern)
      const lines = codeContent.trim().split('\n');
      const hasTablePattern = lines.some((line: string) => {
        const trimmedLine = line.trim();
        return trimmedLine.startsWith('|') && trimmedLine.split('|').length >= 3;
      });
      
      const hasHeaderSeparator = lines.some((line: string) => {
        const trimmedLine = line.trim();
        return trimmedLine.match(/^\|[\s\-:]+\|/);
      });
      
      if (hasTablePattern && hasHeaderSeparator) {
        // Extract and return just the markdown table content (remove the code block wrapper)
        return codeContent.trim();
      }
      // If it's not a table, just return the content without code block markers
      return codeContent.trim();
    });
  }
  
  return processedContent;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({
  content,
  className,
  dir = 'auto',
  disableCodeBlocks = false,
  isStreaming = false,
}) => {
  // Preprocess content to handle markdown tables in code blocks
  // Use useMemo to prevent re-processing on every render
  const processedContent = React.useMemo(() => preprocessMarkdown(content, disableCodeBlocks, isStreaming), [content, disableCodeBlocks, isStreaming]);
  
  return (
    <div className={cn(className)} dir={dir}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize table rendering for RTL
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="border-collapse w-full border border-gray-300 min-w-full table-auto" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead  {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-200 " {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 px-4 py-2  font-bold text-right whitespace-nowrap" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-4 py-2 text-right align-top" {...props}>
              {children}
            </td>
          ),
          // Headers
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold mb-3 mt-5" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-bold mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="mb-0 leading-[25.233px] text-[14.419px] text-[#101828]" {...props}>
              {children}
            </p>
          ),
          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc mr-4 mb-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal mr-4 mb-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="mb-1" {...props}>
              {children}
            </li>
          ),
          // Code - ALWAYS render as plain text/span, never as <code>
          code: ({ className, children, ...props }) => {
            // Always render as plain text/span instead of code
            const { ref, node, ...spanProps } = props as any;
            return <span {...spanProps}>{children}</span>;
          },
          // Pre - ALWAYS render as div, never as <pre>
          pre: ({ children, ...props }) => {
            // Always render as div instead of pre - exclude ref and node props
            const { ref, node, ...divProps } = props as any;
            return <div className="whitespace-pre-wrap" {...divProps}>{children}</div>;
          },
          // Blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-r-4 border-gray-300 pr-4 pl-2 italic" {...props}>
              {children}
            </blockquote>
          ),
          // Horizontal rule - prevent rendering
          hr: () => null,
          // Strong
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-[16.221px]" {...props}>
              {children}
            </strong>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if content actually changes
  return prevProps.content === nextProps.content && 
         prevProps.className === nextProps.className &&
         prevProps.dir === nextProps.dir &&
         prevProps.disableCodeBlocks === nextProps.disableCodeBlocks &&
         prevProps.isStreaming === nextProps.isStreaming;
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

