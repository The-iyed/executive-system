import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { UseQueryResult } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/popover"

export interface AsyncSelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
  has_next?: boolean
  has_previous?: boolean
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export interface AsyncSelectProps<T = any> {
  /**
   * Async function to fetch options
   * Can return either an array or a paginated response
   * Required if query is not provided
   */
  loadOptions?: (search?: string, skip?: number, limit?: number) => Promise<AsyncSelectOption<T>[] | PaginatedResponse<AsyncSelectOption<T>>>
  
  /**
   * React Query result (alternative to loadOptions)
   * Required if loadOptions is not provided
   */
  query?: UseQueryResult<AsyncSelectOption<T>[], Error>
  
  /**
   * Initial limit for pagination
   */
  limit?: number
  
  /**
   * Enable scroll pagination
   */
  enablePagination?: boolean
  
  /**
   * Current selected value
   */
  value?: T
  
  /**
   * Callback when value changes
   */
  onValueChange?: (value: T) => void
  
  /**
   * Placeholder text
   */
  placeholder?: string
  
  /**
   * Whether the select is disabled
   */
  disabled?: boolean
  
  /**
   * Custom className for the trigger button
   */
  className?: string
  
  /**
   * Custom className for the trigger button
   */
  triggerClassName?: string
  
  /**
   * Custom width for the popover
   */
  width?: string | number
  
  /**
   * Whether to enable search
   */
  searchable?: boolean
  
  /**
   * Search placeholder
   */
  searchPlaceholder?: string
  
  /**
   * Debounce delay for search (ms)
   */
  searchDebounceMs?: number
  
  /**
   * Custom empty message
   */
  emptyMessage?: string
  
  /**
   * Custom error message
   */
  errorMessage?: string | null
  
  /**
   * Custom label to display when value is set but not in options
   */
  selectedLabel?: string
  
  /**
   * Allow clearing selection
   */
  clearable?: boolean
  
  /**
   * Custom render function for each option
   */
  renderOption?: (option: AsyncSelectOption<T>) => React.ReactNode
  
  /**
   * Custom render function for selected value display
   */
  renderSelected?: (option: AsyncSelectOption<T> | null) => React.ReactNode
}

function DefaultLoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map((i) => (
        <CommandItem key={i} disabled>
          <div className="flex items-center gap-2 w-full">
            <div className="h-4 w-4 rounded animate-pulse bg-muted" />
            <div className="h-4 w-32 animate-pulse bg-muted rounded" />
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

export function AsyncSelectV2<T = string>({
  loadOptions,
  query,
  value,
  onValueChange,
  placeholder = "Select...",
  disabled = false,
  className,
  triggerClassName,
  width = "200px",
  searchable = true,
  searchPlaceholder,
  searchDebounceMs = 500,
  emptyMessage = "لم يتم العثور على نتائج.",
  errorMessage,
  selectedLabel,
  clearable = false,
  renderOption,
  renderSelected,
  enablePagination = false,
}: AsyncSelectProps<T>) {
  // Validate that either loadOptions or query is provided
  if (!loadOptions && !query) {
    console.warn('AsyncSelectV2: Either loadOptions or query must be provided')
  }

  // Ensure limit is always 6
  const finalLimit = 6
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<AsyncSelectOption<T>[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs)
  const [hasMore, setHasMore] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [skip, setSkip] = React.useState(0)
  const [popoverWidth, setPopoverWidth] = React.useState<string | number>(width)
  const commandListRef = React.useRef<React.ElementRef<typeof CommandList>>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isLoadingMoreRef = React.useRef(false)

  // Use React Query if provided, otherwise use loadOptions
  const isLoading = query ? (query.isLoading || query.isFetching) : loading
  const queryError = query?.error?.message ?? null
  const finalError = errorMessage || error || queryError

  // Reset pagination when search changes
  React.useEffect(() => {
    if (enablePagination) {
      setSkip(0)
      setOptions([])
    }
  }, [debouncedSearchTerm, enablePagination])

  // Load options when using loadOptions (not React Query)
  React.useEffect(() => {
    if (query) {
      // Use React Query data
      if (query.data) {
        setOptions(query.data)
      }
      return
    }

    // Use loadOptions function
    if (!loadOptions) {
      return
    }

    let cancelled = false

    const fetchOptions = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await loadOptions(
          searchable ? debouncedSearchTerm : undefined,
          enablePagination ? skip : undefined,
          enablePagination ? finalLimit : undefined
        )

        if (!cancelled) {
          // Check if result is paginated
          if (Array.isArray(result)) {
            if (enablePagination && skip > 0) {
              setOptions(prev => [...prev, ...result])
            } else {
              setOptions(result)
            }
            setHasMore(false)
          } else {
            // Paginated response
            if (enablePagination && skip > 0) {
              setOptions(prev => [...prev, ...result.items])
            } else {
              setOptions(result.items)
            }
            setHasMore(result.has_next || false)
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
          setLoading(false)
        }
      }
    }

    if (open || !searchable) {
      fetchOptions()
    }

    return () => {
      cancelled = true
    }
  }, [debouncedSearchTerm, open, loadOptions, searchable, query, enablePagination, skip, finalLimit])

  // Load more on scroll
  const loadMore = React.useCallback(async () => {
    if (!enablePagination || !hasMore || isLoadingMore || loading || isLoadingMoreRef.current || !loadOptions) {
      return
    }

    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    
    try {
      const nextSkip = skip + finalLimit
      const result = await loadOptions(
        searchable ? debouncedSearchTerm : undefined,
        nextSkip,
        finalLimit
      )

      if (Array.isArray(result)) {
        setOptions(prev => [...prev, ...result])
        setHasMore(result.length >= finalLimit)
      } else {
        setOptions(prev => [...prev, ...result.items])
        setHasMore(result.has_next || false)
      }
      setSkip(nextSkip)
    } catch (err) {
      console.error('Error loading more options:', err)
    } finally {
      setIsLoadingMore(false)
      isLoadingMoreRef.current = false
    }
  }, [enablePagination, hasMore, isLoadingMore, loading, loadOptions, searchable, debouncedSearchTerm, skip, finalLimit])

  // Handle scroll for pagination
  React.useEffect(() => {
    if (!enablePagination || !open) return

    let scrollableElement: HTMLElement | null = null
    let cleanup: (() => void) | null = null

    const findScrollableElement = (): HTMLElement | null => {
      const commandList = commandListRef.current
      if (!commandList) return null

      // CommandList ref points to the actual DOM element
      // Check if it's an HTMLElement and is scrollable
      if (commandList instanceof HTMLElement) {
        // Check if this element itself is scrollable
        const style = window.getComputedStyle(commandList)
        const isScrollable = 
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          commandList.scrollHeight > commandList.clientHeight
        
        if (isScrollable) {
          return commandList
        }

        // Look for scrollable children
        const scrollableChildren = commandList.querySelectorAll('[cmdk-list], [data-radix-scroll-area-viewport]')
        for (const child of Array.from(scrollableChildren)) {
          if (child instanceof HTMLElement) {
            const childStyle = window.getComputedStyle(child)
            if (
              (childStyle.overflowY === 'auto' || childStyle.overflowY === 'scroll') &&
              child.scrollHeight > child.clientHeight
            ) {
              return child
            }
          }
        }
      }

      // Fallback: return the commandList element itself
      return commandList instanceof HTMLElement ? commandList : null
    }

    const handleScroll = () => {
      if (!hasMore || isLoadingMoreRef.current || !scrollableElement) return
      
      const { scrollTop, scrollHeight, clientHeight } = scrollableElement
      
      // Check if we're near the bottom (within 50px or 80% scrolled)
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
      const shouldLoad = distanceFromBottom < 50 || (scrollTop + clientHeight) / scrollHeight >= 0.8
      
      if (shouldLoad && hasMore) {
        loadMore()
      }
    }

    // Use requestAnimationFrame and setTimeout to ensure DOM is ready
    const setupScrollListener = () => {
      scrollableElement = findScrollableElement()
      
      if (scrollableElement) {
        scrollableElement.addEventListener('scroll', handleScroll, { passive: true })
        cleanup = () => {
          scrollableElement?.removeEventListener('scroll', handleScroll)
        }
      } else {
        // Retry if element not found
        setTimeout(setupScrollListener, 100)
      }
    }

    // Start setup after a short delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(setupScrollListener)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      cleanup?.()
    }
  }, [enablePagination, open, loadMore, hasMore, options.length])

  // Sync popover width with trigger width
  React.useEffect(() => {
    if (triggerRef.current && open) {
      const triggerWidth = triggerRef.current.offsetWidth
      if (triggerWidth > 0) {
        setPopoverWidth(triggerWidth)
      }
    }
  }, [open, width])

  // Find selected option
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  )

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      const option = options.find((opt) => String(opt.value) === selectedValue)
      if (option) {
        const newValue = clearable && value === option.value ? undefined : option.value
        onValueChange?.(newValue as T)
        setOpen(false)
      }
    },
    [options, value, clearable, onValueChange]
  )

  // Display value
  const displayValue = React.useMemo(() => {
    if (selectedOption) {
      if (renderSelected) {
        return renderSelected(selectedOption)
      }
      return selectedOption.label
    }
    if (selectedLabel && value) {
      return selectedLabel
    }
    return null
  }, [selectedOption, selectedLabel, value, renderSelected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-right min-w-0",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
          style={{ 
            width: typeof width === "number" ? `${width}px` : width,
            maxWidth: "100%"
          }}
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-auto max-w-[95vw] sm:max-w-none", className)}
        align="start"
        dir="rtl"
        style={{
          width: typeof popoverWidth === "number" 
            ? `${typeof window !== 'undefined' ? Math.min(popoverWidth, window.innerWidth * 0.95) : popoverWidth}px` 
            : popoverWidth,
          minWidth: typeof popoverWidth === "number" ? `${popoverWidth}px` : popoverWidth,
          maxWidth: typeof popoverWidth === "number" 
            ? `${typeof window !== 'undefined' ? Math.min(popoverWidth, window.innerWidth * 0.95) : popoverWidth}px` 
            : `min(${popoverWidth}, 95vw)`,
        }}
      >
        <Command shouldFilter={false} dir="rtl">
          {searchable && (
            <div className="relative border-b">
              <CommandInput
                placeholder={searchPlaceholder || "Search..."}
                value={searchTerm}
                onValueChange={setSearchTerm}
                dir="rtl"
              />
              {isLoading && options.length > 0 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <CommandList 
            ref={commandListRef}
            className={enablePagination ? "max-h-[300px] overflow-y-auto overscroll-contain" : undefined}
          >
            {finalError && (
              <div className="p-4 text-destructive text-center text-sm">
                {finalError}
              </div>
            )}
            {isLoading && options.length === 0 && (
              <DefaultLoadingSkeleton />
            )}
            {!isLoading && !finalError && options.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => {
                const optionValue = String(option.value)
                const isSelected = value === option.value

                return (
                  <CommandItem
                    key={optionValue}
                    value={optionValue}
                    onSelect={handleSelect}
                    disabled={option.disabled}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {option.icon}
                        <div className="flex flex-col flex-1">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
              {isLoadingMore && (
                <CommandItem disabled>
                  <div className="flex items-center justify-center w-full py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

AsyncSelectV2.displayName = "AsyncSelectV2"
