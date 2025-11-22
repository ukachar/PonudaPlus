import packageJson from "../package.json";

export const APP_VERSIONS = {
  react: packageJson.dependencies["react"],
  react_dom: packageJson.dependencies["react-dom"],
  react_router_dom: packageJson.dependencies["react-router-dom"],
  appwrite: packageJson.dependencies["appwrite"],
  html2canvas: packageJson.dependencies["html2canvas-pro"],
  html2pdf: packageJson.dependencies["html2pdf.js"],

  // Dev deps
  vite: packageJson.devDependencies["vite"],
  tailwindcss: packageJson.devDependencies["tailwindcss"],
  daisyui: packageJson.devDependencies["daisyui"],
  eslint: packageJson.devDependencies["eslint"],
  autoprefixer: packageJson.devDependencies["autoprefixer"],
  postcss: packageJson.devDependencies["postcss"],
};
