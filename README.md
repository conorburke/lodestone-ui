# Lodestone UI

A clean, modern React interface for the Lodestone platform - file management with semantic search capabilities.

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-4+-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3+-38B2AC?style=flat-square&logo=tailwind-css)

## Features

- **File Management** - Upload, view, and organize documents
- **Semantic Search** - Natural language queries across your files
- **User Authentication** - Secure login and registration
- **Modern UI** - Clean glassmorphism design with animated background

## Getting Started

### Prerequisites
- Node.js 16+
- Running Lodestone backend server

### Installation

```bash
# Install dependencies
npm install

# Configure API endpoint in src/App.jsx
const API_BASE = 'http://your-backend-url:8000';

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Using Make Commands

```bash
make install    # Install dependencies
make up         # Start development server
```

## API Integration

The frontend connects to these Lodestone API endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/files/` - List files
- `POST /api/v1/files/upload` - Upload files
- `POST /api/v1/semantic/query` - Semantic search

## Development

Built with:
- **React 18** with hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons

## License

MIT License