
import React, { useEffect, useState } from 'react';
import { api, cleanupSubscriptions } from '../services/api';
import { User, Product, Package, Target, Role } from '../types';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';

// --- Modal Components ---

const TargetEditModal: React.FC<{ target: Target, adminName: string, onSave: (data: Target) => void, onClose: () => void }> = ({ target, adminName, onSave, onClose }) => {
    const [data, setData] = useState(target);
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Edit Target for {adminName}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="font-bold">Target Harian</label>
                        <input type="number" value={data.target_harian} onChange={e => setData({...data, target_harian: Number(e.target.value)})} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                    <div>
                        <label className="font-bold">Target Bulanan</label>
                        <input type="number" value={data.target_bulanan} onChange={e => setData({...data, target_bulanan: Number(e.target.value)})} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(data)}>Save</Button>
                </div>
            </Card>
        </div>
    )
}

const ProductEditModal: React.FC<{ product: Product, onSave: (data: Product) => void, onClose: () => void }> = ({ product, onSave, onClose }) => {
    const [data, setData] = useState(product);
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Edit Product</h3>
                <div>
                    <label className="font-bold">Product Name</label>
                    <input type="text" value={data.nama_produk} onChange={e => setData({...data, nama_produk: e.target.value})} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(data)}>Save</Button>
                </div>
            </Card>
        </div>
    )
}

const PackageEditModal: React.FC<{ pkg: Package, onSave: (data: Package) => void, onClose: () => void }> = ({ pkg, onSave, onClose }) => {
    const [data, setData] = useState(pkg);
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Edit Package</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="font-bold">Package Name</label>
                        <input type="text" value={data.nama_paket} onChange={e => setData({...data, nama_paket: e.target.value})} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                    <div>
                        <label className="font-bold">Harga Default</label>
                        <input type="number" value={data.harga_default} onChange={e => setData({...data, harga_default: Number(e.target.value)})} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(data)}>Save</Button>
                </div>
            </Card>
        </div>
    )
}

const AddProductModal: React.FC<{ onSave: (data: { nama_produk: string }) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Add New Product</h3>
                <div>
                    <label className="font-bold">Product Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50" placeholder="e.g., New Venture"/>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave({ nama_produk: name })}>Save</Button>
                </div>
            </Card>
        </div>
    )
}

const AddPackageModal: React.FC<{ productId: string, onSave: (data: Omit<Package, 'id'>) => void, onClose: () => void }> = ({ productId, onSave, onClose }) => {
    const [data, setData] = useState({ product_id: productId, nama_paket: '', harga_default: 0 });
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Add New Package</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="font-bold">Package Name</label>
                        <input type="text" value={data.nama_paket} onChange={e => setData({...data, nama_paket: e.target.value})} placeholder="e.g., Starter Pack" className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                    <div>
                        <label className="font-bold">Harga Default</label>
                        <input type="number" value={data.harga_default} onChange={e => setData({...data, harga_default: Number(e.target.value)})} placeholder="e.g., 100000" className="w-full p-2 border-2 rounded mt-1 dark:bg-dark-card border-neutral dark:border-dark-content/50"/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(data)}>Save</Button>
                </div>
            </Card>
        </div>
    )
}


