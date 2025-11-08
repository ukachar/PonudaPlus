// helpers/QRCodeGenerator.jsx
import React, { useEffect, useRef } from "react";

const QRCodeGenerator = ({ value, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    // Koristimo qrcodegen biblioteku (dodaj u HTML ili koristi npm paket)
    // Za sada ćemo koristiti jednostavnu implementaciju preko externe biblioteke

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Jednostavna implementacija koristeći API servis
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      value
    )}`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.src = qrCodeUrl;
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="border border-gray-300 rounded"
    />
  );
};

export default QRCodeGenerator;
