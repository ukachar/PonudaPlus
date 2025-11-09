// helpers/backup.js
import { databases } from "../appwriteConfig";
import { Query } from "appwrite";

class BackupManager {
  constructor() {
    this.checkBackupReminder();
  }

  // Provjeri da li treba prikazati podsjetnik za backup
  checkBackupReminder() {
    const lastBackup = localStorage.getItem("last_backup_date");
    const backupInterval = parseInt(
      localStorage.getItem("backup_interval_days") || "7"
    );

    if (!lastBackup) {
      // Prvo pokretanje - postavi današnji datum
      localStorage.setItem("last_backup_date", new Date().toISOString());
      return false;
    }

    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = Math.floor(
      (new Date() - lastBackupDate) / (1000 * 60 * 60 * 24)
    );

    return daysSinceBackup >= backupInterval;
  }

  // Kreiraj kompletan backup svih podataka
  async createFullBackup() {
    try {
      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {},
      };

      // Backup Prijemi
      const prijemi = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.prijemi = prijemi.documents;

      // Backup Ponude
      const ponude = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.ponude = ponude.documents;

      // Backup Stavke
      const stavke = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.stavke = stavke.documents;

      // Backup Settings
      const settings = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION,
        import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID
      );
      backup.data.settings = settings;

      // Backup Logs (opciono, može biti veliki)
      try {
        const logs = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_LOGS_COLLECTION,
          [Query.limit(1000), Query.orderDesc("timestamp")]
        );
        backup.data.logs = logs.documents;
      } catch (e) {
        backup.data.logs = [];
      }

      // Metadata
      backup.metadata = {
        prijemiCount: backup.data.prijemi.length,
        ponudeCount: backup.data.ponude.length,
        stavkeCount: backup.data.stavke.length,
        logsCount: backup.data.logs.length,
      };

      return backup;
    } catch (err) {
      console.error("Backup creation error:", err);
      throw err;
    }
  }

  // Download backup kao JSON file
  async downloadBackup() {
    try {
      const backup = await this.createFullBackup();

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `ponuda-plus-backup-${timestamp}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Ažuriraj datum zadnjeg backupa
      localStorage.setItem("last_backup_date", new Date().toISOString());

      return true;
    } catch (err) {
      console.error("Download backup error:", err);
      throw err;
    }
  }

  // Restore iz backup file-a
  async restoreFromBackup(backupData) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error("Invalid backup format");
      }

      const results = {
        prijemi: 0,
        ponude: 0,
        stavke: 0,
        errors: [],
      };

      // VAŽNO: Ovo će DODATI podatke, ne brisati postojeće
      // Za complete restore, prvo bi trebalo ručno očistiti bazu

      // Restore Prijemi
      if (backupData.data.prijemi) {
        for (const prijem of backupData.data.prijemi) {
          try {
            // Ukloni Appwrite specifične fieldove
            const {
              $id,
              $createdAt,
              $updatedAt,
              $permissions,
              $collectionId,
              $databaseId,
              ...cleanData
            } = prijem;

            await databases.createDocument(
              import.meta.env.VITE_APPWRITE_DATABASE,
              import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
              $id, // Koristi originalni ID
              cleanData
            );
            results.prijemi++;
          } catch (e) {
            results.errors.push(`Prijem ${prijem.$id}: ${e.message}`);
          }
        }
      }

      // Restore Ponude
      if (backupData.data.ponude) {
        for (const ponuda of backupData.data.ponude) {
          try {
            const {
              $id,
              $createdAt,
              $updatedAt,
              $permissions,
              $collectionId,
              $databaseId,
              ...cleanData
            } = ponuda;

            await databases.createDocument(
              import.meta.env.VITE_APPWRITE_DATABASE,
              import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
              $id,
              cleanData
            );
            results.ponude++;
          } catch (e) {
            results.errors.push(`Ponuda ${ponuda.$id}: ${e.message}`);
          }
        }
      }

      // Restore Stavke
      if (backupData.data.stavke) {
        for (const stavka of backupData.data.stavke) {
          try {
            const {
              $id,
              $createdAt,
              $updatedAt,
              $permissions,
              $collectionId,
              $databaseId,
              ...cleanData
            } = stavka;

            await databases.createDocument(
              import.meta.env.VITE_APPWRITE_DATABASE,
              import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
              $id,
              cleanData
            );
            results.stavke++;
          } catch (e) {
            results.errors.push(`Stavka ${stavka.$id}: ${e.message}`);
          }
        }
      }

      return results;
    } catch (err) {
      console.error("Restore error:", err);
      throw err;
    }
  }

  // Auto backup u localStorage (emergency backup)
  async createEmergencyBackup() {
    try {
      const backup = await this.createFullBackup();
      localStorage.setItem("emergency_backup", JSON.stringify(backup));
      localStorage.setItem("emergency_backup_date", new Date().toISOString());
      return true;
    } catch (err) {
      console.error("Emergency backup error:", err);
      return false;
    }
  }

  // Dohvati emergency backup
  getEmergencyBackup() {
    try {
      const backup = localStorage.getItem("emergency_backup");
      const date = localStorage.getItem("emergency_backup_date");

      if (backup && date) {
        return {
          backup: JSON.parse(backup),
          date: new Date(date),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

// Singleton instance
const backupManager = new BackupManager();

export default backupManager;

// Export funkcija za laki pristup
export const downloadBackup = () => backupManager.downloadBackup();
export const checkBackupReminder = () => backupManager.checkBackupReminder();
export const createEmergencyBackup = () =>
  backupManager.createEmergencyBackup();
