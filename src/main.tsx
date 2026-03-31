import '@/data/config/i18n/i18n.config.ts';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import Layout from './layout.tsx';
import Notfound from './notFound.tsx';

const modules = import.meta.glob('./pages/**/route.ts', { eager: true });
const routes = Object.values(modules)
  .map((d: any) => d.default)
  .flat();

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      ...routes,
      {
        path: '*',
        Component: Notfound,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <>
    <RouterProvider router={router}></RouterProvider>
  </>
);
