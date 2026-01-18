# AsyncSelect Component

A production-ready, reusable async select component with pagination, infinite scroll, and search functionality built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Server-side pagination** - Fetch options from API with pagination support
- ✅ **Infinite scroll** - Automatically loads more items when scrolling near bottom
- ✅ **Debounced search** - Optimized search with configurable debounce delay
- ✅ **Single & Multi-select** - Support for both selection modes
- ✅ **Controlled component** - Full control over value and onChange
- ✅ **Loading states** - Loading indicators during fetch operations
- ✅ **Error handling** - Display error messages when requests fail
- ✅ **Empty states** - Customizable empty state messages
- ✅ **Keyboard navigation** - Full keyboard support via Command component
- ✅ **Performance optimized** - Request cancellation, caching, and race condition handling
- ✅ **React Query support** - Optional version using `useInfiniteQuery`
- ✅ **Accessibility** - ARIA roles and keyboard navigation
- ✅ **Customizable** - Custom render functions for options and selected values

## Installation

The component is already included in the `@sanad-ai/ui` package. Import it like this:

```tsx
import { AsyncSelect } from '@sanad-ai/ui';
```

## Basic Usage

### Single Select

```tsx
import { AsyncSelect } from '@sanad-ai/ui';
import type { PaginatedResponse, AsyncSelectOption } from '@sanad-ai/ui';

function MyComponent() {
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
      data: data.items.map((item) => ({
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
```

### Multi-Select

```tsx
<AsyncSelect
  multiple
  fetchOptions={fetchOptions}
  value={values}
  onValueChange={setValues}
  placeholder="Select tags..."
  searchable
  clearable
/>
```

### React Query Version

For better caching and background refetching, use the React Query version:

```tsx
import { AsyncSelectQuery } from '@sanad-ai/ui';

<AsyncSelectQuery
  queryKey={['users', searchTerm]}
  queryFn={async (search, page) => {
    const response = await fetch(`/api/users?search=${search}&page=${page}`);
    return response.json();
  }}
  value={value}
  onValueChange={setValue}
  placeholder="Select a user..."
/>
```

## API Contract

Your API should return data in the following format:

```typescript
interface PaginatedResponse<T> {
  data: Array<T>;        // Array of options
  page: number;          // Current page number (0-indexed)
  pageSize: number;      // Number of items per page
  total: number;         // Total number of items
  hasMore: boolean;      // Whether there are more pages
}
```

Each option should have:

```typescript
interface AsyncSelectOption<T> {
  id: string;            // Unique identifier
  label: string;         // Display text
  disabled?: boolean;    // Whether option is disabled
  description?: string;  // Optional description
  icon?: React.ReactNode; // Optional icon
  data?: T;              // Optional additional data
}
```

## Props

### AsyncSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fetchOptions` | `FetchOptionsFn<T>` | **required** | Function to fetch options from API |
| `value` | `T \| T[]` | - | Selected value(s) |
| `onValueChange` | `(value: T \| T[] \| undefined) => void` | - | Callback when value changes |
| `multiple` | `boolean` | `false` | Enable multi-select mode |
| `pageSize` | `number` | `20` | Number of items per page |
| `searchDebounceMs` | `number` | `300` | Debounce delay for search (ms) |
| `placeholder` | `string` | `"Select..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether select is disabled |
| `searchable` | `boolean` | `true` | Enable search input |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `clearable` | `boolean` | `false` | Show clear button |
| `emptyMessage` | `string` | `"No results found."` | Message when no results |
| `errorMessage` | `string \| null` | - | Custom error message |
| `maxHeight` | `number` | `300` | Max height of options list (px) |
| `loadMoreThreshold` | `number` | `100` | Distance from bottom to trigger load (px) |
| `className` | `string` | - | Custom className for trigger |
| `popoverClassName` | `string` | - | Custom className for popover |
| `width` | `string \| number` | `"200px"` | Width of trigger |
| `renderOption` | `(option) => ReactNode` | - | Custom option renderer |
| `renderSelected` | `(option) => ReactNode` | - | Custom selected value renderer |
| `renderMultiSelected` | `(options) => ReactNode` | - | Custom multi-select renderer |

## Architecture & Logic Flow

### Component Structure

```
async-select/
├── types.ts                    # Type definitions
├── hooks/
│   ├── useDebounce.ts          # Debounce hook
│   ├── useInfinitePagination.ts # Infinite scroll hook
│   └── useAsyncSelect.ts       # Main async select logic
├── async-select.tsx            # Main component
├── async-select-query.tsx      # React Query version
├── example-usage.tsx           # Usage examples
└── index.ts                    # Exports
```

### Logic Flow

1. **Initialization**
   - Component mounts, dropdown is closed
   - No API calls are made until dropdown opens

2. **Opening Dropdown**
   - User clicks trigger button
   - `open` state becomes `true`
   - `useAsyncSelect` hook is enabled
   - Initial fetch is triggered with `page=0`

3. **Search Flow**
   - User types in search input
   - `setSearchTerm` updates search state
   - `useDebounce` delays the debounced value
   - When debounced value changes:
     - Previous request is cancelled (AbortController)
     - Cache is checked for this search query
     - If cached, use cached data
     - Otherwise, fetch new data with `page=0`
     - Options list is reset

4. **Pagination Flow**
   - User scrolls down the options list
   - `useInfinitePagination` hook monitors scroll position
   - When user is within `loadMoreThreshold` pixels from bottom:
     - Check if `hasMore` is true
     - Check if not already loading
     - Call `loadMore()` function
     - Fetch next page (`currentPage + 1`)
     - Append new options to existing list
     - Update `hasMore` based on API response

5. **Selection Flow**
   - User clicks an option
   - `handleSelect` is called
   - For single select: set value and close dropdown
   - For multi-select: toggle option in array, keep dropdown open
   - `onValueChange` callback is invoked

6. **Performance Optimizations**
   - **Request Cancellation**: Previous requests are aborted when new ones start
   - **Caching**: Results are cached per search query to avoid duplicate requests
   - **Race Condition Handling**: Loading flags prevent concurrent requests
   - **Debouncing**: Search input is debounced to reduce API calls
   - **Memoization**: Selected options and display values are memoized

### Custom Hooks

#### `useDebounce<T>(value: T, delay: number): T`
Debounces a value, updating it only after the specified delay.

#### `useInfinitePagination(onLoadMore, hasMore, loading, threshold)`
Sets up scroll listener and intersection observer for infinite scroll pagination.

#### `useAsyncSelect(fetchOptions, pageSize, searchDebounceMs, enabled)`
Main hook that manages:
- Options state
- Loading state
- Error state
- Pagination state
- Search state
- Caching
- Request cancellation

## Performance Optimizations

1. **Request Cancellation**: Uses AbortController to cancel in-flight requests
2. **Caching**: Results are cached per search query to avoid duplicate fetches
3. **Debouncing**: Search input is debounced to reduce API calls
4. **Memoization**: Expensive computations are memoized
5. **Race Condition Prevention**: Loading flags prevent concurrent requests
6. **Lazy Loading**: Only fetches when dropdown is open

## Accessibility

- Uses ARIA roles (`combobox`, `listbox`)
- Full keyboard navigation support via Command component
- Focus management
- Screen reader friendly

## Examples

See `example-usage.tsx` for comprehensive examples including:
- Basic single select
- Multi-select
- Custom rendering
- React Query integration
- Error handling
- Custom styling

## Testing

Example test structure:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AsyncSelect } from '@sanad-ai/ui';

test('loads and displays options', async () => {
  const fetchOptions = jest.fn().mockResolvedValue({
    data: [{ id: '1', label: 'Option 1' }],
    page: 0,
    pageSize: 20,
    total: 1,
    hasMore: false,
  });

  render(<AsyncSelect fetchOptions={fetchOptions} />);
  
  // Open dropdown
  await userEvent.click(screen.getByRole('combobox'));
  
  // Wait for options to load
  await waitFor(() => {
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **API Design**: Ensure your API supports pagination and search parameters
2. **Error Handling**: Always handle errors gracefully and show user-friendly messages
3. **Loading States**: Show loading indicators during fetch operations
4. **Caching**: Leverage React Query version for better caching if using React Query
5. **Performance**: Use appropriate `pageSize` based on your data size
6. **Accessibility**: Always provide meaningful labels and ARIA attributes

## Troubleshooting

### Options not loading
- Check that `fetchOptions` returns the correct format
- Verify API endpoint is accessible
- Check browser console for errors

### Infinite scroll not working
- Ensure `hasMore` is correctly returned from API
- Check that scroll container has proper height constraints
- Verify `loadMoreThreshold` is appropriate

### Search not working
- Check debounce delay is not too long
- Verify search parameter is being sent to API
- Check that API handles search correctly

## License

Part of the @sanad-ai/ui component library.
