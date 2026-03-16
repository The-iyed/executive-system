import { useModalStore } from "@gl/stores/modal-store";
import { Dialog, DialogContent, DialogTitle } from "@gl/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@gl/components/ui/tabs";
import { VoiceRequestTab } from "./VoiceRequestTab";
import { WrittenRequestTab } from "./WrittenRequestTab";

function MeetingRequestModal() {
  const activeModal = useModalStore((s) => s.activeModal);
  const closeModal = useModalStore((s) => s.closeModal);

  const isOpen = activeModal === "meeting-request";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="gap-0 p-6 sm:max-w-xl">
        <DialogTitle className="sr-only">طلب اجتماع</DialogTitle>

        <div dir="rtl">
          <Tabs defaultValue="voice" dir="rtl">
            <div className="flex justify-center">
              <TabsList
                variant="default"
                className="h-auto rounded-full bg-muted/60 p-1"
              >
                <TabsTrigger
                  value="voice"
                  className="rounded-full px-5 py-2.5 text-sm font-medium data-[state=active]:bg-linear-to-l data-[state=active]:from-[#048F86] data-[state=active]:to-[#6DCDCD] data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  طلب اجتماع عبر الصوت
                </TabsTrigger>
                <TabsTrigger
                  value="written"
                  className="rounded-full px-5 py-2.5 text-sm font-medium data-[state=active]:bg-linear-to-l data-[state=active]:from-[#048F86] data-[state=active]:to-[#6DCDCD] data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  طلب اجتماع كتابي
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="voice">
              <VoiceRequestTab onClose={closeModal} />
            </TabsContent>

            <TabsContent value="written">
              <WrittenRequestTab onClose={closeModal} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { MeetingRequestModal };
