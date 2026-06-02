DormLife is a full-stack web application designed for students living in dormitories. It bundles several essential services into a single, cohesive Single Page Application (SPA), replacing fragmented ad-hoc solutions like paper posters and improvised messaging threads.

## Overview
DormLife helps students connect, exchange resources, and access information relevant to their everyday dormitory life.

### Key Features
* **Marketplace:** A dormitory-aware platform for buying, selling, and exchanging second-hand items.
* **Laundry Tracker:** Real-time visibility into laundry machine status (free/occupied/out-of-order) with automatic timers.
* **Chat System:** Multi-level communication including dormitory-scoped groups, global channels, and private/product-scoped messaging.
* **Events Module:** A platform for discovering and joining events organized within the dormitory.
* **Notification Center:** In-app and email alerts for messages, exchange offers, and new events.

## Technology Stack

### Front End
* **Framework:** React 18
* **Language:** TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS v4, shadcn/ui

### Back End
* **Framework:** Django, Django REST Framework (DRF)
* **Authentication:** JWT (JSON Web Tokens) with `simplejwt`, Google OAuth 2.0
* **API:** RESTful API

### Infrastructure & Database
* **Local Development:** SQLite
* **Staging Environment:** PostgreSQL 15, orchestrated with Docker Compose
* **CI/CD:** GitHub Actions (automated testing pipeline)

## Getting Started

### Prerequisites
* Docker and Docker Compose
* Node.js (for front-end development)
* Python 3.13 (for back-end development)

### Deployment (Staging)
The application is orchestrated using Docker Compose. To run the staging environment:
1. Ensure you have the `docker-compose.staging.yml` file and a properly configured `.env.staging` file (not included in the repository).
2. Run `docker-compose -f docker-compose.staging.yml up` to start the services.

## How to Run the Program

To run the application locally, you will need two separate terminal windows.

### 1. Back End
In the first terminal, start the Django development server:
```bash
cd backend
# Activate the virtual environment
venv\Scripts\Activate
# Apply migrations
python manage.py migrate
# Start the server
python manage.py runserver
```

### 2. Front End
In the second terminal, start the React development server:
```bash
cd proj
npm install
npm run dev
```

## Testing
The system is validated through:
* **Automated Tests:** Comprehensive end-to-end test suite using `pytest` and component unit tests using `Vitest`.
* **Manual Testing:** Structured component-level testing against defined interactive checklists.
* **CI Pipeline:** Automated execution of the backend test suite on every push to the main branch via GitHub Actions.
