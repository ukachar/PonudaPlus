// helpers/excelExport.js

export const exportToExcel = (data, filename = "export.csv") => {
  // Konvertiraj u CSV format (Excel ga može otvoriti)
  const csvContent = convertToCSV(data);

  // Kreiraj Blob
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes
      const escaped = ("" + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
};

export const exportPrijemiToExcel = (prijemi) => {
  const data = prijemi.map((p) => {
    const stavke = p.stavke ? JSON.parse(p.stavke) : [];
    return {
      Datum: p.datum_prijema,
      Ime: p.ime_kupca,
      Prezime: p.prezime_kupca,
      Email: p.email || "",
      Mobitel: p.mobitel || "",
      Adresa: p.adresa || "",
      "Broj stavki": stavke.length,
      "Cijena (€)": p.cijena || 0,
      Plaćeno: p.placeno ? "Da" : "Ne",
      Napomena: p.napomena || "",
      ID: p.$id,
    };
  });

  const datum = new Date().toISOString().split("T")[0];
  exportToExcel(data, `prijemi_${datum}.csv`);
};

export const exportStavkeToExcel = (stavke) => {
  const data = stavke.map((s) => ({
    Šifra: s.sifra,
    Naziv: s.naziv,
    Kategorija: s.kategorija || "",
    ID: s.$id,
  }));

  const datum = new Date().toISOString().split("T")[0];
  exportToExcel(data, `stavke_${datum}.csv`);
};
