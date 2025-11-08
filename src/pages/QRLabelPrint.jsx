import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { databases } from "../../appwriteConfig";

export default function QRLabelPrint() {
  const { id } = useParams();
  const [prijem, setPrijem] = React.useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
          id
        );
        setPrijem(p);
      } catch (err) {
        console.error("Greška:", err);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (prijem) {
      setTimeout(() => window.print(), 500);
    }
  }, [prijem]);

  if (!prijem) return <p>Učitavanje...</p>;

  const qrValue = `${window.location.origin}/prijem-pdf/${id}`;
  const stavke = prijem.stavke ? JSON.parse(prijem.stavke) : [];

  return (
    <div className="flex flex-wrap gap-4 p-8 bg-white">
      {/* QR Label za svaku stavku */}
      {stavke.map((stavka, index) => (
        <div
          key={index}
          className="border-2 border-black p-4 flex flex-col items-center justify-center"
          style={{
            width: "10cm",
            height: "7cm",
            pageBreakAfter: "always",
          }}
        >
          {/* QR Code */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              qrValue
            )}`}
            alt="QR Code"
            className="mb-3"
          />
          {/* Informacije */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{stavka.naziv}</h2>
            <p className="text-lg font-mono bg-gray-200 px-3 py-1 rounded">
              {stavka.sifra}
            </p>
            <p className="text-sm mt-2">
              {prijem.ime_kupca} {prijem.prezime_kupca}
            </p>
            <p className="text-xs text-gray-600">{prijem.datum_prijema}</p>
          </div>
          {/* ID za skeniranje */}
          <div className="mt-2 text-xs text-gray-500">ID: {id.slice(-8)}</div>
        </div>
      ))}

      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
            size: 10cm 7cm;
          }
        }
      `}</style>
    </div>
  );
}
