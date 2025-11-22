import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { databases, storage } from "../../appwriteConfig"; // dodano storage
import { formattedDate } from "../../helpers/todaysDate";
import { calculateExpiryDate } from "../../helpers/calculateExpiryDate";
import getUserInfo from "../../helpers/getUserInfo";
import getSettings from "../../helpers/getSettings";
import { ID, Query } from "appwrite";

const KreirajPonudu = () => {
  const pdfRef = useRef(null);
  const [formData, setFormData] = useState({
    kupac: "",
    adresa_kupca: "",
    pbr_kupca: "",
    oib_kupca: "",
    datum_ponude: formattedDate,
    vrijedi_do: calculateExpiryDate(0),
    broj_ponude: 0,
  });

  const [daysValid, setDaysValid] = useState(0);
  const [settings, setSettings] = useState({});
  const [broj_ponude, setBrojPonude] = useState(0);
  const [user, setUser] = useState(null);

  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Ovo je helper koji ti već vraća settings iz baze
        const s = await getSettings();

        // Ako postoji logo, generiraj URL
        if (s.logoId && s.logoBucketId) {
          s.logoUrl = storage.getFileView(s.logoBucketId, s.logoId);
        }

        setSettings(s);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    const fetchUser = async () => {
      const u = await getUserInfo();
      setUser(u);
    };

    const fetchBrojPonude = async () => {
      const broj = await getNextPonudaNumber();
      setBrojPonude(broj);
      setFormData((prev) => ({ ...prev, broj_ponude: broj }));
    };

    fetchSettings();
    fetchUser();
    fetchBrojPonude();
  }, []);

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
    return { subtotal, pdv: 0, total: subtotal }; // PDV = 0
  };

  const { subtotal, pdv, total } = calculateTotal();

  const generatePDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    setTimeout(async () => {
      try {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;

        const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
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

        await savePonuda();
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }, 100);
  };

  const getNextPonudaNumber = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Dohvati sve ponude iz trenutne godine
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );

      // Filtriraj ponude iz trenutne godine
      const thisYearPonude = response.documents.filter((p) => {
        if (!p.broj_ponude) return false;
        const year = p.broj_ponude.split("-")[0];
        return year === currentYear.toString();
      });

      // Pronađi najveći broj u ovoj godini
      let maxNumber = 0;
      thisYearPonude.forEach((p) => {
        const parts = p.broj_ponude.split("-");
        if (parts.length === 2) {
          const num = parseInt(parts[1]);
          if (num > maxNumber) maxNumber = num;
        }
      });

      // Sljedeći broj
      const nextNumber = (maxNumber + 1).toString().padStart(2, "0");
      return `${currentYear}-${nextNumber}`;
    } catch (error) {
      console.error("Error fetching last ponuda number:", error);
      const currentYear = new Date().getFullYear();
      return `${currentYear}-01`;
    }
  };

  const savePonuda = async () => {
    try {
      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        ID.unique(),
        {
          broj_ponude,
          kupac: formData.kupac,
          adresa_kupca: formData.adresa_kupca,
          pbr_kupca: formData.pbr_kupca,
          oib_kupca: formData.oib_kupca,
          datum_ponude: formData.datum_ponude,
          vrijedi_do: calculateExpiryDate(daysValid),
          stavke: JSON.stringify(items),
          subtotal,
          pdv,
          total,
        }
      );
      console.log("Ponuda saved:", response);
    } catch (error) {
      console.error("Error saving ponuda:", error);
    }
  };

  return (
    <>
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

            <label htmlFor="valuta" className="font-medium">
              Ponuda vrijedi (dani):
            </label>
            <input
              id="valuta"
              name="valuta"
              type="number"
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              placeholder="Vrijednost ponude u danima"
              className="input input-bordered "
            />
          </form>

          <hr className="my-6" />
          <h3 className="text-lg font-semibold mb-2">Dodaj artikle</h3>

          {/* Labels */}
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold mb-1 px-1">
            <span>Naziv artikla</span>
            <span>Količina</span>
            <span>Cijena (€)</span>
            <span>Rabat (%)</span>
            <span>Ukloni</span>
          </div>

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

          {/* Customer Info */}
          <div className="flex justify-between text-sm">
            <div>
              <p>
                Naziv kupca: <strong>{formData.kupac}</strong>
              </p>
              <p>Adresa kupca: {formData.adresa_kupca}</p>
              <p>Poštanski broj:{formData.pbr_kupca}</p>
              <p>OIB: {formData.oib_kupca}</p>
            </div>
            <div className="text-right">
              <p>Datum ponude: {formattedDate}</p>
              <p>Vrijedi do: {calculateExpiryDate(daysValid)}</p>
            </div>
          </div>

          <h4 className="text-lg font-bold text-center my-4">
            PONUDA {broj_ponude}
          </h4>
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
            <p className="font-bold text-lg">Ukupno: {total.toFixed(2)} €</p>
          </div>

          <div className="text-left mt-2">
            <p className="text-sm text-gray-500 mt-1">
              LD nije u sustavu PDV-a. U cijenu nije uračunat porez prema članku
              90. stavak 1 zakona o PDV-u.
            </p>
          </div>

          <div className="text-sm mt-auto">
            <p>Ponudu izdao: {user ? user.name : "Nepoznato"}</p>
            <p className="text-center">Software: ukachar.com</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KreirajPonudu;
