import sharedRoutes from './sharedRoutes';
import { authRoutes } from '@auth';
import uc01Routes from '../../UC01/routes/routes';
import uc02Routes from '../../UC02/routes/routes';
import uc03Routes from '../../UC03/routes/routes';
import uc04Routes from '../../UC04/routes/routes';
import uc05Routes from '../../UC05/routes/routes';
import uc06Routes from '../../UC06/routes/routes';

const routes = [...sharedRoutes, ...authRoutes, ...uc01Routes, ...uc02Routes, ...uc03Routes, ...uc04Routes, ...uc05Routes, ...uc06Routes]

export default routes
