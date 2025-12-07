import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Calendar, MapPin, Briefcase, Camera, Home, Music, X, ChevronRight, Sun, Baby, Users, Star, Globe, Smile, Armchair, Book, Image as ImageIcon, Edit2, Save, Plus, Lock, Unlock, Trash2, ArrowLeft, ArrowRight, Maximize, Upload, ZoomIn, ZoomOut, Cake, Loader2, Newspaper, StickyNote, Settings, LogOut, Menu, Move, Folder
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBDlM1qFMBNaqTg6jtFyYXfGX3q8Scdd8I",
  authDomain: "memories-f509b.firebaseapp.com",
  projectId: "memories-f509b",
  storageBucket: "memories-f509b.firebasestorage.app",
  messagingSenderId: "193775657466",
  appId: "1:193775657466:web:c41afb77ceb4110d7c4443",
  measurementId: "G-E97GVQC3W7"
};

// --- HELPERS ---
const safeRender = (val: any) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'object') return ""; 
  return String(val);
};

const ICON_MAP: any = {
  baby: <Baby className="w-5 h-5 text-white" />,
  heart: <Heart className="w-5 h-5 text-white" />,
  globe: <Globe className="w-5 h-5 text-white" />,
  briefcase: <Briefcase className="w-5 h-5 text-white" />,
  home: <Home className="w-5 h-5 text-white" />,
  camera: <Camera className="w-5 h-5 text-white" />,
  star: <Star className="w-5 h-5 text-white" />,
  music: <Music className="w-5 h-5 text-white" />,
  map: <MapPin className="w-5 h-5 text-white" />,
  cake: <Cake className="w-5 h-5 text-white" />,
  newspaper: <Newspaper className="w-5 h-5 text-white" />,
  note: <StickyNote className="w-5 h-5 text-white" />
};

