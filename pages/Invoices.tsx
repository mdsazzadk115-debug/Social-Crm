
import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { Invoice, InvoiceItem, Lead } from '../types';
import { Plus, Printer, Download, Search, Trash2, Eye, PenTool, CheckSquare } from 'lucide-react';
import { INVOICE_SERVICE_TYPES, DEFAULT_INVOICE_TERMS } from '../constants';
import { useCurrency } from '../context/CurrencyContext';

const BRAND_COLOR = '#4f46e5'; // Unified Brand Color (Indigo-600)

const Invoices: React.FC = () => {
    const { formatCurrency } = useCurrency(); // Currency Context
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, rate: 0 }]);
    const [status, setStatus] = useState<'new'|'paid'|'unpaid'>('new');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [termsEnabled, setTermsEnabled] = useState(true);
    const [termsContent, setTermsContent] = useState(DEFAULT_INVOICE_TERMS);
    const [leadSearch, setLeadSearch] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [pdfLibReady, setPdfLibReady] = useState(false);
    const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

    useEffect(() => { loadData(); loadPdfLibrary(); }, []);
    useEffect(() => { if (invoiceToPrint) { const timer = setTimeout(() => { triggerHiddenDownload(invoiceToPrint); }, 1000); return () => clearTimeout(timer); } }, [invoiceToPrint]);

    const loadPdfLibrary = () => { if ((window as any).html2pdf) { setPdfLibReady(true); return; } const primaryCdn = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; const backupCdn = "https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"; const loadScript = (src: string) => { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = () => { setPdfLibReady(true); resolve(true); }; script.onerror = () => reject(); document.body.appendChild(script); }); }; loadScript(primaryCdn).catch(() => { console.warn("Primary CDN for html2pdf failed, attempting backup..."); loadScript(backupCdn).catch(() => { console.error("Failed to load html2pdf library from all sources."); alert("Could not load PDF generation library. Please check your internet connection."); }); }); };
    const loadData = () => { mockService.getInvoices().then(setInvoices); mockService.getLeads().then(setLeads); };
    const handleAddItem = () => { setItems([...items, { description: '', quantity: 1, rate: 0 }]); };
    const updateItem = (index: number, field: string, value: any) => { const newItems = [...items]; // @ts-ignore
        newItems[index][field] = value; setItems(newItems); };
    const removeItem = (index: number) => { const newItems = [...items]; newItems.splice(index, 1); setItems(newItems); };
    const calculateTotal = (itemsToCalc: InvoiceItem[]) => { return itemsToCalc.reduce((sum, item) => sum + (item.quantity * item.rate), 0); };
    const handleSelectLead = (lead: Lead) => { setClientName(lead.full_name); setClientPhone(lead.primary_phone); setLeadSearch(''); };
    const handleSave = async () => { if (!clientName) return alert("Client name is required"); await mockService.createInvoice({ client_name: clientName, client_phone: clientPhone, client_address: clientAddress, items, status, date, paid_amount: paidAmount, terms_enabled: termsEnabled, terms_content: termsContent }); setIsCreateMode(false); setClientName(''); setClientPhone(''); setClientAddress(''); setItems([{ description: '', quantity: 1, rate: 0 }]); setPaidAmount(0); setTermsEnabled(true); setTermsContent(DEFAULT_INVOICE_TERMS); loadData(); };
    const handleDelete = async (id: string) => { if (window.confirm("Are you sure you want to delete this invoice?")) { await mockService.deleteInvoice(id); loadData(); } };
    const triggerPrint = () => { window.print(); };
    const triggerDownloadPDF = async (elementId: string, filename: string) => { if (!pdfLibReady) { if ((window as any).html2pdf) { setPdfLibReady(true); } else { alert("PDF Library is initializing. Please wait 2 seconds and try again."); return; } } const element = document.getElementById(elementId); if (!element) { console.error(`Element ${elementId} not found`); setIsDownloading(false); setInvoiceToPrint(null); return; } setIsDownloading(true); try { const html2pdf = (window as any).html2pdf; const opt = { margin: 0, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }; await html2pdf().set(opt).from(element).save(); } catch (error) { console.error("PDF Generation Error:", error); alert("Failed to generate PDF. Please try again."); } finally { setIsDownloading(false); setInvoiceToPrint(null); } };
    const triggerHiddenDownload = (inv: Invoice) => { const filename = `Invoice_${inv.number}_${inv.client_name.replace(/\s+/g, '_')}.pdf`; triggerDownloadPDF('hidden-invoice-preview', filename); };

    // --- Note: Live Invoice Preview remains in BDT/Original Input for strict documentation ---
    const LiveInvoicePreview = ({ invNumber, invDate, invStatus, cName, cPhone, cAddr, invItems, invTotal, invPaidAmount, invTermsEnabled, invTerms }: any) => {
        const safeTotal = invTotal || 0;
        const safePaid = invPaidAmount || 0;
        const dueAmount = safeTotal - safePaid;

        return (
            <div className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-[15mm] relative text-sm text-gray-800 invoice-paper">
                <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: BRAND_COLOR }}>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: BRAND_COLOR }}>Social Ads Expert</h1>
                        <div className="mt-2 text-gray-500"> <p>Chandrima Model Town</p> <p>Mohammadpur, Dhaka</p> <p>Web: socialads.expert</p> <p>Phone: 01798205143</p> </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-extrabold text-gray-200">INVOICE</h2>
                        <div className="mt-4"> {invNumber && <p className="font-mono text-gray-400 text-xs mb-1">#{invNumber}</p>} <p className="font-bold text-gray-600">Date:</p> <p>{invDate}</p> </div>
                    </div>
                </div>
                <div className="mb-10"> <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bill To</h3> <div className="text-lg font-bold text-gray-900">{cName || 'Client Name'}</div> <div className="text-gray-600">{cPhone || 'Phone Number'}</div> <div className="text-gray-600 whitespace-pre-wrap">{cAddr || 'Address'}</div> </div>
                <div className="mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="text-white" style={{ backgroundColor: BRAND_COLOR }}> <th className="py-2 px-3 text-left w-1/2 rounded-tl-md">Description</th> <th className="py-2 px-3 text-center w-24">Qty</th> <th className="py-2 px-3 text-right w-32">Rate</th> <th className="py-2 px-3 text-right w-32 rounded-tr-md">Amount</th> </tr>
                        </thead>
                        <tbody>
                            {invItems.map((item: any, i: number) => ( <tr key={i} className="border-b border-gray-100"> <td className="py-3 px-3">{item.description || 'Item Description'}</td> <td className="py-3 px-3 text-center">{item.quantity}</td> <td className="py-3 px-3 text-right">{(item.rate || 0).toFixed(2)}</td> <td className="py-3 px-3 text-right font-medium"> {(item.quantity * (item.rate || 0)).toFixed(2)} </td> </tr> ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 bg-gray-50 p-4 rounded-md">
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-gray-600"> <span>Sub Total:</span> <span>{safeTotal.toFixed(2)}</span> </div>
                             {safePaid > 0 && ( <div className="flex justify-between items-center text-green-600"> <span>Less: Advance / Paid:</span> <span>- {safePaid.toFixed(2)}</span> </div> )}
                             <div className="flex justify-between items-center text-xl font-bold border-t border-gray-200 pt-2" style={{ color: BRAND_COLOR }}> <span>Due Amount:</span> <span>BDT {dueAmount.toFixed(2)}</span> </div>
                        </div>
                    </div>
                </div>
                {invTermsEnabled && ( <div className="mb-12 border-t border-gray-100 pt-4"> <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Terms & Conditions</h4> <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed"> {invTerms} </p> </div> )}
                <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] flex justify-between items-end"> <div className="text-xs text-gray-400"> <p>Thank you for your business!</p> </div> <div className="text-center"> <div className="border-b border-gray-400 w-48 mb-2"></div> <p className="text-xs font-bold text-gray-600 uppercase">Authorized Signature</p> </div> </div>
                {invStatus !== 'new' && ( <div className={`absolute top-[40%] right-[10%] transform rotate-[-15deg] border-4 rounded px-6 py-2 text-5xl font-black opacity-30 select-none ${invStatus === 'paid' ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'}`}> {invStatus.toUpperCase()} </div> )}
            </div>
        );
    };

    return (
        <div className="space-y-6 invoice-container">
            {invoiceToPrint && ( <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, width: '210mm', background: 'white' }}> <div id="hidden-invoice-preview"> <LiveInvoicePreview invNumber={invoiceToPrint.number} invDate={invoiceToPrint.date} invStatus={invoiceToPrint.status} cName={invoiceToPrint.client_name} cPhone={invoiceToPrint.client_phone} cAddr={invoiceToPrint.client_address} invItems={invoiceToPrint.items} invTotal={calculateTotal(invoiceToPrint.items)} invPaidAmount={invoiceToPrint.paid_amount} invTermsEnabled={invoiceToPrint.terms_enabled} invTerms={invoiceToPrint.terms_content} /> </div> </div> )}
            <div className="flex justify-between items-center print:hidden"> <h1 className="text-2xl font-bold text-gray-900">📄 Invoices</h1> {!isCreateMode ? ( <button onClick={() => setIsCreateMode(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"> <Plus className="h-4 w-4 mr-2" /> New Invoice </button> ) : ( <div className="flex space-x-3"> <button onClick={() => setIsCreateMode(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button> <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm flex items-center"> <CheckSquare className="h-4 w-4 mr-2"/> Save Invoice </button> </div> )} </div>
            {isCreateMode ? (
                <div className="flex flex-col xl:flex-row gap-8">
                    <div className="xl:w-5/12 space-y-6 print:hidden">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800"> <PenTool className="h-4 w-4 mr-2 text-indigo-500"/> Edit Details </h2>
                            <div className="space-y-3 mb-6"> <label className="block text-xs font-bold uppercase text-gray-500">Client Information</label> <div className="relative"> <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Search Existing Lead..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)} /> {leadSearch && ( <div className="absolute z-10 w-full bg-white shadow-xl border border-gray-200 mt-1 max-h-40 overflow-y-auto rounded-md"> {leads.filter(l => l.full_name.toLowerCase().includes(leadSearch.toLowerCase()) || l.primary_phone.includes(leadSearch)).slice(0, 5).map(l => ( <div key={l.id} className="p-2 hover:bg-indigo-50 cursor-pointer text-sm" onClick={() => handleSelectLead(l)}> <span className="font-bold">{l.full_name}</span> <span className="text-gray-500">({l.primary_phone})</span> </div> ))} </div> )} </div> <input type="text" placeholder="Client Name" className="w-full border border-gray-300 rounded p-2 text-sm" value={clientName} onChange={e => setClientName(e.target.value)} /> <input type="text" placeholder="Phone Number" className="w-full border border-gray-300 rounded p-2 text-sm" value={clientPhone} onChange={e => setClientPhone(e.target.value)} /> <textarea placeholder="Billing Address" rows={2} className="w-full border border-gray-300 rounded p-2 text-sm" value={clientAddress} onChange={e => setClientAddress(e.target.value)} /> </div>
                            <div className="grid grid-cols-2 gap-4 mb-6"> <div> <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Invoice Date</label> <input type="date" className="w-full border border-gray-300 rounded p-2 text-sm" value={date} onChange={e => setDate(e.target.value)} /> </div> <div> <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label> <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white" value={status} onChange={e => setStatus(e.target.value as any)}> <option value="new">Draft / New</option> <option value="unpaid">Unpaid (Sent)</option> <option value="paid">Paid</option> </select> </div> </div>
                            <div className="mb-6"> <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Line Items (BDT)</label> <div className="space-y-2"> {items.map((item, i) => ( <div key={i} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100"> <div className="flex-1 space-y-1"> <input list="service-types" type="text" placeholder="Description" className="w-full border border-gray-300 rounded p-1.5 text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /> <div className="flex gap-2"> <input type="number" placeholder="Qty" className="w-20 border border-gray-300 rounded p-1.5 text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value))} /> <input type="number" placeholder="Rate (BDT)" className="w-24 border border-gray-300 rounded p-1.5 text-sm" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value))} /> </div> </div> <div className="flex flex-col items-end gap-1"> <span className="text-xs font-mono font-bold pt-2">{(item.quantity * item.rate).toFixed(0)}</span> <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button> </div> </div> ))} <datalist id="service-types"> {INVOICE_SERVICE_TYPES.map(s => <option key={s} value={s} />)} </datalist> </div> <button onClick={handleAddItem} className="mt-2 text-xs text-indigo-600 font-bold flex items-center hover:underline"> <Plus className="h-3 w-3 mr-1" /> Add Line Item </button> </div>
                            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200"> <label className="block text-xs font-bold uppercase text-green-700 mb-1">Advance / Paid Amount (BDT)</label> <div className="relative"> <span className="absolute left-3 top-2 text-green-600 font-bold">৳</span> <input type="number" className="w-full pl-8 border border-green-300 rounded p-2 text-sm focus:ring-green-500 focus:border-green-500" placeholder="0" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value))} /> </div> <p className="text-xs text-green-600 mt-1">This will be deducted from the subtotal.</p> </div>
                            <div> <div className="flex items-center justify-between mb-2"> <label className="block text-xs font-bold uppercase text-gray-500">Terms & Conditions</label> <button onClick={() => setTermsEnabled(!termsEnabled)} className={`text-xs font-medium px-2 py-0.5 rounded ${termsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}> {termsEnabled ? 'Enabled' : 'Disabled'} </button> </div> {termsEnabled && ( <textarea rows={4} className="w-full border border-gray-300 rounded p-2 text-xs" value={termsContent} onChange={e => setTermsContent(e.target.value)} /> )} </div>
                        </div>
                    </div>
                    <div className="xl:w-7/12">
                        <div className="sticky top-6">
                            <div className="mb-4 flex justify-between items-center print:hidden"> <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center"> <Eye className="h-4 w-4 mr-2"/> Live Preview </h3> <div className="flex space-x-2"> <button onClick={triggerPrint} className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs hover:bg-black flex items-center"> <Printer className="h-3 w-3 mr-1" /> Print </button> <button onClick={() => triggerDownloadPDF('invoice-preview', `Invoice_${clientName}_Draft.pdf`)} disabled={!pdfLibReady || isDownloading} className={`px-3 py-1.5 rounded text-xs flex items-center shadow-sm text-white ${ !pdfLibReady ? 'bg-gray-400 cursor-not-allowed' : isDownloading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700' }`}> <Download className="h-3 w-3 mr-1" /> {!pdfLibReady ? 'Loading Lib...' : isDownloading ? 'Generating...' : 'Download PDF'} </button> </div> </div>
                            <div id="invoice-preview"> <LiveInvoicePreview invDate={date} invStatus={status} cName={clientName} cPhone={clientPhone} cAddr={clientAddress} invItems={items} invTotal={calculateTotal(items)} invPaidAmount={paidAmount} invTermsEnabled={termsEnabled} invTerms={termsContent} /> </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden print:hidden">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Invoice #</th> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client</th> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total (BDT)</th> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paid</th> <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th> <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th> </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-500">No invoices yet.</td></tr> : invoices.map(inv => {
                                const total = inv.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
                                return (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{inv.number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900"> {inv.client_name} <div className="text-xs text-gray-400">{inv.client_phone}</div> </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                                    <td className="px-6 py-4 text-sm font-mono font-bold"> {total.toFixed(2)} </td>
                                    <td className="px-6 py-4 text-sm font-mono text-green-600"> {(inv.paid_amount || 0) > 0 ? (inv.paid_amount || 0).toFixed(2) : '-'} </td>
                                    <td className="px-6 py-4"> <span className={`px-2 py-1 rounded-full text-xs font-bold ${ inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }`}> {inv.status.toUpperCase()} </span> </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => { setInvoiceToPrint(inv); setTimeout(() => window.print(), 800); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Print"> <Printer className="h-4 w-4"/> </button>
                                            <button onClick={() => { if (isDownloading || !pdfLibReady) return; setInvoiceToPrint(inv); }} className={`p-2 hover:bg-indigo-50 rounded ${isDownloading ? 'text-indigo-300 cursor-wait' : 'text-gray-400 hover:text-indigo-600'}`} title={!pdfLibReady ? 'Loading Library...' : 'Download PDF'} disabled={!pdfLibReady || isDownloading}> <Download className="h-4 w-4"/> </button>
                                            <button onClick={() => { setClientName(inv.client_name); setClientPhone(inv.client_phone || ''); setClientAddress(inv.client_address || ''); setItems(inv.items); setStatus(inv.status); setDate(inv.date); setPaidAmount(inv.paid_amount || 0); setTermsEnabled(inv.terms_enabled); setTermsContent(inv.terms_content || DEFAULT_INVOICE_TERMS); setIsCreateMode(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit / View"> <PenTool className="h-4 w-4"/> </button>
                                            <button onClick={() => handleDelete(inv.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"> <Trash2 className="h-4 w-4"/> </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            <style>{` @media print { body * { visibility: hidden; } #invoice-preview, #invoice-preview *, #hidden-invoice-preview, #hidden-invoice-preview * { visibility: visible; } .invoice-paper { position: fixed; left: 0; top: 0; width: 100%; margin: 0; padding: 15mm !important; box-shadow: none; max-width: none; background: white; z-index: 9999; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 0; size: auto; } } `}</style>
        </div>
    );
};
export default Invoices;
