import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto py-4 text-center text-xs text-base-content/60">
      <Link to="/technical-details">Technical Details</Link>
    </footer>
  );
};

export default Footer;