const getCategoryStyles = (category: any) => {
    switch(category) {
        case 'work': return { icon: 'briefcase', color: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        case 'world': return { icon: 'globe', color: 'bg-slate-600', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
        case 'birthday': return { icon: 'cake', color: 'bg-rose-400', text: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' };
        case 'family': default: return { icon: 'heart', color: 'bg-pink-500', text: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' };
    }
};

const MONTH_OPTIONS = [
    { value: 'January', label: 'January' }, { value: 'February', label: 'February' }, { value: 'March', label: 'March' },
    { value: 'April', label: 'April' }, { value: 'May', label: 'May' }, { value: 'June', label: 'June' },
    { value: 'July', label: 'July' }, { value: 'August', label: 'August' }, { value: 'September', label: 'September' },
    { value: 'October', label: 'October' }, { value: 'November', label: 'November' }, { value: 'December', label: 'December' }
];

// --- DEFAULT DATA ---
const DEFAULT_SETTINGS = { siteTitle: "Jackie's Memory Garden", adminPin: "1954", familyPin: "1234" };
const DEFAULT_HOMES = [{ id: 'bungalow', name: 'The Bungalow', address: '12 Garden Row', years: '2015 - Present', color: 'bg-indigo-500', image: '', description: "Your lovely home.", features: [], rooms: [] }];
const DEFAULT_FRIENDS = [{ id: 'margaret', name: 'Margaret Hill', metAt: 'The Library', frequency: 'Tuesdays', role: 'Best Friend', color: 'bg-emerald-500', image: '', details: "Met at work in 1985.", memories: [] }];
const DEFAULT_FAMILY = [
  { id: 'ann', name: 'Ann Rankin', relation: 'Mum', generation: 0, role: 'Mother', color: 'bg-violet-400', image: '', details: "Jackie's Mum.", spouseId: 'abbie', dob: '1928' },
  { id: 'abbie', name: 'Abbie Rankin', relation: 'Dad', generation: 0, role: 'Father', color: 'bg-slate-500', image: '', details: "Jackie's Dad.", spouseId: 'ann', dob: '1925' },
  { id: 'jackie', name: 'Jackie', relation: 'Me', generation: 1, role: 'Matriarch', color: 'bg-rose-500', image: '', details: "Born 1954.", parentId: 'ann', spouseId: 'kenny', dob: '1954' },
  { id: 'kenny', name: 'Kenny', relation: 'Husband', generation: 1, role: 'Husband', color: 'bg-blue-600', image: '', details: "Jackie's Husband.", spouseId: 'jackie', dob: '1952' },
  { id: 'pam', name: 'Pam', relation: 'Sister', generation: 1, role: 'Sister', color: 'bg-purple-400', image: '', details: "Jackie's sister.", parentId: 'ann' },
  { id: 'lindsay', name: 'Lindsay', relation: 'Sister', generation: 1, role: 'Sister', color: 'bg-purple-400', image: '', details: "Jackie's sister.", parentId: 'ann', spouseId: 'eugene' },
  { id: 'eugene', name: 'Eugene', relation: 'Brother-in-Law', generation: 1, role: 'Brother-in-Law', color: 'bg-slate-400', image: '', details: "Lindsay's husband.", spouseId: 'lindsay' },
  { id: 'kerry', name: 'Kerry', relation: 'Daughter', generation: 2, role: 'Daughter', color: 'bg-pink-500', image: '', details: "Daughter of Jackie & Kenny.", parentId: 'jackie', spouseId: 'craig', dob: '1982' },
  { id: 'craig', name: 'Craig', relation: 'Partner', generation: 2, role: 'Son-in-Law', color: 'bg-slate-400', image: '', details: "Kerry's Partner.", spouseId: 'kerry' },
  { id: 'grant', name: 'Grant', relation: 'Son', generation: 2, role: 'Son', color: 'bg-teal-500', image: '', details: "Son of Jackie & Kenny.", parentId: 'jackie', spouseId: 'tina', dob: '1985' },
  { id: 'tina', name: 'Tina', relation: 'Wife', generation: 2, role: 'Daughter-in-Law', color: 'bg-slate-400', image: '', details: "Grant's Wife.", spouseId: 'grant' },
  { id: 'jenna', name: 'Jenna', relation: 'Daughter', generation: 2, role: 'Daughter', color: 'bg-pink-500', image: '', details: "Daughter of Jackie & Kenny.", parentId: 'jackie', spouseId: 'cammy', dob: '1990' },
  { id: 'cammy', name: 'Cammy', relation: 'Fiance', generation: 2, role: 'Son-in-Law', color: 'bg-slate-400', image: '', details: "Jenna's Fiance.", spouseId: 'jenna' },
  { id: 'murray', name: 'Murray', relation: 'Nephew', generation: 2, role: 'Nephew', color: 'bg-indigo-400', image: '', details: "Pam's Son.", parentId: 'pam' },
  { id: 'abby', name: 'Abby', relation: 'Niece', generation: 2, role: 'Niece', color: 'bg-fuchsia-400', image: '', details: "Pam's Daughter.", parentId: 'pam' },
  { id: 'lewis', name: 'Lewis', relation: 'Nephew', generation: 2, role: 'Nephew', color: 'bg-indigo-400', image: '', details: "Lindsay's Son.", parentId: 'lindsay' },
  { id: 'faye', name: 'Faye', relation: 'Niece', generation: 2, role: 'Niece', color: 'bg-fuchsia-400', image: '', details: "Lindsay's Daughter.", parentId: 'lindsay' },
  { id: 'paige', name: 'Paige', relation: 'Granddaughter', generation: 3, role: 'Granddaughter', color: 'bg-amber-400', image: '', details: "Kerry's Daughter.", parentId: 'kerry' },
  { id: 'anna', name: 'Anna', relation: 'Granddaughter', generation: 3, role: 'Granddaughter', color: 'bg-amber-400', image: '', details: "Kerry's Daughter.", parentId: 'kerry' },
  { id: 'willow', name: 'Willow', relation: 'Granddaughter', generation: 3, role: 'Granddaughter', color: 'bg-amber-400', image: '', details: "Grant's Daughter.", parentId: 'grant' }
];
const DEFAULT_TIMELINE = [
  { year: 1976, title: "Wedding Day", category: "family", icon: "heart", color: "bg-red-500", description: "Married Kenny.", location: "St. Mary's", type: "memory" }
];
const DEFAULT_JOURNAL = [{ id: '1', date: "2023-10-24", content: "Had a lovely cup of tea.", mood: "Happy" }];
const DEFAULT_ALBUMS = [{ id: '1', title: 'Family Holidays', subtitle: 'July 1995', year: 1995, month: 'July', color: 'bg-blue-500', link: '', coverImage: '' }];

// --- UI COMPONENTS ---

const Modal = ({ isOpen, onClose, children, color = "bg-white", zIndex = "z-50" }: any) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className={`${color} relative w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"><X className="w-6 h-6 text-gray-800" /></button>
        {children}
      </div>
    </div>
  );
};

const EditorModal = ({ isOpen, title, fields, onClose, onSave, onUpload }: any) => {
    const [formData, setFormData] = useState<any>({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && fields) {
            const initialData: any = {};
            fields.forEach((f: any) => initialData[f.name] = f.value);
            setFormData(initialData);
        }
    }, [isOpen, fields]);

    const handleChange = (name: string, value: any) => { setFormData((prev: any) => ({...prev, [name]: value})); };
    
    const handleFileChange = async (name: string, e: any) => {
        const file = e.target.files[0];
        if (file && onUpload) {
            setUploading(true);
            try { const url = await onUpload(file); handleChange(name, url); } 
            catch (err) { console.error(err); alert("Upload failed."); } 
            finally { setUploading(false); }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex="z-[60]">
            <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Edit2 size={24} className="text-indigo-600"/>{title}</h3>
                <div className="space-y-4">
                    {fields.map((field: any) => (
                        <div key={field.name}>
                            <label className="block text-sm font-bold text-slate-500 mb-1 uppercase">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-400 focus:ring-0 min-h-[100px]" />
                            ) : field.type === 'select' ? (
                                <div className="relative">
                                    <select value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-400 focus:ring-0 appearance-none">
                                        <option value="">None</option>
                                        {field.options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-4 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={16} /></div>
                                </div>
                            ) : field.type === 'file' ? (
                                <div className="space-y-2">
                                    {formData[field.name] ? (
                                        <div className="w-full h-40 bg-slate-100 rounded-xl overflow-hidden relative shadow-inner"><img src={formData[field.name]} alt="Preview" className="w-full h-full object-cover" /><button onClick={() => handleChange(field.name, "")} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"><X size={14} /></button></div>
                                    ) : (
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">{uploading ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}<p className="text-sm text-slate-500 font-bold">{uploading ? "Uploading..." : "Click to upload photo"}</p></div>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(field.name, e)} disabled={uploading}/>
                                        </label>
                                    )}
                                </div>
                            ) : (
                                <input type="text" value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-400 focus:ring-0" />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                    <button onClick={() => onSave(formData)} disabled={uploading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-50"><Save size={18} /> Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};

const ConfirmModal = ({ isOpen, title, message, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return <Modal isOpen={isOpen} onClose={onClose} zIndex="z-[70]"><div className="p-8 text-center"><div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32}/></div><h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3><p className="text-slate-500 mb-8">{message}</p><div className="flex justify-center gap-3"><button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button><button onClick={onConfirm} className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl shadow-md">Delete</button></div></div></Modal>;
}

const PinModal = ({ isOpen, onClose, onSuccess, correctPin }: any) => {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const handleSubmit = () => { if (pin === correctPin) { onSuccess(); onClose(); setPin(""); setError(false); } else { setError(true); } };
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex="z-[80]"><div className="p-8 text-center"><div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div><h3 className="text-2xl font-bold text-slate-800 mb-2">Admin Access</h3><p className="text-slate-500 mb-6">Enter PIN to edit memories.</p><input type="password" value={pin} onChange={e=>setPin(e.target.value)} className="w-32 text-center text-2xl tracking-widest p-2 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-400 focus:ring-0 mb-4" maxLength={4} placeholder="****" />{error && <p className="text-red-500 font-bold text-sm mb-4">Incorrect PIN</p>}<div className="flex justify-center gap-3"><button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button><button onClick={handleSubmit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">Unlock</button></div></div></Modal>
    );
};

const LoginScreen = ({ onLogin, correctPin }: any) => {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const handleSubmit = (e: any) => { e.preventDefault(); if (pin === correctPin) { onLogin(); } else { setError(true); } };
    return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center"><Heart className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" /><h1 className="text-3xl font-bold text-white">Memories</h1><p className="text-indigo-100 mt-2">Welcome to our memory garden.</p></div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col items-center"><p className="text-slate-500 mb-6 text-center font-medium">Please enter the family access code to enter.</p><input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setError(false); }} className={`w-48 text-center text-3xl tracking-[0.5em] p-4 border-2 rounded-2xl font-bold text-slate-800 focus:ring-0 mb-2 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`} maxLength={4} placeholder="••••" autoFocus />{error && <p className="text-red-500 font-bold text-sm mb-6">Incorrect Code. Try again.</p>}<button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg mt-4 flex items-center justify-center gap-2">Enter Garden <ArrowRight size={20} /></button></form>
                </div>
            </div>
        </div>
    );
}

// --- NODES ---
const FamilyMemberNode = ({ member, onClick }: any) => ( <button onClick={() => onClick(member)} className="relative flex flex-col items-center group hover:-translate-y-1 transition-transform"><div className={`w-20 h-20 rounded-full ${member.color} flex items-center justify-center mb-2 shadow-lg border-2 border-white overflow-hidden`}>{member.image ? <img src={member.image} className="w-full h-full object-cover"/> : <span className="text-2xl font-bold text-white opacity-95">{member.name.charAt(0)}</span>}</div><div className="bg-white/90 px-3 py-1.5 rounded-lg shadow-sm border text-center min-w-[90px]"><h3 className="font-bold text-slate-800 text-xs">{safeRender(member.name).split(' ')[0]}</h3><p className="text-indigo-500 font-medium text-[10px] uppercase">{safeRender(member.relation)}</p></div></button>);
const FriendCard = ({ friend, onClick }: any) => (<button onClick={() => onClick(friend)} className="bg-white p-6 rounded-3xl shadow-sm border hover:shadow-xl transition-all w-full text-left flex gap-5 items-center"><div className={`w-16 h-16 rounded-full ${friend.color} flex-shrink-0 flex items-center justify-center overflow-hidden`}>{friend.image ? <img src={friend.image} className="w-full h-full object-cover"/> : <span className="text-2xl font-bold text-white">{friend.name.charAt(0)}</span>}</div><div><h3 className="font-bold text-lg">{friend.name}</h3><div className="flex flex-col gap-1 text-sm"><div className="flex items-center gap-2 text-indigo-500 font-medium"><MapPin size={14} /> Met: {friend.metAt}</div></div></div><ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" /></button>);
const HomeCard = ({ home, onClick }: any) => (<button onClick={() => onClick(home)} className="group relative w-full overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all aspect-[4/3]"><div className={`absolute inset-0 ${home.color}`}>{home.image ? <img src={home.image} className="w-full h-full object-cover opacity-90"/> : <Home size={80} className="text-white/30 m-auto mt-12"/>}</div><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-left"><h3 className="text-2xl font-bold text-white">{home.name}</h3><p className="text-white/80 text-sm">{home.address}</p></div></button>);
const FilterToggle = ({ label, icon, active, onClick, colorClass }: any) => (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${active ? `${colorClass} text-white border-transparent shadow-md` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{React.cloneElement(icon, { size: 16 })}<span className="font-bold text-sm">{label}</span>{active && <span className="ml-1 bg-white/20 px-1.5 rounded text-xs">✓</span>}</button>);
const NavButton = ({ active, onClick, icon, label }: any) => ( <button onClick={onClick} className={`w-full flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-50 text-indigo-600 scale-105 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}><div>{React.cloneElement(icon, { size: 28 })}</div><span className="text-xs">{label}</span></button> );
const NavButtonMobile = ({ active, onClick, icon, label }: any) => ( <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${active ? 'text-indigo-600 -translate-y-2' : 'text-slate-400'}`}><div>{React.cloneElement(icon, { size: 20 })}</div><span className="text-[10px]">{label}</span></button> );

const TreeBranch = ({ person, allMembers, onSelect, stopRecursion = false }: any) => {
    const spouse = allMembers.find((m: any) => m.id === person.spouseId);
    const children = stopRecursion ? [] : allMembers.filter((m: any) => (m.parentId === person.id || (spouse && m.parentId === spouse.id)) && m.id !== person.spouseId);
    return (
        <div className="flex flex-col items-center px-2">
            <div className="z-10 relative flex items-center gap-3 mb-4">
                <FamilyMemberNode member={person} onClick={onSelect} />
                {spouse && (
                    <>
                        <div className="h-0.5 w-4 bg-rose-300"></div>
                        <FamilyMemberNode member={spouse} onClick={onSelect} />
                    </>
                )}
            </div>
            {children.length > 0 && (
                <div className="flex flex-col items-center w-full">
                    <div className="h-6 w-px bg-slate-300 -mt-4 mb-0"></div>
                    {children.length > 1 && (
                        <div className="w-full h-3 border-t border-slate-300 rounded-t-lg mb-3" style={{width: '94%'}}></div>
                    )}
                    <div className="flex gap-4 items-start justify-center">
                        {children.map((child: any) => (
                            <TreeBranch key={child.id} person={child} allMembers={allMembers} onSelect={onSelect} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const FamilyTreeView = ({ familyMembers, viewRootId, setViewRootId, onSelect, zoom, scrollContainerRef, handleZoomIn, handleZoomOut, handleResetZoom }: any) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [showHint, setShowHint] = useState(true);
    
    // Mouse Events
    const handleMouseDown = (e: any) => {
        if (!scrollContainerRef.current) return;
        setShowHint(false);
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setStartY(e.pageY - scrollContainerRef.current.offsetTop);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setScrollTop(scrollContainerRef.current.scrollTop);
    };
    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: any) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const y = e.pageY - scrollContainerRef.current.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
        scrollContainerRef.current.scrollTop = scrollTop - walkY;
    };

    // Touch Events for Mobile
    const handleTouchStart = (e: any) => {
        if (!scrollContainerRef.current) return;
        setShowHint(false);
        setIsDragging(true);
        const touch = e.touches[0];
        setStartX(touch.pageX - scrollContainerRef.current.offsetLeft);
        setStartY(touch.pageY - scrollContainerRef.current.offsetTop);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setScrollTop(scrollContainerRef.current.scrollTop);
    };

    const handleTouchMove = (e: any) => {
        if (!isDragging || !scrollContainerRef.current) return;
        // e.preventDefault(); 
        // We generally want to preventDefault to stop native scrolling, 
        // but 'touch-action: none' css should handle it better.
        const touch = e.touches[0];
        const x = touch.pageX - scrollContainerRef.current.offsetLeft;
        const y = touch.pageY - scrollContainerRef.current.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
        scrollContainerRef.current.scrollTop = scrollTop - walkY;
    };

    const handleTouchEnd = () => setIsDragging(false);
    
    // CENTER ON MOUNT
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                 const { scrollWidth, clientWidth } = scrollContainerRef.current;
                 scrollContainerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
                 scrollContainerRef.current.scrollTop = 50;
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const currentRoot = familyMembers.find((m: any) => m.id === viewRootId) || familyMembers[0];
    let parents: any[] = [];
    let siblings: any[] = [];
    
    if (currentRoot) {
        if (currentRoot.parentId) {
            const directParent = familyMembers.find((m: any) => m.id === currentRoot.parentId);
            parents = directParent ? [directParent] : [];
        }
        if (viewRootId === 'jackie') {
           siblings = familyMembers.filter((m: any) => m.parentId === currentRoot.parentId && m.id !== currentRoot.id && m.id !== currentRoot.spouseId);
        }
    }

    if (!currentRoot) return <div className="text-center p-20 text-slate-400 font-bold">Loading Family Tree...</div>;

    return (
        <div 
            className="h-[80vh] border-2 border-slate-100 rounded-2xl bg-slate-50 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none" 
            ref={scrollContainerRef} 
            onMouseDown={handleMouseDown} 
            onMouseLeave={handleMouseLeave} 
            onMouseUp={handleMouseUp} 
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
        >
           {showHint && (
               <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/5 animate-in fade-in duration-500">
                   <div className="bg-white/95 px-6 py-4 rounded-full shadow-xl flex items-center gap-3 animate-pulse border border-slate-100">
                       <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                           <Move size={24} /> 
                       </div>
                       <div>
                           <p className="font-bold text-slate-800 text-sm">Drag to explore</p>
                           <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Move to see everyone</p>
                       </div>
                   </div>
               </div>
           )}

           <div className="absolute top-4 right-4 flex gap-2 z-20"><button onClick={handleZoomIn} className="bg-white p-2 rounded shadow"><ZoomIn size={20}/></button><button onClick={handleZoomOut} className="bg-white p-2 rounded shadow"><ZoomOut size={20}/></button><button onClick={handleResetZoom} className="bg-white p-2 rounded shadow"><Maximize size={20}/></button></div>
           <header className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none"><h2 className="text-3xl font-bold text-slate-800">Family Tree</h2></header>
           <div className="w-fit min-w-full min-h-full flex flex-col items-center justify-start pt-32 pb-32 px-10 origin-top-center transition-transform duration-200" style={{transform: `scale(${zoom})`}}>
              {parents.length > 0 && (
                  <div className="flex flex-col items-center mb-12">
                      <div className="flex gap-16">{parents.map((p: any) => <TreeBranch key={p.id} person={p} allMembers={familyMembers} onSelect={onSelect} stopRecursion={true} />)}</div>
                      <div className="h-8 w-px bg-slate-300"></div>
                  </div>
              )}
              <div className="flex items-center gap-8 mb-12">
                  {viewRootId !== 'jackie' && (<button onClick={() => setViewRootId('jackie')} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold mr-8"><ArrowLeft size={18} /> Back to Main Tree</button>)}
                  {viewRootId === 'jackie' && (<div className="flex flex-col gap-4 mr-8">{siblings.map((sib: any) => (<button key={sib.id} onClick={() => setViewRootId(sib.id)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-slate-600 font-medium"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>See {sib.name}'s Family <ArrowRight size={14} /></button>))}</div>)}
                  <TreeBranch person={currentRoot} allMembers={familyMembers} onSelect={onSelect} />
              </div>
          </div>
        </div>
    );
};

const ScrapbookItem = ({ item, onClick }: any) => {
    const isRecent = new Date().getFullYear() - item.year <= 5;
    if (item.type === 'headline' || item.category === 'world') {
        return (
            <div onClick={() => onClick(item)} className="group cursor-pointer transform hover:-rotate-1 transition-transform duration-300 w-full mb-6">
                <div className="bg-stone-100 p-4 border-b-4 border-r-4 border-stone-300 rounded-sm shadow-md border-t border-l border-stone-200">
                    <div className="flex justify-between items-center border-b-2 border-stone-800 pb-2 mb-2"><span className="font-serif font-bold text-3xl text-stone-900">{item.year}</span><div className="bg-stone-800 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-widest">Headline</div></div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 leading-none mb-2">{item.title}</h3>
                    <p className="font-serif text-stone-600 text-sm italic border-l-4 border-stone-300 pl-3">{item.description}</p>
                </div>
            </div>
        );
    }
    if (item.type === 'photo' || (item.image && item.category === 'family')) {
        return (
            <div onClick={() => onClick(item)} className="group cursor-pointer transform hover:rotate-1 transition-transform duration-300 w-full mb-8 flex justify-center">
                <div className="bg-white p-3 pb-12 shadow-xl rotate-1 border border-slate-100 max-w-sm w-full relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-200/50 backdrop-blur-sm rotate-1 shadow-sm"></div>
                    <div className="aspect-square bg-slate-100 mb-4 overflow-hidden border border-slate-200">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.title} /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={48}/></div>}
                    </div>
                    <div className="text-center"><h3 className="font-handwriting text-slate-800 font-bold text-xl rotate-1">{item.title}</h3><p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{item.year}</p></div>
                </div>
            </div>
        );
    }
    return (
        <div onClick={() => onClick(item)} className={`group relative flex gap-6 pb-12 cursor-pointer animate-in slide-in-from-bottom-2 duration-500 ${isRecent ? 'scale-105 origin-left' : ''}`}>
            <div className="absolute left-6 top-10 bottom-0 w-1 bg-gray-200 group-hover:bg-gray-300 transition-colors" />
            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl ${item.color || getCategoryStyles(item.category).color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {ICON_MAP[item.icon] || ICON_MAP[getCategoryStyles(item.category).icon]}
            </div>
            <div className={`flex-grow bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent group-hover:border-indigo-100 group-hover:shadow-md transition-all ${isRecent ? 'border-l-8 border-l-indigo-400' : ''}`}>
                <div className="flex justify-between items-start"><div className="flex flex-col"><span className="font-bold text-2xl text-slate-800 flex items-baseline gap-2">{item.year}</span><span className={`text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400`}>{item.category || 'Memory'}</span></div></div>
                <h3 className="text-xl font-bold text-gray-800 mt-2">{item.title}</h3>
                {item.location && <div className="flex items-center gap-1 mt-2 text-gray-400 text-sm"><MapPin size={14} />{item.location}</div>}
            </div>
        </div>
    );
};

const TimelineZoomControls = ({ zoom, setZoom }: any) => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-end">
                <div><h3 className="text-lg font-bold text-slate-800">Timeline View</h3><p className="text-sm text-slate-500">{zoom === 0 ? 'Eras Overview' : zoom === 1 ? 'Yearly Highlights' : 'Detailed Moments'}</p></div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setZoom(0)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${zoom === 0 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Eras</button>
                    <button onClick={() => setZoom(1)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${zoom === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Years</button>
                    <button onClick={() => setZoom(2)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${zoom === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Moments</button>
                </div>
            </div>
            <input type="range" min="0" max="2" step="1" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>
    );
};

const TimelineEraView = ({ events, onSelectEra }: any) => {
    const decades = events.reduce((acc: any, event: any) => {
        const decade = Math.floor(event.year / 10) * 10;
        if (!acc[decade]) acc[decade] = { year: decade, count: 0, images: [] };
        acc[decade].count++;
        if (event.image && acc[decade].images.length < 3) acc[decade].images.push(event.image);
        return acc;
    }, {});
    const sortedDecades = Object.values(decades).sort((a: any,b: any) => a.year - b.year);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedDecades.map((d: any) => (
                <button key={d.year} onClick={() => onSelectEra(d.year)} className="bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-indigo-200 hover:shadow-xl transition-all text-left group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-slate-900 font-black text-6xl">{d.year}s</div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{d.year}s</h3>
                    <p className="text-indigo-500 font-medium mb-4">{d.count} Memories</p>
                    <div className="flex -space-x-3">{d.images.map((img: string, i: number) => (<div key={i} className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden"><img src={img} className="w-full h-full object-cover" /></div>))}{d.count > 0 && <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">View</div>}</div>
                </button>
            ))}
        </div>
    );
};

const TimelineYearView = ({ events, onSelectEvent }: any) => {
    const sortedEvents = [...events].sort((a: any, b: any) => a.year - b.year);
    return (
        <div className="space-y-4 relative border-l-2 border-slate-200 ml-4 pl-8 py-2">
            {sortedEvents.map((item: any, index: number) => {
                 const styles = getCategoryStyles(item.category);
                 return (
                    <div key={index} onClick={() => onSelectEvent(item)} className="relative flex items-center gap-4 cursor-pointer group">
                        <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${styles.bg} ${styles.text}`}><div className={`w-full h-full rounded-full ${styles.color}`}></div></div>
                        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-4">
                             <div className={`font-bold text-xl ${styles.text}`}>{item.year}</div>
                             <div className="h-8 w-px bg-slate-100"></div>
                             <div><h4 className="font-bold text-slate-700">{item.title}</h4><span className="text-xs text-slate-400 uppercase tracking-wide">{item.category}</span></div>
                             {item.image && <div className="ml-auto w-10 h-10 rounded-lg overflow-hidden"><img src={item.image} className="w-full h-full object-cover"/></div>}
                        </div>
                    </div>
                 );
            })}
        </div>
    );
}

