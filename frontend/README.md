# Boi Adda Frontend

A React-based frontend for the Boi Adda book sharing platform.

## Environment Setup

The application uses environment variables for configuration:

### Development
- Copy `.env.development` or create `.env.local` for local overrides
- Default API URL: `http://localhost:8000`

### Production
- Uses `.env.production` for production builds
- Default production API URL: `https://boi-adda-backend.onrender.com`
- Can be overridden with environment variables in deployment platform

### Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The build script will automatically use the production environment configuration.

## Deployment

For Render deployment:
1. Set `VITE_API_BASE_URL` environment variable in Render dashboard if different from default
2. Use `build.sh` as the build command
3. Use `dist` as the publish directory

## API Integration

The frontend communicates with a FastAPI backend and includes:
- Authentication with JWT tokens
- Book management
- User profiles
- Donation system
- Borrowing system
- Admin dashboard

All API calls are handled through axios with automatic token management.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
