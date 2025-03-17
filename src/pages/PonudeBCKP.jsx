import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import Header from "../components/Header";
import { formattedDate } from "../../helpers/todaysDate";

const Ponude = () => {
  const pdfRef = useRef(null);
  const [formData, setFormData] = useState({
    kupac: "",
    adresa_kupca: "",
    pbr_kupca: "",
    oib_kupca: "",
  });

  const [items, setItems] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0, discount: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => {
      const discountedPrice = item.price * (1 - item.discount / 100);
      return acc + item.quantity * discountedPrice;
    }, 0);

    const pdv = subtotal * 0.25;
    return { subtotal, pdv, total: subtotal + pdv };
  };

  const generatePDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    setTimeout(async () => {
      try {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;

        const canvas = await html2canvas(element, {
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
        pdf.save("ponuda.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }, 100);
  };

  const { subtotal, pdv, total } = calculateTotal();

  return (
    <>
      <Header />
      <div className="p-6 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 p-4 shadow-md">
          <h2 className="text-xl font-bold mb-4">Unesi podatke</h2>
          <form className="grid grid-cols-2 gap-4">
            <input
              onChange={handleChange}
              type="text"
              name="kupac"
              placeholder="Naziv kupca"
              className="input input-bordered"
              required
            />
            <input
              onChange={handleChange}
              type="text"
              name="adresa_kupca"
              placeholder="Adresa kupca"
              className="input input-bordered"
            />
            <input
              onChange={handleChange}
              type="text"
              name="pbr_kupca"
              placeholder="Poštanski broj i mjesto"
              className="input input-bordered"
            />
            <input
              onChange={handleChange}
              type="number"
              name="oib_kupca"
              placeholder="OIB kupca"
              className="input input-bordered"
            />
          </form>

          <hr className="my-6" />
          <h3 className="text-lg font-semibold mb-2">Dodaj artikle</h3>
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-2 mb-2 items-center"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  handleItemChange(index, "name", e.target.value)
                }
                placeholder="Naziv artikla"
                className="input input-bordered"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", Number(e.target.value))
                }
                placeholder="Količina"
                className="input input-bordered"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, "price", Number(e.target.value))
                }
                placeholder="Cijena (€)"
                className="input input-bordered"
              />
              <input
                type="number"
                value={item.discount}
                onChange={(e) =>
                  handleItemChange(index, "discount", Number(e.target.value))
                }
                placeholder="Rabat (%)"
                className="input input-bordered"
              />
              <button
                onClick={() => removeItem(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                ❌
              </button>
            </div>
          ))}

          <button
            onClick={addItem}
            className="mt-3 p-2 bg-blue-500 text-white rounded"
          >
            Dodaj Artikl
          </button>
          <button
            disabled={!formData.kupac || !items.length}
            onClick={generatePDF}
            className="text-white mt-4 p-2 rounded btn w-full bg-green-600"
          >
            Generiraj PDF
          </button>
        </div>

        {/* PDF Preview */}
        <div
          ref={pdfRef}
          className="pdf-container border p-6 bg-white flex flex-col text-black"
          style={{
            width: "210mm", // A4 width
            height: "297mm", // A4 height
            overflow: "hidden",
            padding: "20mm", // Keep margins inside the preview
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <img src="/logo_inverted.png" alt="Logo" className="w-32" />
            <div className="text-right text-sm">
              <strong>Naziv tvrtke</strong>
              <p>Adresa</p>
              <p>Matični broj: 12345678</p>
              <p>OIB: 12345678901</p>
              <p>Telefon: 091 123 4567</p>
            </div>
          </div>
          <hr className="my-4" />

          {/* Customer Info */}
          <div className="flex justify-between text-sm">
            <div>
              <p>
                <strong>{formData.kupac}</strong>
              </p>
              <p>{formData.adresa_kupca}</p>
              <p>{formData.pbr_kupca}</p>
              <p>OIB: {formData.oib_kupca}</p>
            </div>
            <div className="text-right">
              <p>Datum ponude: {formattedDate}</p>
              <p>Vrijedi do: 15.02.2025.</p>
            </div>
          </div>

          <h4 className="text-lg font-bold text-center my-4">Ponuda # 4</h4>
          <hr className="my-4" />

          {/* Items Table */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left">Naziv</th>
                <th>Količina</th>
                <th>Cijena (€)</th>
                <th>Rabat (€)</th>
                <th>Ukupno (€)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td>{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center">{item.price.toFixed(2)}</td>
                  <td className="text-center">{item.discount}%</td>
                  <td className="text-center">
                    {(item.quantity * (item.price - item.discount)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="text-right mt-4">
            <p>Ukupno: {subtotal.toFixed(2)} €</p>
            <p>PDV (25%): {pdv.toFixed(2)} €</p>
            <p className="font-bold">Sveukupno: {total.toFixed(2)} €</p>
          </div>

          <div className="text-sm mt-auto">
            <p>Ponudu izdao: ____________________</p>
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
      </div>
    </>
  );
};

export default Ponude;
