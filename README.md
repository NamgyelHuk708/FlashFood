# SS2024-Flashfood
# Flash Food App - Layered Architecture Documentation

## Architecture Overview

The Flash Food application implements a **5-Layer Monolithic Architecture** with **CLOSED layers**, meaning each layer can only communicate with the layer directly below it. This ensures proper separation of concerns and maintainability.

## Layer Structure (Top to Bottom)

### 1. PRESENTATION LAYER
**Location**: `/screens/`, `/components/ui/`
**Responsibility**: User interface and user interaction handling
**Technologies**: React Native components, navigation, styling

**Key Components**:
- Screen components (`RestaurantsScreen`, `ProfileScreen`, etc.)
- Reusable UI components (`RestaurantCard`, `SearchBar`, `LoadingSpinner`)
- Navigation configuration

**Access Pattern**: 
- Can access: Business Layer
- annot access: Service Layer, Data Access Layer, Persistence Layer directly

### 2. BUSINESS LAYER
**Location**: `/business/`, `/hooks/`
**Responsibility**: Business logic, validation, data transformation
**Technologies**: Custom hooks, business action classes

**Key Components**:
- Business logic classes (`RestaurantActions`, `FavoriteActions`)
- Custom hooks (`useRestaurantsWithZustand`, `useAuthWithZustand`)
- Data validation and transformation logic

**Access Pattern**:
- Can access: Service Layer
- Cannot access: Data Access Layer, Persistence Layer directly

### 3. SERVICE LAYER
**Location**: `/services/`
**Responsibility**: External API communication, data fetching
**Technologies**: Supabase client, HTTP requests

**Key Components**:
- Service classes (`RestaurantService`, `FavoriteService`)
- API communication logic
- Error handling for external services

**Access Pattern**:
- Can access: Data Access Layer
-  Cannot access: Persistence Layer directly

### 4. DATA ACCESS LAYER
**Location**: `/lib/supabase.ts`, database functions
**Responsibility**: Database operations, query execution
**Technologies**: Supabase client configuration, SQL functions

**Key Components**:
- Database client configuration
- SQL query execution
- Database connection management

**Access Pattern**:
-  Can access: Persistence Layer
- No restrictions (bottom-most business layer)

### 5. PERSISTENCE LAYER
**Location**: `/stores/` (Zustand), Supabase database, AsyncStorage
**Responsibility**: Data storage and state management
**Technologies**: Zustand stores, Supabase PostgreSQL, AsyncStorage

**Key Components**:
- Zustand stores (`authStore`, `restaurantStore`, `userPreferencesStore`)
- Database tables and relationships
- Local storage for offline capabilities

**Access Pattern**:
-  Accessed by: Data Access Layer only
-  No direct access from other layers

## Data Flow Example

### User adds restaurant to favorites:

1. **Presentation Layer**: User taps heart icon on `RestaurantCard`
2. **Business Layer**: `useRestaurantsWithZustand` hook calls `toggleFavorite()`
3. **Service Layer**: `FavoriteService.addToFavorites()` makes API call
4. **Data Access Layer**: Supabase client executes INSERT query
5. **Persistence Layer**: Data stored in database + Zustand store updated

## State Management Strategy

### Zustand Implementation
- **Global State**: Authentication, restaurants, user preferences
- **Local State**: Component-specific UI state (modals, form inputs)
- **Persistence**: Critical data persisted to AsyncStorage
- **Cache Management**: 5-minute cache for restaurant data

### Store Structure
\`\`\`typescript
// Authentication Store
- session: Session | null
- user: User | null
- loading: boolean

// Restaurant Store  
- restaurants: Restaurant[]
- favorites: string[]
- filters: RestaurantFilters
- loading: boolean

// User Preferences Store
- locationPermissionGranted: boolean
- userLocation: UserLocation | null
- preferredCuisines: string[]
- theme: 'light' | 'dark' | 'system'
\`\`\`

## Benefits of CLOSED Layer Architecture

1. **Maintainability**: Clear separation prevents tight coupling
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to modify one layer without affecting others
4. **Security**: Data access is controlled and auditable
5. **Performance**: Caching and optimization can be implemented per layer

## Layer Communication Rules

- **CLOSED Architecture**: Each layer only communicates with the layer directly below
- **No Skip-Level Access**: Presentation cannot directly call Service Layer
- **Unidirectional Flow**: Data flows down, events flow up
- **Interface Contracts**: Each layer exposes specific interfaces to the layer above

## Performance Considerations

1. **Caching**: Restaurant data cached for 5 minutes
2. **Lazy Loading**: Components loaded on-demand
3. **Memoization**: React.memo used for expensive components
4. **State Optimization**: Zustand stores only persist essential data
5. **Offline Support**: Critical data available offline via AsyncStorage

This architecture ensures the Flash Food app is maintainable, scalable, and follows industry best practices for React Native applications.
