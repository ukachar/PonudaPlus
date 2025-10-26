import React, { useEffect, useState } from "react";
import { databases, storage } from "../../appwriteConfig";

const COLLECTION_ID = import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE;
const DOCUMENT_ID = import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID;
const BUCKET_ID = import.meta.env.VITE_APPWRITE_SETTINGS_BUCKET_ID; // bucket za logo

const Settings = () => {
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Dohvati postavke
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID,
          DOCUMENT_ID
        );
        setSettingsData(response);

        // Ako postoji logoId, generiraj preview preko direktnog URL-a
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
    setSettingsData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
      console.log("Upload response:", response);
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
      console.log("Updated settings:", response);
      setSettingsData(response);

      // Ako je logo spremljen, postavi preview na direktni Appwrite URL
      if (response.logoId && response.logoBucketId) {
        const logoUrl = storage.getFileView(
          response.logoBucketId,
          response.logoId
        );
        setLogoPreview(logoUrl);
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

        <form className="pt-4">
          {["naziv_tvrtke", "adresa", "pbr", "oib"].map((field) => (
            <div key={field} className="grid grid-cols-12 gap-2 py-2">
              <label className="input input-bordered flex items-center gap-2 col-span-12">
                <span className="font-bold">
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
            </div>
          ))}

          <div className="grid grid-cols-12 gap-2 py-2">
            <label className="flex flex-col col-span-12 gap-2">
              <span className="font-bold">LOGO</span>
              <div>
                Promjeni logo: &nbsp;
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full max-w-xs"
                  onChange={handleLogoChange}
                />
              </div>
            </label>
          </div>

          {logoPreview && (
            <img
              className="mx-auto mt-4"
              width={200}
              src={logoPreview}
              alt="Logo"
            />
          )}
        </form>

        <div className="flex justify-center p-4">
          <button className="btn btn-lg" onClick={updateSettings}>
            Spremi
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
