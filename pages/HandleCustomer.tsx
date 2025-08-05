import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';
import { Lead, FollowUp } from '../types';

export default function HandleCustomer() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpText, setFollowUpText] = useState('');
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

    const followUpsSubscription = supabase
      .channel('follow_ups_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follow_ups' },
        () => fetchFollowUps()
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      followUpsSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchFollowUps()]);
    setLoading(false);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
  };

  const fetchFollowUps = async () => {
    const { data } = await supabase
      .from('follow_ups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setFollowUps(data);
  };

  const handleFollowUp = async () => {
    if (!selectedLead || !followUpText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('follow_ups')
        .insert({
          lead_id: selectedLead.id,
          notes: followUpText,
          follow_up_date: new Date().toISOString()
        });

      if (!error) {
        setFollowUpText('');
        setSelectedLead(null);
        await fetchFollowUps();
      }
    } catch (error) {
      console.error('Error adding follow-up:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (!error) {
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Handle Customer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Active Leads</h2>
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
                <p className="text-sm text-gray-600 mb-2">{lead.email}</p>
                <p className="text-sm text-gray-600">{lead.phone}</p>
                {lead.product && (
                  <p className="text-sm text-blue-600 mt-2">
                    Interested in: {lead.product}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLeadStatus(lead.id, 'contacted');
                    }}
                  >
                    Mark Contacted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLeadStatus(lead.id, 'qualified');
                    }}
                  >
                    Qualify
                  </Button>
                </div>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-gray-500 text-center py-8">No leads available</p>
            )}
          </div>
        </Card>

        {/* Follow-up Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add Follow-up</h2>
          {selectedLead ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedLead.name}</h3>
                <p className="text-sm text-gray-600">{selectedLead.email}</p>
              </div>
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Add follow-up notes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleFollowUp}
                  disabled={submitting || !followUpText.trim()}
                >
                  {submitting ? <Spinner size="sm" /> : 'Add Follow-up'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLead(null);
                    setFollowUpText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a lead to add follow-up notes
            </p>
          )}
        </Card>
      </div>

      {/* Recent Follow-ups */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Follow-ups</h2>
        <div className="space-y-4">
          {followUps.slice(0, 10).map((followUp) => {
            const lead = leads.find(l => l.id === followUp.lead_id);
            return (
              <div key={followUp.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{lead?.name || 'Unknown Lead'}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(followUp.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{followUp.notes}</p>
              </div>
            );
          })}
          {followUps.length === 0 && (
            <p className="text-gray-500 text-center py-8">No follow-ups yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}