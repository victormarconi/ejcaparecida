export const FORM_FIELD_TYPES = ["text", "number", "select", "checkbox"] as const;

export type DynamicFormField = {
  id: string;
  label: string;
  type: (typeof FORM_FIELD_TYPES)[number];
  required?: boolean;
  options?: string[];
};

function isFieldType(value: unknown): value is DynamicFormField["type"] {
  return typeof value === "string" && FORM_FIELD_TYPES.includes(value as DynamicFormField["type"]);
}

export function parseFormFields(value: string): DynamicFormField[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.id !== "string" || !candidate.id.trim() || typeof candidate.label !== "string" || !candidate.label.trim() || !isFieldType(candidate.type)) return [];
      const options = Array.isArray(candidate.options) ? candidate.options.filter((option): option is string => typeof option === "string" && Boolean(option.trim())).map((option) => option.trim()) : undefined;
      return [{
        id: candidate.id.trim().slice(0, 80),
        label: candidate.label.trim().slice(0, 160),
        type: candidate.type,
        required: Boolean(candidate.required),
        options: candidate.type === "select" ? options : undefined,
      }];
    }).slice(0, 40);
  } catch {
    return [];
  }
}

