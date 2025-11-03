// src/MitelVmwareSizingInfo_escaped.jsx
import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

/**
 * Named export: hook that loads all Excel datasets from public/data/.
 */
export function useExcelData() {
  const [vmwareData, setVmwareData] = useState([]);
  const [hypervData, setHypervData] = useState([]);
  const [nutanixEsxiData, setNutanixEsxiData] = useState([]);
  const [proxmoxData, setProxmoxData] = useState([]);
  const [AWSData, setAWSData] = useState([]);
  const [AzureData, setAzureData] = useState([]);
  const [nutanixAHVData, setNutanixAHVData] = useState([]);

  useEffect(() => {
    const base =
      process.env.PUBLIC_URL && process.env.PUBLIC_URL !== ""
        ? process.env.PUBLIC_URL
        : "";
    const files = [
      { file: `${base}/data/Sizing-VMWare.xlsx`, setter: setVmwareData },
      { file: `${base}/data/Sizing-hyperv.xlsx`, setter: setHypervData },
      { file: `${base}/data/Sizing-Nutanix-ESXi.xlsx`, setter: setNutanixEsxiData },
      { file: `${base}/data/Sizing-Proxmox.xlsx`, setter: setProxmoxData },
      { file: `${base}/data/Sizing-Azure.xlsx`, setter: setAzureData },
      { file: `${base}/data/Sizing-AWS.xlsx`, setter: setAWSData },
      { file: `${base}/data/Sizing-Nutanix-AHV.xlsx`, setter: setNutanixAHVData },
    ];

    const loadExcel = async (url, setter) => {
      try {
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) {
          console.warn(`Could not fetch ${url}: ${resp.status}`);
          return;
        }
        const arrayBuffer = await resp.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          console.warn(`Workbook has no sheets: ${url}`);
          return;
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setter(jsonData);
      } catch (err) {
        console.error("Error loading excel", url, err);
      }
    };

    files.forEach((f) => {
      if (typeof f.setter === "function") loadExcel(f.file, f.setter);
      else console.warn("Invalid setter for", f.file, f.setter);
    });
  }, []);

  return {
    vmwareData,
    hypervData,
    nutanixEsxiData,
    proxmoxData,
    AWSData,
    AzureData,
    nutanixAHVData,
  };
}

/**
 * Default export: Main UI component (tabs, filters, table, notes)
 */
