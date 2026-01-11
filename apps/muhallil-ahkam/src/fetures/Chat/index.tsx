import { WelcomeMessage } from '../../components/welcome-message';
import { PdfUploadModal } from '../../components/pdf-upload-modal';
import type { CourtType } from '../../components/court-tabs';

const Chat = () => {
  const handleStartAnalysis = (files: File[], courtType: CourtType, multipleFiles: boolean) => {
    // TODO: Implement analysis logic
  };
  
  return (
    <div className="ahkam-chat-app h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <WelcomeMessage userName="عبد الله" />

        <PdfUploadModal onStartAnalysis={handleStartAnalysis} />
      </div>
    </div>
  )
}

export default Chat