import sharedRoutes from './sharedRoutes';
import { authRoutes } from '@auth';
import uc01Routes from '../../UC01/routes/routes';
import uc02Routes from '../../UC02/routes/routes';

const routes = [...sharedRoutes, ...authRoutes, ...uc01Routes, ...uc02Routes]

export default routes
