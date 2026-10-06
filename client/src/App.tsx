import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConfigurePage } from './pages/ConfigurePage';
import { DesignPage } from './pages/DesignPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoomPage } from './pages/RoomPage';
import { UploadPage } from './pages/UploadPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/upload', element: <UploadPage /> },
      { path: '/configure', element: <ConfigurePage /> },
      { path: '/rooms/:roomId', element: <RoomPage /> },
      { path: '/designs/:designId', element: <DesignPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
