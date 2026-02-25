# RidenDine Architecture Diagram

**Generated:** 2026-02-25
**Type:** 3-Sided Marketplace (Customer, Chef/Driver, Admin)
**Pattern:** Real-time Event-Driven Architecture

---

## Level 0: System Context

```mermaid
flowchart TB
    subgraph Actors
        CUST[Customer<br/>iOS/Android App]
        CHEF[Chef<br/>iOS/Android App]
        DRIVER[Driver<br/>iOS/Android App]
        ADMIN[Platform Admin<br/>Web Dashboard]
    end

    subgraph External_Services
        STRIPE[Stripe Connect<br/>Payment Processing]
        GMAPS[Google Maps<br/>Geocoding & Routing]
        APPLE[Apple App Store]
        GOOGLE[Google Play Store]
    end

    subgraph RidenDine_Platform
        BACKEND[RidenDine Backend<br/>Supabase]
    end

    CUST <-->|Orders, Payments| BACKEND
    CHEF <-->|Menu, Orders| BACKEND
    DRIVER <-->|Deliveries, GPS| BACKEND
    ADMIN <-->|Management| BACKEND

    BACKEND <-->|Process Payments| STRIPE
    BACKEND <-->|Geocode, Routes| GMAPS

    CUST -.->|Download App| APPLE
    CUST -.->|Download App| GOOGLE
    CHEF -.->|Download App| APPLE
    DRIVER -.->|Download App| APPLE
```

---

## Level 1: Container Architecture

```mermaid
flowchart TB
    subgraph Mobile_Apps[Mobile Applications - React Native + Expo]
        CUST_APP[Customer App<br/>Browse, Order, Track]
        CHEF_APP[Chef App<br/>Menu, Orders, Analytics]
        DRIVER_APP[Driver App<br/>Deliveries, Navigation]
    end

    subgraph Web_Apps[Web Applications - Next.js 15]
        ADMIN_WEB[Admin Dashboard<br/>User Mgmt, Analytics, Config]
        CUSTOMER_WEB[Customer Web<br/>Browse, Order]
    end

    subgraph Supabase_Backend[Supabase Backend - Cloud Infrastructure]
        direction TB

        subgraph Auth_Layer[Authentication Layer]
            AUTH[Supabase Auth<br/>JWT + Row Level Security]
        end

        subgraph Database_Layer[Database Layer]
            POSTGRES[(PostgreSQL<br/>Users, Orders, Menus)]
            REALTIME[Realtime Subscriptions<br/>Order Status, GPS Updates]
            STORAGE[Storage Buckets<br/>Dish Photos, Receipts]
        end

        subgraph Compute_Layer[Compute Layer]
            EF_NOTIFY[Edge Function<br/>Send Notifications]
            EF_PAYMENT[Edge Function<br/>Process Payments]
            EF_DISPATCH[Edge Function<br/>Auto-Assign Drivers]
            EF_GEOCODE[Edge Function<br/>Geocode Addresses]
            EF_ROUTE[Edge Function<br/>Calculate Routes]
        end
    end

    subgraph External_APIs[External Services]
        STRIPE[Stripe Connect]
        GMAPS[Google Maps API]
    end

    CUST_APP <-->|REST + Realtime| Auth_Layer
    CHEF_APP <-->|REST + Realtime| Auth_Layer
    DRIVER_APP <-->|REST + Realtime| Auth_Layer
    ADMIN_WEB <-->|REST| Auth_Layer
    CUSTOMER_WEB <-->|REST| Auth_Layer

    Auth_Layer --> Database_Layer
    Database_Layer <-->|Triggers| Compute_Layer

    EF_PAYMENT <-->|Split Payments| STRIPE
    EF_GEOCODE <-->|Cached 30 days| GMAPS
    EF_ROUTE <-->|Cached 5 min| GMAPS
```

---

## Level 2: Component Architecture - Order Flow

