import React, { useEffect, useState } from "react";
import { databases } from "../../appwriteConfig";
import { Link } from "react-router-dom";
import { Query } from "appwrite";

export default function Ponude() {
  const [ponude, setPonude] = useState([]);

  useEffect(() => {
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
    fetchPonude();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sve ponude</h1>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="text-left"># Ponude</th>
              <th className="text-left">Kupac</th>
              <th className="text-left">Adresa</th>
              <th className="text-left">Iznos (€)</th>
              <th className="text-left">Datum</th>
              <th className="text-center">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {ponude.length > 0 ? (
              ponude.map((p) => (
                <tr key={p.$id}>
                  <td className="font-medium">{p.broj_ponude}</td>
                  <td className="truncate max-w-xs" title={p.kupac}>
                    {p.kupac}
                  </td>
                  <td className="truncate max-w-xs" title={p.adresa_kupca}>
                    {p.adresa_kupca || "-"}
                  </td>
                  <td>{p.total ? p.total.toFixed(2) : "0.00"}</td>
                  <td>{new Date(p.$createdAt).toLocaleDateString()}</td>
                  <td className="text-center space-x-2">
                    <Link
                      to={`/uredi-ponudu/${p.$id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Uredi
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
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
