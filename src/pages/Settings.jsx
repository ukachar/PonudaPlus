import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { databases, storage } from "../../appwriteConfig";

const COLLECTION_ID = import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE;
const DOCUMENT_ID = import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID;

const Settings = () => {
  const [settingsData, setSettingsData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID);
    const fetchData = async () => {
      try {
        const response = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID,
          DOCUMENT_ID
        );
        setSettingsData(response);
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

  const updateSettings = async () => {
    const { naziv_tvrtke, adresa, pbr, oib } = settingsData;
    const updatedData = { naziv_tvrtke, adresa, pbr, oib };

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        DOCUMENT_ID,
        updatedData
      );
      console.log("Document updated successfully:", response);
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      const toast = document.getElementById("toast-simple");
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 3000);
    }
  };

  const handleChange = (e) => {
    setSettingsData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Header />
      <section>
        <div className="flex justify-center items-center pt-6 ">
          <div className="w-6/12 border-gray-700 rounded-lg border-2 p-4">
            <h2 className="text-2xl">Postavke</h2>
            <p>Promjenite postavke aplikacije</p>
            <form className="pt-4">
              <div className="grid grid-cols-12 gap-2 py-2">
                <label className="input input-bordered flex items-center gap-2 col-span-12">
                  <span className="font-bold">Naziv tvrtke</span>
                  <input
                    type="text"
                    name="naziv_tvrtke"
                    className="grow "
                    placeholder="Abeceda d.o.o."
                    value={settingsData.naziv_tvrtke}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2">
                <label className="input input-bordered flex items-center gap-2 col-span-12">
                  <span className="font-bold">Adresa</span>
                  <input
                    type="text"
                    name="adresa"
                    className="grow"
                    placeholder="Abeceda d.o.o."
                    value={settingsData.adresa}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2">
                <label className="input input-bordered flex items-center gap-2 col-span-12">
                  <span className="font-bold">Poštanski broj i mjesto</span>
                  <input
                    type="text"
                    name="pbr"
                    className="grow"
                    placeholder="42000 Varaždin"
                    value={settingsData.pbr}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2">
                <label className="input input-bordered flex items-center gap-2 col-span-12">
                  <span className="font-bold">OIB</span>
                  <input
                    type="text"
                    maxLength={13}
                    name="oib"
                    className="grow"
                    placeholder="1234567789123"
                    value={settingsData.oib}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2">
                <label className="input input-bordered flex items-center gap-2 col-span-12 pr-2">
                  LOGO
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full max-w-xs"
                  />
                </label>
              </div>
              <img
                className="mx-auto mt-4"
                width={200}
                src={storage.getFilePreview(
                  "67bcd7c900332f219c53",
                  "67bcd7e500166c72cc0e"
                )}
                alt="Logo"
              />
            </form>
            <div className="flex justify-center p-4">
              <button className="btn btn-lg" onClick={updateSettings}>
                Spremi
              </button>
            </div>
            <div
              id="toast-simple"
              className=" hidden absolute flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow-sm dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800"
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translate(-50%, 0)",
              }}
              role="alert"
            >
              Postavke su spremljene.
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Settings;
