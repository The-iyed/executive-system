import { MOCK_CLASSIFICATIONS } from "@gl/data/mock-search";

function MeetingClassifications() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">
        تصنيفات الاجتماعات
      </h3>
      <div className="rounded-xl bg-white/5 p-3">
        <div className="grid grid-cols-3 gap-2">
          {MOCK_CLASSIFICATIONS.map((tag) => (
            <button
              key={tag.id}
              className="rounded-lg bg-white/10 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { MeetingClassifications };