export default function MitelVmwareSizingInfo_notes_from_txt() {
  const tabs = ["VMware", "Hyper-V", "Nutanix AHV", "Nutanix ESXi", "AWS", "Azure", "Proxmox"];
  const [activeTab, setActiveTab] = useState("VMware");
  const [filters, setFilters] = useState({
    Product: "",
    Release: "",
    Configuration: "",
  });

  const defaultNoteText =
    "• Contact TechPubs for any information.\\n• This is a new fresh page, so expect faults.";
  const [tabNotes, setTabNotes] = useState({
    "VMware": { content: defaultNoteText, status: "idle" },
    "Hyper-V": { content: defaultNoteText, status: "idle" },
    "Nutanix AHV": { content: defaultNoteText, status: "idle" },
    "Nutanix ESXi": { content: defaultNoteText, status: "idle" },
    "AWS": { content: defaultNoteText, status: "idle" },
    "Azure": { content: defaultNoteText, status: "idle" },
    "Proxmox": { content: defaultNoteText, status: "idle" },
  });

  const filenameForTab = (tab) => {
    const base =
      process.env.PUBLIC_URL && process.env.PUBLIC_URL !== ""
        ? process.env.PUBLIC_URL
        : "";
    const map = {
      "VMware": `${base}/notes-vmware.txt`,
      "Hyper-V": `${base}/notes-hyperv.txt`,
      "Nutanix AHV": `${base}/notes-nutanix-ahv.txt`,
      "Nutanix ESXi": `${base}/notes-nutanix-esxi.txt`,
      "AWS": `${base}/notes-aws.txt`,
      "Azure": `${base}/notes-azure.txt`,
      "Proxmox": `${base}/notes-proxmox.txt`,
    };
    return map[tab] || null;
  };

  const fixEscapedNewlines = (s) =>
    typeof s === "string" ? s.replace(/\\n/g, "\n") : s;

  // Fetch notes files on mount
  useEffect(() => {
    tabs.forEach(async (tab) => {
      const url = filenameForTab(tab);
      if (!url) return;
      try {
        setTabNotes((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], status: "loading" },
        }));
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const missingMsg = `Notes file not found: ${url} (HTTP ${res.status}). Please add the file to the public/ folder.`;
          setTabNotes((prev) => ({
            ...prev,
            [tab]: { content: missingMsg, status: "missing" },
          }));
          console.warn(missingMsg);
          return;
        }
        const text = await res.text();
        const content =
          text && text.trim().length > 0
            ? fixEscapedNewlines(text)
            : `Notes file is empty: ${url}`;
        setTabNotes((prev) => ({
          ...prev,
          [tab]: { content, status: "loaded" },
        }));
      } catch (err) {
        const errMsg = `Error fetching ${url}: ${String(err)}`;
        console.error(errMsg);
        setTabNotes((prev) => ({
          ...prev,
          [tab]: { content: errMsg, status: "error" },
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Excel datasets
  const {
    vmwareData,
    hypervData,
    nutanixEsxiData,
    proxmoxData,
    AWSData,
    AzureData,
    nutanixAHVData,
  } = useExcelData();

  const platformData = useMemo(
    () => ({
      "VMware": vmwareData,
      "Hyper-V": hypervData,
      "Nutanix AHV": nutanixAHVData,
      "Nutanix ESXi": nutanixEsxiData,
      "AWS": AWSData,
      "Azure": AzureData,
      "Proxmox": proxmoxData,
    }),
    [vmwareData, hypervData, nutanixAHVData, nutanixEsxiData, AWSData, AzureData, proxmoxData]
  );

  const data = useMemo(() => platformData[activeTab] || [], [platformData, activeTab]);

  const filteredData = useMemo(() => {
    return (data || []).filter((row) => {
      return (
        (filters.Product === "" || row.Product === filters.Product) &&
        (filters.Release === "" || row.Release === filters.Release) &&
        (filters.Configuration === "" || row.Configuration === filters.Configuration)
      );
    });
  }, [data, filters]);

  const uniqueValues = (key) =>
    [...new Set((data || []).map((item) => item[key]).filter(Boolean))];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ RENDER STARTS HERE
  return (
    <div
      className="min-h-screen bg-[#F3F5F7] text-[#002B49] p-8"
      style={{ fontFamily: 'Segoe UI, "Open Sans", sans-serif' }}
    >
      {/* Top bar with logo */}
      <header className="flex items-center bg-[#002B49] text-white px-6 py-3 rounded-md shadow-md mb-8">
        <div className="bg-white p-2 rounded-md mr-4">
          {/* Corrected path to your folder: public/assests/mitel-logo.png */}
          <img
            src={process.env.PUBLIC_URL + "/assests/mitel-logo.png"}
            alt="Mitel Logo"
            className="h-10"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-wide">
          Mitel Virtual Appliances Server Sizing Information
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center mb-8 border-b border-[#0078D7]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFilters({ Product: "", Release: "", Configuration: "" });
            }}
            className={`px-6 py-3 text-sm font-semibold transition-all border-t border-x border-[#0078D7] ${
              activeTab === tab
                ? "bg-gradient-to-r from-[#0078D7] to-[#00ADEF] text-white"
                : "bg-white text-[#002B49] hover:bg-[#E6F2FA]"
            }`}
            aria-current={activeTab === tab ? "true" : "false"}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <select
          value={filters.Product}
          onChange={(e) => handleFilterChange("Product", e.target.value)}
          className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
        >
          <option value="">All Products</option>
          {uniqueValues("Product").map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <select
          value={filters.Release}
          onChange={(e) => handleFilterChange("Release", e.target.value)}
          className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
        >
          <option value="">All Releases</option>
          {uniqueValues("Release").map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <select
          value={filters.Configuration}
          onChange={(e) => handleFilterChange("Configuration", e.target.value)}
          className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
        >
          <option value="">All Configurations</option>
          {uniqueValues("Configuration").map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-md shadow-md border border-[#D0D7DE]">
        {(!data || data.length === 0) ? (
          <div className="p-6 text-center text-gray-600">
            {activeTab === "VMware" || activeTab === "Hyper-V"
              ? "Loading data..."
              : "No data available for " + activeTab}
          </div>
        ) : (
          <table className="min-w-full text-sm text-[#002B49]">
            <thead className="bg-[#002B49] text-white uppercase text-xs">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-4 py-3 text-left font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b ${i % 2 === 0 ? "bg-[#F8FAFB]" : "bg-white"} hover:bg-[#E6F2FA]`}
                >
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-2">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes panel */}
      <div className="mt-6 bg-white rounded-md shadow-md border border-[#D0D7DE] p-4 text-[#002B49]">
        <h2 className="text-lg font-semibold">Notes — {activeTab}</h2>
        <div className="mt-2 whitespace-pre-wrap text-sm">
          {fixEscapedNewlines(
            tabNotes[activeTab]?.content ??
              `Notes file not loaded yet for ${activeTab}`
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          {tabNotes[activeTab] && tabNotes[activeTab].status === "loading" && "Loading notes..."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "loaded" && "Notes loaded from file."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "missing" && "Notes file not found — please add to public/."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "error" && "Error loading notes — check console."}
        </div>
      </div>
    </div>
  );
}