```mermaid
sequenceDiagram
    participant C as Customer App
    participant A as Supabase Auth
    participant DB as PostgreSQL
    participant RT as Realtime
    participant EF as Edge Functions
    participant CH as Chef App
    participant D as Driver App
    participant S as Stripe

    Note over C,S: Order Placement & Fulfillment

    C->>A: Login (JWT)
    A-->>C: Auth Token

    C->>DB: Create Order (RLS enforced)
    DB-->>C: Order Created (status: PENDING)

    DB->>RT: Broadcast (order.insert)
    RT-->>CH: New Order Notification

    CH->>DB: Update Order (status: ACCEPTED)
    DB->>RT: Broadcast (order.update)
    RT-->>C: Order Accepted

    CH->>DB: Update Order (status: COOKING)
    DB->>RT: Broadcast
    RT-->>C: Cooking Status

    CH->>DB: Update Order (status: READY)
    DB->>EF: Trigger (dispatch)
    EF->>DB: Auto-assign available driver
    DB->>RT: Broadcast
    RT-->>D: New Delivery Assignment

    D->>DB: Update Delivery (status: EN_ROUTE)
    D->>RT: Publish GPS coordinates
    RT-->>C: Live Driver Location

    D->>DB: Update Delivery (status: DELIVERED)
    DB->>EF: Trigger (payment)
    EF->>S: Process payment split
    S-->>EF: Payment confirmed
    EF->>DB: Update payout records

    DB->>RT: Broadcast
    RT-->>C: Order Complete
    RT-->>CH: Payout Processed
```

---

## Level 3: Data Flow - Payment Processing

```mermaid
flowchart LR
    subgraph Customer_Flow
        C[Customer pays $50]
    end

    subgraph Platform_Logic
        CALC[Calculate Split<br/>Platform: $5 fee<br/>Chef: $45 payout]
    end

    subgraph Stripe_Connect
        HOLD[Hold funds in platform account]
        TRANSFER[Transfer to Chef's<br/>connected account]
    end

    subgraph Database
        RECORD[Record transaction<br/>orders.total_cents<br/>payouts.amount_cents]
    end

    C --> CALC
    CALC --> HOLD
    HOLD --> TRANSFER
    HOLD --> RECORD
    TRANSFER --> RECORD
```

---

## Level 4: GPS & Real-Time Architecture

```mermaid
flowchart TB
    subgraph Driver_App
        GPS[GPS Sensor<br/>expo-location]
        BROADCAST[Broadcast Module]
    end

    subgraph Supabase_Realtime
        CHANNEL[Channel: deliveries:*]
        PRESENCE[Presence Tracking]
    end

    subgraph Caching_Layer
        GEOCODE_CACHE[(Geocode Cache<br/>30-day TTL)]
        ROUTE_CACHE[(Route Cache<br/>5-min TTL)]
    end

    subgraph Customer_App
        MAP[Live Map Component]
        ETA[ETA Display]
    end

    GPS -->|Every 5 seconds| BROADCAST
    BROADCAST -->|Publish coordinates| CHANNEL
    CHANNEL -->|Subscribe| MAP

    MAP -->|Request route| ROUTE_CACHE
    ROUTE_CACHE -.->|Cache miss| GMAPS[Google Routes API]
    GMAPS -.->|Store result| ROUTE_CACHE
    ROUTE_CACHE -->|Return polyline| MAP
```

---

## Database Schema - Core Tables

```mermaid
erDiagram
    PROFILES ||--o{ CHEFS : "has role"
    PROFILES ||--o{ ORDERS : "places"
    CHEFS ||--|{ MENUS : "owns"
    MENUS ||--|{ MENU_ITEMS : "contains"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDERS ||--|| DELIVERIES : "requires"
    DELIVERIES ||--o| PROFILES : "assigned to driver"

    PROFILES {
        uuid id PK
        text role
        text email
        text name
        timestamp created_at
    }

    CHEFS {
        uuid id PK
        uuid profile_id FK
        text status
        text connect_account_id
        boolean payout_enabled
        jsonb location
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        uuid chef_id FK
        text status
        int total_cents
        text delivery_method
        timestamp created_at
    }

    DELIVERIES {
        uuid id PK
        uuid order_id FK
        uuid driver_id FK
        text status
        jsonb pickup_location
        jsonb dropoff_location
        int delivery_fee_cents
    }
```

---

## Security Model - Row Level Security (RLS)

