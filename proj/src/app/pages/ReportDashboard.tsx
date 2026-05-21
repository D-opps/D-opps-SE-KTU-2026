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

type ActionType = 'remove' | 'warn' | 'dismiss';

const ReportDashboard = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            const response = await axios.get(
                'http://127.0.0.1:8000/api/reports/',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setReports(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, actionType: ActionType) => {
        try {
            const token = localStorage.getItem('accessToken');

            await axios.post(
                `http://127.0.0.1:8000/api/reports/${id}/perform_action/`,
                { action: actionType },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Action "${actionType}" completed`);
            fetchReports();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Action failed');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'dismissed':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <ShieldAlert className="text-red-500 w-8 h-8" />
                        Reports Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Moderation dashboard for user reports
                    </p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <div className="px-4 py-2 text-center border-r border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-xl font-black text-gray-900">
                            {reports.length}
                        </p>
                    </div>

                    <div className="px-4 py-2 text-center">
                        <p className="text-xs font-bold text-orange-400 uppercase">
                            Pending
                        </p>
                        <p className="text-xl font-black text-orange-500">
                            {reports.filter(r => r.status === 'pending').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="p-5 text-xs uppercase">Reporter</th>
                                <th className="p-5 text-xs uppercase">Content</th>
                                <th className="p-5 text-xs uppercase">Reason</th>
                                <th className="p-5 text-xs uppercase">Description</th>
                                <th className="p-5 text-xs uppercase text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {reports.map((report: any) => (
                                <tr
                                    key={report.id}
                                    className="border-b hover:bg-blue-50/30"
                                >

                                    {/* REPORTER */}
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold">
                                                    {report.reporter_name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {report.reporter_email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* CONTENT */}
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                                            <Package size={16} />
                                            {report.content_details}
                                        </div>
                                    </td>

                                    {/* REASON */}
                                    <td className="p-5 text-red-500 font-bold text-xs uppercase">
                                        {report.reason}
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td className="p-5 text-gray-600 italic text-sm">
                                        {report.description || 'No description'}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="p-5 text-center">

                                        <div className={`mb-3 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(report.status)}`}>
                                            {report.status}
                                        </div>

                                        {report.status === 'pending' ? (
                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() =>
                                                        handleAction(report.id, 'remove')
                                                    }
                                                    className="p-2 bg-red-500 text-white rounded-lg"
                                                    title="Remove content"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleAction(report.id, 'warn')
                                                    }
                                                    className="p-2 bg-yellow-500 text-white rounded-lg"
                                                    title="Warn user"
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleAction(report.id, 'dismiss')
                                                    }
                                                    className="p-2 bg-gray-400 text-white rounded-lg"
                                                    title="Dismiss"
                                                >
                                                    <XCircle size={16} />
                                                </button>

                                            </div>
                                        ) : (
                                            <div className="text-green-500 flex items-center justify-center gap-1 text-xs font-bold">
                                                <CheckCircle2 size={14} />
                                                Handled
                                            </div>
                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* EMPTY */}
                {reports.length === 0 && !loading && (
                    <div className="p-20 text-center text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-lg font-bold">
                            No reports found
                        </p>
                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className="p-20 text-center text-blue-500 font-bold">
                        Loading...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDashboard;