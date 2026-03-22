"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCharities, upsertCharity } from "@/lib/supabase/db";
import type { Charity } from "@/types/domain";

export default function CharityManagementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [charities, setCharities] = useState<Charity[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Charity | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setFetching(false);
      return;
    }
    getCharities()
      .then(setCharities)
      .finally(() => setFetching(false));
  }, [user]);

  const handleSave = async () => {
    if (!editForm) return;
    try {
      await upsertCharity(editForm);
      setCharities(prev => prev.map(c => c.id === editForm.id ? editForm : c));
      setEditingId(null);
    } catch (e) {
      alert("Error saving charity");
    }
  };

  if (loading || fetching) return <div className="p-10 text-zinc-500">Loading Charities...</div>;

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-[#f1f3f5] pb-20 pt-10 font-sans">
      <div className="mx-auto max-w-[1300px] px-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-zinc-900">Charity Partners</h1>
            <p className="mt-2 text-lg text-zinc-500 font-medium tracking-tight">Manage impact-driven organizations and featured listings.</p>
          </div>
          <button className="rounded-2xl bg-indigo-600 px-8 py-5 text-xs font-black text-white hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-xl">
             Onboard New Charity
          </button>
        </div>

        {/* Charity List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {charities.map(c => (
              <div key={c.id} className="group relative rounded-[32px] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-zinc-50 transition-all hover:shadow-indigo-100/30 overflow-hidden">
                 <div className="flex items-center justify-between mb-8">
                    <div className="h-16 w-16 rounded-[22px] bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 shadow-sm text-lg">
                        {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    {c.featured && (
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[9px] font-black tracking-widest text-emerald-700 uppercase">Featured</span>
                    )}
                 </div>
                 
                 <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-4">{c.name}</h3>
                 <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 mb-8">{c.description}</p>
                 
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setEditingId(c.id);
                            setEditForm(c);
                        }}
                        className="flex-1 rounded-xl bg-[#f8f9fa] py-3.5 text-xs font-black text-zinc-900 hover:bg-zinc-200 transition-all uppercase tracking-wider"
                    >
                        Edit Details
                    </button>
                    <button className="h-11 w-11 flex items-center justify-center rounded-xl border border-zinc-100 bg-white text-zinc-300 hover:text-rose-500 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
                 
                 {/* Detail view decoration */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-all duration-700" />
              </div>
           ))}
        </div>

        {/* Edit Modal */}
        {editingId && editForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-6">
                <div className="w-full max-w-[600px] overflow-hidden rounded-[32px] bg-white p-10 shadow-2xl relative">
                    <button 
                        onClick={() => setEditingId(null)}
                        className="absolute right-8 top-8 text-zinc-300 hover:text-zinc-600 transition-colors"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </button>
                    
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-10">Modify Charity</h2>
                    
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3">Organization Name</p>
                            <input 
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                             <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3">Mission Description</p>
                             <textarea 
                                value={editForm.description}
                                rows={4}
                                onChange={e => setEditForm({...editForm, description: e.target.value})}
                                className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 resize-none"
                             />
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox"
                                checked={editForm.featured}
                                onChange={e => setEditForm({...editForm, featured: e.target.checked})}
                                id="featured-check"
                                className="h-5 w-5 rounded border-zinc-100 accent-indigo-600"
                            />
                            <label htmlFor="featured-check" className="text-sm font-bold text-zinc-900 cursor-pointer">Post as Featured Charity on Home Page</label>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button 
                            onClick={() => setEditingId(null)}
                            className="flex-1 rounded-2xl bg-[#e9ecef] py-5 text-xs font-black text-zinc-500 uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 rounded-2xl bg-indigo-600 py-5 text-xs font-black text-white shadow-lg shadow-indigo-100 uppercase tracking-widest"
                        >
                            Save Updates
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
