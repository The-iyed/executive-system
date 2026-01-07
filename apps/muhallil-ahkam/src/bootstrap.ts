import { createMount } from './mount';

const mount = createMount();

if (typeof window !== 'undefined') {
  window.AHKAM_APP = mount;
}

