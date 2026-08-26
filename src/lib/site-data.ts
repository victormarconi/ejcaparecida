export type SiteData = {
  notices: Array<{
    id: string;
    title: string;
    summary: string;
    content?: string | null;
    assetUrl?: string | null;
    secondaryAssetUrl?: string | null;
    type: "AVISO" | "VENDA" | "GINCANA" | "EVENTO";
    highlight: boolean;
    published: boolean;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startsAt: string;
    visibility: "PUBLIC" | "MEMBERS";
  }>;
  team: Array<{
    id: string;
    name: string;
    role: string;
    bio?: string | null;
    photoUrl?: string | null;
    sortOrder: number;
    active: boolean;
  }>;
  locations: Array<{
    id: string;
    type: string;
    title: string;
    address: string;
    query: string;
    mapUrl?: string | null;
    sortOrder: number;
  }>;
  finances: Array<{
    id: string;
    type: "INCOME" | "EXPENSE";
    title: string;
    description?: string | null;
    amountCents: number;
    occurredAt: string;
    category?: string | null;
  }>;
};