```mermaid
flowchart TB
    subgraph Request_Flow
        USER[User makes request<br/>with JWT token]
    end

    subgraph Auth_Layer
        VERIFY[Verify JWT signature]
        EXTRACT[Extract user_id & role]
    end

    subgraph RLS_Policies
        CHECK{Check RLS policy}
        CHEF_POLICY[Chef Policy:<br/>user_id = chef.profile_id]
        CUSTOMER_POLICY[Customer Policy:<br/>user_id = order.customer_id]
        DRIVER_POLICY[Driver Policy:<br/>user_id = delivery.driver_id]
    end

    subgraph Database
        FILTER[Filter rows based on policy]
        RETURN[Return authorized data only]
    end

    USER --> VERIFY
    VERIFY --> EXTRACT
    EXTRACT --> CHECK
    CHECK -->|Chef request| CHEF_POLICY
    CHECK -->|Customer request| CUSTOMER_POLICY
    CHECK -->|Driver request| DRIVER_POLICY
    CHEF_POLICY --> FILTER
    CUSTOMER_POLICY --> FILTER
    DRIVER_POLICY --> FILTER
    FILTER --> RETURN
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Development
        DEV[Local Development<br/>Expo Dev Server]
        GIT[Git Repository<br/>GitHub]
    end

    subgraph CI_CD
        GH_ACTIONS[GitHub Actions<br/>CI Pipeline]
        TESTS[Run Tests<br/>Vitest + Bun]
        LINT[Type Check + Lint]
    end

    subgraph Production_Deployment
        VERCEL[Vercel<br/>Admin + Customer Web]
        EAS[Expo Application Services<br/>Mobile App Builds]
        SUPABASE[Supabase Cloud<br/>Backend + Database]
    end

    subgraph App_Stores
        APPLE[Apple App Store]
        GOOGLE[Google Play Store]
    end

    DEV -->|Push code| GIT
    GIT -->|Trigger| GH_ACTIONS
    GH_ACTIONS --> TESTS
    GH_ACTIONS --> LINT
    TESTS -->|Pass| VERCEL
    TESTS -->|Pass| EAS

    VERCEL -->|Deploy| WEB_LIVE[Live Web Apps]
    EAS -->|Submit| APPLE
    EAS -->|Submit| GOOGLE

    WEB_LIVE <--> SUPABASE
    APPLE <--> SUPABASE
    GOOGLE <--> SUPABASE
```

---

## Monitoring & Observability

```mermaid
flowchart LR
    subgraph Application_Layer
        MOBILE[Mobile Apps]
        WEB[Web Apps]
        EDGE[Edge Functions]
    end

    subgraph Logging
        SUPABASE_LOGS[Supabase Logs<br/>Database queries, Auth]
        VERCEL_LOGS[Vercel Logs<br/>Web requests, Errors]
        SENTRY[Sentry<br/>Error tracking]
    end

    subgraph Analytics
        STRIPE_DASH[Stripe Dashboard<br/>Revenue, Payouts]
        ADMIN_DASH[Admin Dashboard<br/>Orders, Users, Performance]
    end

    MOBILE --> SENTRY
    WEB --> VERCEL_LOGS
    EDGE --> SUPABASE_LOGS

    SUPABASE_LOGS --> ADMIN_DASH
    VERCEL_LOGS --> ADMIN_DASH
    STRIPE_DASH --> ADMIN_DASH
```

---

## Cost Optimization - Google Maps Free Tier

```mermaid
flowchart TB
    subgraph Request_Flow
        APP[App requests geocode/route]
    end

    subgraph Cache_First
        CACHE_CHECK{Check cache}
        GEOCODE_HIT[Geocode cache hit<br/>30-day TTL]
        ROUTE_HIT[Route cache hit<br/>5-min TTL]
    end

    subgraph API_Fallback
        GMAPS_CALL[Google Maps API call<br/>$5/1000 requests]
        STORE_CACHE[Store in cache table]
    end

    subgraph Cost_Savings
        REDUCTION[92% reduction<br/>3,000 → 750 calls/month]
    end

    APP --> CACHE_CHECK
    CACHE_CHECK -->|Hit| GEOCODE_HIT
    CACHE_CHECK -->|Hit| ROUTE_HIT
    CACHE_CHECK -->|Miss| GMAPS_CALL
    GMAPS_CALL --> STORE_CACHE
    STORE_CACHE --> REDUCTION
```

---

## Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Supabase Backend** | Managed Postgres + Auth + Realtime out of the box | Vendor lock-in vs speed to market |
| **Monorepo Structure** | Share types/logic across mobile + web | Larger codebase vs code reuse |
| **React Native + Expo** | Single codebase for iOS/Android | Limited native API access vs development speed |
| **RLS for Security** | Database-level authorization | Complex policies vs foolproof security |
| **Stripe Connect** | Built-in marketplace payments | 2.9% + $0.30 + 2% fee vs custom solution |
| **Edge Functions** | Serverless compute at the edge | Cold starts vs no server management |
| **Caching Strategy** | Reduce Google Maps API costs by 92% | Stale data risk vs cost savings |

---

## References

- **C4 Model**: Context → Container → Component → Code
- **Architecture Patterns**: Event-Driven, 3-Sided Marketplace, Real-time Subscriptions
- **Security**: Row Level Security (RLS), JWT Authentication
- **Cost Optimization**: Two-tier caching (geocode 30d, routes 5m)
