import React, { useState, useCallback, useRef } from 'react';
import { FormTable, ActionButtons, FormAsyncSelectV2 } from '@shared';
import {
  INVITEES_TABLE_COLUMNS,
  INVITEES_TABLE_TITLE,
  ADD_INVITEE_BUTTON_LABEL,
} from '../../utils/constants';
import type { Step2FormData } from '../../schemas/step2.schema';
import { getUsers } from '../../../../data/usersApi';
import type { UserApiResponse } from '../../../../data/usersApi';

export interface Step2Props {
  // Form data and state
  formData: Partial<Step2FormData>;
  errors: Record<string, Record<string, string>>;
  touched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  
  // Handlers
  handleAddAttendee: () => void;
  handleDeleteAttendee: (id: string) => void;
  handleUpdateAttendee: (id: string, field: string, value: any) => void;
  handleAddUserFromSelect: (userOption: { 
    value: string; 
    label: string; 
    description?: string; 
    username?: string;
    position?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
}

export const Step2: React.FC<Step2Props> = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isDeleting,
  handleAddAttendee,
  handleDeleteAttendee,
  handleUpdateAttendee,
  handleAddUserFromSelect,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // Use a ref to store all loaded options (Map for O(1) lookup)
  const userOptionsMapRef = useRef<Map<string, { 
    value: string; 
    label: string; 
    description?: string; 
    username?: string; 
    position?: string; 
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }>>(new Map());

  // Handle user selection from async select
  const handleUserSelect = useCallback((userId: string | number | null) => {
    if (!userId) {
      setSelectedUserId(null);
      return;
    }
    
    // Convert to string for lookup
    const userIdString = String(userId);
    
    // Find the selected user option from the map
    const selectedOption = userOptionsMapRef.current.get(userIdString);
    if (selectedOption) {
      handleAddUserFromSelect(selectedOption);
      // Clear selection after adding
      setSelectedUserId(null);
    } else {
      // If option not found, just clear selection
      setSelectedUserId(null);
    }
  }, [handleAddUserFromSelect]);

  // Load options function for FormAsyncSelectV2
  const handleLoadOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });

      // Map users to options format
      const items = response.items.map((user: UserApiResponse) => {
        // Construct name from first_name and last_name
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
        
        return {
          value: user.id,
          label: fullName,
          description: user.email,
          username: user.username || fullName, // Store username for display
          position: user.position || '',
          phone_number: user.phone_number || '',
          first_name: user.first_name || '', // Store first_name for mapper
          last_name: user.last_name || '', // Store last_name for mapper
        };
      });

      // Store all options in the map for quick lookup
      items.forEach((option) => {
        userOptionsMapRef.current.set(option.value, option);
      });

      // Return paginated response matching the API format
      return {
        items,
        total: response.total,
        skip: response.skip,
        limit: response.limit,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      };
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex flex-col gap-6">
        <FormAsyncSelectV2
          value={selectedUserId}
          onValueChange={handleUserSelect}
          placeholder="اختر أحدَ المشتركين في المنصّة"
          loadOptions={handleLoadOptions}
          isClearable
          fullWidth
          className='max-w-[1085px] mx-auto'
          isSearchable={true}
          limit={10}
          searchPlaceholder="ابحث عن مستخدم..."
          emptyMessage="لم يتم العثور على مستخدمين"
        />
        {/* Table */}
        <FormTable
          title={INVITEES_TABLE_TITLE}
          columns={INVITEES_TABLE_COLUMNS}
          rows={formData.invitees || []}
          onAddRow={handleAddAttendee}
          onDeleteRow={handleDeleteAttendee}
          onUpdateRow={handleUpdateAttendee}
          addButtonLabel={ADD_INVITEE_BUTTON_LABEL}
          errors={errors}
          touched={touched}
        />

        {/* Action Buttons */}
        <ActionButtons
          onCancel={handleCancelClick}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </div>
    </div>
  );
};