export const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [addingProduct, setAddingProduct] = useState<boolean>(false);
  const [addingPackageFor, setAddingPackageFor] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [u, p, pk, t] = await Promise.all([
          api.getUsers(),
          api.getProducts(),
          api.getPackages(),
          api.getTargets(),
        ]);
        setUsers(u);
        setProducts(p);
        setPackages(pk);
        setTargets(t);
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Setup real-time subscriptions for settings data
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        const users = await api.getUsers();
        setUsers(users);
      })
      .subscribe();

    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const products = await api.getProducts();
        setProducts(products);
      })
      .subscribe();

    const packagesSubscription = supabase
      .channel('packages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, async () => {
        const packages = await api.getPackages();
        setPackages(packages);
      })
      .subscribe();

    const targetsSubscription = supabase
      .channel('targets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'targets' }, async () => {
        const targets = await api.getTargets();
        setTargets(targets);
      })
      .subscribe();

    fetchData();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(packagesSubscription);
      supabase.removeChannel(targetsSubscription);
    };
  }, []);

  const handleSave = async <T extends {id: string} | {user_id: string}>(
    saveFn: (data: any) => Promise<any>,
    data: T,
    updateStateFn: React.Dispatch<React.SetStateAction<any[]>>,
    idKey: 'id' | 'user_id' = 'id'
    ) => {
        try {
            const savedData = await saveFn(data);
            updateStateFn(prev => prev.map(item => item[idKey] === savedData[idKey] ? savedData : item));
        } catch (error) {
            console.error("Save failed", error);
        }
    }
  
    const handleAdd = async <T,>(addFn: (data: any) => Promise<any>, data: T, updateStateFn: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
            const newData = await addFn(data);
            updateStateFn(prev => [...prev, newData]);
        } catch (error) {
            console.error("Add failed", error);
        }
    }
    
    const handleToggleUserStatus = async (user: User) => {
        try {
            const updatedUser = await api.updateUserStatus(user.id, !user.aktif);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        } catch (error) {
            console.error("Failed to toggle user status:", error);
        }
    }


  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-neutral dark:border-dark-content/30">
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">WA Number</th>
                <th className="p-2">Lead Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-dark-content/20 text-sm">
                  <td className="p-2 font-semibold">{user.nama_lengkap}</td>
                  <td className="p-2 capitalize">{user.role}</td>
                  <td className="p-2">{user.nomor_wa}</td>
                  <td className="p-2">
                     {user.role === Role.ADMIN ? (
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={user.aktif} onChange={() => handleToggleUserStatus(user)} />
                                <div className={`block w-12 h-6 rounded-full ${user.aktif ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${user.aktif ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-700 dark:text-dark-content font-medium">
                                {user.aktif ? 'Active' : 'Inactive'}
                            </div>
                        </label>
                     ) : (
                        <span className="text-gray-400">N/A</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Products & Packages</h2>
                <Button onClick={() => setAddingProduct(true)} variant="ghost" className="p-2 shadow-none"><PlusIcon className="h-5 w-5 mr-1" /> Add Product</Button>
            </div>
             <div className="space-y-6">
                {products.map(product => (
                    <div key={product.id} className="border-t-2 border-gray-200 dark:border-dark-content/20 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg capitalize">{product.nama_produk}</h3>
                            <div className="flex items-center space-x-2">
                                <Button onClick={() => setEditingProduct(product)} variant="ghost" className="text-xs p-1 shadow-none"><PencilIcon className="h-4 w-4" /></Button>
                                <Button onClick={() => setAddingPackageFor(product.id)} variant="ghost" className="text-xs p-1 shadow-none"><PlusIcon className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <ul className="space-y-1 text-sm pl-2 mt-1">
                            {packages.filter(p => p.product_id === product.id).map(pkg => (
                                <li key={pkg.id} className="flex justify-between items-center hover:bg-gray-100 dark:hover:bg-dark-card/50 p-1 rounded">
                                    <span>{pkg.nama_paket} - <span className="font-semibold">Rp {pkg.harga_default.toLocaleString('id-ID')}</span></span>
                                    <Button onClick={() => setEditingPackage(pkg)} variant="ghost" className="text-xs p-1 shadow-none"><PencilIcon className="h-4 w-4" /></Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
             </div>
        </Card>
        <Card>
            <h2 className="text-xl font-bold mb-4">Admin Targets</h2>
            <div className="space-y-2">
                {users.filter(u => u.role === Role.ADMIN).map(admin => {
                    const target = targets.find(t => t.user_id === admin.id);
                    if (!target) return null;
                    return (
                        <div key={target.user_id} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-dark-card/50 rounded">
                            <div>
                                <span className="font-semibold">{admin?.nama_lengkap}</span>
                                <div className="text-sm text-gray-500 dark:text-dark-content/70">
                                    <span>Harian: {target.target_harian}, Bulanan: {target.target_bulanan}</span>
                                </div>
                            </div>
                           <Button onClick={() => setEditingTarget(target)} variant="ghost" className="text-xs p-1 shadow-none"><PencilIcon className="h-5 w-5" /></Button>
                        </div>
                    );
                })}
            </div>
        </Card>
      </div>

      {/* --- Modals --- */}
      {editingTarget && (
        <TargetEditModal 
            target={editingTarget}
            adminName={users.find(u => u.id === editingTarget.user_id)?.nama_lengkap || ''}
            onClose={() => setEditingTarget(null)}
            onSave={(data) => {
                handleSave(api.updateTarget, data, setTargets, 'user_id');
                setEditingTarget(null);
            }}
        />
      )}
      {editingProduct && (
          <ProductEditModal 
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSave={(data) => {
                handleSave(api.updateProduct, data, setProducts);
                setEditingProduct(null);
            }}
          />
      )}
       {editingPackage && (
          <PackageEditModal 
            pkg={editingPackage}
            onClose={() => setEditingPackage(null)}
            onSave={(data) => {
                handleSave(api.updatePackage, data, setPackages);
                setEditingPackage(null);
            }}
          />
      )}
       {addingProduct && (
          <AddProductModal
            onClose={() => setAddingProduct(false)}
            onSave={(data) => {
                handleAdd(api.addProduct, data, setProducts);
                setAddingProduct(false);
            }}
          />
      )}
      {addingPackageFor && (
          <AddPackageModal
            productId={addingPackageFor}
            onClose={() => setAddingPackageFor(null)}
            onSave={(data) => {
                handleAdd(api.addPackage, data, setPackages);
                setAddingPackageFor(null);
            }}
          />
      )}
    </div>
  );
};