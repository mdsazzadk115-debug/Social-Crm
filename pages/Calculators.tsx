
import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart2, ShoppingBag, Copy, Check, MessageCircle, ShoppingCart } from 'lucide-react';
import { mockService } from '../services/mockService';
import { PaymentMethod } from '../types';

const Calculators: React.FC = () => {
    
    // 1. CPR Calculator
    const [cprSpend, setCprSpend] = useState<number>(0);
    const [cprResults, setCprResults] = useState<number>(0);
    const [reportType, setReportType] = useState<'MESSAGE' | 'SALE'>('MESSAGE');
    const [copied, setCopied] = useState(false);
    
    // 2. Currency Converter
    const [usdAmount, setUsdAmount] = useState<number>(0);
    const [exchangeRate, setExchangeRate] = useState<number>(145);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [currencyCopied, setCurrencyCopied] = useState(false);

    // 3. E-commerce Profit
    const [productCost, setProductCost] = useState<number>(0);
    const [salePrice, setSalePrice] = useState<number>(0);
    const [marketingCost, setMarketingCost] = useState<number>(0);
    const [deliveryCost, setDeliveryCost] = useState<number>(100);
    const [returnRate, setReturnRate] = useState<number>(20);
    const [returnCharge, setReturnCharge] = useState<number>(100); // Usually delivery charge + return charge
    const [profitCopied, setProfitCopied] = useState(false);

    // Load Payment Methods on Mount
    useEffect(() => {
        mockService.getPaymentMethods().then(setPaymentMethods);
    }, []);

    // --- CALCULATIONS ---
    const cprResult = cprResults > 0 ? (cprSpend / cprResults) : 0;
    const bdtAmount = usdAmount * exchangeRate;

    // Profit Logic
    const profitDelivered = salePrice - productCost - marketingCost - deliveryCost;
    const lossReturned = marketingCost + returnCharge;
    
    // Weighted Average Profit (Considering Return Rate)
    const successRate = (100 - returnRate) / 100;
    const failRate = returnRate / 100;
    const weightedProfit = (profitDelivered * successRate) - (lossReturned * failRate);

    const breakEvenReturnRate = profitDelivered > 0 
        ? (profitDelivered / (profitDelivered + lossReturned)) * 100 
        : 0;

    // --- REPORT GENERATOR (CPR) ---
    const generateReport = () => {
        const date = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        const label = reportType === 'MESSAGE' ? 'মেসেজ' : 'সেলস';
        
        return `📊 ডেইলি অ্যাড রিপোর্ট (${date})

✅ টোটাল স্পেন্ড: $${cprSpend}
✅ টোটাল ${label}: ${cprResults} টি
💰 প্রতি ${label} খরচ: $${cprResult.toFixed(2)}

ধন্যবাদ!`;
    };

    const handleCopyReport = () => {
        navigator.clipboard.writeText(generateReport());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- REPORT GENERATOR (PAYMENT / CURRENCY) ---
    const generatePaymentReport = () => {
        const methodsText = paymentMethods.length > 0 
            ? paymentMethods.map(pm => {
                if (pm.type === 'BANK') {
                    return `🏦 Bank: ${pm.provider_name}\n   A/C Name: ${pm.account_name}\n   A/C No: ${pm.account_number}\n   Branch: ${pm.branch_name || 'N/A'}`;
                } else {
                    return `📱 ${pm.provider_name} (${pm.mobile_type}): ${pm.account_number} (${pm.instruction})`;
                }
            }).join('\n\n')
            : "Please ask for payment details.";

        return `💸 পেমেন্ট বিল / ইনভয়েস

💵 ডলার অ্যামাউন্ট: $${usdAmount}
🇧🇩 বাংলা টাকা: ৳ ${bdtAmount.toLocaleString()} (Rate: ${exchangeRate})

💳 পেমেন্ট ডিটেইলস:
-------------------------
${methodsText}
-------------------------

🌐 ভিজিট করুন: socialads.expert
পেমেন্ট করে স্ক্রিনশট বা লাস্ট নাম্বার জানাবেন। ধন্যবাদ!`;
    };

    const handleCopyPaymentReport = () => {
        navigator.clipboard.writeText(generatePaymentReport());
        setCurrencyCopied(true);
        setTimeout(() => setCurrencyCopied(false), 2000);
    };

    // --- REPORT GENERATOR (PROFIT ANALYSIS) ---
    const generateProfitReport = () => {
        const status = weightedProfit > 0 ? "✅ লাভজনক ব্যবসা" : "❌ ঝুঁকিপূর্ণ/লস";
        
        return `📈 ই-কমার্স প্রফিট অ্যানালাইসিস

📦 প্রোডাক্ট প্রাইস: ${salePrice} টাকা
🔹 ডেলিভারি হলে লাভ: ${profitDelivered.toFixed(0)} টাকা
🔸 রিটার্ন হলে লস: -${lossReturned.toFixed(0)} টাকা

⚠️ বর্তমান রিটার্ন রেট: ${returnRate}%
💰 গড় লাভ (প্রতি অর্ডারে): ${weightedProfit.toFixed(0)} টাকা

🛑 ব্রেক-ইভেন সতর্কতা:
আপনার রিটার্ন রেট ${breakEvenReturnRate.toFixed(1)}% এর বেশি হলে ব্যবসায় লস হবে। লাভ রাখতে হলে রিটার্ন এর নিচে রাখতে হবে।

ফলাফল: ${status}`;
    };

    const handleCopyProfitReport = () => {
        navigator.clipboard.writeText(generateProfitReport());
        setProfitCopied(true);
        setTimeout(() => setProfitCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">🧮 Smart Calculators</h1>
                <p className="text-sm text-gray-500">Essential tools for media buying and e-commerce planning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. COST PER RESULT + REPORT GENERATOR */}
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <BarChart2 className="h-6 w-6"/>
                        </div>
                        <h3 className="font-bold text-gray-800">Cost Per Result (CPR)</h3>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Total Spend ($)</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded-md p-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors font-medium shadow-sm"
                                value={cprSpend || ''}
                                onChange={e => setCprSpend(parseFloat(e.target.value))}
                                placeholder="10.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Total Results</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded-md p-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors font-medium shadow-sm"
                                value={cprResults || ''}
                                onChange={e => setCprResults(parseFloat(e.target.value))}
                                placeholder="50"
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-500">Cost Per Result</p>
                            <p className="text-center text-3xl font-bold text-blue-600">${cprResult.toFixed(2)}</p>
                        </div>

                        {/* AUTOMATIC REPORT SECTION */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-blue-700 uppercase">Generate Report</span>
                                <div className="flex bg-white rounded border border-blue-200 p-0.5 shadow-sm">
                                    <button 
                                        onClick={() => setReportType('MESSAGE')}
                                        className={`p-1.5 rounded ${reportType === 'MESSAGE' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="Message Report"
                                    >
                                        <MessageCircle className="h-4 w-4"/>
                                    </button>
                                    <button 
                                        onClick={() => setReportType('SALE')}
                                        className={`p-1.5 rounded ${reportType === 'SALE' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="Sales Report"
                                    >
                                        <ShoppingCart className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>
                            
                            <textarea 
                                readOnly
                                value={generateReport()}
                                className="w-full text-xs text-gray-700 bg-white border border-gray-300 rounded p-2 h-28 resize-none font-mono mb-2 focus:outline-none"
                            />
                            
                            <button 
                                onClick={handleCopyReport}
                                className={`w-full flex items-center justify-center py-2 rounded text-xs font-bold transition-colors shadow-sm ${copied ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {copied ? <><Check className="h-3 w-3 mr-1"/> Copied!</> : <><Copy className="h-3 w-3 mr-1"/> Copy Report</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. CURRENCY CONVERTER + PAYMENT REPORT */}
                <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <DollarSign className="h-6 w-6"/>
                        </div>
                        <h3 className="font-bold text-gray-800">USD to BDT</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Amount ($)</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded-md p-3 text-gray-900 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-colors font-medium shadow-sm"
                                value={usdAmount || ''}
                                onChange={e => setUsdAmount(parseFloat(e.target.value))}
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rate (BDT)</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded-md p-3 text-gray-900 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-colors font-medium shadow-sm"
                                value={exchangeRate}
                                onChange={e => setExchangeRate(parseFloat(e.target.value))}
                            />
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-500">Total BDT</p>
                            <p className="text-center text-3xl font-bold text-green-600">৳ {bdtAmount.toLocaleString()}</p>
                        </div>

                        {/* PAYMENT REPORT SECTION */}
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-green-700 uppercase">Payment Bill</span>
                            </div>
                            
                            <textarea 
                                readOnly
                                value={generatePaymentReport()}
                                className="w-full text-xs text-gray-700 bg-white border border-gray-300 rounded p-2 h-40 resize-none font-mono mb-2 focus:outline-none"
                            />
                            
                            <button 
                                onClick={handleCopyPaymentReport}
                                className={`w-full flex items-center justify-center py-2 rounded text-xs font-bold transition-colors shadow-sm ${currencyCopied ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {currencyCopied ? <><Check className="h-3 w-3 mr-1"/> Copied!</> : <><Copy className="h-3 w-3 mr-1"/> Copy Bill & Info</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. E-COMMERCE PROFITABILITY */}
                <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 md:col-span-2 lg:col-span-1 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <ShoppingBag className="h-6 w-6"/>
                        </div>
                        <h3 className="font-bold text-gray-800">E-com Profitability</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Product Cost</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={productCost || ''} 
                                onChange={e => setProductCost(parseFloat(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Sale Price</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={salePrice || ''} 
                                onChange={e => setSalePrice(parseFloat(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Ad Cost (CPA)</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={marketingCost || ''} 
                                onChange={e => setMarketingCost(parseFloat(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Delivery Cost</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={deliveryCost} 
                                onChange={e => setDeliveryCost(parseFloat(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Return Charge</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={returnCharge} 
                                onChange={e => setReturnCharge(parseFloat(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1">Est. Return %</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 bg-gray-50 rounded p-2 focus:ring-purple-500 focus:border-purple-500" 
                                value={returnRate} 
                                onChange={e => setReturnRate(parseFloat(e.target.value))} 
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Profit (Delivered):</span>
                            <span className="font-bold text-green-600">৳ {profitDelivered.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Loss (Returned):</span>
                            <span className="font-bold text-red-600">৳ -{lossReturned.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <span className="text-purple-900 font-bold text-sm">Net Avg. Profit:</span>
                            <span className={`font-bold text-xl ${weightedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>৳ {weightedProfit.toFixed(0)}</span>
                        </div>
                        <div className="text-xs text-center text-gray-400 mt-2">
                            Break-even if Return Rate hits <span className="text-orange-500 font-bold">{breakEvenReturnRate.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* PROFIT REPORT SECTION */}
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-purple-700 uppercase">Analysis Report</span>
                        </div>
                        
                        <textarea 
                            readOnly
                            value={generateProfitReport()}
                            className="w-full text-xs text-gray-700 bg-white border border-gray-300 rounded p-2 h-36 resize-none font-mono mb-2 focus:outline-none"
                        />
                        
                        <button 
                            onClick={handleCopyProfitReport}
                            className={`w-full flex items-center justify-center py-2 rounded text-xs font-bold transition-colors shadow-sm ${profitCopied ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            {profitCopied ? <><Check className="h-3 w-3 mr-1"/> Copied!</> : <><Copy className="h-3 w-3 mr-1"/> Copy Advice</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Calculators;
