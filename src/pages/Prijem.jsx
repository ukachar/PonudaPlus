import React, { useState, useEffect } from "react";
import { databases } from "../../appwriteConfig";
import { ID, Query } from "appwrite";
import { Link } from "react-router-dom";
import logger from "../../helpers/logger";

const exportToExcel = (data, filename = "export.csv") => {
  const csvContent = convertToCSV(data);
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
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
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = ("" + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
};

const Prijem = () => {
  // State za listu primljenih strojeva
  const [prijemi, setPrijemi] = useState([]);

  // State za listu svih dostupnih stavki (autocomplete)
  const [stavkeDatabase, setStavkeDatabase] = useState([]);

  // State za formu novog prijema
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // State za modal za upravljanje stavkama
  const [showStavkeModal, setShowStavkeModal] = useState(false);

  // State za modal za stare prijeme
  const [showOldPrijemiModal, setShowOldPrijemiModal] = useState(false);
  const [oldPrijemiList, setOldPrijemiList] = useState([]);

  // Funkcija za prikaz modalа
  const handleShowOldPrijemi = () => {
    const old = getOldPrijemi(7);
    setOldPrijemiList(old);
    setShowOldPrijemiModal(true);
  };

  // Form data
  const [formData, setFormData] = useState({
    ime_kupca: "",
    prezime_kupca: "",
    mobitel: "",
    email: "",
    adresa: "",
    datum_prijema: new Date().toISOString().split("T")[0],
    stavke: [],
    napomena: "",
    cijena: 0,
    placeno: false,
  });

  // State za novu stavku u formi
  const [novaStavka, setNovaStavka] = useState({
    naziv: "",
    sifra: "",
    opis: "",
    stanje: "Na pregledu",
  });

  // State za autocomplete
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStavke, setFilteredStavke] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // State za loading i error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State za search i filtere
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Nova stavka u bazi (admin dodaje nove tipove strojeva/dijelova)
  const [novaStavkaBaza, setNovaStavkaBaza] = useState({
    naziv: "",
    sifra: "",
    kategorija: "",
  });

  // Fetch svih prijema
  useEffect(() => {
    fetchPrijemi();
    fetchStavkeDatabase();
  }, []);

  const fetchPrijemi = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );
      setPrijemi(response.documents);
    } catch (err) {
      console.error("Greška pri dohvaćanju prijema:", err);
      setError("Nije moguće dohvatiti podatke");
    } finally {
      setLoading(false);
    }
  };

  const fetchStavkeDatabase = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
        [Query.limit(1000)]
      );
      setStavkeDatabase(response.documents);
    } catch (err) {
      console.error("Greška pri dohvaćanju baze stavki:", err);
    }
  };

  // Autocomplete funkcionalnost
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = stavkeDatabase.filter(
        (stavka) =>
          stavka.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stavka.sifra.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStavke(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredStavke([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, stavkeDatabase]);

  // Handle form input promjene
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle nova stavka input
  const handleNovaStavkaChange = (e) => {
    const { name, value } = e.target;
    setNovaStavka((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Odabir stavke iz autocomplete
  const selectStavka = (stavka) => {
    setNovaStavka({
      naziv: stavka.naziv,
      sifra: stavka.sifra,
      opis: "",
      stanje: "Na pregledu",
    });
    setSearchTerm(stavka.naziv);
    setShowSuggestions(false);
  };

  // Dodaj stavku u listu stavki prijema
  const dodajStavku = () => {
    if (!novaStavka.naziv || !novaStavka.sifra) {
      alert("Molimo unesite naziv i šifru stavke");
      return;
    }

    // Provjeri da li već postoji u trenutnom prijemu
    const postojiVecUPrijemu = formData.stavke.some(
      (s) => s.sifra === novaStavka.sifra
    );

    if (postojiVecUPrijemu) {
      alert("Stavka s tom šifrom već postoji u ovom prijemu!");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      stavke: [...prev.stavke, { ...novaStavka, id: Date.now() }],
    }));

    // Reset forme
    setNovaStavka({
      naziv: "",
      sifra: "",
      opis: "",
      stanje: "Na pregledu",
    });
    setSearchTerm("");
  };

  // Ukloni stavku iz prijema
  const ukloniStavku = (id) => {
    setFormData((prev) => ({
      ...prev,
      stavke: prev.stavke.filter((s) => s.id !== id),
    }));
  };

  // Ažuriraj pojedinu stavku u prijemu
  const azurirajStavku = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stavke: prev.stavke.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Spremi novi prijem
  const spremiPrijem = async (e) => {
    e.preventDefault();

    if (!formData.ime_kupca || !formData.prezime_kupca) {
      alert("Molimo unesite ime i prezime kupca");
      return;
    }

    if (formData.stavke.length === 0) {
      alert("Molimo dodajte barem jednu stavku");
      return;
    }

    try {
      logger.logPrijem("Prijem create started", {
        kupac: formData.ime_kupca,
      });
      setLoading(true);

      if (editMode) {
        const response = await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
          currentId,
          {
            ...formData,
            stavke: JSON.stringify(formData.stavke),
          }
        );
        logger.logPrijem("Prijem updated successfully", {
          id: response.$id,
          kupac: formData.ime_kupca,
        });
      } else {
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE,
          import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
          ID.unique(),
          {
            ...formData,
            stavke: JSON.stringify(formData.stavke),
          }
        );
        logger.logPrijem("Prijem created successfully", {
          id: response.$id,
          kupac: formData.ime_kupca,
        });
      }

      // Reset i zatvori modal
      resetForm();
      setShowModal(false);
      fetchPrijemi();
    } catch (err) {
      console.error("Greška pri spremanju prijema:", err);
      alert("Došlo je do greške pri spremanju");
      logger.error("Prijem create failed", {
        error: err.message,
        kupac: formData.ime_kupca,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset forme
  const resetForm = () => {
    setFormData({
      ime_kupca: "",
      prezime_kupca: "",
      mobitel: "",
      email: "",
      adresa: "",
      datum_prijema: new Date().toISOString().split("T")[0],
      stavke: [],
      napomena: "",
      cijena: 0,
      placeno: false,
    });
    setNovaStavka({
      naziv: "",
      sifra: "",
      opis: "",
      stanje: "Na pregledu",
    });
    setEditMode(false);
    setCurrentId(null);
    setSearchTerm("");
  };

  // Otvori modal za uređivanje
  const urediPrijem = (prijem) => {
    setFormData({
      ime_kupca: prijem.ime_kupca,
      prezime_kupca: prijem.prezime_kupca,
      mobitel: prijem.mobitel || "",
      email: prijem.email || "",
      adresa: prijem.adresa || "",
      datum_prijema: prijem.datum_prijema,
      stavke: prijem.stavke ? JSON.parse(prijem.stavke) : [],
      napomena: prijem.napomena || "",
      cijena: prijem.cijena || 0,
      placeno: prijem.placeno || false,
    });
    setCurrentId(prijem.$id);
    setEditMode(true);
    setShowModal(true);
  };

  // Briši prijem
  const obrisiPrijem = async (id) => {
    if (!window.confirm("Jeste li sigurni da želite obrisati ovaj prijem?")) {
      return;
    }

    try {
      setLoading(true);
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_PRIJEM_COLLECTION,
        id
      );
      fetchPrijemi();
    } catch (err) {
      console.error("Greška pri brisanju:", err);
      alert("Došlo je do greške pri brisanju");
    } finally {
      setLoading(false);
    }
  };

  // ADMIN: Dodaj novu stavku u bazu
  const dodajStavkuUBazu = async () => {
    if (!novaStavkaBaza.naziv || !novaStavkaBaza.sifra) {
      alert("Molimo unesite naziv i šifru");
      return;
    }

    // Provjeri da li šifra već postoji
    const postojiSifra = stavkeDatabase.some(
      (s) => s.sifra === novaStavkaBaza.sifra
    );

    if (postojiSifra) {
      alert("Stavka s tom šifrom već postoji u bazi!");
      return;
    }

    try {
      setLoading(true);
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
        ID.unique(),
        novaStavkaBaza
      );

      // Refresh baze i reset forme
      fetchStavkeDatabase();
      setNovaStavkaBaza({ naziv: "", sifra: "", kategorija: "" });
      alert("Stavka uspješno dodana u bazu!");
    } catch (err) {
      console.error("Greška pri dodavanju stavke:", err);
      alert("Došlo je do greške");
    } finally {
      setLoading(false);
    }
  };

  // Izbriši stavku iz baze (admin)
  const obrisiStavkuIzBaze = async (id) => {
    if (!window.confirm("Obrisati stavku iz baze?")) return;

    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE,
        import.meta.env.VITE_APPWRITE_STAVKE_COLLECTION,
        id
      );
      fetchStavkeDatabase();
    } catch (err) {
      console.error("Greška:", err);
    }
  };

  // Filtriraj prijeme prema search i filterima
  const filteredPrijemi = prijemi.filter((prijem) => {
    const stavke = prijem.stavke ? JSON.parse(prijem.stavke) : [];

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      `${prijem.ime_kupca} ${prijem.prezime_kupca}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      prijem.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prijem.mobitel?.includes(searchQuery) ||
      stavke.some(
        (s) =>
          s.naziv.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sifra.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "na_pregledu") {
      matchesStatus = stavke.some((s) => s.stanje === "Na pregledu");
    } else if (statusFilter === "u_popravku") {
      matchesStatus = stavke.some((s) => s.stanje === "U popravku");
    } else if (statusFilter === "gotovo") {
      matchesStatus = stavke.every((s) => s.stanje === "Gotovo");
    } else if (statusFilter === "ceka_dio") {
      matchesStatus = stavke.some((s) => s.stanje === "Čeka dio");
    }

    // Date filter
    let matchesDate = true;
    const prijemDate = new Date(prijem.datum_prijema);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "today") {
      matchesDate = prijemDate.toDateString() === today.toDateString();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = prijemDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = prijemDate >= monthAgo;
    } else if (dateFilter === "custom" && customDateFrom && customDateTo) {
      const dateFrom = new Date(customDateFrom);
      const dateTo = new Date(customDateTo);
      matchesDate = prijemDate >= dateFrom && prijemDate <= dateTo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Statistika za filtrirane prijeme
  const getStatusCount = (status) => {
    return prijemi.filter((p) => {
      const stavke = p.stavke ? JSON.parse(p.stavke) : [];
      if (status === "Gotovo")
        return stavke.every((s) => s.stanje === "Gotovo");
      return stavke.some((s) => s.stanje === status);
    }).length;
  };

  // Export funkcije
  const exportPrijemiToExcel = () => {
    const data = filteredPrijemi.map((p) => {
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

  const exportStavkeToExcel = () => {
    const data = stavkeDatabase.map((s) => ({
      Šifra: s.sifra,
      Naziv: s.naziv,
      Kategorija: s.kategorija || "",
      ID: s.$id,
    }));
    const datum = new Date().toISOString().split("T")[0];
    exportToExcel(data, `stavke_${datum}.csv`);
  };

  // Provjera za stare prijeme (duže od X dana)
  const getOldPrijemi = (days = 7) => {
    const today = new Date();
    return prijemi.filter((p) => {
      const stavke = p.stavke ? JSON.parse(p.stavke) : [];
      const isNotFinished = !stavke.every((s) => s.stanje === "Gotovo");
      const prijemDate = new Date(p.datum_prijema);
      const daysDiff = Math.floor((today - prijemDate) / (1000 * 60 * 60 * 24));
      return isNotFinished && daysDiff > days;
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prijem Strojeva</h1>
          <p className="text-gray-500 mt-1">
            Upravljanje primljenim strojevima i opremom
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            + Novi Prijem
          </button>
          <button
            onClick={() => setShowStavkeModal(true)}
            className="btn btn-secondary"
          >
            Upravljaj Stavkama
          </button>
          <div className="dropdown dropdown-end inline-block">
            <label tabIndex={0} className="btn btn-accent">
              Export
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-50"
            >
              <li>
                <a onClick={exportPrijemiToExcel}>Export Prijeme (Excel)</a>
              </li>
              <li>
                <a onClick={exportStavkeToExcel}>Export Stavke (Excel)</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="stats shadow mb-6 w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Ukupno Prijema</div>
          <div className="stat-value text-primary">{prijemi.length}</div>
          <div className="stat-desc">Filtrirano: {filteredPrijemi.length}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">U Obradi</div>
          <div className="stat-value text-warning">
            {getStatusCount("U popravku")}
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Gotovo</div>
          <div className="stat-value text-success">
            {getStatusCount("Gotovo")}
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Duže od 7 dana</div>
          <div className="stat-value text-error">{getOldPrijemi(7).length}</div>
          <div
            className="stat-desc cursor-pointer hover:underline text-primary font-semibold"
            onClick={handleShowOldPrijemi}
          >
            Klikni za detalje
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Pretraži</span>
            </label>
            <input
              type="text"
              placeholder="Ime, email, mobitel, šifra..."
              className="input input-bordered"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Svi statusi</option>
              <option value="na_pregledu">Na pregledu</option>
              <option value="u_popravku">U popravku</option>
              <option value="gotovo">Gotovo</option>
              <option value="ceka_dio">Čeka dio</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Datum</span>
            </label>
            <select
              className="select select-bordered"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Svi datumi</option>
              <option value="today">Danas</option>
              <option value="week">Zadnjih 7 dana</option>
              <option value="month">Zadnjih 30 dana</option>
              <option value="custom">Prilagođeno</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">&nbsp;</span>
            </label>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setDateFilter("all");
                setCustomDateFrom("");
                setCustomDateTo("");
              }}
            >
              ✕ Očisti filtere
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Od datuma</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Do datuma</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tablica */}
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Kupac</th>
              <th>Kontakt</th>
              <th>Cijena</th>
              <th>Broj Stavki</th>
              <th>Status</th>
              <th className="text-center">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="text-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
            )}

            {!loading && filteredPrijemi.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-8">
                  Nema prijema koji odgovaraju filterima.
                </td>
              </tr>
            )}

            {!loading &&
              filteredPrijemi.map((prijem) => {
                const stavke = prijem.stavke ? JSON.parse(prijem.stavke) : [];
                return (
                  <tr key={prijem.$id} className="hover">
                    <td>{prijem.datum_prijema}</td>
                    <td>
                      <div className="font-bold">
                        {prijem.ime_kupca} {prijem.prezime_kupca}
                      </div>
                      <div className="text-sm opacity-50">{prijem.email}</div>
                    </td>
                    <td>
                      <div>{prijem.mobitel}</div>
                      <div className="text-sm opacity-50">{prijem.adresa}</div>
                    </td>
                    <td>
                      <div className="font-bold">
                        {prijem.cijena ? `${prijem.cijena.toFixed(2)} €` : "-"}
                      </div>
                      {prijem.placeno ? (
                        <div className="badge badge-success badge-sm">
                          Plaćeno
                        </div>
                      ) : (
                        <div className="badge badge-error badge-sm">
                          Nije plaćeno
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="badge badge-ghost">
                        {stavke.length} stavki
                      </div>
                    </td>
                    <td>
                      {stavke.some((s) => s.stanje === "Gotovo") ? (
                        <div className="badge badge-success">Obrađeno</div>
                      ) : (
                        <div className="badge badge-warning">U obradi</div>
                      )}
                    </td>
                    <td className="text-center space-x-2">
                      <button
                        onClick={() => urediPrijem(prijem)}
                        className="btn btn-sm btn-primary"
                      >
                        Uredi
                      </button>
                      <Link
                        to={`/prijem-pdf/${prijem.$id}`}
                        target="_blank"
                        className="btn btn-sm btn-secondary"
                      >
                        Print
                      </Link>
                      <Link
                        to={`/qr-label/${prijem.$id}`}
                        target="_blank"
                        className="btn btn-sm btn-info"
                        title="Print QR Label"
                      >
                        QR
                      </Link>
                      <button
                        onClick={() => obrisiPrijem(prijem.$id)}
                        className="btn btn-sm btn-error"
                        disabled={loading}
                      >
                        Obriši
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* MODAL: Novi/Uredi Prijem */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              {editMode ? "Uredi Prijem" : "Novi Prijem"}
            </h3>

            <form onSubmit={spremiPrijem}>
              {/* Osnovni podaci kupca */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ime *</span>
                  </label>
                  <input
                    type="text"
                    name="ime_kupca"
                    value={formData.ime_kupca}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Prezime *</span>
                  </label>
                  <input
                    type="text"
                    name="prezime_kupca"
                    value={formData.prezime_kupca}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Mobitel</span>
                  </label>
                  <input
                    type="tel"
                    name="mobitel"
                    value={formData.mobitel}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control col-span-2">
                  <label className="label">
                    <span className="label-text">Adresa</span>
                  </label>
                  <input
                    type="text"
                    name="adresa"
                    value={formData.adresa}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="Ulica i broj, grad"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Datum Prijema</span>
                  </label>
                  <input
                    type="date"
                    name="datum_prijema"
                    value={formData.datum_prijema}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="divider">Stavke</div>

              {/* Dodaj novu stavku */}
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Dodaj Stavku</h4>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="form-control col-span-4 relative">
                    <label className="label">
                      <span className="label-text">Naziv</span>
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => searchTerm && setShowSuggestions(true)}
                      className="input input-bordered"
                      placeholder="Počni pisati..."
                    />

                    {/* Autocomplete dropdown */}
                    {showSuggestions && filteredStavke.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 bg-base-100 shadow-lg rounded-lg mt-1 max-h-48 overflow-y-auto z-50 border border-base-300">
                        {filteredStavke.map((stavka) => (
                          <li
                            key={stavka.$id}
                            onClick={() => selectStavka(stavka)}
                            className="px-4 py-2 hover:bg-base-200 cursor-pointer"
                          >
                            <div className="font-semibold">{stavka.naziv}</div>
                            <div className="text-sm text-gray-500">
                              Šifra: {stavka.sifra}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text">Šifra</span>
                    </label>
                    <input
                      type="text"
                      name="sifra"
                      value={novaStavka.sifra}
                      onChange={handleNovaStavkaChange}
                      className="input input-bordered"
                    />
                  </div>

                  <div className="form-control col-span-3">
                    <label className="label">
                      <span className="label-text">Opis</span>
                    </label>
                    <input
                      type="text"
                      name="opis"
                      value={novaStavka.opis}
                      onChange={handleNovaStavkaChange}
                      className="input input-bordered"
                      placeholder="Dodatne info..."
                    />
                  </div>

                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text">Stanje</span>
                    </label>
                    <select
                      name="stanje"
                      value={novaStavka.stanje}
                      onChange={handleNovaStavkaChange}
                      className="select select-bordered"
                    >
                      <option value="Na pregledu">Na pregledu</option>
                      <option value="U popravku">U popravku</option>
                      <option value="Gotovo">Gotovo</option>
                      <option value="Čeka dio">Čeka dio</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={dodajStavku}
                    className="btn btn-primary col-span-1"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista dodanih stavki */}
              {formData.stavke.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr>
                        <th>Šifra</th>
                        <th>Naziv</th>
                        <th>Opis</th>
                        <th>Stanje</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.stavke.map((stavka) => (
                        <tr key={stavka.id}>
                          <td>
                            <span className="badge">{stavka.sifra}</span>
                          </td>
                          <td>{stavka.naziv}</td>
                          <td>
                            <input
                              type="text"
                              value={stavka.opis}
                              onChange={(e) =>
                                azurirajStavku(
                                  stavka.id,
                                  "opis",
                                  e.target.value
                                )
                              }
                              className="input input-sm input-bordered w-full"
                            />
                          </td>
                          <td>
                            <select
                              value={stavka.stanje}
                              onChange={(e) =>
                                azurirajStavku(
                                  stavka.id,
                                  "stanje",
                                  e.target.value
                                )
                              }
                              className="select select-sm select-bordered"
                            >
                              <option value="Na pregledu">Na pregledu</option>
                              <option value="U popravku">U popravku</option>
                              <option value="Gotovo">Gotovo</option>
                              <option value="Čeka dio">Čeka dio</option>
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => ukloniStavku(stavka.id)}
                              className="btn btn-sm btn-error"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Napomena */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Napomena</span>
                </label>
                <textarea
                  name="napomena"
                  value={formData.napomena}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered h-20"
                  placeholder="Dodatne napomene..."
                ></textarea>
              </div>

              <div className="divider">Plaćanje</div>

              {/* Cijena i plaćanje */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Cijena (€)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="cijena"
                    value={formData.cijena}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Plaćeno?</span>
                    <input
                      type="checkbox"
                      name="placeno"
                      checked={formData.placeno}
                      onChange={(e) =>
                        setFormData({ ...formData, placeno: e.target.checked })
                      }
                      className="checkbox checkbox-success"
                    />
                  </label>
                </div>
              </div>

              {/* Gumbi */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? "Spremam..."
                    : editMode
                    ? "Spremi Promjene"
                    : "Kreiraj Prijem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upravljanje Stavkama (Admin) */}
      {showStavkeModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Upravljanje Bazom Stavki</h3>

            {/* Dodaj novu stavku u bazu */}
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-3">Dodaj Novu Stavku u Bazu</h4>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Naziv"
                  value={novaStavkaBaza.naziv}
                  onChange={(e) =>
                    setNovaStavkaBaza({
                      ...novaStavkaBaza,
                      naziv: e.target.value,
                    })
                  }
                  className="input input-bordered"
                />
                <input
                  type="text"
                  placeholder="Šifra"
                  value={novaStavkaBaza.sifra}
                  onChange={(e) =>
                    setNovaStavkaBaza({
                      ...novaStavkaBaza,
                      sifra: e.target.value,
                    })
                  }
                  className="input input-bordered"
                />
                <input
                  type="text"
                  placeholder="Kategorija"
                  value={novaStavkaBaza.kategorija}
                  onChange={(e) =>
                    setNovaStavkaBaza({
                      ...novaStavkaBaza,
                      kategorija: e.target.value,
                    })
                  }
                  className="input input-bordered"
                />
                <button
                  onClick={dodajStavkuUBazu}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Dodaj
                </button>
              </div>
            </div>

            {/* Lista postojećih stavki */}
            <div className="overflow-x-auto max-h-96">
              <table className="table table-compact w-full">
                <thead>
                  <tr>
                    <th>Šifra</th>
                    <th>Naziv</th>
                    <th>Kategorija</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stavkeDatabase.map((stavka) => (
                    <tr key={stavka.$id}>
                      <td>
                        <span className="badge badge-primary">
                          {stavka.sifra}
                        </span>
                      </td>
                      <td>{stavka.naziv}</td>
                      <td>
                        <span className="badge badge-ghost">
                          {stavka.kategorija || "-"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => obrisiStavkuIzBaze(stavka.$id)}
                          className="btn btn-sm btn-error"
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowStavkeModal(false)} className="btn">
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Stari Prijemi */}
      {showOldPrijemiModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-6 h-6 stroke-current text-error"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              Prijemi duži od 7 dana
            </h3>

            {oldPrijemiList.length === 0 ? (
              <div className="alert alert-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Nema starih prijema! Svi su obrađeni na vrijeme. 🎉</span>
              </div>
            ) : (
              <>
                <div className="alert alert-warning mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
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
                  <span>
                    Pronađeno <strong>{oldPrijemiList.length}</strong> prijema
                    koji su u sustavu duže od 7 dana.
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr>
                        <th>Datum prijema</th>
                        <th>Kupac</th>
                        <th>Kontakt</th>
                        <th>Broj stavki</th>
                        <th>Dana u sustavu</th>
                        <th>Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oldPrijemiList.map((prijem) => {
                        const stavke = prijem.stavke
                          ? JSON.parse(prijem.stavke)
                          : [];
                        const prijemDate = new Date(prijem.datum_prijema);
                        const today = new Date();
                        const daysDiff = Math.floor(
                          (today - prijemDate) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <tr key={prijem.$id} className="hover">
                            <td>
                              <span className="text-sm">
                                {prijem.datum_prijema}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold">
                                {prijem.ime_kupca} {prijem.prezime_kupca}
                              </div>
                              <div className="text-xs opacity-50">
                                {prijem.email}
                              </div>
                            </td>
                            <td>
                              <div className="text-sm">{prijem.mobitel}</div>
                            </td>
                            <td>
                              <div className="badge badge-ghost">
                                {stavke.length}
                              </div>
                            </td>
                            <td>
                              <div
                                className={`badge ${
                                  daysDiff > 14
                                    ? "badge-error"
                                    : daysDiff > 10
                                    ? "badge-warning"
                                    : "badge-info"
                                }`}
                              >
                                {daysDiff} dana
                              </div>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setShowOldPrijemiModal(false);
                                  urediPrijem(prijem);
                                }}
                                className="btn btn-sm btn-primary"
                              >
                                Uredi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-base-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💡 Savjet:</strong> Kontaktiraj kupce čiji strojevi
                    čekaju duže od 10 dana.
                  </p>
                </div>
              </>
            )}

            <div className="modal-action">
              <button
                onClick={() => setShowOldPrijemiModal(false)}
                className="btn"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div> // ⬅️ Ovo je zadnji </div>
  );
};

export default Prijem;
