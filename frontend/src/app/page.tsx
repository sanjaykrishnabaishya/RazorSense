import React from 'react';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function MerchantDashboard() {
  const disputes = [
    { id: "RS-1042", user: "Alice M.", item: "iPhone 15 Pro", score: 85, status: "REJECTED", reason: "Logistics: Return package weight significantly lower than dispatched (Possible Empty Box)." },
    { id: "RS-1043", user: "Rahul K.", item: "Sony Headphones", score: 12, status: "REFUND_SCHEDULED", reason: "AI Analysis: Low risk, clean history, verified defect." },
    { id: "RS-1044", user: "Priya S.", item: "Zomato Meal", score: 45, status: "HUMAN_INTERVENTION", reason: "AI Analysis: Food 90% consumed before claim. Ambiguous intent." },
    { id: "RS-1045", user: "Vikram R.", item: "PUBG 5000 UC", score: 100, status: "REJECTED", reason: "Payments: Active bank-level chargeback detected (Double-dip dispute attempt)." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-blue-600" />
              RazorSense Command Center
            </h1>
            <p className="text-gray-500">Autonomous Dispute Resolution Engine</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">AI Auto-Resolution Rate</p>
            <p className="text-2xl font-bold text-green-600">89.4%</p>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold">Dispute ID</th>
                <th className="p-4 font-semibold">Customer & Item</th>
                <th className="p-4 font-semibold">Fraud Risk Score</th>
                <th className="p-4 font-semibold">AI Reasoning</th>
                <th className="p-4 font-semibold">Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 font-mono text-sm text-gray-600">{d.id}</td>
                  <td className="p-4">
                    <p className="font-semibold">{d.user}</p>
                    <p className="text-sm text-gray-500">{d.item}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                        ${d.score > 60 ? 'bg-red-500' : d.score > 20 ? 'bg-yellow-500' : 'bg-green-500'}
                      `}>
                        {d.score}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs">{d.reason}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max
                      ${d.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        d.status === 'REFUND_SCHEDULED' ? 'bg-green-100 text-green-700' : 
                        'bg-yellow-100 text-yellow-700'}
                    `}>
                      {d.status === 'REJECTED' && <AlertTriangle size={14} />}
                      {d.status === 'REFUND_SCHEDULED' && <CheckCircle size={14} />}
                      {d.status === 'HUMAN_INTERVENTION' && <Clock size={14} />}
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
