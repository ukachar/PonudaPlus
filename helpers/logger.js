// helpers/logger.js
import { databases, account } from "../appwriteConfig";
import { ID } from "appwrite";

class Logger {
  constructor() {
    this.isEnabled = false;
    this.init();
  }

  async init() {
    // Provjeri da li je logging enabled u settings
    try {
      const settings = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION,
        import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID
      );
      this.isEnabled = settings.logging_enabled || false;
    } catch (err) {
      console.error("Error checking logging status:", err);
    }
  }

  async log(action, category, details = {}, severity = "info") {
    if (!this.isEnabled) return;

    try {
      let userId = "unknown";
      let userName = "Unknown User";

      try {
        const currentUser = await account.get(); // ✅ sad radi
        userId = currentUser.$id || "unknown";
        userName = currentUser.name || currentUser.email || "Unknown User";
      } catch (err) {
        console.warn("User not logged in or failed to fetch:", err.message);
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        category,
        details: JSON.stringify(details),
        severity,
        userId,
        userName,
      };

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_LOGS_COLLECTION,
        ID.unique(),
        logEntry
      );

      this.saveToLocalStorage(logEntry);
    } catch (err) {
      console.error("Logging error:", err);
      this.saveToLocalStorage({
        timestamp: new Date().toISOString(),
        action,
        category,
        details: JSON.stringify(details),
        severity,
        error: err.message,
      });
    }
  }

  saveToLocalStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem("app_logs") || "[]");
      logs.push(logEntry);

      // Čuvaj samo zadnjih 1000 logova lokalno
      if (logs.length > 1000) {
        logs.shift();
      }

      localStorage.setItem("app_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save log to localStorage:", e);
    }
  }

  // Različite vrste logova
  async info(action, details = {}) {
    return this.log(action, "info", details, "info");
  }

  async warning(action, details = {}) {
    return this.log(action, "warning", details, "warning");
  }

  async error(action, details = {}) {
    return this.log(action, "error", details, "error");
  }

  async success(action, details = {}) {
    return this.log(action, "success", details, "success");
  }

  // Specifični eventi
  async logAuth(action, details = {}) {
    return this.log(action, "auth", details, "info");
  }

  async logPrijem(action, details = {}) {
    return this.log(action, "prijem", details, "info");
  }

  async logPonuda(action, details = {}) {
    return this.log(action, "ponuda", details, "info");
  }

  async logSettings(action, details = {}) {
    return this.log(action, "settings", details, "info");
  }

  async logStavka(action, details = {}) {
    return this.log(action, "stavka", details, "info");
  }

  // Export logova
  async exportLogs(startDate, endDate) {
    try {
      const Query = (await import("appwrite")).Query;

      let queries = [Query.orderDesc("timestamp"), Query.limit(10000)];

      if (startDate) {
        queries.push(Query.greaterThanEqual("timestamp", startDate));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("timestamp", endDate));
      }

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_LOGS_COLLECTION,
        queries
      );

      return response.documents;
    } catch (err) {
      console.error("Error exporting logs:", err);
      return [];
    }
  }

  // Očisti stare logove (starije od X dana)
  async clearOldLogs(daysOld = 90) {
    try {
      const Query = (await import("appwrite")).Query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_LOGS_COLLECTION,
        [
          Query.lessThan("timestamp", cutoffDate.toISOString()),
          Query.limit(100),
        ]
      );

      for (const log of response.documents) {
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_LOGS_COLLECTION,
          log.$id
        );
      }

      return response.documents.length;
    } catch (err) {
      console.error("Error clearing old logs:", err);
      return 0;
    }
  }
}

// Singleton instance
const logger = new Logger();

export default logger;

// Helper funkcija za brzi pristup
export const logAction = (action, details) => logger.info(action, details);
export const logError = (action, details) => logger.error(action, details);
export const logAuth = (action, details) => logger.logAuth(action, details);
export const logPrijem = (action, details) => logger.logPrijem(action, details);
export const logPonuda = (action, details) => logger.logPonuda(action, details);
