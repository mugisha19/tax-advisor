# Tax Professional Management System

A comprehensive system for managing tax professional registrations and certifications for the Rwanda Revenue Authority (RRA).

## Architecture

- **Backend**: Spring Boot (Java 17) - `taxprofessionals/`
- **Tax Professional Frontend**: React/TypeScript - `taxProfessionalsFrontend/`
- **Officer Frontend**: React/JSX - `Officer_app/`

## Quick Start

### 1. Environment Setup

Copy environment files and configure:

```bash
# Backend
cp taxprofessionals/.env.example taxprofessionals/.env

# Tax Professional Frontend  
cp taxProfessionalsFrontend/.env.example taxProfessionalsFrontend/.env

# Officer Frontend
cp Officer_app/.env.example Officer_app/.env
```

### 2. Configure Environment Variables

Edit each `.env` file with your specific values:

- Database credentials
- JWT secrets
- Email configuration
- API URLs

### 3. Start Services

```bash
# Backend (Port 8080)
cd taxprofessionals
mvn spring-boot:run

# Tax Professional Frontend (Port 5173)
cd taxProfessionalsFrontend
npm install && npm run dev

# Officer Frontend (Port 5000)
cd Officer_app
npm install && npm run dev
```

## Features

- **Tax Professional Registration** (Individual & Company)
- **Document Management** & Verification
- **Application Review Workflow**
- **Certificate Generation** (PDF)
- **Email Notifications**
- **Role-based Access Control**

## Security

- JWT Authentication
- Environment-based Configuration
- Role-based Authorization
- Secure File Upload

## Database

PostgreSQL with automatic schema management via Hibernate.

## Documentation

See individual application folders for detailed setup instructions.