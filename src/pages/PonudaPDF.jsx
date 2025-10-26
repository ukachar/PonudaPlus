import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { databases, storage } from "../../appwriteConfig";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import getSettings from "../../helpers/getSettings";
import getUserInfo from "../../helpers/getUserInfo";

export default function PonudaPDF() {
  const { id } = useParams();
  const pdfRef = useRef(null);
  const [ponuda, setPonuda] = useState(null);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
          id
        );
        setPonuda(p);

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
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const canvas = await html2canvas(pdfRef.current, {
      useCORS: true,
      scale: 2,
    });
    const imgData = canvas.toDataURL("image/png");

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      pageWidth - 2 * margin,
      pageHeight - 2 * margin
    );
    pdf.autoPrint();
    pdf.output("dataurlnewwindow");
  };

  useEffect(() => {
    if (ponuda && settings) {
      setTimeout(generatePDF, 500);
    }
  }, [ponuda, settings]);

  if (!ponuda || !settings) return <p>Dohvaćanje podataka...</p>;

  const items = ponuda.stavke ? JSON.parse(ponuda.stavke) : [];
  const subtotal = ponuda.subtotal || 0;
  const pdv = ponuda.pdv || 0;
  const total = ponuda.total || 0;

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

      {/* Kupac info */}
      <div className="flex justify-between text-sm">
        <div>
          <p>
            Naziv kupca: <strong>{ponuda.kupac}</strong>
          </p>
          <p>Adresa kupca: {ponuda.adresa_kupca}</p>
          <p>Poštanski broj: {ponuda.pbr_kupca}</p>
          <p>OIB: {ponuda.oib_kupca}</p>
        </div>
        <div className="text-right">
          <p>Datum ponude: {ponuda.datum_ponude}</p>
          <p>Vrijedi do: {ponuda.vrijedi_do}</p>
        </div>
      </div>

      <h4 className="text-lg font-bold text-center my-4">
        Ponuda #{ponuda.broj_ponude}
      </h4>
      <hr className="my-4" />

      {/* Items Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left">Naziv</th>
            <th>Količina</th>
            <th>Cijena (€)</th>
            <th>Rabat (%)</th>
            <th>Ukupno (€)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b">
              <td>{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-center">{item.price.toFixed(2)}</td>
              <td className="text-center">{item.discount}</td>
              <td className="text-center">
                {(
                  item.quantity *
                  (item.price * (1 - item.discount / 100))
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-right mt-4 text-sm">
        <p>Ukupno: {subtotal.toFixed(2)} €</p>
        <p>PDV (25%): {pdv.toFixed(2)} €</p>
        <p className="font-bold">Sveukupno: {total.toFixed(2)} €</p>
      </div>

      {/* Footer */}
      <div className="text-sm mt-auto pt-6">
        <p>Ponudu izdao: {user ? user.name : "Nepoznato"}</p>
        <p>Način plaćanja: transakcijski račun</p>
        <p>JIR i ZKI: [JIR i ZKI]</p>
        <p>Članovi uprave: [Članovi uprave]</p>
        <p>Temeljni kapital: [Temeljni kapital]</p>
        <p>[Sud]</p>
        <p>[Naziv banke]</p>
        <p>IBAN: [Bankovni račun (IBAN)]</p>
        <p>SWIFT/BIC: [SWIFT/BIC]</p>
      </div>
    </div>
  );
}
