# RestaurantAI Multi-Agent Pipeline

## Overview

RestaurantAI is a sophisticated multi-agent data extraction and processing pipeline designed to collect, standardize, and validate restaurant information from various sources. The system uses AI-powered agents to scrape web data, extract structured information, and synthesize conflicting data into a unified restaurant database. The application features a React-based dashboard for monitoring pipeline operations, agent status, and data quality metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom color variables and design tokens
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with shared UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured endpoint organization
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Logging**: Custom logging system for API requests and agent activities

### Multi-Agent System
- **Agent Manager**: Centralized agent orchestration and lifecycle management
- **Agent Types**: 
  - Web scraping agents for data collection
  - Data extraction agents for content parsing
  - Schema validation agents for data quality assurance
  - AI synthesis agents for conflict resolution
- **Pipeline Orchestrator**: Coordinates multi-step data processing workflows
- **Queue Management**: Processing queue for managing extraction tasks

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive restaurant data schema with support for:
  - Restaurant metadata (name, address, cuisine types)
  - Contact information and operating hours
  - Ratings aggregation from multiple sources
  - Data lineage tracking and quality metrics
- **In-Memory Storage**: Fallback memory storage implementation for development

### AI Integration
- **Provider**: Google Gemini AI for intelligent data processing
- **Use Cases**:
  - Data synthesis from conflicting sources
  - Cuisine type classification
  - Address validation and standardization
  - Quality assessment of extracted data

### Monitoring and Analytics
- **Real-time Metrics**: Pipeline performance tracking and agent status monitoring
- **Dashboard Components**: Live updating components for queue status and extraction results
- **Data Quality Tracking**: Completeness and accuracy metrics for extracted data

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI service for data synthesis and classification
- **Configuration**: API key-based authentication with configurable model selection

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migrations and schema management
- **Connection**: Environment variable-based connection string configuration

### Web Scraping
- **Cheerio**: Server-side HTML parsing and DOM manipulation
- **Axios**: HTTP client for web requests with custom headers and timeout handling

### UI and Styling
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Google Fonts**: Typography using Roboto and Roboto Mono font families

### Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **ESBuild**: Production bundling for server-side code
- **Replit Integration**: Development environment plugins and error handling

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class management
- **zod**: Runtime type validation and schema definition
- **nanoid**: Unique ID generation for entities