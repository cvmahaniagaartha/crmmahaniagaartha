
import React, { useEffect, useState, useMemo } from 'react';
import { api, subscribeToLeads, subscribeToNotes, cleanupSubscriptions } from '../services/api';
import { Lead, LeadStage, FinalStatus, PaymentMethod, Product, Package, Note } from '../types';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PencilIcon, ClockIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import { KanbanBoard } from '../components/leads/KanbanBoard';
import { TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';


const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.354 1.687zM8.931 7.341c.227-.352.688-.543 1.138-.515.324.019.58.15.75.312.204.187.318.414.394.66.065.211.102.434.138.671.054.343.042.684-.029 1.011-.115.523-.335.962-.623 1.348-.052.069-.092.134-.118.196-.037.088-.059.183-.059.28.002.172.05.338.14.481.252.392.585.722.973.987.491.332 1.02.535 1.574.593.136.015.272.006.406-.025.293-.069.562-.213.787-.42.109-.101.205-.213.287-.334.093-.139.19-.271.326-.388.163-.142.36-.219.565-.219.241 0 .46.095.619.256.195.196.293.443.293.719-.002.143-.024.283-.068.418-.176.533-.476.992-.881 1.327-.425.348-.922.589-1.461.708-.609.135-1.244.085-1.829-.133-.775-.285-1.481-.74-2.065-1.333-.91-1.025-1.438-2.358-1.43-3.756.002-.6.12-1.188.353-1.735z" />
    </svg>
);


