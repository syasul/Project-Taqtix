'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Calendar, Shield } from 'lucide-react';

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
}

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';
};

const getActionColor = (action: string) => {
  if (action.includes('SUSPEND') || action.includes('UNPUBLISH')) {
    return 'bg-red-50 text-red-700 border border-red-200';
  }
  if (action.includes('APPROVE') || action.includes('PAID')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  return 'bg-blue-50 text-blue-700 border border-blue-200';
};

export default function AuditLogPage() {
  // Fetch Audit Logs
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get<AuditLog[]>('/admin/audit-log'),
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Audit Log Aktivitas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Rekaman log aktivitas admin untuk menjaga akuntabilitas, pelacakan tindakan sensitif, dan kepatuhan sistem internal.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Memuat data log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Belum ada log aktivitas yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="p-4 w-1/4">Waktu Kejadian</th>
                  <th className="p-4 w-1/4">Administrator</th>
                  <th className="p-4 w-1/4">Jenis Aksi</th>
                  <th className="p-4 w-1/4">Entitas Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="p-4 text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(log.timestamp)}</span>
                    </td>
                    {/* Admin Email */}
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.adminEmail}</span>
                      </div>
                    </td>
                    {/* Action Name */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    {/* Target */}
                    <td className="p-4 text-slate-700 truncate max-w-xs font-sans text-sm" title={log.target}>
                      {log.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
