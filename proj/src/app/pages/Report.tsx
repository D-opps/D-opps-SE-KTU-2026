import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const ReportPage: React.FC = () => {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();

    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            
            await axios.post('http://127.0.0.1:8000/api/reports/', {
                model_name: type, 
                object_id: id,
                reason: reason,
                description: description,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Скаргу прийнято!');
            navigate(-1);
        } catch (error: any) {
            console.error('Помилка:', error.response?.data);
            alert("Помилка: " + JSON.stringify(error.response?.data));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-br from-red-500 to-pink-600 p-8 text-white">
                    <h2 className="text-2xl font-bold">Complain?</h2>
                    <p className="text-red-100 mt-2">Are you going to complain about {type === 'product' ? 'this product' : 'this user'}?</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-gray-700 font-bold mb-3">What's the issue?</label>
                        <div className="space-y-3">
                            {[
                                { id: 'spam', label: 'Spam / Advertisement' },
                                { id: 'fraud', label: 'Fraud' },
                                { id: 'inappropriate', label: 'Inappropriate Content' },
                                { id: 'other', label: 'Other' }
                            ].map((opt) => (
                                <div 
                                    key={opt.id}
                                    onClick={() => setReason(opt.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                                        reason === opt.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <span className={reason === opt.id ? 'text-red-700 font-semibold' : 'text-gray-600'}>
                                        {opt.label}
                                    </span>
                                    {reason === opt.id && <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-3">Add more details</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-400 outline-none transition min-h-[120px]"
                            placeholder="Tell us more..."
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Submit Complaint'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full py-3 text-gray-400 hover:text-gray-600 font-medium transition"
                        >
                            I changed my mind, go back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportPage;