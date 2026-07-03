import type { ChartData } from "@/types/slide";

/**
 * Expects the first column to hold category labels and each subsequent
 * column to be a data series, with the header row giving the series names
 * (e.g. "Trimestre, Ventes, Coûts"). Works for both .csv and .xlsx/.xls.
 */
export async function parseChartFile(file: File): Promise<ChartData> {
  // Lazy-loaded: xlsx is a large parser only needed when the user actually
  // imports a spreadsheet, so it shouldn't inflate the app's initial bundle.
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buf), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, blankrows: false });

  if (rows.length < 2) {
    throw new Error("Le fichier doit contenir une ligne d'en-tête et au moins une ligne de données.");
  }

  const [headerRow, ...dataRows] = rows;
  const seriesNames = headerRow.slice(1).map((h, i) => String(h ?? "").trim() || `Série ${i + 1}`);
  if (seriesNames.length === 0) {
    throw new Error("Le fichier doit contenir au moins une colonne de données après les catégories.");
  }

  const categories: string[] = [];
  const seriesValues: number[][] = seriesNames.map(() => []);

  for (const row of dataRows) {
    if (!row || row.length === 0 || row[0] == null || row[0] === "") continue;
    categories.push(String(row[0]).trim());
    seriesNames.forEach((_, i) => {
      const raw = row[i + 1];
      const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0").replace(",", "."));
      seriesValues[i].push(Number.isFinite(num) ? num : 0);
    });
  }

  if (categories.length === 0) {
    throw new Error("Aucune ligne de données exploitable trouvée dans le fichier.");
  }

  return {
    type: "bar",
    categories,
    series: seriesNames.map((name, i) => ({ name, values: seriesValues[i] })),
  };
}
