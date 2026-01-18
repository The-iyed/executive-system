/**
 * Example usage of AsyncSelect component
 * 
 * This file demonstrates various use cases for the AsyncSelect component
 * including single select, multi-select, and React Query integration.
 */

import { useState } from 'react';
import { AsyncSelect } from './async-select';
import { AsyncSelectQuery } from './async-select-query';
import type { PaginatedResponse, AsyncSelectOption } from './types';

// ============================================================================
// Example 1: Basic Single Select
// ============================================================================

export function BasicExample() {
  const [value, setValue] = useState<string>();

  const fetchOptions = async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    // Simulate API call
    const response = await fetch(
      `/api/users?search=${search || ''}&page=${page || 0}&pageSize=${pageSize || 20}`
    );
    const data = await response.json();

    // Transform API response to match expected format
    return {
      data: data.items.map((item: any) => ({
        id: item.id,
        label: item.name,
        description: item.email,
      })),
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  return (
    <AsyncSelect
      fetchOptions={fetchOptions}
      value={value}
      onValueChange={setValue}
      placeholder="Select a user..."
      searchable
      clearable
    />
  );
}

// ============================================================================
// Example 2: Multi-Select
// ============================================================================

export function MultiSelectExample() {
  const [values, setValues] = useState<string[]>([]);

  const fetchOptions = async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    const response = await fetch(
      `/api/tags?search=${search || ''}&page=${page || 0}&pageSize=${pageSize || 20}`
    );
    const data = await response.json();

    return {
      data: data.items.map((item: any) => ({
        id: item.id,
        label: item.name,
      })),
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  return (
    <AsyncSelect<string>
      multiple
      fetchOptions={fetchOptions}
      value={values}
      onValueChange={(newValues) => setValues(newValues || [])}
      placeholder="Select tags..."
      searchable
      clearable
      renderMultiSelected={(options) => (
        <div className="flex gap-1 flex-wrap">
          {options.map((opt) => (
            <span
              key={opt.id}
              className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}
    />
  );
}

// ============================================================================
// Example 3: Custom Rendering
// ============================================================================

export function CustomRenderingExample() {
  const [value, setValue] = useState<string>();

  const fetchOptions = async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    const response = await fetch(
      `/api/products?search=${search || ''}&page=${page || 0}&pageSize=${pageSize || 20}`
    );
    const data = await response.json();

    return {
      data: data.items.map((item: any) => ({
        id: item.id,
        label: item.name,
        description: `$${item.price}`,
        icon: <span>🛍️</span>,
      })),
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  return (
    <AsyncSelect
      fetchOptions={fetchOptions}
      value={value}
      onValueChange={setValue}
      placeholder="Select a product..."
      renderOption={(option) => (
        <div className="flex items-center gap-3 w-full">
          {option.icon}
          <div className="flex flex-col flex-1">
            <span className="font-medium">{option.label}</span>
            {option.description && (
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ============================================================================
// Example 4: React Query Version
// ============================================================================

export function ReactQueryExample() {
  const [value, setValue] = useState<string>();

  const queryFn = async (
    search?: string,
    pageParam?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    const response = await fetch(
      `/api/users?search=${search || ''}&page=${pageParam || 0}&pageSize=20`
    );
    const data = await response.json();

    return {
      data: data.items.map((item: any) => ({
        id: item.id,
        label: item.name,
        description: item.email,
      })),
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  return (
    <AsyncSelectQuery
      queryKey={['users']}
      queryFn={queryFn}
      value={value}
      onValueChange={setValue}
      placeholder="Select a user..."
      searchable
      clearable
    />
  );
}

// ============================================================================
// Example 5: With Error Handling
// ============================================================================

export function ErrorHandlingExample() {
  const [value, setValue] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    try {
      const response = await fetch(
        `/api/users?search=${search || ''}&page=${page || 0}&pageSize=${pageSize || 20}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setError(null);

      return {
        data: data.items.map((item: any) => ({
          id: item.id,
          label: item.name,
        })),
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        hasMore: data.hasMore,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return (
    <AsyncSelect
      fetchOptions={fetchOptions}
      value={value}
      onValueChange={setValue}
      placeholder="Select a user..."
      errorMessage={error}
      searchable
    />
  );
}

// ============================================================================
// Example 6: Custom Styling
// ============================================================================

export function CustomStylingExample() {
  const [value, setValue] = useState<string>();

  const fetchOptions = async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    const response = await fetch(
      `/api/users?search=${search || ''}&page=${page || 0}&pageSize=${pageSize || 20}`
    );
    const data = await response.json();

    return {
      data: data.items.map((item: any) => ({
        id: item.id,
        label: item.name,
      })),
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  return (
    <AsyncSelect
      fetchOptions={fetchOptions}
      value={value}
      onValueChange={setValue}
      placeholder="Select a user..."
      className="border-2 border-primary"
      popoverClassName="shadow-lg"
      width={400}
      maxHeight={400}
      searchable
    />
  );
}
