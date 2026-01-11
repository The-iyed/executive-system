import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeMessage } from '../../components/welcome-message';
import { PdfUploadModal, type PdfUploadModalRef } from '../../components/pdf-upload-modal';
import type { CourtType } from '../../components/court-tabs';
import { useDocumentSplitter } from '../../hooks/use-document-splitter';
import { useToast } from '@sanad-ai/ui';
import { PATH } from '../../routes/path';

const Chat = () => {
  const navigate = useNavigate();
  const { mutate: splitDocuments, isPending } = useDocumentSplitter();
  const { toast } = useToast();
  const pdfUploadModalRef = useRef<PdfUploadModalRef>(null);

  const handleStartAnalysis = (files: File[], courtType: CourtType, multipleFiles: boolean) => {
    console.log('Starting analysis with:', { files, courtType, multipleFiles });
    
    splitDocuments(files, {
      onSuccess: (response) => {
        toast({
          title: 'نجح التحميل',
          description: 'تم تحميل وتحليل الملفات بنجاح',
        });
        pdfUploadModalRef.current?.resetFiles();
        
        if (response.conversation_id) {
          navigate(PATH.CASE_FILES.replace(':conversation_id', response.conversation_id));
        }
      },
      onError: (error) => {
        toast({
          title: 'حدث خطأ',
          description: error?.message || 'حدث خطأ أثناء تحميل الملفات',
          variant: 'destructive',
        });
      },
    });
  };
  
  return (
    <div className="ahkam-chat-app h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <WelcomeMessage userName="عبد الله" />

        <PdfUploadModal 
          ref={pdfUploadModalRef}
          onStartAnalysis={handleStartAnalysis}
          isLoading={isPending}
        />
      </div>
    </div>
  )
}

export default Chat