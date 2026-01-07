import { createMount } from './mount';

const mount = createMount();

if (typeof window !== 'undefined') {
  window.SANAD_APP = mount;
}

