
import React, { useEffect, useState, useMemo } from 'react';
import { api, cleanupSubscriptions } from '../services/api';
import { HandleCustomerData, Product, Package, FollowUpStatus } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PencilIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';


const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.354 1.687zM8.931 7.341c.227-.352.688-.543 1.138-.515.324.019.58.15.75.312.204.187.318.414.394.66.065.211.102.434.138.671.054.343.042.684-.029 1.011-.115.523-.335.962-.623 1.348-.052.069-.092.134-.118.196-.037.088-.059.183-.059.28.002.172.05.338.14.481.252.392.585.722.973.987.491.332 1.02.535 1.574.593.136.015.272.006.406-.025.293-.069.562-.213.787-.42.109-.101.205-.213.287-.334.093-.139.19-.271.326-.388.163-.142.36-.219.565-.219.241 0 .46.095.619.256.195.196.293.443.293.719-.002.143-.024.283-.068.418-.176.533-.476.992-.881 1.327-.425.348-.922.589-1.461.708-.609.135-1.244.085-1.829-.133-.775-.285-1.481-.74-2.065-1.333-.91-1.025-1.438-2.358-1.43-3.756.002-.6.12-1.188.353-1.735z" />
    </svg>
);

const HandleCustomerUpdateModal: React.FC<{
  item: HandleCustomerData | null;
  onClose: () => void;
  onSave: (item: HandleCustomerData) => void;
}> = ({ item, onClose, onSave }) => {
  const [editedItem, setEditedItem] = useState<HandleCustomerData | null>(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  if (!editedItem) return null;

  const handleSave = () => {
    onSave(editedItem);
  };

  const handleInputChange = <K extends keyof HandleCustomerData>(key: K, value: HandleCustomerData[K]) => {
    setEditedItem(prev => (prev ? { ...prev, [key]: value } : null));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <Card className="w-full max-w-lg shadow-neo dark:shadow-dark-neo">
        <h2 className="text-xl font-bold mb-4">Update Follow-up: {editedItem.nama}</h2>
        <div className="space-y-4">
          <div>
            <label className="font-bold">Follow-up Status</label>
            <select
              value={editedItem.status_fu}
              onChange={e => handleInputChange('status_fu', e.target.value as FollowUpStatus)}
              className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"
            >
              {Object.values(FollowUpStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="font-bold">Tanggal Follow-up Terakhir</label>
            <input
              type="date"
              value={editedItem.tanggal_fu_terakhir || ''}
              onChange={e => handleInputChange('tanggal_fu_terakhir', e.target.value)}
              className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Card>
    </div>
  );
};


export const HandleCustomer: React.FC = () => {
  const { user } = useAuth();
  const [hcData, setHcData] = useState<HandleCustomerData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHcItem, setSelectedHcItem] = useState<HandleCustomerData | null>(null);
  
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.nama_produk])), [products]);
  const packageMap = useMemo(() => new Map(packages.map(p => [p.id, p.nama_paket])), [packages]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [data, prods, pkgs] = await Promise.all([
            api.getHandleCustomerData(),
            api.getProducts(),
            api.getPackages()
        ]);
        setHcData(data);
        setProducts(prods);
        setPackages(pkgs);
      } catch (error) {
        console.error("Failed to fetch handle customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Setup real-time subscription for handle customer data
    const hcSubscription = supabase
      .channel('handle-customer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handle_customer_data',
        },
        async () => {
          // Refresh data when changes occur
          const data = await api.getHandleCustomerData();
          setHcData(data);
        }
      )
      .subscribe();

    fetchData();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(hcSubscription);
    };
  }, []);
  
  const handleUpdateItem = async (updatedItem: HandleCustomerData) => {
    try {
        const savedItem = await api.updateHandleCustomer(updatedItem);
        setHcData(prev => prev.map(d => d.id === savedItem.id ? savedItem : d));
        setSelectedHcItem(null);
    } catch(error) {
        console.error("Failed to update follow up status:", error);
    }
  };

  const handleChat = (item: HandleCustomerData) => {
      if (!user) return;
      const message = encodeURIComponent(`Halo ${item.nama}, saya ${user.nama_lengkap} ingin melakukan follow up.`);
      window.open(`https://wa.me/${item.nomor_wa}?text=${message}`, '_blank');
  }

  if (loading) return <Spinner />;

  return (
    <>
      <Card className="shadow-neo-sm dark:shadow-dark-neo-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-neutral dark:border-dark-content/30">
              <th className="p-4">Name</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Package Taken</th>
              <th className="p-4">Last Follow-up</th>
              <th className="p-4">Follow-up Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {hcData.map(item => (
              <tr key={item.id} className="border-b border-gray-200 dark:border-dark-content/20">
                <td className="p-4 font-semibold">{item.nama}</td>
                <td className="p-4">{item.nomor_wa}</td>
                <td className="p-4">{packageMap.get(item.paket_id) || 'N/A'} ({productMap.get(item.product_id) || 'N/A'})</td>
                <td className="p-4">{item.tanggal_fu_terakhir || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status_fu === FollowUpStatus.SUDAH ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {item.status_fu}
                  </span>
                </td>
                <td className="p-4">
                   <div className="flex items-center space-x-2">
                     <Button variant="ghost" className="p-2 shadow-none" onClick={() => handleChat(item)} title="Chat on WhatsApp">
                         <WhatsAppIcon />
                     </Button>
                     <Button variant="ghost" className="p-2 shadow-none" onClick={() => setSelectedHcItem(item)} title="Edit Follow-up">
                        <PencilIcon className="h-5 w-5" />
                     </Button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selectedHcItem && (
        <HandleCustomerUpdateModal
          item={selectedHcItem}
          onClose={() => setSelectedHcItem(null)}
          onSave={handleUpdateItem}
        />
      )}
    </>
  );
};