const TimelineScrapbookView = ({ events, onSelectEvent }: any) => {
    const sortedEvents = [...events].sort((a: any, b: any) => a.year - b.year);
    return <div className="max-w-2xl space-y-8">{sortedEvents.map((item: any, index: number) => <ScrapbookItem key={index} item={item} onClick={onSelectEvent} />)}</div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [storageRefState, setStorageRefState] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [appId, setAppId] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedHome, setSelectedHome] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoom, setZoom] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const scrollContainerRef = useRef<any>(null);
  const [galleryViewYear, setGalleryViewYear] = useState<string | number | null>(null);

  const [editModalConfig, setEditModalConfig] = useState<any>({ isOpen: false, title: '', fields: [], onSave: () => {} });
  const [confirmModalConfig, setConfirmModalConfig] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  // INITIALIZE WITH DEFAULT FAMILY TO PREVENT BLANK SCREEN
  const [familyMembers, setFamilyMembers] = useState<any[]>(DEFAULT_FAMILY); 
  const [friends, setFriends] = useState<any[]>([]);
  const [homes, setHomes] = useState<any[]>([]);
  const [profile, setProfile] = useState({ name: "Jackie Johnston", details: "Born 1954 • Avid Gardener • Cake Baker" });
  const [quickPrompt, setQuickPrompt] = useState({ text: "Your grandson Ben loves dinosaurs. He is coming to visit this Sunday." });
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);
  
  const [viewRootId, setViewRootId] = useState('jackie');
  const [timelineZoom, setTimelineZoom] = useState(2);
  const startYear = 1950; 
  const endYear = new Date().getFullYear() + 1;
  const [filters, setFilters] = useState({ family: true, work: true, world: true, birthday: true });

  const toggleFilter = (key: any) => { setFilters((prev: any) => ({ ...prev, [key]: !prev[key] })); };
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState("");

  // Calculate timeline data at the top so it's available
  const birthdayEvents = familyMembers.filter(m => m.dob).map(m => ({ 
      id: `bd-${m.id}`, 
      year: parseInt(m.dob.split('-')[0] || m.dob), 
      title: `${m.name} born`, 
      category: 'birthday', 
      icon: 'cake', 
      color: 'bg-rose-300', 
      description: `Birthday of ${m.name}.`, 
      location: 'Family', 
      type: 'memory',
      image: m.image || "" // Inherit image from person
  }));
  const allTimelineEvents = [...timelineEvents, ...birthdayEvents];
  const sortedTimeline = allTimelineEvents.filter(item => filters[item.category as keyof typeof filters]).filter(item => item.year >= startYear && item.year <= endYear).sort((a, b) => a.year - b.year);
  const filteredJournal = journalEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const getGreeting = () => { const hour = new Date().getHours(); if (hour < 12) return "Good Morning"; if (hour < 18) return "Good Afternoon"; return "Good Evening"; };

  useEffect(() => {
    const storedAuth = localStorage.getItem('familyAuth');
    if (storedAuth === 'true') setIsAuthenticated(true);

    const initFirebase = async () => {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const dbInstance = getFirestore(app);
        const storageInstance = getStorage(app);
        
        setDb(dbInstance);
        setStorageRefState(storageInstance);
        const currentAppId = "jackie-family-app-001";
        setAppId(currentAppId);

        try {
             await signInAnonymously(auth);
        } catch (error) {
            console.error("Auth Error:", error);
        }
        
        onAuthStateChanged(auth, (u: any) => setUser(u));
    };
    initFirebase();
  }, []);

  useEffect(() => {
      const timer = setInterval(() => setCurrentDate(new Date()), 60000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (!db || !user) return;
      const dataPath = `artifacts/${appId}/public/data`;

      const unsubMeta = onSnapshot(doc(db, `${dataPath}/metadata`, 'settings'), (docSnap: any) => {
            if (docSnap.exists()) setAppSettings(docSnap.data() as any);
            else setDoc(doc(db, `${dataPath}/metadata`, 'settings'), DEFAULT_SETTINGS);
      }, (err: any) => console.log("Waiting for permissions...", err.code));

      const unsubFamily = onSnapshot(collection(db, `${dataPath}/familyMembers`), (snap: any) => {
        const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })); 
        if (data.length > 0) {
            const merged = DEFAULT_FAMILY.map(def => {
                const found = data.find((d: any) => d.id === def.id);
                return found ? { ...def, ...found } : def;
            });
            setFamilyMembers(merged);
        }
      }, (err: any) => console.log("Using default family data due to:", err.code));
      
      const unsubTimeline = onSnapshot(collection(db, `${dataPath}/timelineEvents`), (snap: any) => {
            const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
            if (data.length > 0) setTimelineEvents(data);
            else if (snap.empty) DEFAULT_TIMELINE.forEach(async (m) => await setDoc(doc(db, `${dataPath}/timelineEvents`, String(m.year + m.title)), m));
      }, (err: any) => console.log("Waiting for permissions...", err.code));
      
      const unsubFriends = onSnapshot(collection(db, `${dataPath}/friends`), (snap: any) => { const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })); if (data.length > 0) setFriends(data); else if(snap.empty) DEFAULT_FRIENDS.forEach(async (m, i) => await setDoc(doc(db, `${dataPath}/friends`, String(i)), m)); }, (err: any) => console.log("Waiting for permissions...", err.code));
      const unsubHomes = onSnapshot(collection(db, `${dataPath}/homes`), (snap: any) => { const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })); if (data.length > 0) setHomes(data); else if(snap.empty) DEFAULT_HOMES.forEach(async (m) => await setDoc(doc(db, `${dataPath}/homes`, m.id), m)); }, (err: any) => console.log("Waiting for permissions...", err.code));
      const unsubJournal = onSnapshot(collection(db, `${dataPath}/journal`), (snap: any) => { const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })); if (data.length > 0) setJournalEntries(data); else if(snap.empty) DEFAULT_JOURNAL.forEach(async (m) => await setDoc(doc(db, `${dataPath}/journal`, String(m.id)), m)); }, (err: any) => console.log("Waiting for permissions...", err.code));
      const unsubAlbums = onSnapshot(collection(db, `${dataPath}/albums`), (snap: any) => { const data = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })); if (data.length > 0) setAlbums(data); else if(snap.empty) DEFAULT_ALBUMS.forEach(async (m) => await setDoc(doc(db, `${dataPath}/albums`, String(m.id)), m)); }, (err: any) => console.log("Waiting for permissions...", err.code));
      const unsubProfile = onSnapshot(collection(db, `${dataPath}/metadata`), (snap: any) => { snap.docs.forEach((d: any) => { if (d.id === 'profile') setProfile(d.data() as any); if (d.id === 'quickPrompt') setQuickPrompt(d.data() as any); }); }, (err: any) => console.log("Waiting for permissions...", err.code));

      return () => {
          unsubMeta();
          unsubFamily();
          unsubTimeline();
          unsubFriends();
          unsubHomes();
          unsubJournal();
          unsubAlbums();
          unsubProfile();
      };
  }, [db, user, appId]);

  const dbUpdate = async (collectionName: string, id: string|number, data: any) => { 
      if (!db) return; 
      // Clean data to remove undefined values
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, String(id)), cleanData); 
  };
  const dbDelete = async (collectionName: string, id: string|number) => { if (!db) return; await deleteDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, String(id))); };
  const handleUpload = async (file: any) => { if (!storageRefState) return ""; const storageRef = ref(storageRefState, 'images/' + file.name + '_' + Date.now()); await uploadBytes(storageRef, file); return await getDownloadURL(storageRef); };

  const handleAdminClick = () => { isEditMode ? setIsEditMode(false) : setIsPinModalOpen(true); };
  const handleLogout = () => { setIsEditMode(false); setIsAuthenticated(false); localStorage.removeItem('familyAuth'); };
  const handleFamilyLogin = () => { setIsAuthenticated(true); localStorage.setItem('familyAuth', 'true'); };
  const closeModals = () => { setSelectedEvent(null); setSelectedPerson(null); setSelectedHome(null); };
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setZoom(0.9);
  const handleUpdateSettings = () => { const fields = [{ name: "siteTitle", label: "Site Title", value: appSettings.siteTitle }, { name: "familyPin", label: "Family PIN", value: appSettings.familyPin }, { name: "adminPin", label: "Admin PIN", value: appSettings.adminPin }]; setEditModalConfig({ isOpen: true, title: "Settings", fields, onSave: (data: any) => { dbUpdate('metadata', 'settings', data); setEditModalConfig((p: any) => ({...p, isOpen:false})); } }); };

  const handleAddEvent = () => { 
      const fields = [
          { name: "title", label: "Title", value: "" }, 
          { name: "year", label: "Year", value: "" }, 
          { name: "description", label: "Desc", value: "", type: "textarea" }, 
          { name: "location", label: "Loc", value: "" },
          { name: "type", label: "Style", value: "memory", type: "select", options: [{value: 'memory', label: 'Standard Card'}, {value: 'headline', label: 'Headline Style'}, {value: 'photo', label: 'Polaroid Photo'}] },
          { name: "category", label: "Category", value: "family", type: "select", options: [{value: 'family', label: 'Family'}, {value: 'work', label: 'Work'}, {value: 'world', label: 'World'}, {value: 'birthday', label: 'Birthday'}] },
          { name: "image", label: "Image", value: "", type: "file" }
      ];
      setEditModalConfig({ isOpen: true, title: "Add Event", fields, onSave: (data: any) => {
          const id = Date.now();
          const styles = getCategoryStyles(data.category || 'family');
          const newEvent = { id, ...styles, ...data }; 
          dbUpdate('timelineEvents', id, newEvent);
          // Optimistic update
          setTimelineEvents(prev => [...prev, newEvent]);
          setEditModalConfig((prev: any) => ({...prev, isOpen: false}));
      }, onUpload: handleUpload });
  };

  const handleEditProfile = (e: any) => { e.stopPropagation(); setEditModalConfig({isOpen: true, title: "Edit Profile", fields: [{ name: "name", label: "Name", value: profile.name }, { name: "details", label: "Details", value: profile.details }], onSave: (data: any) => { dbUpdate('metadata', 'profile', data); setEditModalConfig((p: any) => ({...p, isOpen:false})); }}); };
  const handleEditPrompt = (e: any) => { e.stopPropagation(); setEditModalConfig({isOpen: true, title: "Edit Reminder", fields: [{ name: "text", label: "Text", value: quickPrompt.text, type: "textarea" }], onSave: (data: any) => { dbUpdate('metadata', 'quickPrompt', data); setEditModalConfig((p: any) => ({...p, isOpen:false})); }}); };
  
  const handleEditEvent = (e: any) => { 
      e.stopPropagation(); 
      const fields = [{ name: "title", label: "Title", value: selectedEvent.title }, { name: "year", label: "Year", value: selectedEvent.year }, { name: "description", label: "Desc", value: selectedEvent.description, type: "textarea" }, { name: "location", label: "Loc", value: selectedEvent.location }, { name: "type", label: "Style", value: selectedEvent.type, type: "select", options: [{value: 'memory', label: 'Standard Card'}, {value: 'headline', label: 'Headline Style'}, {value: 'photo', label: 'Polaroid Photo'}] }, { name: "image", label: "Image", value: selectedEvent.image, type: "file" }]; 
      setEditModalConfig({ isOpen: true, title: "Edit Event", fields, onSave: (data: any) => { 
          const styles = getCategoryStyles(data.category || selectedEvent.category); 
          const updated = { ...selectedEvent, ...data, ...styles }; 
          dbUpdate('timelineEvents', selectedEvent.id, updated); 
          // Optimistic update
          setTimelineEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? updated : ev));
          setSelectedEvent(updated); 
          setEditModalConfig((p: any) => ({...p, isOpen:false})); 
      }, onUpload: handleUpload }); 
  };

  const handleDeleteEvent = (e: any) => { 
      e.stopPropagation(); 
      setConfirmModalConfig({isOpen: true, title: "Delete", message: "Delete event?", onConfirm: () => { 
          if (selectedEvent && selectedEvent.id) {
             dbDelete('timelineEvents', selectedEvent.id); 
             // Optimistic update
             setTimelineEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
             setSelectedEvent(null); 
             setConfirmModalConfig((p: any) => ({...p, isOpen:false})); 
          }
      }}); 
  };
  
  const handleAddFriend = () => { const id = Date.now(); dbUpdate('friends', id, { id, name: "New Friend", metAt: "Loc", frequency: "Often", role: "Friend", color: "bg-indigo-500", details: "...", memories: [] }); };
  
  const handleSelectFriend = (friend: any) => { setSelectedPerson(friend); };

  const startEditPerson = () => { 
      if (selectedPerson.hasOwnProperty('generation')) { 
          // It's family
          const fields = [{ name: "name", label: "Name", value: selectedPerson.name }, { name: "relation", label: "Relation", value: selectedPerson.relation }, { name: "dob", label: "DOB", value: selectedPerson.dob }, { name: "image", label: "Photo", value: selectedPerson.image, type: "file" }, { name: "details", label: "Details", value: selectedPerson.details, type: "textarea" }]; 
          setEditModalConfig({ isOpen: true, title: "Edit Member", fields, onSave: (data: any) => { const updated = { ...selectedPerson, ...data }; dbUpdate('familyMembers', selectedPerson.id, updated); setSelectedPerson(updated); setEditModalConfig((p: any) => ({...p, isOpen:false})); }, onUpload: handleUpload }); 
      } else { 
          // It's a friend
          const fields = [{ name: "name", label: "Name", value: selectedPerson.name }, { name: "metAt", label: "Met At", value: selectedPerson.metAt }, { name: "frequency", label: "Freq", value: selectedPerson.frequency }, { name: "image", label: "Photo", value: selectedPerson.image, type: "file" }, { name: "details", label: "Details", value: selectedPerson.details, type: "textarea" }]; 
          setEditModalConfig({ isOpen: true, title: "Edit Friend", fields, onSave: (data: any) => { const updated = { ...selectedPerson, ...data }; dbUpdate('friends', selectedPerson.id, updated); setSelectedPerson(updated); setEditModalConfig((p: any) => ({...p, isOpen:false})); }, onUpload: handleUpload }); 
      } 
  };

  const handleDeletePersonAny = () => { if (selectedPerson.hasOwnProperty('generation')) { alert("Family structure is fixed."); } else { setConfirmModalConfig({ isOpen: true, title: "Delete", message: "Remove friend?", onConfirm: () => { dbDelete('friends', selectedPerson.id); setSelectedPerson(null); setConfirmModalConfig((p: any) => ({...p, isOpen:false})); }}); } };
  const handleAddHome = () => { const fields = [{ name: "name", label: "Name", value: "" }, { name: "address", label: "Address", value: "" }, { name: "years", label: "Years", value: "" }, { name: "image", label: "Photo", value: "", type: "file" }]; setEditModalConfig({ isOpen: true, title: "Add Home", fields, onSave: (data: any) => { const id = Date.now(); const newHome = { id, color: "bg-indigo-500", description: "...", features: [], rooms: [], ...data }; dbUpdate('homes', id, newHome); setEditModalConfig((p: any) => ({...p, isOpen:false})); }, onUpload: handleUpload }); };
  const handleEditHome = () => { const fields = [{ name: "name", label: "Name", value: selectedHome.name }, { name: "address", label: "Address", value: selectedHome.address }, { name: "years", label: "Years", value: selectedHome.years }, { name: "description", label: "Description", value: selectedHome.description, type: "textarea" }, { name: "image", label: "Photo", value: selectedHome.image, type: "file" }]; setEditModalConfig({ isOpen: true, title: "Edit Home", fields, onSave: (data: any) => { const updatedHome = { ...selectedHome, ...data }; dbUpdate('homes', selectedHome.id, updatedHome); setSelectedHome(updatedHome); setEditModalConfig((p: any) => ({...p, isOpen:false})); }, onUpload: handleUpload }); };
  const handleAddRoom = () => { const fields = [{name: "name", label: "Room Name", value: ""}, {name: "desc", label: "Desc", value: "", type: "textarea"}, {name: "image", label: "Photo", value: "", type: "file"}]; setEditModalConfig({ isOpen: true, title: "Add Room", fields, onSave: (data: any) => { const newRoom = { name: data.name, desc: data.desc, image: data.image, color: "bg-indigo-100" }; const updatedHome = { ...selectedHome, rooms: [...(selectedHome.rooms || []), newRoom] }; dbUpdate('homes', selectedHome.id, updatedHome); setSelectedHome(updatedHome); setEditModalConfig((p: any) => ({...p, isOpen:false})); }, onUpload: handleUpload }); };
  const handleDeleteRoom = (index: number) => { setConfirmModalConfig({ isOpen: true, title: "Delete Room", message: "Delete?", onConfirm: () => { const updatedRooms = selectedHome.rooms.filter((_: any, i: number) => i !== index); const updatedHome = { ...selectedHome, rooms: updatedRooms }; dbUpdate('homes', selectedHome.id, updatedHome); setSelectedHome(updatedHome); setConfirmModalConfig((p: any) => ({...p, isOpen:false})); }}); };
  const handleAddAlbum = () => { 
      const fields = [
          { name: "title", label: "Album Title", value: "" },
          { name: "month", label: "Month", value: "", type: "select", options: MONTH_OPTIONS },
          { name: "year", label: "Year", value: "" },
          { name: "link", label: "Google Photos Link", value: "" },
          { name: "coverImage", label: "Cover Photo", value: "", type: "file" }
      ];
      setEditModalConfig({
          isOpen: true,
          title: "Add Album",
          fields,
          onSave: (data: any) => {
              const id = Date.now();
              const subtitle = data.month && data.year ? `${data.month} ${data.year}` : data.year ? `${data.year}` : '';
              const newAlbum = { id, color: "bg-slate-400", ...data, subtitle };
              dbUpdate('albums', id, newAlbum);
              setEditModalConfig((prev: any) => ({...prev, isOpen: false}));
          },
          onUpload: handleUpload
      });
  };
  const handleEditAlbum = (e: any, id: string|number) => {
    e.stopPropagation();
    e.preventDefault();
    const album = albums.find(a => a.id === id);
    const fields = [
        { name: "title", label: "Album Title", value: album.title },
        { name: "month", label: "Month", value: album.month || "", type: "select", options: MONTH_OPTIONS },
        { name: "year", label: "Year", value: album.year || "" },
        { name: "link", label: "Link", value: album.link },
        { name: "coverImage", label: "Cover Photo", value: album.coverImage, type: "file" }
    ];
    setEditModalConfig({
        isOpen: true,
        title: "Edit Album",
        fields,
        onSave: (data: any) => {
            const subtitle = data.month && data.year ? `${data.month} ${data.year}` : data.year ? `${data.year}` : '';
            dbUpdate('albums', id, { ...album, ...data, subtitle });
            setEditModalConfig((p: any) => ({...p, isOpen:false}));
        },
        onUpload: handleUpload
    });
  };
  const handleDeleteAlbum = (e: any, id: string|number) => { e.stopPropagation(); e.preventDefault(); setConfirmModalConfig({ isOpen: true, title: "Delete", message: "Delete?", onConfirm: () => { dbDelete('albums', id); setConfirmModalConfig((p: any) => ({...p, isOpen:false})); }}); };
  const saveNewEntry = () => { if (!newEntryContent.trim()) return; const id = Date.now(); const newEntry = { id, date: new Date().toISOString(), content: newEntryContent, mood: "Neutral" }; dbUpdate('journal', id, newEntry); setIsCreatingEntry(false); setNewEntryContent(""); };
  const deleteEntry = (id: string|number) => { 
      setConfirmModalConfig({
          isOpen: true, 
          title: "Delete Entry", 
          message: "Are you sure you want to delete this journal entry?", 
          onConfirm: () => { 
              dbDelete('journal', id); 
              setConfirmModalConfig((prev: any) => ({...prev, isOpen: false}));
          }
      }); 
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleFamilyLogin} correctPin={appSettings.familyPin} />;

  // Group Albums by Year
  const albumsByYear = albums.reduce((acc: any, album: any) => {
      const year = album.year || 'Undated';
      if (!acc[year]) acc[year] = [];
      acc[year].push(album);
      return acc;
  }, {});
  
  // Sort years descending
  const sortedAlbumYears = Object.keys(albumsByYear).sort((a: any, b: any) => {
      if(a === 'Undated') return 1;
      if(b === 'Undated') return -1;
      return b - a;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 md:pb-0 md:pl-20">
      <EditorModal isOpen={editModalConfig.isOpen} title={editModalConfig.title} fields={editModalConfig.fields} onSave={editModalConfig.onSave} onClose={() => setEditModalConfig((prev: any) => ({...prev, isOpen: false}))} onUpload={handleUpload} />
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onClose={() => setConfirmModalConfig((prev: any) => ({...prev, isOpen: false}))} />
      <PinModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} onSuccess={() => setIsEditMode(true)} correctPin={appSettings.adminPin} />
      
      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-200 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-sm"><X size={24}/></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
                <button onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Home size={32} className="text-indigo-600"/><span className="font-bold text-slate-700">Home</span></button>
                <button onClick={() => { setActiveTab('timeline'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Calendar size={32} className="text-blue-600"/><span className="font-bold text-slate-700">Timeline</span></button>
                <button onClick={() => { setActiveTab('family'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Users size={32} className="text-pink-500"/><span className="font-bold text-slate-700">Family</span></button>
                <button onClick={() => { setActiveTab('gallery'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><ImageIcon size={32} className="text-purple-500"/><span className="font-bold text-slate-700">Gallery</span></button>
                <button onClick={() => { setActiveTab('friends'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Smile size={32} className="text-yellow-500"/><span className="font-bold text-slate-700">Friends</span></button>
                <button onClick={() => { setActiveTab('houses'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Armchair size={32} className="text-orange-500"/><span className="font-bold text-slate-700">Homes</span></button>
                <button onClick={() => { setActiveTab('journal'); setIsMobileMenuOpen(false); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Book size={32} className="text-emerald-500"/><span className="font-bold text-slate-700">Journal</span></button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleAdminClick(); }} className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-transparent active:border-indigo-500"><Settings size={32} className="text-slate-400"/><span className="font-bold text-slate-700">Admin</span></button>
            </div>
        </div>
      )}

      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-200 flex-col items-center py-6 z-40 overflow-y-auto no-scrollbar">
         <div className="flex flex-col items-center w-full gap-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white mb-4"><Heart size={24} /></div>
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Home" />
            <NavButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<Calendar />} label="Timeline" />
            <NavButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={<Users />} label="Family" />
            <NavButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={<Smile />} label="Friends" />
            <NavButton active={activeTab === 'houses'} onClick={() => setActiveTab('houses')} icon={<Armchair />} label="Homes" />
            <NavButton active={activeTab === 'journal'} onClick={() => setActiveTab('journal')} icon={<Book />} label="Journal" />
            <NavButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon />} label="Gallery" />
         </div>
         <div className="flex flex-col gap-4 mt-auto pb-4">
             {isEditMode && <button onClick={handleUpdateSettings} className="p-3 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100" title="Settings"><Settings size={20} /></button>}
             <button onClick={handleAdminClick} className={`p-3 rounded-full ${isEditMode ? 'bg-red-100 text-red-600' : 'text-slate-300'}`} title="Admin Mode">{isEditMode ? <Unlock size={20} /> : <Lock size={20} />}</button>
             <button onClick={handleLogout} className="p-3 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 mb-4" title="Logout"><LogOut size={20} /></button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-40">
        <NavButtonMobile active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Home" />
        <NavButtonMobile active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={<Users />} label="Family" />
        <NavButtonMobile active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon />} label="Gallery" />
        <NavButtonMobile active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<Calendar />} label="Timeline" />
        <button onClick={() => setIsMobileMenuOpen(true)} className={`flex flex-col items-center gap-1 p-2 min-w-[64px] text-slate-400`}><div><Menu size={20} /></div><span className="text-[10px]">Menu</span></button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
               <p className="text-slate-500 font-medium">{currentDate.toDateString()}</p>
               <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mt-1">{getGreeting()}, <span className="text-indigo-600">{profile.name.split(' ')[0]}.</span></h1>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                  {isEditMode && <button onClick={handleEditProfile} className="absolute top-3 right-3 bg-white/20 p-1.5 rounded-full"><Edit2 size={14}/></button>}
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mb-4">👩‍🦳</div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="opacity-90">{profile.details}</p>
               </div>
               <div className="relative bg-amber-100 rounded-2xl p-6 text-amber-900 shadow-sm cursor-pointer hover:bg-amber-200 transition-colors" onClick={() => setActiveTab('family')}>
                  {isEditMode && <button onClick={handleEditPrompt} className="absolute top-3 right-3 bg-white/40 p-1.5 rounded-full"><Edit2 size={14}/></button>}
                  <div className="flex items-center gap-2 mb-2 font-bold text-amber-700"><Sun size={20}/> REMEMBER THIS?</div>
                  <p className="text-lg font-medium leading-snug">"{quickPrompt.text}"</p>
               </div>
            </div>
            <div className="text-center text-slate-300 text-xs mt-12">Version 1.10 - Mobile Menu</div>
          </div>
        )}

        {activeTab === 'timeline' && (
            <div className="animate-in fade-in">
                <header className="mb-6 flex justify-between items-start">
                    <h2 className="text-4xl font-bold text-slate-800">Life Journey</h2>
                    {isEditMode && <button onClick={handleAddEvent} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Add Event</button>}
                </header>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                   <TimelineZoomControls zoom={timelineZoom} setZoom={setTimelineZoom} />
                </div>

                <div className="flex flex-wrap gap-3 pb-4 mb-4">
                   <FilterToggle label="Family & Home" icon={<Heart />} active={filters.family} onClick={() => toggleFilter('family')} colorClass="bg-pink-500" />
                   <FilterToggle label="Work & Career" icon={<Briefcase />} active={filters.work} onClick={() => toggleFilter('work')} colorClass="bg-blue-600" />
                   <FilterToggle label="World Events" icon={<Globe />} active={filters.world} onClick={() => toggleFilter('world')} colorClass="bg-slate-600" />
                   <FilterToggle label="Birthdays" icon={<Cake />} active={filters.birthday} onClick={() => toggleFilter('birthday')} colorClass="bg-rose-400" />
                </div>

                <div className="max-w-2xl space-y-4">
                    {timelineZoom === 0 && <TimelineEraView events={sortedTimeline} onSelectEra={() => setTimelineZoom(1)} />}
                    {timelineZoom === 1 && <TimelineYearView events={sortedTimeline} onSelectEvent={setSelectedEvent} />}
                    {timelineZoom === 2 && <TimelineScrapbookView events={sortedTimeline} onSelectEvent={setSelectedEvent} />}
                </div>
            </div>
        )}

        {activeTab === 'family' && (
            <FamilyTreeView familyMembers={familyMembers} viewRootId={viewRootId} setViewRootId={setViewRootId} onSelect={setSelectedPerson} zoom={zoom} scrollContainerRef={scrollContainerRef} handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} handleResetZoom={handleResetZoom} isEditMode={isEditMode} />
        )}

        {/* ... Other tabs (Gallery, Friends, Houses, Journal) ... */}
        {activeTab === 'gallery' && (
            <div>
                <header className="mb-10 flex justify-between items-center">
                    {galleryViewYear ? (
                        <div className="flex items-center gap-4">
                            <button onClick={() => setGalleryViewYear(null)} className="bg-white p-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50">
                                <ArrowLeft size={24} className="text-slate-600"/>
                            </button>
                            <h2 className="text-4xl font-bold text-slate-800">{galleryViewYear} Gallery</h2>
                        </div>
                    ) : (
                        <h2 className="text-4xl font-bold text-slate-800">Gallery</h2>
                    )}
                    
                    {isEditMode && <button onClick={handleAddAlbum} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Add Album</button>}
                </header>

                {!galleryViewYear ? (
                    // YEAR TILES VIEW
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 animate-in fade-in">
                        {sortedAlbumYears.map((year: any) => {
                            const yearAlbums = albumsByYear[year];
                            
                            return (
                                <button 
                                    key={year} 
                                    onClick={() => setGalleryViewYear(year)}
                                    className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white border border-slate-200 flex flex-col items-center justify-center p-4 hover:border-indigo-300"
                                >
                                    <span className="block text-3xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{year}</span>
                                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wide mt-1">{yearAlbums.length} {yearAlbums.length === 1 ? 'Album' : 'Albums'}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    // ALBUMS FOR SELECTED YEAR VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                        {albumsByYear[galleryViewYear]?.map((album: any) => (
                            <a key={album.id} href={album.link} target="_blank" rel="noreferrer" className="block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow relative">
                                <div className="aspect-video relative overflow-hidden">
                                    {album.coverImage ? <img src={album.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className={`w-full h-full ${album.color}`}></div>}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-xl">{album.title}</h3>
                                    {album.subtitle && <p className="text-slate-500 text-sm mt-1 font-medium">{album.subtitle}</p>}
                                    <div className="mt-2 flex justify-end">
                                        {isEditMode && <button onClick={(e) => handleEditAlbum(e, album.id)} className="bg-indigo-50 text-indigo-600 p-2 rounded-full mr-2 hover:bg-indigo-100"><Edit2 size={16}/></button>}
                                        {isEditMode && <button onClick={(e) => handleDeleteAlbum(e, album.id)} className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>}
                                    </div>
                                </div>
                            </a>
                        ))}
                        {albumsByYear[galleryViewYear]?.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-400">No albums found for this year.</div>
                        )}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'friends' && (
             <div>
                <header className="mb-10 flex justify-between">
                    <h2 className="text-4xl font-bold text-slate-800">Friends</h2>
                    {isEditMode && <button onClick={handleAddFriend} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Add Friend</button>}
                </header>
                <div className="grid grid-cols-1 gap-4">
                    {friends.map(friend => (<FriendCard key={friend.id} friend={friend} onClick={handleSelectFriend} />))}
                </div>
             </div>
        )}

        {activeTab === 'houses' && (
            <div>
                <header className="mb-10 flex justify-between">
                    <h2 className="text-4xl font-bold text-slate-800">Homes</h2>
                    {isEditMode && <button onClick={handleAddHome} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Add Home</button>}
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {homes.map((home, index) => (<HomeCard key={index} home={home} onClick={setSelectedHome} />))}
                </div>
            </div>
        )}

        {activeTab === 'journal' && (
             <div className="space-y-4">
                 <header className="mb-6"><h2 className="text-4xl font-bold text-slate-800">Journal</h2></header>
                 <div className="flex gap-2 mb-4"><button onClick={() => setIsCreatingEntry(!isCreatingEntry)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Write Entry</button></div>
                 {isCreatingEntry && <div className="bg-white p-4 rounded-xl shadow-lg"><textarea value={newEntryContent} onChange={(e) => setNewEntryContent(e.target.value)} className="w-full p-3 border rounded-xl mb-3" placeholder="What happened today?" /><button onClick={saveNewEntry} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Save</button></div>}
                 {filteredJournal.map(entry => (
                     <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                         <div className="font-bold text-indigo-900 border-b pb-2 mb-2 flex justify-between"><span>{new Date(entry.date).toLocaleDateString()}</span>{isEditMode && <button onClick={() => deleteEntry(entry.id)}><Trash2 size={16} className="text-red-400"/></button>}</div>
                         <p className="text-slate-700">{entry.content}</p>
                     </div>
                 ))}
             </div>
        )}
      </main>
      
      <Modal isOpen={!!selectedPerson} onClose={closeModals}>
         {selectedPerson && (
             <div className="bg-white">
                 <div className={`h-32 ${selectedPerson.color} relative`}>
                     {isEditMode && (
                         <div className="absolute top-4 right-4 flex gap-2">
                             <button onClick={startEditPerson} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/40"><Edit2 size={18}/></button>
                             <button onClick={handleDeletePersonAny} className="bg-white/20 p-2 rounded-full text-white hover:bg-red-500"><Trash2 size={18}/></button>
                         </div>
                     )}
                     <div className="absolute -bottom-10 left-8 w-20 h-20 bg-white rounded-full p-1 shadow-lg overflow-hidden">
                         <div className={`w-full h-full rounded-full ${selectedPerson.color} flex items-center justify-center overflow-hidden`}>
                            {selectedPerson.image ? (
                                <img src={selectedPerson.image} alt={selectedPerson.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white">{selectedPerson.name.charAt(0)}</span>
                            )}
                         </div>
                     </div>
                 </div>
                 <div className="pt-12 px-8 pb-8">
                     <h2 className="text-2xl font-bold text-slate-800">{selectedPerson.name}</h2>
                     <p className="text-indigo-500 font-medium mb-4">{selectedPerson.relation}</p>
                     <div className="bg-slate-50 p-4 rounded-xl mb-4 text-slate-700">{selectedPerson.details}</div>
                 </div>
             </div>
         )}
      </Modal>

      <Modal isOpen={!!selectedEvent} onClose={closeModals}>
        {selectedEvent && (
          <div className="bg-white">
            <div className={`h-32 ${selectedEvent.color} flex items-center justify-center relative`}>
               {isEditMode && (
                  <div className="absolute top-4 right-12 flex gap-2 z-20">
                      <button onClick={handleEditEvent} className="bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm text-white"><Edit2 size={20} /></button>
                      <button onClick={handleDeleteEvent} className="bg-white/20 hover:bg-red-500/80 p-2 rounded-full backdrop-blur-sm text-white hover:text-white transition-colors"><Trash2 size={20} /></button>
                  </div>
              )}
              <div className="scale-[2.5] text-white opacity-90">
                {ICON_MAP[selectedEvent.icon] || <Heart className="w-6 h-6 text-white" />}
              </div>
            </div>
            <div className="p-8">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold uppercase tracking-wide mb-3">
                {selectedEvent.year} • {selectedEvent.category ? selectedEvent.category.toUpperCase() : 'FAMILY'}
              </span>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedEvent.title}</h2>
              <div className="flex items-center gap-2 text-slate-500 font-medium mb-6">
                 <MapPin size={18} />
                 {selectedEvent.location}
              </div>
              <p className="text-xl text-slate-700 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
