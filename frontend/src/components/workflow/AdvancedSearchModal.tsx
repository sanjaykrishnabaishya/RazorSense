import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function AdvancedSearchModal({ isOpen, onClose, onSearch }: any) {
  const [step, setStep] = useState(1);
  const [merchant, setMerchant] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiPlatform, setUpiPlatform] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchClick = () => {
    // If orderId is not given, show history step, else direct search
    if (!orderId) {
      setStep(2);
    } else {
      // simulate direct result
      onSearch({
        merchant: merchant || 'Unknown Merchant',
        orderId: orderId,
        method: paymentMethod
      });
      onClose();
    }
  };

  const handleFinalSubmit = () => {
    onSearch({
      merchant: merchant || 'Unknown Merchant',
      orderId: selectedResult || 'MULTIPLE_ORDERS',
      method: paymentMethod
    });
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="flex justify-between items-center p-5 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">Advanced Search</h3>
            <button onClick={onClose} className="text-white/50 hover:text-white transition"><X size={20} /></button>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] text-white/60 mb-1.5">Merchant Name</label>
                  <input type="text" placeholder="e.g. Amazon, Flipkart" value={merchant} onChange={e => setMerchant(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-[13px] text-white/60 mb-1.5">Order ID (Optional)</label>
                  <input type="text" placeholder="Leave blank to search history" value={orderId} onChange={e => setOrderId(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-[13px] text-white/60 mb-1.5">Order Date (Optional)</label>
                  <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-[13px] text-white/60 mb-1.5">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="">Select a method...</option>
                    <option value="upi">UPI</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>

                {paymentMethod === 'upi' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[13px] text-white/60 mb-1.5">UPI Platform</label>
                      <select value={upiPlatform} onChange={e => setUpiPlatform(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none">
                        <option value="">Select app...</option>
                        <option value="gpay">Google Pay</option>
                        <option value="phonepe">PhonePe</option>
                        <option value="paytm">Paytm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-white/60 mb-1.5">UPI ID</label>
                      <input type="text" placeholder="name@bank" value={upiId} onChange={e => setUpiId(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'card' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[13px] text-white/60 mb-1.5">Bank Name</label>
                      <input type="text" placeholder="e.g. HDFC, SBI" value={bankName} onChange={e => setBankName(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[13px] text-white/60 mb-1.5">Last 4 digits of Card</label>
                      <input type="text" placeholder="XXXX" maxLength={4} value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleSearchClick}
                  disabled={!paymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl mt-4 transition flex items-center justify-center gap-2"
                >
                  <Search size={18} /> Search Transactions
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-[14px] text-white/70 mb-4">We found multiple transactions matching these details in your last 10 purchases. Please select the one with the issue:</p>
                <div className="space-y-2">
                  {[
                    { id: '#AMZ884512', amount: '₹1,499', date: 'Today, 2:30 PM', item: 'Wireless Earbuds' },
                    { id: '#AMZ992144', amount: '₹450', date: 'Yesterday, 11:15 AM', item: 'Phone Case' },
                    { id: '#AMZ771233', amount: '₹2,999', date: '2 days ago', item: 'Mechanical Keyboard' }
                  ].map((res) => (
                    <label key={res.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${selectedResult === res.id ? 'bg-blue-500/10 border-blue-500' : 'bg-[#111] border-white/10 hover:border-white/30'}`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedResult === res.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/30'}`}>
                        {selectedResult === res.id && <Check size={12} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white text-[14px]">{res.item}</span>
                          <span className="font-bold text-white text-[14px]">{res.amount}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[12px] text-white/50">{res.id}</span>
                          <span className="text-[12px] text-white/50">{res.date}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-[14px]">Back</button>
                  <button 
                    onClick={handleFinalSubmit}
                    disabled={!selectedResult}
                    className="flex-1 bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    Confirm Selection <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
