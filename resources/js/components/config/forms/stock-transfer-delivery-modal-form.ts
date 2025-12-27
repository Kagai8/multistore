// resources/js/config/forms/stock-transfer-delivery-modal-form.ts


export interface FieldGroup {
  header: string;
  fields: Array<{
    id: string;
    key: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'multi-select' | 'checkbox' | 'tag-input' | 'hidden' | 'date';
    placeholder?: string;
    autocomplete?: string;
    tabIndex?: number;
    autoFocus?: boolean;
    rows?: number;
    accept?: string;
    className?: string;
    optionsSource?: string;
    colSpan?: number;
    // 🔑 Updated signature: (mode, currentUserContext, data)
    disabled?: boolean | ((mode: 'create' | 'view' | 'edit', currentUserContext?: any, data?: Record<string, any>) => boolean);
  }>;
  columns: number;
}

export const StockTransferDeliveryFormConfig = {
  moduleTitle: 'Stock Management',
  title: 'Confirm Dispatch & Add Delivery Info',
  description: 'Provide delivery details before dispatching this transfer.',
  addButton: null,

  fields: [
    // 1. Delivery Type Selection
    {
      header: 'Delivery Method',
      columns: 1,
      fields: [
        {
          id: 'delivery-type',
          key: 'delivery_type',
          name: 'delivery_type',
          label: 'Delivery Type *',
          type: 'single-select',
          optionsSource: 'deliveryTypes',
          placeholder: 'Select delivery method',
          tabIndex: 1,
          autoFocus: true,
          colSpan: 1,
        },
      ],
    },

    // 2. Internal Delivery Fields
    {
      header: 'Internal Delivery Details',
      columns: 2,
      fields: [
        {
          id: 'assigned-driver',
          key: 'assigned_to_user_id',
          name: 'assigned_to_user_id',
          label: 'Assigned Driver *',
          type: 'single-select',
          optionsSource: 'deliveryUsers',
          placeholder: 'Select delivery staff member',
          tabIndex: 2,
          colSpan: 1,
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'internal',
        },
        {
          id: 'delivery-time-internal',
          key: 'delivery_time',
          name: 'delivery_time',
          label: 'Estimated Delivery Time',
          type: 'date',
          placeholder: 'Select estimated time',
          tabIndex: 3,
          colSpan: 1,
          className: 'max-w-[200px]',
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'internal',
        },
      ],
    },

    // 3. External Delivery Fields
    {
      header: 'External Carrier Details',
      columns: 2,
      fields: [
        {
          id: 'carrier-name',
          key: 'carrier_name',
          name: 'carrier_name',
          label: 'Carrier Name *',
          type: 'text',
          placeholder: 'e.g., Uber Connect, DHL',
          tabIndex: 4,
          colSpan: 1,
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'external',
        },
        {
          id: 'contact-number',
          key: 'contact_number',
          name: 'contact_number',
          label: 'Contact Number',
          type: 'text',
          placeholder: 'e.g., +254712345678',
          tabIndex: 5,
          colSpan: 1,
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'external',
        },
        {
          id: 'tracking-reference',
          key: 'tracking_reference',
          name: 'tracking_reference',
          label: 'Tracking / Reference ID',
          type: 'text',
          placeholder: 'e.g., UC-789456',
          tabIndex: 6,
          colSpan: 2,
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'external',
        },
        {
          id: 'delivery-time-external',
          key: 'delivery_time',
          name: 'delivery_time',
          label: 'Actual Delivery Time',
          type: 'date',
          placeholder: 'When was it delivered?',
          tabIndex: 7,
          colSpan: 1,
          className: 'max-w-[200px]',
          disabled: (mode, currentUserContext, data) => data?.delivery_type !== 'external',
        },
      ],
    },
  ] as FieldGroup[],

  buttons: [
    {
      key: 'cancel',
      type: 'button',
      label: 'Cancel',
      variant: 'ghost',
      className: 'cursor-pointer',
    },
    {
      key: 'submit',
      type: 'submit',
      label: 'Confirm & Send Transfer',
      variant: 'default',
      className: 'cursor-pointer bg-orange-600 hover:bg-orange-700',
    },
  ],
};
