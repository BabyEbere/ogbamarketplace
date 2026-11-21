'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const TINYMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || '68p6fs0nyu59icihoyv7sk06p6olzz92r68eg3heah8qx3tb';
const TINYMCE_CDN_SRC = `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/8/tinymce.min.js`;

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

// Dynamically import Editor to prevent SSR window issues
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium animate-pulse">
        Loading TinyMCE 8 Editor...
      </div>
    ),
  }
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type product details, specifications, packaging, and warranty...',
  height = 320,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium"
        style={{ height }}
      >
        Initializing rich text editor...
      </div>
    );
  }

  return (
    <div className="tinymce-wrapper w-full rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-forest-800 transition-all">
      <Editor
        apiKey={TINYMCE_API_KEY}
        tinymceScriptSrc={TINYMCE_CDN_SRC}
        value={value}
        onEditorChange={(newContent) => onChange(newContent)}
        init={{
          height: height,
          min_height: 240,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            // Free plugins baseline
            'accordion', 'advlist', 'anchor', 'autolink', 'autoresize', 'autosave',
            'charmap', 'code', 'codesample', 'directionality', 'emoticons', 'fullscreen',
            'help', 'image', 'importcss', 'insertdatetime', 'link', 'lists', 'media',
            'nonbreaking', 'pagebreak', 'preview', 'quickbars', 'save', 'searchreplace',
            'table', 'visualblocks', 'visualchars', 'wordcount',
          ],
          toolbar: 
            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
            'align lineheight | numlist bullist indent outdent | emoticons charmap | ' +
            'link image media table | removeformat | code fullscreen preview',
          content_style: 
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1E293B; }',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          elementpath: true,
          resize: true,
        }}
      />
    </div>
  );
}
