"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/ui/components/collapsible";
import { cn } from "@/lib/ui/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import React, { createContext, memo, useContext, useEffect, useState } from "react";
import { MarkdownRenderer } from "../markdown-renderer";
import { Shimmer } from "./shimmer";

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  autoClose?: boolean; // New prop to control auto-close behavior
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    autoClose = false, // Default to false - keep thinking visible
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: undefined,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.ceil((Date.now() - startTime) / MS_IN_S));
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (only if autoClose is enabled)
    useEffect(() => {
      if (autoClose && defaultOpen && !isStreaming && isOpen && !hasAutoClosed) {
        // Add a small delay before closing to allow user to see the content
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed, autoClose]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Collapsible
          className={cn("not-prose mb-4", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }
  return <p>Thought for {duration} seconds</p>;
};

export const ReasoningTrigger = memo(
  ({ className, children, getThinkingMessage = defaultGetThinkingMessage, ...props }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className={cn(
              "size-3",
              isStreaming && "animate-pulse"
            )} />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon
              className={cn(
                "size-3 transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

// Clean thinking content by removing tool call metadata and formatting issues
function cleanThinkingContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let cleaned = content;

  // FIRST: Remove ALL code block wrappers (```...```) - never render thinking as code
  // Handle code blocks at the start/end of content
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*\n?/gm, ''); // Remove opening code block markers
  cleaned = cleaned.replace(/\n?```\s*$/gm, ''); // Remove closing code block markers
  // Handle code blocks that wrap the entire content
  const fullCodeBlockMatch = cleaned.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/m);
  if (fullCodeBlockMatch && fullCodeBlockMatch[1]) {
    cleaned = fullCodeBlockMatch[1];
  }
  // Remove any remaining code block markers in the middle
  cleaned = cleaned.replace(/```[a-zA-Z]*\s*\n/g, '');
  cleaned = cleaned.replace(/\n```\s*/g, '\n');

  // Remove tool call patterns like "legal,web|" or "tool1,tool2|" at the start of lines
  // This pattern appears when thinking includes tool call information
  // Pattern: word characters, commas, hyphens followed by a pipe at line start
  cleaned = cleaned.replace(/^[a-zA-Z0-9_,\s-]+\|/gm, '');

  // Remove tool call patterns that appear anywhere in the text (not just line start)
  // This handles cases where the pattern appears mid-text
  cleaned = cleaned.replace(/\b[a-zA-Z0-9_,\s-]+\|/g, '');

  // Remove any remaining pipe characters that are standalone or at line starts
  cleaned = cleaned.replace(/^\|\s*/gm, '');
  cleaned = cleaned.replace(/\s*\|$/gm, '');

  // Clean up multiple consecutive newlines (more than 2) but preserve paragraph breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Split into lines, clean each line, and rejoin
  // Preserve paragraph structure by keeping single empty lines between paragraphs
  const lines = cleaned.split('\n');
  const cleanedLines: string[] = [];
  let previousLineWasEmpty = false;
  
  for (let i = 0; i < lines.length; i++) {
    let lineCleaned = lines[i].trim();
    // Remove any remaining tool call patterns
    lineCleaned = lineCleaned.replace(/^[a-zA-Z0-9_,\s-]+\|/, '');
    
    if (lineCleaned.length === 0) {
      // Only add empty line if previous line wasn't empty (preserve single paragraph breaks)
      if (!previousLineWasEmpty && cleanedLines.length > 0) {
        cleanedLines.push('');
        previousLineWasEmpty = true;
      }
    } else {
      cleanedLines.push(lineCleaned);
      previousLineWasEmpty = false;
    }
  }
  
  cleaned = cleanedLines.join('\n');

  // If we removed all content, restore a single newline to preserve structure
  if (cleaned.trim().length === 0 && content.trim().length > 0) {
    // Fallback: try to extract text after the last pipe
    const lastPipeIndex = content.lastIndexOf('|');
    if (lastPipeIndex >= 0 && lastPipeIndex < content.length - 1) {
      cleaned = content.substring(lastPipeIndex + 1).trim();
    }
  }

  // Final trim
  cleaned = cleaned.trim();

  return cleaned;
}

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => {
    const { isStreaming } = useReasoning();
    // Memoize the content to prevent unnecessary re-renders
    // Ensure content is always treated as a string and properly formatted for markdown
    const memoizedContent = React.useMemo(() => {
      let content = '';
      if (typeof children !== 'string') {
        content = String(children || '');
      } else {
        content = children;
      }
      // Clean the content to remove tool call metadata
      return cleanThinkingContent(content);
    }, [children]);
    
    return (
      <CollapsibleContent
        className={cn(
          "mt-2 text-xs",
          "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
          className
        )}
        {...props}
      >
        <div className={cn("relative", isStreaming && "opacity-90")}>
          <MarkdownRenderer content={memoizedContent} dir="rtl" disableCodeBlocks={true} />
          {isStreaming && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          )}
        </div>
      </CollapsibleContent>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content actually changes
    return prevProps.children === nextProps.children;
  }
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
