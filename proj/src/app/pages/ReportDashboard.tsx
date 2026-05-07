import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    ShieldAlert, 
    User, 
    Package, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Trash2,
    Clock
} from 'lucide-react';

const ReportDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://127.0.0.1:8000/api/reports/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(response.data);
        } catch (error) {
            console.error("Error fetching complaints", error);
            toast.error("Не вдалося завантажити список скарг");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, actionType: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`http://127.0.0.1:8000/api/reports/${id}/perform_action/`, 
                { action: actionType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success(`Дію "${actionType}" успішно виконано`);
            fetchReports(); 
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Помилка при виконанні дії");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'dismissed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <ShieldAlert className="text-red-500 w-8 h-8" />
                        Complaints Management
                    </h1>
                    <p className="text-gray-500 mt-1">Management of user complaints and content moderation</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <div className="px-4 py-2 text-center border-r border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-xl font-black text-gray-900">{reports.length}</p>
                    </div>
                    <div className="px-4 py-2 text-center">
                        <p className="text-xs font-bold text-orange-400 uppercase">New</p>
                        <p className="text-xl font-black text-orange-500">
                            {reports.filter((r: any) => r.status === 'pending').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="p-5 font-bold uppercase text-xs tracking-wider">Reporter</th>
                                <th className="p-5 font-bold uppercase text-xs tracking-wider">Target Content</th>
                                <th className="p-5 font-bold uppercase text-xs tracking-wider">Reason</th>
                                <th className="p-5 font-bold uppercase text-xs tracking-wider">Description</th>
                                <th className="p-5 font-bold uppercase text-xs tracking-wider text-center">Status & Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{report.reporter_name || "Dorm User"}</div>
                                                <div className="text-xs text-gray-400 font-medium">{report.reporter_email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-2 rounded-xl w-fit">
                                            <Package size={16} />
                                            <span className="text-sm truncate max-w-[150px]">
                                                {report.content_details || "Unknown Object"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex items-center gap-1 text-red-500 font-black text-xs uppercase tracking-tighter">
                                            <AlertTriangle size={14} />
                                            {report.reason}
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        <p className="text-gray-600 text-sm italic line-clamp-2 max-w-xs">
                                            "{report.description || "No comment provided"}"
                                        </p>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex flex-col items-center gap-3">
                                            {/* Status Badge */}
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(report.status)}`}>
                                                {report.status}
                                            </div>

                                            {/* Quick Actions (тільки для статусів pending) */}
                                            {report.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleAction(report.id, 'remove')}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md shadow-red-200"
                                                        title="Delete Content"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(report.id, 'warn')}
                                                        className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-md shadow-amber-200"
                                                        title="Warn User"
                                                    >
                                                        <AlertTriangle size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(report.id, 'dismiss')}
                                                        className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all shadow-md shadow-gray-200"
                                                        title="Dismiss"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {report.status !== 'pending' && (
                                                <div className="text-green-500 flex items-center gap-1 text-xs font-bold">
                                                    <CheckCircle2 size={14} /> Handled
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {reports.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-400 bg-white">
                        <Clock className="w-16 h-16 mb-4 text-gray-200" />
                        <p className="text-xl font-bold">Oops! No complaints found.</p>
                        <p className="text-sm italic">All good, no moderation needed.</p>
                    </div>
                )}
                
                {loading && (
                    <div className="p-20 text-center text-blue-500 font-bold animate-pulse">
                        Loading complaints...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDashboard;