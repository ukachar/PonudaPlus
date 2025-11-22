import React from "react";
import { APP_VERSIONS } from "../version";

const TechnicalDetails = () => {
  return (
    <>
      <h2 className="mt-12 text-lg font-medium text-heading">
        📝 Tehnički Detalji
      </h2>

      <ul className="max-w-md space-y-1 text-body list-disc list-inside">
        {/* Main dependencies */}
        <li>
          <strong>React:</strong> {APP_VERSIONS.react}
        </li>
        <li>
          <strong>React DOM:</strong> {APP_VERSIONS.react_dom}
        </li>
        <li>
          <strong>React Router DOM:</strong> {APP_VERSIONS.react_router_dom}
        </li>
        <li>
          <strong>Appwrite:</strong> {APP_VERSIONS.appwrite}
        </li>
        <li>
          <strong>html2canvas-pro:</strong> {APP_VERSIONS.html2canvas}
        </li>
        <li>
          <strong>html2pdf.js:</strong> {APP_VERSIONS.html2pdf}
        </li>

        {/* Dev dependencies */}
        <li>
          <strong>Vite:</strong> {APP_VERSIONS.vite}
        </li>
        <li>
          <strong>TailwindCSS:</strong> {APP_VERSIONS.tailwindcss}
        </li>
        <li>
          <strong>DaisyUI:</strong> {APP_VERSIONS.daisyui}
        </li>
        <li>
          <strong>ESLint:</strong> {APP_VERSIONS.eslint}
        </li>
        <li>
          <strong>Autoprefixer:</strong> {APP_VERSIONS.autoprefixer}
        </li>
        <li>
          <strong>PostCSS:</strong> {APP_VERSIONS.postcss}
        </li>
      </ul>
    </>
  );
};

export default TechnicalDetails;
