import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { KanbanBoard } from '../components/leads/KanbanBoard';
import { supabase } from '../lib/supabase';
import { Lead, Note } from '../types';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Setup real-time subscriptions
    const leadsSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchLeads()
      )
      .subscribe();

    const notesSubscription = supabase
      .channel('notes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => fetchNotes()
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      notesSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchNotes()]);
    setLoading(false);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNotes(data);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (!error) {
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const addNote = async () => {
    if (!selectedLead || !noteText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          lead_id: selectedLead.id,
          content: noteText,
          created_by: 'current_user' // In real app, get from auth context
        });

      if (!error) {
        setNoteText('');
        setSelectedLead(null);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            Kanban View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-2xl font-bold text-blue-600">
                {getLeadsByStatus('new').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-2xl font-bold text-yellow-600">
                {getLeadsByStatus('contacted').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-green-600">
                {getLeadsByStatus('qualified').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-600">
                {getLeadsByStatus('closed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard leads={leads} onStatusChange={updateLeadStatus} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">All Leads</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLead?.id === lead.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{lead.name}</h3>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{lead.email}</p>
                    <p className="text-sm text-gray-600 mb-2">{lead.phone}</p>
                    {lead.product && (
                      <p className="text-sm text-blue-600">
                        Interested in: {lead.product}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {leads.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No leads available</p>
                )}
              </div>
            </Card>
          </div>

          {/* Notes Section */}
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Add Note</h2>
              {selectedLead ? (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">{selectedLead.name}</h3>
                    <p className="text-sm text-gray-600">{selectedLead.email}</p>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note about this lead..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addNote}
                      disabled={submitting || !noteText.trim()}
                      size="sm"
                    >
                      {submitting ? <Spinner size="sm" /> : 'Add Note'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(null);
                        setNoteText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Select a lead to add notes
                </p>
              )}
            </Card>

            {/* Recent Notes */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Notes</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notes.slice(0, 5).map((note) => {
                  const lead = leads.find(l => l.id === note.lead_id);
                  return (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium">
                          {lead?.name || 'Unknown Lead'}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{note.content}</p>
                    </div>
                  );
                })}
                {notes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No notes yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}