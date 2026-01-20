import React, { forwardRef } from 'react';

// Define Interface for Company Settings
interface CompanySettings {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
    tax_pin?: string; // KRA PIN
    receipt_footer?: string;
    logo_path?: string; // The backend path
}

interface ReceiptProps {
    data: any;       // Transaction Data (Date, Ref, etc.)
    items: any[];    // Cart Items
    company: CompanySettings; // 🟢 Dynamic Company Data
}

export const ReceiptTemplate = forwardRef((props: ReceiptProps, ref: any) => {
    const { data, items, company } = props;

    // Fallbacks to prevent crash if printing empty
    if (!data) return null;

    // Construct Logo URL correctly (if stored in public/storage)
    const logoUrl = company.logo_path ? `/storage/${company.logo_path}` : null;

    return (
        <div ref={ref} className="receipt-box">
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        .receipt-box, .receipt-box * { visibility: visible; }
                        .receipt-box {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm; /* Standard Thermal Paper Width */
                            margin: 0;
                            padding: 0;
                        }
                        @page { size: auto; margin: 0mm; }
                    }

                    /* Base Styles */
                    .receipt-box {
                        width: 80mm;
                        background: #fff;
                        padding: 2mm 4mm; /* Little side padding */
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        color: #000;
                        line-height: 1.3;
                    }
                    .center { text-align: center; }
                    .right { float: right; }
                    .left { text-align: left; }
                    .bold { font-weight: bold; }
                    .dashed-line {
                        margin: 5px 0;
                        border-top: 1px dashed #000;
                        width: 100%;
                    }
                    .items-table { width: 100%; border-collapse: collapse; margin: 5px 0; }
                    .items-table td, .items-table th { padding: 2px 0; font-size: 11px; }
                    .totals p { margin: 3px 0; display: flex; justify-content: space-between; }

                    /* Logo Handling */
                    .receipt-logo {
                        max-width: 60%;
                        height: auto;
                        display: block;
                        margin: 0 auto 5px auto;
                    }
                `}
            </style>

            {/* 🟢 DYNAMIC HEADER */}
            <div className="center">
                {logoUrl && <img src={logoUrl} alt="Logo" className="receipt-logo" />}

                <h2 className="bold" style={{ fontSize: '15px', marginBottom: '2px', textTransform: 'uppercase' }}>
                    {company.name}
                </h2>

                {company.address && <p>{company.address}</p>}
                {company.city && <p>{company.city}</p>}

                {/* Contact Block */}
                <div style={{ fontSize: '11px', marginTop: '3px' }}>
                    {company.phone && <p>Tel: {company.phone}</p>}
                    {company.email && <p>Email: {company.email}</p>}
                    {company.tax_pin && <p className="bold">PIN: {company.tax_pin}</p>}
                </div>
            </div>

            <div className="dashed-line"></div>

            {/* Transaction Details */}
            <div style={{ fontSize: '11px' }}>
                <p>RCP #: <span className="right bold">{data.number || data.receipt_number}</span></p>
                <p>Date: <span className="right">{new Date().toLocaleString()}</span></p>
                <p>Served By: <span className="right">{data.user_name || 'Cashier'}</span></p>
                {data.customer_name && <p>Cust: <span className="right">{data.customer_name}</span></p>}
            </div>

            <div className="dashed-line"></div>

            {/* Items Table */}
            <table className="items-table">
                <thead>
                    <tr>
                        <th className="left">Item</th>
                        <th className="center">Qty</th>
                        <th className="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, index: number) => (
                        <tr key={index}>
                            <td className="left">
                                {item.name}
                                {/* Optional: Show SKU if needed */}
                                {/* <br/><span style={{fontSize:'9px'}}>{item.sku}</span> */}
                            </td>
                            <td className="center">x{item.qty}</td>
                            <td className="right">{Number(item.price * item.qty).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="dashed-line"></div>

            {/* Totals Section */}
            <div className="totals">
                <p className="bold" style={{ fontSize: '14px' }}>
                    <span>TOTAL</span>
                    <span>{Number(data.total_amount).toLocaleString()}</span>
                </p>

                <div className="dashed-line" style={{ margin: '2px 0', opacity: 0.5 }}></div>

                <p>
                    <span>CASH / PAID</span>
                    <span>{Number(data.tendered_amount).toLocaleString()}</span>
                </p>

                {/* Only show change if relevant */}
                <p className="bold">
                    <span>CHANGE</span>
                    <span>{Number(data.change || data.change_amount || 0).toLocaleString()}</span>
                </p>
            </div>

            <div className="dashed-line"></div>

            {/* 🟢 DYNAMIC FOOTER */}
            <div className="center">
                <p style={{ fontWeight: 'bold', margin: '5px 0' }}>
                    {company.receipt_footer || 'Thank you for shopping!'}
                </p>

                {company.website && <p style={{ fontSize: '10px' }}>{company.website}</p>}

                <p style={{ fontSize: '9px', marginTop: '8px', color: '#555' }}>
                    Powered by InventoryHub
                </p>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
