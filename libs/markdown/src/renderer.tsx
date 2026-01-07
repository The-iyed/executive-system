import React from 'react';
import { Streamdown } from 'streamdown';
import 'streamdown/dist/index.css';
import { getTextDirection } from './rtl';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const direction = getTextDirection(content);

  return (
    <div className={className} dir={direction}>
      <Streamdown>{content}</Streamdown>
    </div>
  );
};

