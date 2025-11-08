import React from "react";

const Toast = ({ type, title, message }) => {
  return (
    <div className="toast toast-end">
      {type === "info" ? (
        <div className="alert alert-info">
          {title && <span className="font-bold">{title}</span>}
          <span>{message}</span>
        </div>
      ) : (
        <div className="alert alert-success">
          {title && <span className="font-bold">{title}</span>}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default Toast;
