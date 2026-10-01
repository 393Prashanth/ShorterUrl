# 🔗 ShorterUrl - Scalable URL Shortener Backend

An enterprise-grade, high-performance URL Shortener REST API built with **NestJS**, **PostgreSQL**, and **TypeORM**.

## 📌 Architecture Highlights
- **Layered Architecture**: Clean separation across Controllers, Services, and Repositories.
- **Dependency Injection**: Modular, testable, and loosely coupled design.
- **Database**: PostgreSQL with connection pooling and TypeORM entities.
- **Validation**: Strict DTO validation and global exception filters.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/393Prashanth/ShorterUrl.git
cd ShorterUrl
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your local database credentials:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
```bash
# Development mode (with hot-reload)
npm run start:dev
```
Application will be available at `http://localhost:5000`.

