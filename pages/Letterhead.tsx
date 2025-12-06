
import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { Document, Lead } from '../types';
import { Plus, Printer, Download, Trash2, Eye, FileText, CheckCircle, LayoutTemplate, PenTool, Bold, Italic, List, Type, X } from 'lucide-react';
import { LETTERHEAD_TEMPLATES } from '../constants';

const BRAND_COLOR = '#4f46e5'; // Unified Brand Color (Indigo-600)

const Letterhead: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [docTitle, setDocTitle] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [docContent, setDocContent] = useState(''); 
    const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
    const [pdfLibReady, setPdfLibReady] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [docToPrint, setDocToPrint] = useState<Document | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadData(); loadPdfLibrary(); }, []);
    useEffect(() => { if (docToPrint) { const timer = setTimeout(() => { triggerHiddenDownload(docToPrint); }, 1000); return () => clearTimeout(timer); } }, [docToPrint]);
    useEffect(() => { if (isCreateMode && editorRef.current && docContent !== editorRef.current.innerHTML) { if (editorRef.current.innerHTML === '' || docContent.length > editorRef.current.innerHTML.length + 10 || docContent.length < 50) { editorRef.current.innerHTML = docContent; } } }, [isCreateMode, docContent]);

    const loadData = () => { mockService.getDocuments().then(setDocuments); mockService.getLeads().then(setLeads); };
    const loadPdfLibrary = () => { if ((window as any).html2pdf) { setPdfLibReady(true); return; } const primaryCdn = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; const backupCdn = "https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"; const loadScript = (src: string) => { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = () => { setPdfLibReady(true); resolve(true); }; script.onerror = () => reject(); document.body.appendChild(script); }); }; loadScript(primaryCdn).catch(() => { console.warn("Primary CDN for html2pdf failed, attempting backup..."); loadScript(backupCdn).catch(() => { console.error("Failed to load html2pdf library."); alert("Could not load PDF generation library. Please check your internet connection."); }); }); };
    const handleCreateNew = () => { setEditingDocId(null); setDocTitle(''); setSelectedClientId(''); setDocContent(''); setSelectedTemplateKey(''); if (editorRef.current) editorRef.current.innerHTML = ''; setIsCreateMode(true); };
    const handleEdit = (doc: Document) => { setEditingDocId(doc.id); setDocTitle(doc.title); setSelectedClientId(doc.client_id || ''); setDocContent(doc.content); setSelectedTemplateKey(''); setIsCreateMode(true); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = doc.content; }, 100); };
    const handleLoadTemplate = () => { if(!selectedTemplateKey) return; if (docContent.length > 20 && !confirm("This will replace your current text. Continue?")) { return; } const newContent = LETTERHEAD_TEMPLATES[selectedTemplateKey]; setDocContent(newContent); if (editorRef.current) editorRef.current.innerHTML = newContent; };
    const handleSave = async () => { if (!docTitle) return alert("Please enter a document title."); const finalContent = editorRef.current?.innerHTML || docContent; const client = leads.find(l => l.id === selectedClientId); const docData = { title: docTitle, client_id: selectedClientId, client_name: client ? client.full_name : 'General', content: finalContent }; if (editingDocId) { await mockService.deleteDocument(editingDocId); await mockService.saveDocument(docData); } else { await mockService.saveDocument(docData); } setIsCreateMode(false); loadData(); };
    const handleDelete = async (id: string) => { if(confirm("Delete this document?")) { await mockService.deleteDocument(id); loadData(); } };
    const triggerDownloadPDF = async (elementId: string, filename: string) => { if (!pdfLibReady) { alert("PDF Library is initializing. Please wait..."); return; } if (isDownloading) return; setIsDownloading(true); const element = document.getElementById(elementId); if (element) { const opt = { margin: 0, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }; try { await (window as any).html2pdf().set(opt).from(element).save(); } catch (e) { console.error("PDF Error", e); alert("Failed to generate PDF. Please try again."); } } else { console.error("Element not found:", elementId); } setIsDownloading(false); setDocToPrint(null); };
    const triggerHiddenDownload = (doc: Document) => { const safeTitle = doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(); triggerDownloadPDF('hidden-doc-preview', `${safeTitle}.pdf`); };
    const execCmd = (command: string, value: string | undefined = undefined) => { document.execCommand(command, false, value); if (editorRef.current) setDocContent(editorRef.current.innerHTML); };

    const LiveDocument = ({ title, date, clientName, content }: any) => {
        return (
            <div className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-[20mm] relative text-sm text-gray-800 flex flex-col justify-between doc-paper">
                <div className="border-b-2 pb-4 mb-8 flex justify-between items-end" style={{ borderColor: BRAND_COLOR }}>
                    <div> <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: BRAND_COLOR }}>Social Ads Expert</h1> <p className="text-xs text-gray-500 mt-1">Chandrima Model Town, Mohammadpur, Dhaka</p> <p className="text-xs text-gray-500">Phone: 01798205143 | Web: socialads.expert</p> </div>
                    <div className="text-right"> <h2 className="text-xl font-bold text-gray-700">{title || 'Document Title'}</h2> <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</p> </div>
                </div>
                <div className="flex-1"> {clientName && ( <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-100 w-fit"> <span className="text-xs font-bold text-gray-500 uppercase block">Prepared For:</span> <span className="font-medium text-gray-900">{clientName}</span> </div> )} <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">Start typing content...</p>' }} /> </div>
                <div className="mt-12 pt-4 border-t border-gray-200 text-center"> <p className="text-xs text-gray-400"> Thank you for choosing Social Ads Expert. We are committed to your growth. </p> </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 doc-container">
             {docToPrint && ( <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, width: '210mm', background: 'white' }}> <div id="hidden-doc-preview"> <LiveDocument title={docToPrint.title} date={docToPrint.created_at} clientName={docToPrint.client_name} content={docToPrint.content} /> </div> </div> )}
            <div className="flex justify-between items-center print:hidden"> <div> <h1 className="text-2xl font-bold text-gray-900">📜 Letterhead / Proposals</h1> <p className="text-sm text-gray-500">Create professional reports & plans on company letterhead.</p> </div> {!isCreateMode ? ( <button onClick={handleCreateNew} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"> <Plus className="h-4 w-4 mr-2" /> New Document </button> ) : ( <div className="flex space-x-3"> <button onClick={() => setIsCreateMode(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button> <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm flex items-center"> <CheckCircle className="h-4 w-4 mr-2"/> {editingDocId ? 'Update Document' : 'Save Document'} </button> </div> )} </div>
            {isCreateMode ? (
                <div className="flex flex-col xl:flex-row gap-8">
                    <div className="xl:w-5/12 space-y-6 print:hidden">
                         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800"> <FileText className="h-4 w-4 mr-2 text-indigo-500"/> Document Details </h2>
                            <div className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-700">Document Title</label> <input type="text" className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring-indigo-500" placeholder="e.g. June Marketing Plan" value={docTitle} onChange={e => setDocTitle(e.target.value)} /> </div> <div> <label className="block text-sm font-medium text-gray-700">Client (Optional)</label> <select className="mt-1 w-full border border-gray-300 rounded p-2" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}> <option value="">-- Select Client --</option> {leads.map(l => ( <option key={l.id} value={l.id}>{l.full_name} - {l.primary_phone}</option> ))} </select> </div> <div className="pt-4 border-t border-gray-100"> <div className="flex flex-col gap-2 mb-2"> <label className="block text-sm font-medium text-gray-700 flex items-center"> <LayoutTemplate className="h-4 w-4 mr-1 text-gray-500"/> Load Ready Template </label> <div className="flex gap-2"> <select className="flex-1 border border-gray-300 rounded p-2 text-sm bg-gray-50" value={selectedTemplateKey} onChange={e => setSelectedTemplateKey(e.target.value)}> <option value="">-- Choose Template --</option> <option value="FB_REPORT">📈 Facebook Report</option> <option value="WEB_HANDOVER">💻 Website Handover</option> <option value="LANDING_HANDOVER">🚀 Landing Page Handover</option> <option value="BUSINESS_PLAN">📅 Business/Marketing Plan</option> </select> <button onClick={handleLoadTemplate} disabled={!selectedTemplateKey} className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-200 border border-indigo-200 text-sm font-medium disabled:opacity-50"> Load </button> </div> </div> <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Content Editor (Type directly below)</label> <div className="flex items-center gap-1 mb-2 p-1 bg-gray-100 rounded border border-gray-300 flex-wrap"> <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 rounded" title="Bold"><Bold className="h-4 w-4"/></button> <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 rounded" title="Italic"><Italic className="h-4 w-4"/></button> <div className="w-px h-4 bg-gray-300 mx-1"></div> <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded" title="Bullet List"><List className="h-4 w-4"/></button> <button onClick={() => execCmd('formatBlock', 'H3')} className="p-1.5 hover:bg-gray-200 rounded" title="Heading"><Type className="h-4 w-4"/></button> <button onClick={() => execCmd('removeFormat')} className="p-1.5 hover:bg-gray-200 rounded" title="Clear Formatting"><X className="h-4 w-4"/></button> </div> <div ref={editorRef} contentEditable className="w-full border border-gray-300 rounded p-4 min-h-[400px] focus:ring-2 focus:ring-indigo-500 focus:outline-none overflow-y-auto bg-white" onInput={(e) => setDocContent(e.currentTarget.innerHTML)} style={{ fontFamily: 'Inter, sans-serif' }}></div> </div> </div>
                         </div>
                    </div>
                    <div className="xl:w-7/12">
                         <div className="sticky top-6">
                            <div className="mb-4 flex justify-between items-center print:hidden"> <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center"> <Eye className="h-4 w-4 mr-2"/> A4 Preview </h3> <div className="flex space-x-2"> <button onClick={() => window.print()} className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs hover:bg-black flex items-center"> <Printer className="h-3 w-3 mr-1" /> Print </button> <button onClick={() => triggerDownloadPDF('live-doc-preview', `${docTitle || 'Document'}.pdf`)} className={`px-3 py-1.5 rounded text-xs flex items-center shadow-sm text-white ${ !pdfLibReady ? 'bg-gray-400 cursor-not-allowed' : isDownloading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700' }`} disabled={!pdfLibReady || isDownloading}> <Download className="h-3 w-3 mr-1" /> {!pdfLibReady ? 'Loading Lib...' : isDownloading ? 'Generating...' : 'Download PDF'} </button> </div> </div>
                            <div id="live-doc-preview"> <LiveDocument title={docTitle} date={new Date().toISOString()} clientName={leads.find(l => l.id === selectedClientId)?.full_name || 'General Client'} content={docContent} /> </div>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr> 
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th> 
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Document Title</th> 
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client</th> 
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documents.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">No documents created.</td></tr> : documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.client_name || 'General'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => { setDocToPrint(doc); setTimeout(() => window.print(), 800); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Print"> <Printer className="h-4 w-4"/> </button>
                                            <button onClick={() => { if (isDownloading || !pdfLibReady) return; setDocToPrint(doc); }} className={`p-2 hover:bg-indigo-50 rounded ${isDownloading ? 'text-indigo-300 cursor-wait' : 'text-gray-400 hover:text-indigo-600'}`} title={!pdfLibReady ? 'Loading Library...' : 'Download PDF'} disabled={!pdfLibReady || isDownloading}> <Download className="h-4 w-4"/> </button>
                                            <button onClick={() => handleEdit(doc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"> <PenTool className="h-4 w-4"/> </button>
                                            <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"> <Trash2 className="h-4 w-4"/> </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <style>{` @media print { body * { visibility: hidden; } #live-doc-preview, #live-doc-preview *, #hidden-doc-preview, #hidden-doc-preview * { visibility: visible; } .doc-paper { position: fixed; left: 0; top: 0; width: 100%; margin: 0; padding: 20mm !important; box-shadow: none; max-width: none; background: white; z-index: 9999; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 0; size: auto; } } `}</style>
        </div>
    );
};

export default Letterhead;
