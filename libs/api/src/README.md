# API Definitions System

This library provides a centralized system for defining and managing API endpoints across the monorepo.

## Structure

- **Shared APIs** (`libs/api/src/endpoints.ts`): APIs available to all apps
- **App-specific APIs**: Defined in each app's `src/api/endpoints.ts`

## Usage

### 1. Define Shared APIs

In `libs/api/src/endpoints.ts`:

```typescript
import { createEndpoint, createApiGroup } from './definitions';

export const sharedChatEndpoints = createApiGroup(
  'chat',
  {
    sendMessage: createEndpoint<SendMessageRequest, SendMessageResponse>(
      'POST',
      '/chat/message'
    ),
  },
  '/chat' // optional base path
);
```

### 2. Define App-Specific APIs

In `apps/sanad-ai/src/api/endpoints.ts`:

```typescript
import { createEndpoint, createApiGroup, apiRegistry } from '@sanad-ai/api';

export const sanadAiEndpoints = createApiGroup(
  'sanad-ai',
  {
    getData: createEndpoint<{ id: string }, { data: string }>(
      'GET',
      '/sanad-ai/data'
    ),
  }
);

// Register the APIs
apiRegistry.registerApp('sanad-ai', sanadAiEndpoints);
```

### 3. Use the Enhanced API Client

```typescript
import { createEnhancedApiClient } from '@sanad-ai/api';

const apiClient = createEnhancedApiClient({
  baseURL: 'https://api.example.com',
  basicAuth: { username: 'user', password: 'pass' }
});

// Call shared API
const response = await apiClient.callShared('chat', 'sendMessage', {
  message: 'Hello'
});

// Call app-specific API
const data = await apiClient.callApp('sanad-ai', 'sanad-ai', 'getData', {
  id: '123'
});
```

### 4. Use with React Query

```typescript
import { createMutation } from '@sanad-ai/api';
import { ApiClient } from '@sanad-ai/api';

const apiClient = createEnhancedApiClient({ baseURL: '...' });

const sendMessageMutation = createMutation({
  client: apiClient.getClient(),
  mutationFn: async (variables) => {
    return apiClient.callShared('chat', 'sendMessage', variables);
  }
});
```

## Benefits

- ✅ Centralized API definitions
- ✅ Type-safe endpoints
- ✅ Shared vs app-specific separation
- ✅ Easy to discover available APIs
- ✅ Consistent API structure across apps




