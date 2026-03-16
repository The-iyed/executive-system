import { useState } from "react";
import { useModalStore } from "@gl/stores/modal-store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@gl/components/ui/dialog";
import { SearchInput } from "./SearchInput";
import { SearchOptions } from "./SearchOptions";
import { RecentSearches } from "./RecentSearches";
import { MeetingClassifications } from "./MeetingClassifications";
import { SearchResults } from "./SearchResults";

function SearchModal() {
  const activeModal = useModalStore((s) => s.activeModal);
  const closeModal = useModalStore((s) => s.closeModal);
  const isOpen = activeModal === "search";

  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  function handleClose() {
    closeModal();
    setQuery("");
    setIsSearchActive(false);
  }

  function handleClear() {
    setQuery("");
    setIsSearchActive(false);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="dark flex max-h-[85vh] max-w-[calc(100%-2.5rem)] flex-col overflow-hidden border-white/10 bg-[#1a1a2e] p-4 sm:p-6 lg:max-w-5xl"
      >
        <DialogTitle className="sr-only">البحث في الاجتماعات</DialogTitle>

        <div dir="rtl" className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
          <SearchInput
            value={query}
            isActive={isSearchActive}
            onChange={setQuery}
            onFocus={() => setIsSearchActive(true)}
            onClear={handleClear}
          />

          {/* Default view */}
          <div
            className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto transition-all duration-300 lg:overflow-hidden ${
              isSearchActive
                ? "pointer-events-none absolute opacity-0"
                : "relative opacity-100"
            }`}
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
              <div className="scrollbar-hide min-h-0 lg:col-span-3 lg:overflow-y-auto">
                <SearchOptions />
              </div>
              <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                <RecentSearches />
                <MeetingClassifications />
              </div>
            </div>
          </div>

          {/* Search results view */}
          <div
            className={`min-h-0 flex-1 transition-all duration-300 ${
              isSearchActive
                ? "relative opacity-100"
                : "pointer-events-none absolute opacity-0"
            }`}
          >
            <SearchResults query={query} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SearchModal };
