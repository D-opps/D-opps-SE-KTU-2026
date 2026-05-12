// import { RouterProvider } from 'react-router-dom';
// import { router } from './routes';
import { Events } from './pages/Events';
// import { UserProvider } from './pages/UserContext';

// export default function App() {
//   return <RouterProvider router={router} />;
  
// }


import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { UserProvider } from './pages/UserContext';

export default function App() {
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
}