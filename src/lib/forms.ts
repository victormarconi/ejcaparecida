export const FORM_FIELD_TYPES = ["text", "number", "select", "multiselect", "radio", "checkbox", "file"] as const;

export type DynamicFormField = {
  id: string;
  label: string;
  type: (typeof FORM_FIELD_TYPES)[number];
  required?: boolean;
  options?: string[];
  dependsOn?: {
    fieldId: string;
    value: string;
  };
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
      
      let dependsOn: { fieldId: string; value: string } | undefined = undefined;
      if (candidate.dependsOn && typeof candidate.dependsOn === "object") {
        const dep = candidate.dependsOn as Record<string, unknown>;
        if (typeof dep.fieldId === "string" && dep.fieldId.trim() && typeof dep.value === "string" && dep.value.trim()) {
          dependsOn = { fieldId: dep.fieldId.trim(), value: dep.value.trim() };
        }
      }

      return [{
        id: candidate.id.trim().slice(0, 80),
        label: candidate.label.trim().slice(0, 160),
        type: candidate.type,
        required: Boolean(candidate.required),
        options: (candidate.type === "select" || candidate.type === "multiselect" || candidate.type === "radio") ? (options && options.length ? options : ["Sim", "Não"]) : undefined,
        dependsOn,
      }];
    }).slice(0, 40);
  } catch {
    return [];
  }
}
