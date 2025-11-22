import React from "react";

const Release = () => {
  return (
    <div className="w-full py-8 px-16">
      <h1 className="text-3xl font-bold text-center mb-4">Release Notes</h1>

      <h2 className="mt-12 text-lg font-medium text-heading">
        v 1.0.2 - Minor changes
      </h2>
      <ul className="space-y-2 text-body list-disc list-inside">
        <li>Dodani tehnički detalji</li>
      </ul>

      <h2 className="mt-12 text-lg font-medium text-heading">
        v 1.0.1 - Minor changes
      </h2>
      <ul className="space-y-2 text-body list-disc list-inside">
        <li>Maknut PDV</li>
        <li>Profesionalniji format broja ponude (2025-01, 2025-02...)</li>
        <li>Uklonjen PDV (0%) - tvrtka nije u PDV sustavu</li>
        <li>Dodana napomena "Tvrtka nije u sustavu PDV-a" na PDF-u</li>
      </ul>

      <h2 className="mt-12 text-lg font-medium text-heading">
        v 1.0 - Initial Release
      </h2>
      <ul className="space-y-2 text-body list-disc list-inside">
        <li>
          **Prijem Strojeva – Kompletna funkcionalnost:** kreiranje, uređivanje
          i brisanje prijema, autocomplete za stavke, evidencija kupaca,
          statusi, plaćanja, print radnog naloga i QR labela.
        </li>

        <li>
          **Napredna pretraga i filteri:** search bar, filtriranje po statusu i
          datumu, te brisanje svih filtera jednim klikom.
        </li>

        <li>
          **Statistika i praćenje:** dashboard s real-time statistikama, brojači
          prijema, upozorenja za prijeme starije od 7 dana i detaljni modal
          pregleda.
        </li>

        <li>
          **Export funkcionalnost:** export prijema i stavki u Excel/CSV format
          s kompletnim informacijama.
        </li>

        <li>
          **Backup & Restore sustav:** full database backup, download i restore
          JSON-a, emergency backup u browseru, automatski podsjetnici i smart
          restore.
        </li>

        <li>
          **Logging sustav:** bilježenje svih akcija, filteri, export logova,
          auto-cleanup i kategorizirani logovi.
        </li>

        <li>
          **QR kod funkcionalnost:** generiranje QR kodova za prijeme, print
          labela i brzi pristup skeniranjem.
        </li>

        <li>
          **Postavke:** podijeljene u tabove (Opće, Backup, Logging), interval
          backup podsjetnika, toggle logginga i statistike logova.
        </li>

        <li>
          **UI/UX poboljšanja:** modali umjesto alertova, badgevi za statuse,
          bolji responsive dizajn, loading indikatori i toast notifikacije.
        </li>

        <li>
          **Bug fixovi:** backup reminder više ne prikazuje na login stranici,
          ispravljen duplicate šifra check, bolje error poruke i fixano
          učitavanje postavki nakon login-a.
        </li>

        <li>**Baza podataka – Nove kolekcije:** Prijem, Stavke i Logs.</li>
      </ul>
    </div>
  );
};

export default Release;
