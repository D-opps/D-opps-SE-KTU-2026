# DormLife – Project Documentation

**Course:** Software Engineering  
**Platform:** Full-stack Web Application  
**Summary:** A dormitory life management application for students, featuring a marketplace, laundry room tracker, community chat, events, and more.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Models](#4-database-models)
5. [API Endpoints](#5-api-endpoints)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Features & Modules](#7-features--modules)
8. [Frontend Routing](#8-frontend-routing)
9. [Security](#9-security)
10. [Setup & Running Locally](#10-setup--running-locally)
11. [Git Branching Strategy](#11-git-branching-strategy)
12. [Deployment Notes](#12-deployment-notes)

---

## 1. Project Overview

DormLife is a student-focused web application designed to improve dormitory life by bringing common needs into one platform. It allows students to:

- Buy and sell second-hand items through an in-dorm **Marketplace**
- Check and manage **Laundry Room** machine availability
- Communicate through a community **Chat**
- Stay updated on dorm **Events**
- Manage their personal **Profile** and dormitory details

The application supports three user roles — **Student**, **Admin**, and **Doorkeeper** — each with different levels of access and functionality.

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | — | Type safety |
| Vite | 6.3.5 | Build tool and dev server |
| React Router | 7.13.0 | Client-side routing |
| Tailwind CSS | 4.1.12 | Utility-first styling |
| Radix UI / shadcn/ui | — | Accessible UI components |
| Axios | 1.14.0 | HTTP client |
| React Hook Form | 7.55.0 | Form handling |
| @react-oauth/google | 0.13.5 | Google OAuth integration |
| Lucide React | 0.487.0 | Icons |
| Sonner | 2.0.3 | Toast notifications |
| date-fns | 3.6.0 | Date formatting |

### Backend

| Technology | Purpose |
|---|---|
| Django (Python) | Web framework |
| Django REST Framework (DRF) | RESTful API |
| Simple JWT | JWT-based authentication |
| django-cors-headers | Cross-origin request handling |
| django-rest-passwordreset | Password reset via email |
| SQLite | Development database |
| Gmail SMTP | Email delivery |

---

## 3. Project Structure

```
D-opps-SE-KTU-2026/
├── proj/                          # Frontend (React + TypeScript + Vite)
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── src/
│       └── app/
│           ├── App.tsx            # Root component
│           ├── routes.ts          # Route definitions
│           ├── components/
│           │   ├── Layout.tsx     # Sidebar + navigation wrapper
│           │   ├── OnboardingModal.tsx
│           │   └── ui/            # 50+ reusable UI components
│           ├── pages/
│           │   ├── Login.tsx
│           │   ├── Register.tsx
│           │   ├── ForgotPassword.tsx
│           │   ├── ResetPassword.tsx
│           │   ├── VerifyEmail.tsx
│           │   ├── Dashboard.tsx
│           │   ├── Marketplace.tsx
│           │   ├── ItemDetails.tsx
│           │   ├── Laundry.tsx
│           │   ├── Chat.tsx
│           │   ├── Profile.tsx
│           │   ├── Events.tsx
│           │   └── Notifications.tsx
│           └── data/
│               └── mockData.ts    # Development mock data
└── backend/                       # Backend (Django)
    ├── manage.py
    ├── api/                       # Main API application
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   ├── admin.py
    │   ├── signals.py
    │   └── migrations/
    └── dormlife_server/           # Django project config
        ├── settings.py
        └── urls.py
```

---

## 4. Database Models

### User (Custom, extends AbstractUser)

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | EmailField | Unique, used for login |
| username | CharField | Inherited from AbstractUser |
| first_name | CharField | — |
| last_name | CharField | — |
| role | CharField | `student`, `admin`, or `doorkeeper` |
| dormitory | IntegerField | Nullable; dorm number (1–8) |
| room_number | CharField | Nullable |
| photo | ImageField | Stored in `profiles/` |

### Product (Marketplace Listing)

| Field | Type | Notes |
|---|---|---|
| id | BigAutoField | Primary key |
| title | CharField | Max 200 chars |
| price | DecimalField | 2 decimal places |
| description | TextField | — |
| category | CharField | e.g. Electronics, Books |
| image | ImageField | Stored in `products/` |
| seller | ForeignKey → User | On delete: CASCADE |
| status | CharField | Default: `available` |
| created_at | DateTimeField | Auto set on creation |

### ProductPhoto (Product Image Gallery)

| Field | Type | Notes |
|---|---|---|
| id | BigAutoField | Primary key |
| product | ForeignKey → Product | On delete: CASCADE |
| image | ImageField | Stored in `products/` |

Allows multiple photos per product listing.

### Machine (Laundry Room Equipment)

| Field | Type | Notes |
|---|---|---|
| id | BigAutoField | Primary key |
| name | CharField | e.g. "Washer 1" |
| type | CharField | `washer` or `dryer` |
| status | CharField | `free`, `occupied`, or `out-of-order` |
| time_left | IntegerField | Minutes remaining; default 0 |

---

## 5. API Endpoints

**Base URL (development):** `http://127.0.0.1:8000/api/`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register/` | Register a new user |
| POST | `/token/` | Log in and receive JWT tokens |
| POST | `/token/refresh/` | Refresh an expired access token |
| POST | `/auth/google/` | Log in with Google OAuth |
| POST | `/password_reset/` | Request a password reset email |

**Login Response Example:**
```json
{
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>",
  "user": {
    "email": "student@example.com",
    "full_name": "Jane Smith",
    "role": "student"
  }
}
```

### Marketplace

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products/` | List all available products |
| POST | `/products/` | Create a new product listing |
| GET | `/products/{id}/` | Get details of a specific product |
| PUT | `/products/{id}/` | Update a product listing |
| DELETE | `/products/{id}/` | Delete a product listing |

**Create Product Request (multipart/form-data):**
```
title: "Mini Fridge"
price: 80.00
description: "Compact mini fridge, barely used."
category: "appliances"
photos: <image file>
```

### Laundry Machines

| Method | Endpoint | Description |
|---|---|---|
| GET | `/machines/` | List all laundry machines |
| POST | `/machines/` | Add a new machine (admin only) |
| PATCH | `/machines/{id}/` | Update machine status or timer |
| DELETE | `/machines/{id}/` | Remove a machine (admin only) |

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/metrics/?period=7` | Admin dashboard metrics |
| GET | `/notifications/` | User notifications |
| GET | `/chat/unread-count/` | Count of unread chat messages |

---

## 6. Authentication & Authorization

### JWT Authentication Flow

1. User submits credentials to `POST /api/token/`
2. Backend validates and returns an access token (valid 1 day) and a refresh token (valid 7 days)
3. Frontend stores both tokens in `localStorage`
4. Every subsequent API request includes the header:
   ```
   Authorization: Bearer <access_token>
   ```
5. When the access token expires, the frontend calls `POST /api/token/refresh/` with the refresh token to obtain a new one

### Google OAuth Flow

1. User clicks "Sign in with Google" on the frontend
2. Google OAuth popup opens via `@react-oauth/google`
3. On success, Google returns an `access_token`
4. Frontend sends the token to `POST /api/auth/google/`
5. Backend verifies it with Google's userinfo API
6. If the user doesn't exist, an account is auto-created
7. Backend returns the same JWT pair as standard login

### Role-Based Access Control (RBAC)

| Role | Access Level |
|---|---|
| **student** | Default role. Can browse/post marketplace, use laundry, chat, and events. |
| **admin** | Full access including system metrics, machine management, and user management. |
| **doorkeeper** | Building access management and security-related features. |

---

## 7. Features & Modules

### Authentication Module
Pages: `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `VerifyEmail`

- Email/password registration and login
- Google OAuth sign-in
- Password strength validation (8+ chars, uppercase, number, special character)
- Email verification on registration
- Password reset via email link
- Dormitory and room assignment during signup

### Marketplace Module
Pages: `Marketplace`, `ItemDetails`

- Browse all product listings with images
- Filter by category, dormitory, and price range
- Sort by newest, price, or alphabetically
- Pagination (9 items per page)
- Create new listing with photo upload
- View seller profile and contact via chat
- Product status tracking (`available` / `sold`)

### Laundry Room Module
Page: `Laundry`

- View all washers and dryers with live status
- Status indicators: Free (green), Occupied (blue), Out-of-order (red)
- Countdown timer for occupied machines (1–120 minutes)
- Timer auto-decrements every minute
- Admin controls: add/remove machines, change status manually

### Chat Module
Page: `Chat`

- Three community chat rooms: General, Marketplace, Events
- Message history with timestamps
- Contact seller directly from a marketplace listing
- Auto-scroll to latest messages

### Profile Module
Page: `Profile`

- View and edit personal information (name, room, dormitory)
- Role badge display
- Choose from preset avatar options or upload photo
- Change password
- View own marketplace listings

### Dashboard Module
Page: `Dashboard`

- Personalized per role (Student, Admin, Doorkeeper)
- Quick-access widgets: available machines, recent listings, recent messages
- Admin: system metrics with configurable time period (7 or 30 days)
- First-time user onboarding modal

### Notifications Module
Page: `Notifications`

- Notification center for system/activity alerts
- Badge counter in the navigation sidebar
- Polling every 30 seconds for new notifications

### Events Module
Page: `Events`

- View upcoming dormitory events
- Community event management

---

## 8. Frontend Routing

| Route | Page | Auth Required |
|---|---|---|
| `/login` | Login | No |
| `/register` | Register | No |
| `/forgot-password` | ForgotPassword | No |
| `/reset-password/:token` | ResetPassword | No |
| `/verify-email` | VerifyEmail | No |
| `/` | Dashboard | Yes |
| `/laundry` | Laundry | Yes |
| `/marketplace` | Marketplace | Yes |
| `/marketplace/:itemId` | ItemDetails | Yes |
| `/chat` | Chat | Yes |
| `/events` | Events | Yes |
| `/notifications` | Notifications | Yes |
| `/profile` | Profile | Yes |

All authenticated routes are wrapped in `Layout.tsx`, which provides the sidebar navigation and handles logout.

---

## 9. Security

| Concern | Implementation |
|---|---|
| Authentication | JWT tokens with expiry; stored in `localStorage` |
| Token refresh | Automatic refresh flow to prevent forced logouts |
| Password security | Django's built-in hashing; client-side strength requirements |
| CORS | Configured via `django-cors-headers`; whitelist-based |
| Role enforcement | Backend checks user role on protected actions |
| Google login | Token verified server-side against Google's API |
| Password reset | Secure tokenized reset link sent via email |

**Production hardening required before deployment:**
- Move `SECRET_KEY` and credentials to environment variables
- Set `DEBUG = False`
- Restrict `CORS_ALLOWED_ORIGINS` to production domain only
- Switch database from SQLite to PostgreSQL

---

## 10. Setup & Running Locally

### Frontend

```bash
cd proj
npm install        # or: pnpm install
npm run dev        # Dev server starts at http://localhost:5173
```

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers django-rest-passwordreset

# Apply migrations and start server
python manage.py migrate
python manage.py runserver        # API available at http://127.0.0.1:8000
```

Both servers must be running at the same time for the full application to work.

---

## 11. Git Branching Strategy

The project follows a structured branching model:

```
main
└── story-<ISSUE_CODE>-<feature-name>      # One branch per feature story
    └── subtask-<ISSUE_CODE>-<task-name>   # Sub-branches for implementation tasks
```

**Rules:**
- No direct commits to `main`
- All changes go through pull requests
- Branch names are kebab-case and include the issue code

**Examples:**
- `story-DOSK2-20-google-sign-in`
- `subtask-DOSK2-39-marketplace-filters`

---

## 12. Deployment Notes

When deploying to a production environment, the following changes are required:

| Item | Action Needed |
|---|---|
| `SECRET_KEY` | Move to environment variable, never commit |
| `DEBUG` | Set to `False` |
| Database | Migrate from SQLite to PostgreSQL |
| CORS | Restrict `CORS_ALLOWED_ORIGINS` to production domain |
| Email | Configure production SMTP credentials via environment variables |
| Media files | Set up cloud storage (e.g. AWS S3) for uploaded images |
| Frontend API URL | Update base URL from `localhost:8000` to production API domain |
| Google OAuth | Register production domain in Google Cloud Console |
