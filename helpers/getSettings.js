// helpers/getSettings.js
import { databases } from "../appwriteConfig";
import { Query } from "appwrite";

let cachedSettings = null; // cache da ne fetchamo svaki put

export default async function getSettings() {
  if (cachedSettings) return cachedSettings; // vraća cache ako postoji

  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE,
      import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION,
      [Query.limit(1)]
    );

    if (response.documents.length > 0) {
      cachedSettings = response.documents[0]; // cache
      return cachedSettings;
    } else {
      console.warn("No settings found");
      return {};
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
}
