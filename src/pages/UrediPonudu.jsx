import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases } from "../../appwriteConfig";

export default function UrediPonudu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({
    kupac: "",
    adresa_kupca: "",
    pbr_kupca: "",
    oib_kupca: "",
    datum_ponude: "",
    vrijedi_do: "",
    broj_ponude: 0,
    stavke: "[]",
    subtotal: 0,
    pdv: 0,
    total: 0,
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchPonuda = async () => {
      try {
        const res = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
          id
        );
        // Postavi glavna polja
        setData({
          kupac: res.kupac || "",
          adresa_kupca: res.adresa_kupca || "",
          pbr_kupca: res.pbr_kupca || "",
          oib_kupca: res.oib_kupca || "",
          datum_ponude: res.datum_ponude || "",
          vrijedi_do: res.vrijedi_do || "",
          broj_ponude: res.broj_ponude || 0,
          stavke: res.stavke || "[]",
          subtotal: res.subtotal || 0,
          pdv: res.pdv || 0,
          total: res.total || 0,
        });

        // Parsiraj stavke iz JSON stringa
        setItems(res.stavke ? JSON.parse(res.stavke) : []);
      } catch (err) {
        console.error("Greška:", err);
      }
    };
    fetchPonuda();
  }, [id]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0, discount: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => {
      const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
      return acc + item.quantity * discountedPrice;
    }, 0);
    const pdv = subtotal * 0.25;
    const total = subtotal + pdv;
    return { subtotal, pdv, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, pdv, total } = calculateTotals();

    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        id,
        {
          kupac: data.kupac,
          adresa_kupca: data.adresa_kupca,
          pbr_kupca: data.pbr_kupca,
          oib_kupca: data.oib_kupca,
          datum_ponude: data.datum_ponude,
          vrijedi_do: data.vrijedi_do,
          broj_ponude: data.broj_ponude,
          stavke: JSON.stringify(items),
          subtotal,
          pdv,
          total,
        }
      );
      navigate("/ponude");
    } catch (err) {
      console.error("Appwrite error:", err);
    }
  };

  const { subtotal, pdv, total } = calculateTotals();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Uredi ponudu</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="kupac"
          value={data.kupac}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Kupac"
          required
        />
        <input
          name="adresa_kupca"
          value={data.adresa_kupca}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Adresa kupca"
        />
        <input
          name="pbr_kupca"
          value={data.pbr_kupca}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Poštanski broj i mjesto"
        />
        <input
          name="oib_kupca"
          value={data.oib_kupca}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="OIB kupca"
        />
        <input
          name="datum_ponude"
          value={data.datum_ponude}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Datum ponude"
        />
        <input
          name="vrijedi_do"
          value={data.vrijedi_do}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Vrijedi do"
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Stavke ponude</h2>
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-center">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
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
              type="button"
              onClick={() => removeItem(index)}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            >
              ❌
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="mt-3 p-2 bg-blue-500 text-white rounded"
        >
          Dodaj artikl
        </button>

        <div className="mt-4">
          <p>Subtotal: {subtotal.toFixed(2)} €</p>
          <p>PDV (25%): {pdv.toFixed(2)} €</p>
          <p className="font-bold">Total: {total.toFixed(2)} €</p>
        </div>

        <button type="submit" className="btn btn-primary w-full mt-4">
          Spremi promjene
        </button>
      </form>
    </div>
  );
}
