import React, { ChangeEvent } from 'react';
import { FileText, Plus, Trash2, HelpCircle, FileType } from 'lucide-react';
import { ContextFile } from '../types';

interface ContextPanelProps {
  files: ContextFile[];
  setFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
  instructions: string;
  setInstructions: (s: string) => void;
  disabled: boolean;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ 
  files, 
  setFiles, 
  instructions, 
  setInstructions,
  disabled
}) => {
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: ContextFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
        
        if (isPdf || isDocx) {
            try {
                const base64 = await fileToBase64(file);
                newFiles.push({
                    name: file.name,
                    data: base64,
                    mimeType: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    isBinary: true
                });
            } catch (err) {
                console.error("Error reading file", file.name, err);
            }
        } else {
            // Treat as text (txt, md, json, etc)
            const text = await file.text();
            newFiles.push({ 
                name: file.name, 
                data: text, 
                mimeType: 'text/plain', 
                isBinary: false 
            });
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
      if (mimeType.includes('pdf')) return <span className="text-red-400 font-bold text-[10px] uppercase">PDF</span>;
      if (mimeType.includes('word')) return <span className="text-blue-400 font-bold text-[10px] uppercase">DOCX</span>;
      return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto w-80 shrink-0">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
           <FileType className="w-5 h-5 text-brand-500" />
           Context
        </h2>
        <p className="text-xs text-gray-400">
          Upload PDF, DOCX, or Text files to give the agent context about the meeting.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Context Files
        </label>
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-800 p-2 rounded text-sm text-gray-200 border border-gray-700">
              <div className="flex items-center gap-2 overflow-hidden">
                {getFileIcon(file.mimeType)}
                <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
              </div>
              <button 
                onClick={() => removeFile(idx)} 
                disabled={disabled}
                className="text-gray-500 hover:text-red-400 disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 relative">
          <input
            type="file"
            multiple
            accept=".txt,.md,.json,.pdf,.docx"
            onChange={handleFileUpload}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <button 
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-gray-600 rounded text-gray-400 hover:text-brand-500 hover:border-brand-500 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add File</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <span>Custom Instructions</span>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
            <div className="absolute right-0 w-64 p-2 bg-gray-800 text-xs text-gray-300 rounded shadow-xl border border-gray-700 hidden group-hover:block z-50">
               Tell the agent about your role, the customer, or specific technical domains to focus on.
            </div>
          </div>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Focus on Kubernetes security features. I am a Google PSO engineer..."
          className="flex-1 w-full bg-gray-800 text-gray-200 border border-gray-700 rounded p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none disabled:opacity-50"
        />
      </div>
    </div>
  );
};