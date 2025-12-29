# Overview

This is a full-stack gym workout tracking application built with React, Express.js, and PostgreSQL. The application follows a Chest/Arms/Back/Legs workout split system, allowing users to track exercises across four main categories: chest exercises, arm exercises (biceps, triceps), back exercises, and leg exercises (quadriceps, hamstrings, glutes). Users can create, read, update, and delete workout exercises with details like weight, reps, and notes. The workout flow follows: Chest → Arms → Back → Legs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing with main routes (/, /chest, /arms, /back, /legs, /cardio)
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **API Design**: RESTful endpoints following conventional patterns (/api/exercises with GET, POST, PATCH, DELETE methods)
- **Development Setup**: Hot reload with Vite integration in development mode
- **Error Handling**: Centralized error middleware with proper HTTP status codes and JSON responses

## Data Storage
- **Database**: PostgreSQL as the primary database with Neon serverless hosting
- **Schema Design**: Two main tables - users and exercises with proper relationships and constraints
- **Migration System**: Drizzle Kit for database schema migrations and version control
- **Validation**: Zod schemas for runtime type validation on both client and server sides
- **Temporary Storage**: In-memory storage implementation for development with pre-seeded sample data

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **User Model**: Basic username/password authentication structure (implementation pending)
- **Security**: Prepared for secure session handling and user isolation

## External Dependencies
- **Database Hosting**: Neon PostgreSQL serverless database
- **UI Framework**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Handling**: React Hook Form with Hookform Resolvers for form validation
- **Development Tools**: ESBuild for production bundling, TSX for TypeScript execution
- **Carousel Component**: Embla Carousel for interactive UI elements
- **Validation**: Zod for schema validation and type inference