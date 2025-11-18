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

  // Kreiraj kompletan backup CIJELE baze (bez logova)
  async createFullBackup() {
    try {
      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        appName: "Ponuda+",
        data: {},
      };

      console.log("📦 Započinjem backup...");

      // Backup Prijemi
      console.log("📋 Backupam prijeme...");
      const prijemi = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.prijemi = prijemi.documents;

      // Backup Ponude
      console.log("📄 Backupam ponude...");
      const ponude = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.ponude = ponude.documents;

      // Backup Stavke
      console.log("🔧 Backupam stavke...");
      const stavke = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
        [Query.limit(10000)]
      );
      backup.data.stavke = stavke.documents;

      // Backup Settings
      console.log("⚙️ Backupam postavke...");
      const settings = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION,
        import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID
      );
      backup.data.settings = settings;

      // Metadata
      backup.metadata = {
        prijemiCount: backup.data.prijemi.length,
        ponudeCount: backup.data.ponude.length,
        stavkeCount: backup.data.stavke.length,
        backupSize: JSON.stringify(backup).length,
        collections: ["prijemi", "ponude", "stavke", "settings"],
      };

      console.log("✅ Backup završen!");
      console.log(`📊 Statistika:
        - Prijemi: ${backup.metadata.prijemiCount}
        - Ponude: ${backup.metadata.ponudeCount}
        - Stavke: ${backup.metadata.stavkeCount}
        - Veličina: ${(backup.metadata.backupSize / 1024 / 1024).toFixed(2)} MB
      `);

      return backup;
    } catch (err) {
      console.error("❌ Backup creation error:", err);
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

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
      link.download = `ponuda-plus-backup-${timestamp}_${time}.json`;

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

  // Restore iz backup file-a - FULL DATABASE RESTORE
  async restoreFromBackup(backupData, options = {}) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error("Invalid backup format");
      }

      console.log("🔄 Započinjem restore iz backupa...");
      console.log(`📅 Backup datum: ${backupData.timestamp}`);

      const results = {
        prijemi: { created: 0, updated: 0, failed: 0 },
        ponude: { created: 0, updated: 0, failed: 0 },
        stavke: { created: 0, updated: 0, failed: 0 },
        settings: { updated: false, failed: false },
        errors: [],
      };

      // RESTORE PRIJEMI
      if (backupData.data.prijemi) {
        console.log(
          `📋 Restoring ${backupData.data.prijemi.length} prijema...`
        );
        for (const prijem of backupData.data.prijemi) {
          try {
            const { $id, $createdAt, $updatedAt, $permissions, ...cleanData } =
              prijem;

            try {
              // Pokušaj update ako već postoji
              await databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
                $id,
                cleanData
              );
              results.prijemi.updated++;
            } catch (updateErr) {
              // Ako ne postoji, kreiraj novi
              await databases.createDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
                $id,
                cleanData
              );
              results.prijemi.created++;
            }
          } catch (e) {
            results.prijemi.failed++;
            results.errors.push(`Prijem ${prijem.$id}: ${e.message}`);
          }
        }
      }

      // RESTORE PONUDE
      if (backupData.data.ponude) {
        console.log(`📄 Restoring ${backupData.data.ponude.length} ponuda...`);
        for (const ponuda of backupData.data.ponude) {
          try {
            const { $id, $createdAt, $updatedAt, $permissions, ...cleanData } =
              ponuda;

            try {
              await databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
                $id,
                cleanData
              );
              results.ponude.updated++;
            } catch (updateErr) {
              await databases.createDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
                $id,
                cleanData
              );
              results.ponude.created++;
            }
          } catch (e) {
            results.ponude.failed++;
            results.errors.push(`Ponuda ${ponuda.$id}: ${e.message}`);
          }
        }
      }

      // RESTORE STAVKE
      if (backupData.data.stavke) {
        console.log(`🔧 Restoring ${backupData.data.stavke.length} stavki...`);
        for (const stavka of backupData.data.stavke) {
          try {
            const { $id, $createdAt, $updatedAt, $permissions, ...cleanData } =
              stavka;

            try {
              await databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
                $id,
                cleanData
              );
              results.stavke.updated++;
            } catch (updateErr) {
              await databases.createDocument(
                import.meta.env.VITE_APPWRITE_DATABASE,
                import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
                $id,
                cleanData
              );
              results.stavke.created++;
            }
          } catch (e) {
            results.stavke.failed++;
            results.errors.push(`Stavka ${stavka.$id}: ${e.message}`);
          }
        }
      }

      // RESTORE SETTINGS
      if (backupData.data.settings) {
        console.log("⚙️ Restoring settings...");
        try {
          const { $id, $createdAt, $updatedAt, $permissions, ...cleanData } =
            backupData.data.settings;

          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE,
            import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION,
            import.meta.env.VITE_APPWRITE_SETTINGS_DOC_ID,
            cleanData
          );
          results.settings.updated = true;
        } catch (e) {
          results.settings.failed = true;
          results.errors.push(`Settings: ${e.message}`);
        }
      }

      console.log("✅ Restore završen!");
      console.log(`📊 Rezultati:
        Prijemi: ${results.prijemi.created} created, ${results.prijemi.updated} updated, ${results.prijemi.failed} failed
        Ponude: ${results.ponude.created} created, ${results.ponude.updated} updated, ${results.ponude.failed} failed
        Stavke: ${results.stavke.created} created, ${results.stavke.updated} updated, ${results.stavke.failed} failed
        Greške: ${results.errors.length}
      `);

      return results;
    } catch (err) {
      console.error("Restore error:", err);
      throw err;
    }
  }

  // Auto backup u localStorage (emergency backup)
  async createEmergencyBackup() {
    try {
      console.log("🚨 Kreiram emergency backup...");
      const backup = await this.createFullBackup();

      // Spremi u localStorage (limit ~5-10MB)
      const backupStr = JSON.stringify(backup);

      // Provjeri veličinu
      const sizeInMB = backupStr.length / 1024 / 1024;
      if (sizeInMB > 8) {
        console.warn(
          `⚠️ Backup je prevelik za localStorage (${sizeInMB.toFixed(2)} MB)`
        );
        // Spremi samo najvažnije
        const minimalBackup = {
          version: backup.version,
          timestamp: backup.timestamp,
          data: {
            prijemi: backup.data.prijemi,
            ponude: backup.data.ponude,
            stavke: backup.data.stavke,
          },
        };
        localStorage.setItem("emergency_backup", JSON.stringify(minimalBackup));
      } else {
        localStorage.setItem("emergency_backup", backupStr);
      }

      localStorage.setItem("emergency_backup_date", new Date().toISOString());
      console.log("✅ Emergency backup spremljen!");
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

  // Restore iz emergency backupa
  async restoreFromEmergencyBackup() {
    const emergency = this.getEmergencyBackup();
    if (!emergency) {
      throw new Error("Nema emergency backupa");
    }

    return this.restoreFromBackup(emergency.backup);
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
export const restoreFromEmergencyBackup = () =>
  backupManager.restoreFromEmergencyBackup();
