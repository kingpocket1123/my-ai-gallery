import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Tag as TagIcon, 
  X, 
  Loader2, 
  Upload,
  Filter,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryImage {
  id: number;
  image_data: string;
  prompt_original: string;
  prompt_en: string;
  prompt_zh: string;
  tags: string;
  created_at: string;
}

export default function App() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNewTag, setEditNewTag] = useState('');

  const [viewingImage, setViewingImage] = useState<GalleryImage | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const [uploadPrompt, setUploadPrompt] = useState('');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
    fetchTags();
  }, [searchQuery, selectedTag]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedTag) params.append('tag', selectedTag);
      const response = await fetch(`/api/images?${params.toString()}`);
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setAvailableTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (isEdit = false) => {
    const tag = isEdit ? editNewTag : newTag;
    const tags = isEdit ? editTags : uploadTags;
    const setTags = isEdit ? setEditTags : setUploadTags;
    const setNew = isEdit ? setEditNewTag : setNewTag;
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNew('');
    }
  };

  const handleRemoveTag = (tag: string, isEdit = false) => {
    const tags = isEdit ? editTags : uploadTags;
    const setTags = isEdit ? setEditTags : setUploadTags;
    setTags(tags.filter(t => t !== tag));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImage || !uploadPrompt) return;
    setUploading(true);
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: uploadImage, prompt: uploadPrompt, tags: uploadTags })
      });
      if (response.ok) {
        setIsUploadModalOpen(false);
        setUploadPrompt('');
        setUploadImage(null);
        setUploadTags([]);
        fetchImages();
        fetchTags();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/images/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchImages();
        fetchTags();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  const handleEditClick = (img: GalleryImage) => {
    setEditingImage(img);
    setEditPrompt(img.prompt_original);
    setEditTags(JSON.parse(img.tags || '[]'));
    setEditNewTag('');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage || !editPrompt) return;
    setUploading(true);
    try {
      const response = await fetch(`/api/images/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: editPrompt, tags: editTags })
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchImages();
        fetchTags();
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ImageIcon size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AI Prompt Gallery</h1>
          </div>
          <div className="flex-1 max-w-2xl w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search prompts or tags..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} />
            <span>Upload Art</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <Filter size={16} className="text-slate-400" />
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${!selectedTag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            All
          </button>
          {availableTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-bold">Loading masterpieces...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold">No images found. Start uploading!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <motion.div 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={img.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm group relative"
              >
                <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => setViewingImage(img)}>
                  <img src={img.image_data} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-600 line-clamp-2 font-medium mb-3">{img.prompt_original}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {JSON.parse(img.tags || '[]').slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase">{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(img.prompt_original, img.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        {copiedId === img.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <button onClick={() => handleEditClick(img)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(img.id)} className={`p-2 transition-colors ${deleteConfirmId === img.id ? 'text-red-600' : 'text-slate-400 hover:text-red-600'}`}>
                        {isDeleting === img.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Upload Creation</h2>
                <button onClick={() => setIsUploadModalOpen(false)}><X /></button>
              </div>
              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden">
                  {uploadImage ? <img src={uploadImage} className="w-full h-full object-contain" /> : <div className="text-center"><Upload className="mx-auto mb-2 text-slate-400" /><p className="text-slate-400 font-bold">Click to upload</p></div>}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                </div>
                <textarea 
                  value={uploadPrompt} 
                  onChange={(e) => setUploadPrompt(e.target.value)} 
                  placeholder="Enter AI Prompt..." 
                  className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" 
                />
                <div className="flex gap-2">
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." className="flex-1 p-3 bg-slate-100 rounded-xl outline-none" />
                  <button type="button" onClick={() => handleAddTag()} className="px-6 bg-indigo-600 text-white rounded-xl font-bold">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold flex items-center gap-1">
                      {tag} <button onClick={() => handleRemoveTag(tag)}><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <button type="submit" disabled={uploading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                  {uploading ? 'Uploading...' : 'Publish'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setViewingImage(null)}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <img src={viewingImage.image_data} className="w-full max-h-[60vh] object-contain rounded-2xl" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prompt</h3>
                <p className="text-slate-700 font-medium leading-relaxed">{viewingImage.prompt_original}</p>
              </div>
              <div className="flex gap-2">
                {JSON.parse(viewingImage.tags || '[]').map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold uppercase">{tag}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="py-8 text-center text-slate-400 font-bold text-sm">
        AI Prompt Gallery &copy; 2024
      </footer>
    </div>
  );
}
