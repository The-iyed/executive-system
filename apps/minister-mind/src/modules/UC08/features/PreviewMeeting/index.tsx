import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const PreviewMeeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setSearchParams] = useSearchParams();

  const handleEdit = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('form', 'edit');
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-bold mb-4">معاينة الاجتماع</h1>
        <p>معاينة الاجتماع - قيد التطوير</p>
        {id && (
          <button
            type="button"
            onClick={handleEdit}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            تعديل
          </button>
        )}
      </div>
    </div>
  );
};

export default PreviewMeeting;
