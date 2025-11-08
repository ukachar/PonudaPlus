import React, { useEffect, useState } from "react";
import { databases } from "../../appwriteConfig";
import { Link } from "react-router-dom";
import { Query } from "appwrite";
import SkeletonLoader from "../../helpers/SkeletonLoader";

export default function Ponude() {
  const [ponude, setPonude] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPonude = async () => {
    try {
      const res = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        [Query.orderDesc("$createdAt")]
      );
      setPonude(res.documents);
    } catch (err) {
      console.error("Greška pri dohvaćanju ponuda:", err);
    }
  };

  useEffect(() => {
    fetchPonude();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Jesi li siguran da želiš izbrisati ovu ponudu?"
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        id
      );
      setPonude((prev) => prev.filter((p) => p.$id !== id));
    } catch (err) {
      console.error("Greška pri brisanju ponude:", err);
      alert("Došlo je do greške pri brisanju ponude.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sve ponude</h1>
        <Link to="/kreiraj-ponudu" className="btn btn-primary">
          Kreiraj novu ponudu
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th># Ponude</th>
              <th>Kupac</th>
              <th>Adresa</th>
              <th>Iznos (€)</th>
              <th>Datum</th>
              <th className="text-center">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {ponude.length > 0 ? (
              ponude.map((p) => (
                <tr key={p.$id}>
                  <td className="font-bold">{p.broj_ponude}</td>
                  <td title={p.kupac}>{p.kupac}</td>
                  <td title={p.adresa_kupca}>{p.adresa_kupca || "-"}</td>
                  <td>{p.total ? p.total.toFixed(2) : "0.00"}</td>
                  <td>{new Date(p.$createdAt).toLocaleDateString()}</td>
                  <td className="text-center space-x-2">
                    <Link
                      to={`/uredi-ponudu/${p.$id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Uredi
                    </Link>
                    <Link
                      to={`/ponuda-pdf/${p.$id}`}
                      target="_blank"
                      className="btn btn-sm btn-secondary"
                    >
                      Print
                    </Link>
                    <button
                      onClick={() => handleDelete(p.$id)}
                      className="btn btn-sm btn-error"
                      disabled={loading}
                    >
                      {loading ? "Brisanje..." : "Izbriši"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-500">
                  Nema ponuda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
