import tailwindNesting from 'tailwindcss/nesting';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

export default {
  plugins: [tailwindNesting, tailwind(tailwindConfig), autoprefixer()],
};
