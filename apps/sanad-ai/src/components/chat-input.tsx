import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { cn } from '@sanad-ai/ui';
import SendIcon from '../assets/send-icon.svg';
import VoiceIcon from '../assets/voice.svg';

const FONT_FAMILY = '"Frutiger LT Pro", sans-serif';

export interface ChatInputProps {
  onSendMessage: (message: string, file?: File, audioFile?: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [lineHeight, setLineHeight] = useState(0);

  // Measure line height on mount
  useEffect(() => {
    if (textareaRef.current) {
      const computedStyle = window.getComputedStyle(textareaRef.current);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeightValue = parseFloat(computedStyle.lineHeight) || fontSize * 1.5;
      setLineHeight(lineHeightValue);
    }
  }, []);

  // Check if content exceeds one line
  const checkLineCount = useCallback(() => {
    if (!textareaRef.current || !lineHeight) return;

    const textarea = textareaRef.current;
    const scrollHeight = textarea.scrollHeight;
    const shouldBeMultiLine = scrollHeight > lineHeight * 1.5; // Allow small buffer

    if (shouldBeMultiLine !== isMultiLine) {
      setIsMultiLine(shouldBeMultiLine);
    }
  }, [isMultiLine, lineHeight]);

  useEffect(() => {
    checkLineCount();
  }, [message, checkLineCount]);

  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), file || undefined, audioFile || undefined);
      setMessage('');
      setFile(null);
      setAudioFile(null);
      setIsMultiLine(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setAudioFile(selectedFile);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="w-full"
      >
        <div
          className={cn(
            "bg-white shadow-[0px_4px_72.7px_0px_rgba(0,0,0,0.1)] relative transition-all duration-200",
            isMultiLine 
              ? "rounded-2xl py-3 px-4 sm:px-5 md:px-6 flex flex-col gap-3" 
              : "rounded-[50px] sm:rounded-[60px] h-[57px] px-4 sm:px-5 md:px-6 flex items-center justify-between"
          )}
        >
          <div className={cn(
            "flex-1 min-w-0",
            isMultiLine ? "w-full" : "flex items-center gap-4.5"
          )}>
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              aria-label="Upload file"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="رسالة"
              disabled={disabled}
              className={cn(
                "w-full bg-transparent border-none outline-none text-[#020202] text-[15px] sm:text-[16px] md:text-[18px] leading-[1.5] tracking-[-0.18px] placeholder:opacity-30 resize-none overflow-hidden text-right",
                isMultiLine 
                  ? "field-sizing-content max-h-48 min-h-[24px]" 
                  : "h-[24px]"
              )}
              style={{ 
                fontFamily: FONT_FAMILY,
              }}
              dir="rtl"
              rows={1}
            />
          </div>
          <div className={cn(
            isMultiLine ? "w-full flex justify-end gap-2.5" : "flex items-center gap-2.5"
          )}>
            {/* Voice Recording Button */}
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              aria-label="Record voice"
            >
              <img 
                src={VoiceIcon} 
                alt="Record voice" 
                className="w-6 h-6"
              />
            </button>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="hidden"
            />

            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full p-2 bg-[#00a69c] hover:bg-[#00a69c]/90 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Send message"
            >
              <img 
                src={SendIcon} 
                alt="Send" 
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

