import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, ShoppingBag, MessageSquare, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
                try {
                    const token = localStorage.getItem('accessToken'); // Перевір назву ключа!
                    const response = await axios.get('http://127.0.0.1:8000/api/admin/metrics/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMetrics(response.data);
                } catch (error) {
                    console.error("Помилка 403: Перевір чи ти адмін і чи вірний токен", error);
                }
            };
        fetchMetrics();
    }, []);

    if (!metrics) return <div className="p-10 text-center">Loading Metrics...</div>;

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${color} text-white`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <TrendingUp className="text-blue-600" /> Platform Growth
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Residents" 
                    value={metrics.total_users} 
                    icon={Users} 
                    color="bg-blue-600" 
                />
                <StatCard 
                    title="Marketplace Size" 
                    value={metrics.total_listings} 
                    icon={ShoppingBag} 
                    color="bg-emerald-500" 
                />
                <StatCard 
                    title="Signups (Today)" 
                    value={metrics.signups_today} 
                    icon={TrendingUp} 
                    color="bg-orange-500" 
                />
                <StatCard 
                    title="New Listings (Today)" 
                    value={metrics.listings_today} 
                    icon={ShoppingBag} 
                    color="bg-pink-500" 
                />
                <StatCard 
                    title="Active Chats (Today)" 
                    value={metrics.active_chats_today} 
                    icon={MessageSquare} 
                    color="bg-indigo-500" 
                />
            </div>
        </div>
    );
}