const LeadUpdateModal: React.FC<{ lead: Lead | null, onClose: () => void, onSave: (lead: Lead, newNoteText: string) => void }> = ({ lead, onClose, onSave }) => {
    const [editedLead, setEditedLead] = useState<Lead | null>(lead);
    const [newNoteText, setNewNoteText] = useState('');

    useEffect(() => {
        setEditedLead(lead);
        setNewNoteText('');
    }, [lead]);

    if (!editedLead) return null;

    const handleSave = () => {
        onSave(editedLead, newNoteText);
    };

    const handleInputChange = <K extends keyof Lead>(key: K, value: Lead[K]) => {
        setEditedLead(prev => prev ? { ...prev, [key]: value } : null);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl shadow-neo dark:shadow-dark-neo max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Update Lead: {editedLead.nama}</h2>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    
                    {editedLead.inquiry_text && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                            <h4 className="font-bold text-sm flex items-center text-yellow-800 dark:text-yellow-300"><ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-2"/> Initial Inquiry</h4>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">{editedLead.inquiry_text}</p>
                        </div>
                    )}

                    <div>
                        <label className="font-bold">Stage</label>
                        <select value={editedLead.stage} onChange={e => handleInputChange('stage', e.target.value as LeadStage)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50">
                            {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {editedLead.stage === LeadStage.CLOSING && (
                         <>
                            <div>
                                <label className="font-bold">Tanggal Closing</label>
                                <input type="date" value={editedLead.tanggal_closing || ''} onChange={e => handleInputChange('tanggal_closing', e.target.value)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50" />
                            </div>
                            <div>
                                <label className="font-bold">Metode Pembayaran</label>
                                <select value={editedLead.metode_bayar || ''} onChange={e => handleInputChange('metode_bayar', e.target.value as PaymentMethod)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50">
                                    <option value="">Pilih Metode</option>
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            {editedLead.metode_bayar === PaymentMethod.DP && (
                                <div>
                                    <label className="font-bold">Nominal DP</label>
                                    <input type="number" value={editedLead.nominal_dp || ''} onChange={e => handleInputChange('nominal_dp', Number(e.target.value))} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50" />
                                </div>
                            )}
                            <div>
                                <label className="font-bold">Status</label>
                                 <select value={editedLead.status} onChange={e => handleInputChange('status', e.target.value as FinalStatus)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50">
                                    {Object.values(FinalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                         </>
                    )}
                    
                    <div>
                        <label className="font-bold">Next Follow-up Reminder</label>
                         <input type="datetime-local" value={editedLead.next_follow_up || ''} onChange={e => handleInputChange('next_follow_up', e.target.value)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50" />
                    </div>
                    
                    <hr className="my-4 border-gray-300 dark:border-gray-600"/>

                    <div>
                        <label className="font-bold">Add Note</label>
                        <textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)} rows={3} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50" placeholder="Catat hasil follow up di sini..."></textarea>
                    </div>

                    <div>
                        <h4 className="font-bold mb-2">Notes History</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-base-dark p-2 rounded">
                            {editedLead.notes.length > 0 ? (
                                [...editedLead.notes].reverse().map(note => (
                                    <div key={note.id} className={`text-sm p-2 rounded shadow-sm ${note.authorId === 'system' ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-white dark:bg-dark-card'}`}>
                                        <p className={`${note.authorId === 'system' ? 'font-semibold text-blue-800 dark:text-blue-300' : ''}`}>{note.text}</p>
                                        {note.authorId !== 'system' && (
                                            <p className="text-xs text-gray-500 mt-1 text-right">
                                                - {note.authorName} on {new Date(note.timestamp).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">No notes yet.</p>
                            )}
                        </div>
                    </div>

                </div>
                <div className="mt-6 flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-dark-content/20">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </Card>
        </div>
    );
};

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.nama_produk])), [products]);
  const packageMap = useMemo(() => new Map(packages.map(p => [p.id, p.nama_paket])), [packages]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [userLeads, prods, pkgs] = await Promise.all([
          api.getLeadsByAdminId(user.id),
          api.getProducts(),
          api.getPackages()
        ]);
        setLeads(userLeads);
        setProducts(prods);
        setPackages(pkgs);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLoading(false);
      }
    };

    // Setup real-time subscriptions
    const leadsSubscription = subscribeToLeads(async (updatedLeads) => {
      if (user) {
        // Filter leads for current user
        const userLeads = updatedLeads.filter(lead => lead.assigned_to === user.id);
        setLeads(userLeads);
      }
    });

    const notesSubscription = subscribeToNotes(async () => {
      // Refresh leads when notes change to get updated notes
      if (user) {
        const userLeads = await api.getLeadsByAdminId(user.id);
        setLeads(userLeads);
      }
    });

    fetchData();

    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [user]);

  const handleUpdateLead = async (updatedLead: Lead, newNoteText: string) => {
    if (!user) return;
    try {
        let leadToSave: Lead = { ...updatedLead, notes: [...updatedLead.notes] };

        if (newNoteText.trim()) {
            const newNote: Note = {
                id: `n${Date.now()}`,
                text: newNoteText.trim(),
                authorId: user.id,
                authorName: user.nama_lengkap,
                timestamp: new Date().toISOString()
            };
            leadToSave.notes.push(newNote);
        }

        const savedLead = await api.updateLead(leadToSave);
        setLeads(prev => prev.map(l => l.id === savedLead.id ? savedLead : l));
        setSelectedLead(null);
    } catch(error) {
        console.error("Failed to update lead:", error);
    }
  };
  
  const handleStageUpdateFromKanban = async (leadId: string, newStage: LeadStage) => {
    const leadToUpdate = leads.find(l => l.id === leadId);
    if (leadToUpdate && leadToUpdate.stage !== newStage) {
        try {
            const updatedLeadData = { ...leadToUpdate, stage: newStage };
            const savedLead = await api.updateLead(updatedLeadData);
            setLeads(prev => prev.map(l => l.id === savedLead.id ? savedLead : l));
        } catch (error) {
            console.error("Failed to update lead stage from Kanban:", error);
        }
    }
  };

  const handleChat = (lead: Lead) => {
      if (!user) return;
      const productName = productMap.get(lead.product_id) || 'produk kami';
      const message = encodeURIComponent(`Halo ${lead.nama}, saya ${user.nama_lengkap} dari ${productName}.`);
      window.open(`https://wa.me/${lead.nomor_wa}?text=${message}`, '_blank');
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex items-center p-1 bg-gray-200 dark:bg-dark-card rounded-lg border-2 border-neutral dark:border-dark-content/50">
            <button 
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 text-sm font-bold rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-neutral text-primary' : 'text-gray-600 dark:text-dark-content/70'}`}
            >
                <TableCellsIcon className="h-5 w-5" />
            </button>
              <button 
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
                className={`p-1.5 text-sm font-bold rounded-md ${viewMode === 'kanban' ? 'bg-white dark:bg-neutral text-primary' : 'text-gray-600 dark:text-dark-content/70'}`}
            >
                <ViewColumnsIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
      
      {viewMode === 'table' ? (
        <Card className="shadow-neo-sm dark:shadow-dark-neo-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-neutral dark:border-dark-content/30">
                <th className="p-4">Name</th>
                <th className="p-4">Product</th>
                <th className="p-4">Package</th>
                <th className="p-4">Source</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-gray-200 dark:border-dark-content/20">
                  <td className="p-4 font-semibold flex items-center">
                      {lead.nama}
                      {lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() && lead.stage === LeadStage.ON_PROGRESS && (
                          <ClockIcon className="h-4 w-4 ml-2 text-red-500" title={`Overdue: ${new Date(lead.next_follow_up).toLocaleString()}`} />
                      )}
                      {lead.next_follow_up && new Date(lead.next_follow_up) > new Date() && lead.stage === LeadStage.ON_PROGRESS && (
                          <ClockIcon className="h-4 w-4 ml-2 text-blue-500" title={`Upcoming: ${new Date(lead.next_follow_up).toLocaleString()}`} />
                      )}
                  </td>
                  <td className="p-4">{productMap.get(lead.product_id) || 'N/A'}</td>
                  <td className="p-4">{packageMap.get(lead.paket_id) || 'N/A'}</td>
                  <td className="p-4">{lead.sumber_lead}</td>
                  <td className="p-4"><Badge text={lead.stage} type="stage" /></td>
                  <td className="p-4"><Badge text={lead.status} type="status" /></td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" className="p-2 shadow-none" onClick={() => handleChat(lead)} title="Chat on WhatsApp">
                          <WhatsAppIcon />
                      </Button>
                      <Button variant="ghost" className="p-2 shadow-none" onClick={() => setSelectedLead(lead)} title="Edit Lead">
                          <PencilIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <KanbanBoard 
            leads={leads}
            productMap={productMap}
            onUpdateLeadStage={handleStageUpdateFromKanban}
            onEditLead={setSelectedLead}
            onChat={handleChat}
        />
      )}

      {selectedLead && (
        <LeadUpdateModal 
            lead={selectedLead}
            onClose={() => setSelectedLead(null)} 
            onSave={handleUpdateLead}
        />
      )}
    </>
  );
};
