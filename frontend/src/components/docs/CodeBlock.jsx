import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#0F111A] border border-brand-border/50 my-6 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-brand-border/50">
        <span className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">{language}</span>
        <button 
          onClick={handleCopy}
          className="p-1.5 rounded-md text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300">
        <pre className="m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
