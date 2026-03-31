import { type RouteObject } from 'react-router';
import AboutPage from './page';

const route: RouteObject[] = [
  {
    path: '/about',
    Component: AboutPage,
  },
];

export default route;
