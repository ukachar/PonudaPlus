import React, { useEffect, useState } from "react";
import { databases, storage } from "../../appwriteConfig";
import backupManager from "../../helpers/backup";
import logger from "../../helpers/logger";
import { Query } from "appwrite";

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

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);

  // Logs states
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID,
          DOCUMENT_ID
        );
        setSettingsData(response);

        if (response.tema) {
          document.documentElement.setAttribute("data-theme", response.tema);
        }

        if (response.logoId && response.logoBucketId) {
          const logoUrl = storage.getFileView(
            response.logoBucketId,
            response.logoId
          );
          setLogoPreview(logoUrl);
        }

        // Dohvati datum zadnjeg backupa
        const lastBackup = localStorage.getItem("last_backup_date");
        if (lastBackup) {
          setLastBackupDate(new Date(lastBackup));
        }
      } catch (error) {
        setError(error);
        logger.error("Settings fetch error", { error: error.message });
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
      localStorage.setItem("tema", value);
      logger.logSettings("Theme changed", { newTheme: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      logger.logSettings("Logo selected for upload", { fileName: file.name });
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
      logger.logSettings("Logo uploaded", { fileId: response.$id });
      return response;
    } catch (error) {
      console.error("Error uploading logo:", error);
      logger.error("Logo upload failed", { error: error.message });
      return null;
    }
  };

  const updateSettings = async () => {
    let updatedData = { ...settingsData };

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

      if (response.tema) {
        document.documentElement.setAttribute("data-theme", response.tema);
      }

      // Reinitialize logger ako je promijenjen logging status
      if (updatedData.logging_enabled !== undefined) {
        logger.isEnabled = updatedData.logging_enabled;
      }

      logger.logSettings("Settings updated", {
        fields: Object.keys(updatedData),
      });

      alert("Postavke su spremljene.");
    } catch (error) {
      console.error("Error updating settings:", error);
      logger.error("Settings update failed", { error: error.message });
      alert("Greška prilikom spremanja postavki.");
    }
  };

  // BACKUP FUNKCIJE
  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      await backupManager.downloadBackup();
      setLastBackupDate(new Date());
      logger.logSettings("Backup downloaded");
      alert("Backup uspješno preuzet!");
    } catch (err) {
      console.error("Backup error:", err);
      logger.error("Backup download failed", { error: err.message });
      alert("Greška prilikom kreiranja backupa.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      alert("Odaberite backup file");
      return;
    }

    const confirmRestore = window.confirm(
      "UPOZORENJE: Restore će pokušati vratiti sve podatke iz backupa. " +
        "Preporučuje se prvo kreirati novi backup trenutnog stanja. Nastaviti?"
    );

    if (!confirmRestore) return;

    try {
      setBackupLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          const results = await backupManager.restoreFromBackup(backupData);

          logger.logSettings("Backup restored", { results });

          alert(
            `Restore završen!\n\n` +
              `Prijemi: ${results.prijemi}\n` +
              `Ponude: ${results.ponude}\n` +
              `Stavke: ${results.stavke}\n` +
              `Greške: ${results.errors.length}\n\n` +
              (results.errors.length > 0
                ? `Prva greška: ${results.errors[0]}`
                : "")
          );

          // Refresh stranicu
          window.location.reload();
        } catch (err) {
          console.error("Restore error:", err);
          logger.error("Backup restore failed", { error: err.message });
          alert("Greška prilikom restore-a: " + err.message);
        } finally {
          setBackupLoading(false);
        }
      };

      reader.readAsText(restoreFile);
    } catch (err) {
      console.error("File read error:", err);
      logger.error("Backup file read failed", { error: err.message });
      setBackupLoading(false);
    }
  };

  const handleEmergencyBackup = async () => {
    try {
      setBackupLoading(true);
      await backupManager.createEmergencyBackup();
      logger.logSettings("Emergency backup created");
      alert("Emergency backup spremljen u browser storage!");
    } catch (err) {
      logger.error("Emergency backup failed", { error: err.message });
      alert("Greška pri kreiranju emergency backupa.");
    } finally {
      setBackupLoading(false);
    }
  };

  // LOGS FUNKCIJE
  const handleViewLogs = async () => {
    try {
      setLogsLoading(true);
      setShowLogsModal(true);

      const logsData = await logger.exportLogs();
      setLogs(logsData);

      logger.logSettings("Logs viewed");
    } catch (err) {
      console.error("Logs fetch error:", err);
      alert("Greška pri dohvaćanju logova.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const logsData = await logger.exportLogs();

      const dataStr = JSON.stringify(logsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `logs-${timestamp}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.logSettings("Logs exported");
      alert("Logs uspješno exportani!");
    } catch (err) {
      console.error("Export logs error:", err);
      alert("Greška pri exportu logova.");
    }
  };

  const handleClearOldLogs = async () => {
    const days = prompt("Obrisati logove starije od koliko dana?", "90");
    if (!days) return;

    try {
      const deleted = await logger.clearOldLogs(parseInt(days));
      logger.logSettings("Old logs cleared", { daysOld: days, deleted });
      alert(`Obrisano ${deleted} starih logova.`);
      handleViewLogs(); // Refresh
    } catch (err) {
      console.error("Clear logs error:", err);
      alert("Greška pri brisanju logova.");
    }
  };

  return (
    <div className="flex justify-center items-center pt-6">
      <div className="w-10/12 border-gray-700 rounded-lg border-2 p-4">
        <h2 className="text-2xl mb-2 font-bold">Postavke</h2>
        <p className="mb-4">Promijenite postavke aplikacije</p>

        {/* TABS */}
        <div role="tablist" className="tabs tabs-boxed mb-6">
          <input
            type="radio"
            name="settings_tabs"
            role="tab"
            className="tab"
            aria-label="Opće"
            defaultChecked
          />
          <div role="tabpanel" className="tab-content p-6">
            <form className="space-y-4">
              {["naziv_tvrtke", "adresa", "pbr", "oib", "phone", "mbr"].map(
                (field) => (
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
                )
              )}

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
          </div>

          <input
            type="radio"
            name="settings_tabs"
            role="tab"
            className="tab"
            aria-label="Backup"
          />
          <div role="tabpanel" className="tab-content p-6">
            <h3 className="text-xl font-bold mb-4">💾 Backup & Restore</h3>

            {lastBackupDate && (
              <div className="alert alert-info mb-4">
                <span>
                  Zadnji backup: {lastBackupDate.toLocaleString("hr-HR")}
                </span>
              </div>
            )}

            <div className="space-y-4">
              {/* Interval backupa */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">
                    Interval backupa (dani)
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  defaultValue={
                    localStorage.getItem("backup_interval_days") || "7"
                  }
                  onChange={(e) => {
                    localStorage.setItem(
                      "backup_interval_days",
                      e.target.value
                    );
                    logger.logSettings("Backup interval changed", {
                      days: e.target.value,
                    });
                  }}
                />
                <label className="label">
                  <span className="label-text-alt">
                    Sustav će te podsjetiti na backup nakon ovog broja dana
                  </span>
                </label>
              </div>

              {/* Download backup */}
              <button
                className="btn btn-primary w-full"
                onClick={handleDownloadBackup}
                disabled={backupLoading}
              >
                {backupLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Kreiram backup...
                  </>
                ) : (
                  <>📥 Preuzmi Backup</>
                )}
              </button>

              {/* Emergency backup */}
              <button
                className="btn btn-secondary w-full"
                onClick={handleEmergencyBackup}
                disabled={backupLoading}
              >
                🚨 Emergency Backup (Local)
              </button>

              <div className="divider">Restore</div>

              {/* Restore */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">
                    Odaberi backup file
                  </span>
                </label>
                <input
                  type="file"
                  accept=".json"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                />
              </div>

              <button
                className="btn btn-warning w-full"
                onClick={handleRestoreBackup}
                disabled={!restoreFile || backupLoading}
              >
                {backupLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Restore u tijeku...
                  </>
                ) : (
                  <>⚠️ Restore iz Backupa</>
                )}
              </button>

              <div className="alert alert-warning">
                <span className="text-xs">
                  ⚠️ UPOZORENJE: Restore će pokušati vratiti sve podatke.
                  Kreirajte backup trenutnog stanja prije restore-a!
                </span>
              </div>
            </div>
          </div>

          <input
            type="radio"
            name="settings_tabs"
            role="tab"
            className="tab"
            aria-label="Logging"
          />
          <div role="tabpanel" className="tab-content p-6">
            <h3 className="text-xl font-bold mb-4">📊 Logging System</h3>

            <div className="space-y-4">
              {/* Enable/Disable logging */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-bold">Omogući logging</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settingsData.logging_enabled || false}
                    onChange={(e) => {
                      setSettingsData({
                        ...settingsData,
                        logging_enabled: e.target.checked,
                      });
                      logger.isEnabled = e.target.checked;
                      logger.logSettings("Logging toggled", {
                        enabled: e.target.checked,
                      });
                    }}
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">
                    Kada je omogućeno, aplikacija bilježi sve akcije korisnika
                  </span>
                </label>
              </div>

              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Ukupno Logova</div>
                  <div className="stat-value text-primary">{logs.length}</div>
                  <div className="stat-desc">U bazi podataka</div>
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleViewLogs}
                disabled={logsLoading}
              >
                {logsLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Učitavam...
                  </>
                ) : (
                  <>👁️ Pregledaj Logove</>
                )}
              </button>

              <button
                className="btn btn-secondary w-full"
                onClick={handleExportLogs}
              >
                📥 Export Logove (JSON)
              </button>

              <button
                className="btn btn-error w-full"
                onClick={handleClearOldLogs}
              >
                🗑️ Obriši Stare Logove
              </button>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-center p-4">
          <button className="btn btn-lg btn-primary" onClick={updateSettings}>
            💾 Spremi Postavke
          </button>
        </div>
      </div>

      {/* LOGS MODAL */}
      {showLogsModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl">
            <h3 className="font-bold text-lg mb-4">📊 System Logs</h3>

            <div className="overflow-x-auto max-h-96">
              <table className="table table-compact w-full">
                <thead>
                  <tr>
                    <th>Vrijeme</th>
                    <th>Akcija</th>
                    <th>Kategorija</th>
                    <th>Korisnik</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.$id}>
                      <td className="text-xs">
                        {new Date(log.timestamp).toLocaleString("hr-HR")}
                      </td>
                      <td>{log.action}</td>
                      <td>
                        <span className="badge badge-ghost">
                          {log.category}
                        </span>
                      </td>
                      <td className="text-xs">{log.userName}</td>
                      <td>
                        <span
                          className={`badge ${
                            log.severity === "error"
                              ? "badge-error"
                              : log.severity === "warning"
                              ? "badge-warning"
                              : log.severity === "success"
                              ? "badge-success"
                              : "badge-info"
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowLogsModal(false)} className="btn">
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
