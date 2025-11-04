import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { databases, storage } from "../../appwriteConfig";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import getSettings from "../../helpers/getSettings";
import getUserInfo from "../../helpers/getUserInfo";

export default function PrijemPDF() {
  const { id } = useParams();
  const pdfRef = useRef(null);
  const [prijem, setPrijem] = useState(null);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
          id
        );
        setPrijem(p);

        const s = await getSettings();
        if (s.logoId && s.logoBucketId) {
          s.logoUrl = storage.getFileView(s.logoBucketId, s.logoId);
        }
        setSettings(s);

        const u = await getUserInfo();
        setUser(u);
      } catch (err) {
        console.error("Greška pri dohvaćanju podataka:", err);
      }
    };

    fetchData();
  }, [id]);

  const generatePDF = async () => {
    if (!pdfRef.current) return;

    const pdf = new jsPDF("p", "mm", "a5");
    const pageWidth = 148;
    const pageHeight = 210;
    const margin = 2;

    // Generiraj sliku iz HTML-a
    const canvas = await html2canvas(pdfRef.current, {
      useCORS: true,
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Dodaj sliku i centriraj ako je niža od stranice
    const yOffset = Math.max(margin, (pageHeight - imgHeight) / 2);
    pdf.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);

    // Umjesto dataurlnewwindow koristi bloburl (radi sigurnije)
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank");
  };

  useEffect(() => {
    if (prijem && settings) {
      setTimeout(generatePDF, 500);
    }
  }, [prijem, settings]);

  if (!prijem || !settings) return <p>Dohvaćanje podataka...</p>;

  const stavke = prijem.stavke ? JSON.parse(prijem.stavke) : [];

  return (
    <div
      ref={pdfRef}
      className="border p-6 bg-white flex flex-col text-black"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <img
          src={settings.logoUrl || "/logo_inverted.png"}
          alt="Logo"
          className="w-32"
        />
        <div className="text-right text-sm">
          <strong>{settings.naziv_tvrtke}</strong>
          <p>{settings.adresa}</p>
          <p>Matični broj: {settings.mbr}</p>
          <p>OIB: {settings.oib}</p>
          <p>MOB: {settings.phone}</p>
        </div>
      </div>
      <hr className="my-4" />

      {/* Naslov */}
      <h2 className="text-2xl font-bold text-center mb-4">
        RADNI NALOG - PRIJEM STROJA
      </h2>

      {/* Podaci o kupcu */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <h3 className="font-bold mb-2 text-lg">Podaci o kupcu:</h3>
          <p>
            <strong>Ime i prezime:</strong> {prijem.ime_kupca}{" "}
            {prijem.prezime_kupca}
          </p>
          <p>
            <strong>Adresa:</strong> {prijem.adresa || "-"}
          </p>

          <p>
            <strong>Mobitel:</strong> {prijem.mobitel || "-"}
          </p>
          <p>
            <strong>Email:</strong> {prijem.email || "-"}
          </p>
        </div>
        <div className="text-right">
          <p>
            <strong>Datum prijema:</strong>{" "}
            {new Date(prijem.datum_prijema)
              .toLocaleDateString("hr-HR")
              .replaceAll(" ", "")}
          </p>

          <p>
            <strong>Zaprimio:</strong> {user ? user.name : "Nepoznato"}
          </p>
          <p className="text-xs text-gray-500 mt-2">ID: {prijem.$id}</p>
        </div>
      </div>

      <hr className="my-4" />

      {/* Stavke */}
      <h3 className="font-bold text-lg mb-3">Primljeni strojevi/oprema:</h3>
      <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Naziv</th>
            <th className="border border-gray-300 p-2 text-center">Šifra</th>
            <th className="border border-gray-300 p-2 text-left">Opis/Kvar</th>
            <th className="border border-gray-300 p-2 text-center">Stanje</th>
          </tr>
        </thead>
        <tbody>
          {stavke.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{item.naziv}</td>
              <td className="border border-gray-300 p-2 text-center">
                <span className="bg-gray-200 px-2 py-1 rounded">
                  {item.sifra}
                </span>
              </td>
              <td className="border border-gray-300 p-2">{item.opis || "-"}</td>
              <td className="border border-gray-300 p-2 text-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    item.stanje === "Gotovo"
                      ? "bg-green-200"
                      : item.stanje === "U popravku"
                      ? "bg-yellow-200"
                      : item.stanje === "Čeka dio"
                      ? "bg-orange-200"
                      : "bg-blue-200"
                  }`}
                >
                  {item.stanje}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Napomena */}
      {prijem.napomena && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Napomena:</h3>
          <div className="border border-gray-300 p-3 bg-gray-50 rounded">
            {prijem.napomena}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-6 text-sm border-t border-gray-300">
        <div className="grid grid-cols-2 gap-8 mt-4">
          <div>
            <p className="mb-8">Potpis primatelja:</p>
            <p className="border-t border-gray-400 pt-1">
              ______________________________
            </p>
          </div>
          <div>
            <p className="mb-8">Potpis zaposlenika:</p>
            <p className="border-t border-gray-400 pt-1">
              ______________________________
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          Dokument generiran: {new Date().toLocaleString("hr-HR")}
        </p>
      </div>
    </div>
  );
}
