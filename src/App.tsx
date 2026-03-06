import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Search, Trash2 } from 'lucide-react';

function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取图片列表
  const fetchImages = async () => {
    const res = await fetch('/api/images');
    const data = await res.json();
    setImages(data);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // 模拟上传（你可以之后再完善生成逻辑）
  const handleUpload = async () => {
    const prompt = prompt("请输入图片描述:");
    if (!prompt) return;
    
    setLoading(true);
    // 这里暂时存一张占位图，演示数据库连接
    await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data: 'https://picsum.photos/seed/ai/800/600',
        prompt: prompt
      })
    });
    setLoading(false);
    fetchImages();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="text-indigo-600" /> AI 创意画廊
        </h1>
        <button 
          onClick={handleUpload}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Upload size={20} /> {loading ? '保存中...' : '上传新作品'}
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {images.map((img: any) => (
          <div key={img.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img src={img.image_data} alt={img.prompt_zh} className="w-full h-64 object-cover" />
            <div className="p-4">
              <p className="text-gray-700">{img.prompt_original}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(img.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
