import { Building2, Phone, MapPin, FileText, Globe, Plus } from 'lucide-react';

export const CompanySettingFormConfig = {
    title: 'Company Profile',
    description: 'Manage details used on receipts and invoices.',

    // 🟢 ADDED: Add Button Configuration
    addButton: {
        label: 'Add Profile',
        icon: Plus,
        className: 'bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer flex items-center gap-2',
    },

    fields: [
        {
            name: 'name',
            label: 'Company Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Alpha Logistics Ltd',
            icon: Building2
        },
        {
            name: 'slogan',
            label: 'Slogan / Tagline',
            type: 'text',
            required: false,
            placeholder: 'Moving You Forward',
            icon: FileText
        },
        {
            name: 'phone',
            label: 'Phone Number',
            type: 'text',
            required: true,
            placeholder: '+254...',
            icon: Phone
        },
        {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            required: false,
            placeholder: 'info@company.com'
        },
        {
            name: 'city',
            label: 'City / Location',
            type: 'text',
            required: true,
            placeholder: 'Nairobi',
            icon: MapPin
        },
        {
            name: 'address',
            label: 'Physical Address',
            type: 'textarea',
            required: false,
            placeholder: 'Building, Street, Floor...'
        },
        {
            name: 'tax_pin',
            label: 'Tax PIN (KRA)',
            type: 'text',
            required: false,
            placeholder: 'P00...'
        },
        {
            name: 'website',
            label: 'Website',
            type: 'text',
            required: false,
            placeholder: 'www.example.com',
            icon: Globe
        },
        {
            name: 'receipt_footer',
            label: 'Receipt Footer Message',
            type: 'textarea',
            required: false,
            placeholder: 'Thank you for shopping with us! Goods once sold...'
        },
        {
            name: 'logo',
            label: 'Company Logo',
            type: 'file',
            required: false,
            accept: 'image/*'
        },
    ],

    buttons: [
        { label: 'Cancel', type: 'button', onClick: 'close', variant: 'outline' },
        { label: 'Save Profile', type: 'submit', variant: 'orange' },
    ],
};
