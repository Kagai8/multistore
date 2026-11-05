/* resources/js/types/reports.ts */

export type FilterDefinition =
    | {
          id: string;
          label: string;
          type: 'select';
          lookupKey: string;
          placeholder?: string;
      }
    | {
          id: string;
          label: string;
          type: 'range';
          fields: [string, string];
          placeholder?: string;
      }
    | {
          id: string;
          label: string;
          type: 'date-range';
          fields: [string, string];
          placeholder?: string;
      }
    | { id: string; label: string; type: 'text'; placeholder?: string };
