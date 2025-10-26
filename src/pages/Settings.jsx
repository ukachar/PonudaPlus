import React, { useEffect, useState } from "react";
import { databases, storage } from "../../appwriteConfig";

const COLLECTION_ID = import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE;
const DOCUMENT_ID = import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID;
const BUCKET_ID = import.meta.env.VITE_APPWRITE_SETTINGS_BUCKET_ID;

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
];

const Settings = () => {
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // 🔹 Dohvati postavke i primijeni temu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID,
          DOCUMENT_ID
        );
        setSettingsData(response);

        // Postavi temu iz baze
        if (response.tema) {
          document.documentElement.setAttribute("data-theme", response.tema);
        }

        // Ako postoji logoId, prikazi logo
        if (response.logoId && response.logoBucketId) {
          const logoUrl = storage.getFileView(
            response.logoBucketId,
            response.logoId
          );
          setLogoPreview(logoUrl);
        }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error fetching data: {error.message}</p>;

  const handleChange = (e) => {
    const value = e.target.value;
    setSettingsData((prev) => ({ ...prev, [e.target.name]: value }));

    if (e.target.name === "tema") {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem("tema", value); // spremi da ostane i nakon refresha
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const response = await storage.createFile(
        BUCKET_ID,
        "unique()",
        logoFile
      );
      return response;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    }
  };

  const updateSettings = async () => {
    let updatedData = { ...settingsData };

    // Ako je novi logo, uploadaj ga
    if (logoFile) {
      const uploadResponse = await uploadLogo();
      if (uploadResponse) {
        updatedData.logoId = uploadResponse.$id;
        updatedData.logoBucketId = uploadResponse.bucketId;
      }
    }

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        DOCUMENT_ID,
        updatedData
      );
      setSettingsData(response);

      // Postavi temu odmah nakon spremanja
      if (response.tema) {
        document.documentElement.setAttribute("data-theme", response.tema);
      }

      alert("Postavke su spremljene.");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Greška prilikom spremanja postavki.");
    }
  };

  return (
    <div className="flex justify-center items-center pt-6">
      <div className="w-6/12 border-gray-700 rounded-lg border-2 p-4 relative">
        <h2 className="text-2xl mb-2">Postavke</h2>
        <p className="mb-4">Promijenite postavke aplikacije</p>

        <form className="pt-4 space-y-4">
          {/* Tekstualna polja */}
          {["naziv_tvrtke", "adresa", "pbr", "oib"].map((field) => (
            <label
              key={field}
              className="input input-bordered flex items-center gap-2 w-full"
            >
              <span className="font-bold w-40">
                {field.replace("_", " ").toUpperCase()}
              </span>
              <input
                type="text"
                name={field}
                className="grow"
                value={settingsData[field] || ""}
                onChange={handleChange}
              />
            </label>
          ))}

          {/* Tema */}
          <div className="form-control">
            <label className="label font-bold">Odaberite temu</label>
            <select
              name="tema"
              className="select select-bordered w-full"
              value={settingsData.tema || ""}
              onChange={handleChange}
            >
              <option value="">Odaberi temu</option>
              {themes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Logo */}
          <div className="form-control">
            <label className="label font-bold">Logo</label>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered w-full"
              onChange={handleLogoChange}
            />
          </div>

          {logoPreview && (
            <img
              className="mx-auto mt-4 rounded-lg shadow"
              width={200}
              src={logoPreview}
              alt="Logo"
            />
          )}
        </form>

        <div className="flex justify-center p-4">
          <button className="btn btn-lg btn-primary" onClick={updateSettings}>
            Spremi
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
