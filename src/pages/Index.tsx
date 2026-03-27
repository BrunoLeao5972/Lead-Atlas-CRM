import { Navigate } from 'react-router-dom';

// Index redirects to dashboard (handled by App.tsx route)
export default function Index() {
  return <Navigate to="/" replace />;
}
