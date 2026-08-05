const TYPE_LABELS: Record<string, string> = {
  HOUSE: "Casa",
  APARTMENT: "Departamento",
  CONDO: "Condominio",
  LAND: "Terreno",
  OFFICE: "Oficina",
  WAREHOUSE: "Almacén",
  OTHER: "Propiedad",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Venta",
  RENTED: "Alquiler",
};

export function formatPrice(price: number, currency = "PEN"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toLocaleString("es-PE")}`;
}

export function formatArea(area: number, unit = "M2"): string {
  const label = unit === "SQFT" ? "ft²" : "m²";
  return `${area} ${label}`;
}

type DescriptionInput = {
  type?: string;
  price: number;
  currency?: string;
  city?: string;
  district?: string;
  area?: number | null;
  areaUnit?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  featuredText1?: string | null;
  featuredText2?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

export function generatePropertyDescription(data: DescriptionInput): string {
  const lines: string[] = [];

  const typeLabel = TYPE_LABELS[data.type ?? ""] ?? "Propiedad";
  const priceText = formatPrice(data.price, data.currency ?? "PEN");
  const place = [data.district, data.city].filter(Boolean).join(", ");
  const locationText = place ? ` en ${place}` : "";

  const isLand = data.type === "LAND";

  lines.push(`${typeLabel} ${priceText}${locationText}`);

  if (data.area) {
    lines.push(`${formatArea(data.area, data.areaUnit ?? "M2")} de área`);
  }

  if (data.bedrooms && !isLand) {
    lines.push(`${data.bedrooms} habitaciones`);
  }

  if (data.bathrooms && !isLand) {
    lines.push(`${data.bathrooms} baños`);
  }

  if (data.featuredText1?.trim()) {
    lines.push(data.featuredText1.trim());
  }

  if (data.featuredText2?.trim()) {
    lines.push(data.featuredText2.trim());
  }

  lines.push(`Precio: ${priceText}`);

  if (data.contactName?.trim()) {
    lines.push(data.contactName.trim());
  }

  if (data.contactPhone?.trim()) {
    lines.push(data.contactPhone.trim());
  }

  lines.push("REMAX FAMILY");

  return lines.join("\n");
}
