import sharedRoutes from './sharedRoutes';
import authRoutes from '../../auth/routes/routes';
import uc01Routes from '../../UC01/routes/routes';
import uc02Routes from '../../UC02/routes/routes';
import uc03Routes from '../../UC03/routes/routes';
import uc04Routes from '../../UC04/routes/routes';
import uc05Routes from '../../UC05/routes/routes';
import uc06Routes from '../../UC06/routes/routes';
import uc09Routes from '../../UC09/routes/routes';
import uc13Routes from '../../UC-13/routes/routes';
import uc19Routes from '../../UC19/routes/routes';
import adminRoutes from '../../admin/routes/routes';

const routes = [...sharedRoutes, ...authRoutes, ...uc01Routes, ...uc02Routes, ...uc03Routes, ...uc04Routes, ...uc05Routes, ...uc06Routes, ...uc09Routes, ...uc13Routes, ...uc19Routes, ...adminRoutes]

export default routes
