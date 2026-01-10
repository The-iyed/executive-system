import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { cn } from '@sanad-ai/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sanad-ai/ui';
import { FileText } from 'lucide-react';
import SendIcon from '../assets/send-icon.svg';
import VoiceIcon from '../assets/voice.svg';


export interface ChatInputProps {
  onSendMessage: (message: string, file?: File, audioFile?: File, letterResponse?: boolean) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const letterFileInputRef = useRef<HTMLInputElement>(null);
  
  // Recording refs following voice-recorder.tsx pattern
  const mediaRecorderRef = useRef<{
    stream: MediaStream | null;
    analyser: AnalyserNode | null;
    mediaRecorder: MediaRecorder | null;
    audioContext: AudioContext | null;
  }>({
    stream: null,
    analyser: null,
    mediaRecorder: null,
    audioContext: null,
  });
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const isAcceptedRef = useRef<boolean>(false);
  // Store mediaRecorder directly in a ref for easier access
  const activeMediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleLetterFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('Letter file selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        file: selectedFile
      });
      // Store file in a variable to ensure it's not lost
      const fileToSend = selectedFile;
      
      // Verify file is still available before sending
      console.log('About to call onSendMessage with file:', {
        hasFile: !!fileToSend,
        fileName: fileToSend.name,
        fileSize: fileToSend.size,
        fileType: fileToSend.type,
      });
      
      // Send file directly with letter_response: true and query: "ولد خطاب"
      // Call immediately - the file is already available from the event
      // Log the function being called to verify it's the right one
      console.log('onSendMessage function details:', {
        type: typeof onSendMessage,
        name: onSendMessage.name,
        length: onSendMessage.length,
        toString: onSendMessage.toString().substring(0, 200),
      });
      
      // Call with explicit parameters - ensure all 4 parameters are passed
      const arg1 = 'ولد خطاب';
      const arg2 = fileToSend;
      const arg3 = undefined;
      const arg4 = true;
      
      console.log('Calling onSendMessage with args:', {
        arg1,
        arg2: arg2 ? { name: arg2.name, size: arg2.size, type: arg2.type } : arg2,
        arg3,
        arg4,
      });
      
      // Call the function - if it's wrapped incorrectly, this will show in logs
      const result = onSendMessage(arg1, arg2, arg3, arg4);
      console.log('onSendMessage call result:', result);
      
      // Reset the input after a brief delay to ensure the file is processed
      // Don't reset immediately as it might clear the file reference
      setTimeout(() => {
        if (letterFileInputRef.current) {
          letterFileInputRef.current.value = '';
        }
      }, 100);
    } else {
      console.warn('No file selected in handleLetterFileSelect');
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context and analyser (following voice-recorder pattern)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Determine mimeType - prioritize formats that are playable in browser audio elements
      // Note: For browser playback, WebM is most reliable. MP4/M4A may not play in all browsers.
      // We'll use WebM for recording (best browser support) but name it as MP3 for API compatibility
      let mimeType = "audio/webm;codecs=opus"; // Default - best browser support
      let fileExtension = "webm";
      
      // Try formats in order - prioritize WebM for browser playback compatibility
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
        fileExtension = "webm";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
        fileExtension = "webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
        fileExtension = "m4a";
      } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
        mimeType = "audio/mpeg";
        fileExtension = "mp3";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
        fileExtension = "ogg";
      }
      
      console.log('Recording with audio format:', mimeType, 'extension:', fileExtension);

      const options = { mimeType };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      console.log('Created MediaRecorder:', mediaRecorder, 'state:', mediaRecorder.state);
      
      // Store file extension for later use
      (mediaRecorderRef.current as any).fileExtension = fileExtension;
      
      // Store refs (following voice-recorder pattern)
      // IMPORTANT: Update the existing ref object, don't replace it
      mediaRecorderRef.current.stream = stream;
      mediaRecorderRef.current.analyser = analyser;
      mediaRecorderRef.current.mediaRecorder = mediaRecorder;
      mediaRecorderRef.current.audioContext = audioCtx;
      
      // Also store in a separate ref for easier access
      activeMediaRecorderRef.current = mediaRecorder;
      
      console.log('Stored in ref:', {
        hasMediaRecorder: !!mediaRecorderRef.current.mediaRecorder,
        mediaRecorderState: mediaRecorderRef.current.mediaRecorder?.state,
        activeMediaRecorder: !!activeMediaRecorderRef.current
      });
      
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      // Reset accepted flag for new recording
      isAcceptedRef.current = false;
      
      mediaRecorder.onstop = () => {
        // Don't process if already accepted
        if (isAcceptedRef.current) {
          recordingChunksRef.current = [];
          return;
        }
        
        // Process the recording when stopped
        if (recordingChunksRef.current.length > 0) {
          const originalFileExtension = (mediaRecorderRef.current as any).fileExtension || 'webm';
          
          // Create blob with correct MIME type
          const recordBlob = new Blob(recordingChunksRef.current, {
            type: mimeType,
          });
          
          // Verify blob is valid
          if (recordBlob.size === 0) {
            console.error('Recorded audio blob is empty');
            return;
          }
          
          // Always use MP3 extension as requested by user
          // Note: Browsers don't natively support MP3 recording via MediaRecorder
          // We record in WebM (best browser playback) but name it as MP3 for API
          // The API should handle the actual format based on the MIME type
          const finalMimeType = mimeType; // Keep original MIME type (WebM) for browser playback
          const finalExtension = 'mp3'; // Always use MP3 extension for API
          
          console.log('Creating audio file:', {
            originalFormat: mimeType,
            originalExtension: originalFileExtension,
            finalExtension: finalExtension,
            blobSize: recordBlob.size,
            blobType: recordBlob.type
          });
          
          // Create file with MP3 extension but keep WebM MIME type for browser playback
          const recordedFile = new File([recordBlob], `recording-${Date.now()}.mp3`, {
            type: finalMimeType, // WebM MIME type for browser compatibility
          });
          
          // Verify the file is valid
          console.log('Created audio file:', {
            name: recordedFile.name,
            type: recordedFile.type,
            size: recordedFile.size,
            extension: finalExtension
          });
          
          // Test if we can create a blob URL
          const testBlobUrl = URL.createObjectURL(recordedFile);
          console.log('Test blob URL created:', testBlobUrl);
          // Don't revoke it - we'll use it in the message
          
          setAudioFile(recordedFile);
          setShowRecordingControls(true);
        }
        recordingChunksRef.current = [];
      };

      // Store mediaRecorder in a variable that we can access later
      const currentMediaRecorder = mediaRecorder;
      
      mediaRecorder.start();
      
      // Double-check the ref is set correctly
      console.log('After start, ref check:', {
        hasMediaRecorder: !!mediaRecorderRef.current.mediaRecorder,
        mediaRecorderState: mediaRecorderRef.current.mediaRecorder?.state,
        isSameInstance: mediaRecorderRef.current.mediaRecorder === mediaRecorder,
        refObject: mediaRecorderRef.current
      });
      
      // Verify one more time before setting state
      if (!mediaRecorderRef.current.mediaRecorder) {
        console.error('MediaRecorder was lost from ref! Re-setting...');
        mediaRecorderRef.current.mediaRecorder = currentMediaRecorder;
        mediaRecorderRef.current.stream = stream;
        mediaRecorderRef.current.analyser = analyser;
        mediaRecorderRef.current.audioContext = audioCtx;
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      setShowRecordingControls(false);
      setAudioFile(null); // Clear any previous audio file
      
      // Final verification after state update
      setTimeout(() => {
        console.log('After state update, ref check:', {
          hasMediaRecorder: !!mediaRecorderRef.current.mediaRecorder,
          mediaRecorderState: mediaRecorderRef.current.mediaRecorder?.state
        });
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    // Try to get mediaRecorder from multiple sources
    const mediaRecorder = activeMediaRecorderRef.current || mediaRecorderRef.current.mediaRecorder;
    const { stream, analyser, audioContext } = mediaRecorderRef.current;

    console.log('stopRecording called, mediaRecorder:', mediaRecorder, 'isRecording:', isRecording, 'state:', mediaRecorder?.state);
    console.log('Full ref:', mediaRecorderRef.current);
    console.log('Active mediaRecorder ref:', activeMediaRecorderRef.current);

    if (mediaRecorder && isRecording) {
      try {
        // Stop the recorder - onstop handler will process the recording
        if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
          mediaRecorder.stop();
          console.log('MediaRecorder stopped, new state:', mediaRecorder.state);
        } else {
          console.warn('MediaRecorder state is not recording:', mediaRecorder.state);
        }
        setIsRecording(false);
        
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        // Cleanup audio resources after stopping
        if (analyser) {
          analyser.disconnect();
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (audioContext) {
          audioContext.close();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    } else {
      console.warn('Cannot stop recording - mediaRecorder:', !!mediaRecorder, 'isRecording:', isRecording);
    }
  };

  const resetRecording = () => {
    const { mediaRecorder, stream, analyser, audioContext } = mediaRecorderRef.current;

    // Mark as accepted to prevent onstop handler from running
    isAcceptedRef.current = true;

    if (mediaRecorder) {
      // Clear onstop handler
      mediaRecorder.onstop = null;
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }

    // Stop the web audio context and the analyser node
    if (analyser) {
      analyser.disconnect();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    
    setIsRecording(false);
    setShowRecordingControls(false);
    setRecordingTime(0);
    setAudioFile(null);
    recordingChunksRef.current = [];
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Reset refs - update properties individually to preserve ref identity
    mediaRecorderRef.current.stream = null;
    mediaRecorderRef.current.analyser = null;
    mediaRecorderRef.current.mediaRecorder = null;
    mediaRecorderRef.current.audioContext = null;
  };

  const handleAcceptRecording = () => {
    if (!audioFile || audioFile.size === 0) {
      console.warn('No audio file to send or file is empty');
      resetRecording();
      return;
    }
    
    // Mark as accepted to prevent onstop handler from running
    isAcceptedRef.current = true;
    
    // Clear the onstop handler to prevent it from firing
    const { mediaRecorder } = mediaRecorderRef.current;
    if (mediaRecorder) {
      mediaRecorder.onstop = null;
    }
    
    // Store the file before resetting state
    const fileToSend = audioFile;
    
    // Reset all state immediately
    setAudioFile(null);
    setShowRecordingControls(false);
    setRecordingTime(0);
    setIsRecording(false);
    recordingChunksRef.current = [];
    
    // Reset refs - update properties individually to preserve ref identity
    mediaRecorderRef.current.stream = null;
    mediaRecorderRef.current.analyser = null;
    mediaRecorderRef.current.mediaRecorder = null;
    mediaRecorderRef.current.audioContext = null;
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Send the message with the audio file
    onSendMessage('', undefined, fileToSend);
  };

  const handleRejectRecording = () => {
    resetRecording();
  };

  const handleVoiceButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Voice button clicked, isRecording:', isRecording);
    
    if (isRecording) {
      console.log('Stopping recording...');
      stopRecording();
    } else {
      console.log('Starting recording...');
      startRecording();
    }
  };

  // Timer effect (following voice-recorder pattern)
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = window.setTimeout(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, [isRecording, recordingTime]);

  // Cleanup on unmount only (don't run on isRecording changes)
  useEffect(() => {
    return () => {
      const { mediaRecorder, stream, analyser, audioContext } = mediaRecorderRef.current;
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      
      // Stop recording if still active
      if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        try {
          mediaRecorder.stop();
        } catch (e) {
          console.warn('Error stopping mediaRecorder in cleanup:', e);
        }
      }
      
      // Cleanup audio context and analyser
      if (analyser) {
        try {
          analyser.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }
      
      // Stop all tracks to release microphone
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      // Close audio context
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (e) {
          // Already closed
        }
      }
      
      // Reset refs - update properties individually
      mediaRecorderRef.current.stream = null;
      mediaRecorderRef.current.analyser = null;
      mediaRecorderRef.current.mediaRecorder = null;
      mediaRecorderRef.current.audioContext = null;
      activeMediaRecorderRef.current = null;
    };
  }, []); // Empty dependency array - only run on unmount

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
            {/* File Upload Button with Dropdown Menu */}
            {!isRecording && !showRecordingControls && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 disabled:opacity-50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0"
                    aria-label="Upload options"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] bg-white border border-gray-200 shadow-lg">
          
                  <DropdownMenuItem
                    onClick={() => letterFileInputRef.current?.click()}
                    className="cursor-pointer text-right hover:bg-gray-100"
                    dir="rtl"
                  >
                    <FileText className="w-4 h-4 ml-2" />
                    <span>تحميل الخطاب</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={letterFileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleLetterFileSelect}
              className="hidden"
            />

            {/* Recording Controls or Textarea */}
            {showRecordingControls ? (
              <div className="flex-1 flex items-center justify-between gap-2" dir="rtl">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <img src={VoiceIcon} alt="Recording" className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRejectRecording}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Reject recording"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptRecording}
                    className="w-7 h-7 rounded-full bg-[#00a69c] hover:bg-[#00a69c]/90 flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Accept and send recording"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6 11L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : isRecording ? (
              <div className="flex-1 flex items-center gap-2" dir="rtl">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{formatTime(recordingTime)}</span>
              </div>
            ) : (
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
              
                dir="rtl"
                rows={1}
              />
            )}
          </div>
          <div className={cn(
            isMultiLine ? "w-full flex justify-end gap-2.5" : "flex items-center gap-2.5"
          )}>
            {/* Voice Recording Button */}
            {!showRecordingControls && (
              <button
                type="button"
                onClick={handleVoiceButtonClick}
                disabled={disabled && !isRecording}
                className={cn(
                  "w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors",
                  isRecording 
                    ? "bg-red-500 rounded-full animate-pulse cursor-pointer" 
                    : "disabled:opacity-50",
                  disabled && !isRecording && "cursor-not-allowed"
                )}
                aria-label={isRecording ? "Stop recording" : "Record voice"}
                title={isRecording ? `Recording... ${recordingTime}s - Click to stop` : "Record voice"}
                style={{ pointerEvents: disabled && !isRecording ? 'none' : 'auto' }}
              >
                <img 
                  src={VoiceIcon} 
                  alt={isRecording ? "Stop recording" : "Record voice"} 
                  className={cn("w-6 h-6", isRecording && "brightness-0 invert")}
                />
              </button>
            )}

            {!isRecording && !showRecordingControls && (
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

