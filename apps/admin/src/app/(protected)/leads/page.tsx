'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { Kanban, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  organizationName: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'negotiating' | 'onboarded' | 'not_interested';
  assignedTo: string | null;
  createdAt: string;
}

const STAGES = [
  { key: 'new', label: 'Baru (New)', bg: 'bg-blue-50/40 border-blue-200' },
  { key: 'contacted', label: 'Dihubungi (Contacted)', bg: 'bg-amber-50/40 border-amber-200' },
  { key: 'negotiating', label: 'Negosiasi (Negotiating)', bg: 'bg-purple-50/40 border-purple-200' },
  { key: 'onboarded', label: 'Onboarded', bg: 'bg-teal-50/40 border-[#08B4B5]/30' },
  { key: 'not_interested', label: 'Batal (No Interest)', bg: 'bg-slate-50 border-slate-200' },
];

export default function LeadsPipelinePage() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: () => api.get<Lead[]>('/admin/leads'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      api.patch(`/admin/leads/${leadId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Status lead berhasil diperbarui');
    },
  });

  const handleStatusChange = (leadId: string, status: string) => {
    updateStatusMutation.mutate({ leadId, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Kanban className="h-6 w-6 text-[#08B4B5]" />
          Pipeline Prospek Enterprise
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau status prospek kemitraan enterprise yang masuk dari formulir website.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#08B4B5] animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Memuat leads pipeline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} className={`p-4 border rounded-2xl flex flex-col space-y-3 ${stage.bg}`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase">{stage.label}</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Kosong
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div key={lead.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 text-xs">
                        <div>
                          <h4 className="font-bold text-slate-900">{lead.organizationName}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">CP: {lead.name}</span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-500 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[130px]">{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{new Date(lead.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                          &ldquo;{lead.message}&rdquo;
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-[#08B4B5]"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="negotiating">Negotiating</option>
                            <option value="onboarded">Onboarded</option>
                            <option value="not_interested">Dropped</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
