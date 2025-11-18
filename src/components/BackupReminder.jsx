// components/BackupReminder.jsx
import React, { useEffect, useState } from "react";
import backupManager from "../../helpers/backup";
import logger from "../../helpers/logger";
import { useAuth } from "../auth/AuthContext"; // DODAJ OVO

const BackupReminder = () => {
  const { user } = useAuth(); // DODAJ OVO - provjeri da li je user logiran
  const [showReminder, setShowReminder] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // DODAJ PROVJERU - prikaži samo ako je user logiran
    if (!user) {
      setShowReminder(false);
      return;
    }

    // Provjeri da li je potreban backup
    const shouldRemind = backupManager.checkBackupReminder();

    // Provjeri da li je korisnik već odbio podsjetnik danas
    const dismissedToday = localStorage.getItem("backup_reminder_dismissed");
    const today = new Date().toDateString();

    if (shouldRemind && dismissedToday !== today && !dismissed) {
      setShowReminder(true);
      logger.info("Backup reminder shown");
    }
  }, [dismissed, user]); // DODAJ 'user' u dependencies

  const handleDownloadBackup = async () => {
    try {
      await backupManager.downloadBackup();
      setShowReminder(false);
      logger.logSettings("Backup downloaded from reminder");
      alert("Backup uspješno preuzet!");
    } catch (err) {
      console.error("Backup error:", err);
      logger.error("Backup download failed from reminder", {
        error: err.message,
      });
      alert("Greška prilikom kreiranja backupa.");
    }
  };

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem("backup_reminder_dismissed", today);
    setShowReminder(false);
    setDismissed(true);
    logger.info("Backup reminder dismissed");
  };

  const handleSnooze = () => {
    // Snooze za 1 dan
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    localStorage.setItem("last_backup_date", tomorrow.toISOString());
    setShowReminder(false);
    setDismissed(true);
    logger.info("Backup reminder snoozed");
  };

  // NE PRIKAZUJ ništa ako user nije logiran
  if (!user || !showReminder) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      <div className="alert alert-warning shadow-lg max-w-md flex flex-col">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current flex-shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Podsjetnik za Backup!</h3>
            <div className="text-xs mt-1">
              Dugo nisi napravio backup podataka. Preporučujemo da sačuvaš
              kopiju!
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="btn btn-sm btn-success"
            onClick={handleDownloadBackup}
          >
            Preuzmi
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleSnooze}>
            Sutra
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupReminder;
