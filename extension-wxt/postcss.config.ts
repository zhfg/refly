import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "./styles/tailwind.config";

export default {
  plugins: [tailwind(tailwindConfig), autoprefixer],
};
