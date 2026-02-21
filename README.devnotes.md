Developer notes:

## Mono-repo Structure
- `/frontend` - Vite 5 + React 18 + TypeScript
- `/backend` - Express + TypeScript + PostgreSQL
- Each has its own node_modules, tsconfig.json, and package.json

## Architecture
- Keep API keys out of the frontend; backend handles OpenAI calls
- Docker Compose orchestrates all three services (frontend, backend, db)
- Frontend proxies API calls to backend in dev mode

## Future Considerations
- Consider using Tailwind for styling and React Router for navigation
- Add tests for both frontend and backend
- Add CI/CD pipeline
