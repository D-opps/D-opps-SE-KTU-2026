import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Events } from './pages/Events';

export default function App() {
  return <RouterProvider router={router} />;
  
}

