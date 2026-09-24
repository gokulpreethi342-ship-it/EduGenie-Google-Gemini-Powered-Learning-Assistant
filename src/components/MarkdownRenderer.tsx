import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const html = useMemo(() => {
    try {
      return marked.parse(content, { gfm: true, breaks: true });
    } catch (e) {
      console.error('Error rendering markdown:', e);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-indigo max-w-none text-slate-800 leading-relaxed 
        [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-indigo-950 [&>h1]:mb-4 [&>h1]:mt-2
        [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-indigo-900 [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:border-b [&>h2]:border-indigo-100 [&>h2]:pb-1
        [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-slate-900 [&>h3]:mt-4 [&>h3]:mb-2
        [&>p]:mb-3 [&>p]:leading-relaxed
        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-1.5
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-1.5
        [&>li]:text-slate-700
        [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:bg-indigo-50/60 [&>blockquote]:px-4 [&>blockquote]:py-2 [&>blockquote]:rounded-r-lg [&>blockquote]:my-3 [&>blockquote]:italic [&>blockquote]:text-indigo-950
        [&>pre]:bg-slate-900 [&>pre]:text-indigo-200 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-3 [&>pre]:text-sm [&>pre]:font-mono
        [&>code]:bg-indigo-50 [&>code]:text-indigo-700 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>table]:text-sm
        [&>table_th]:border [&>table_th]:border-slate-200 [&>table_th]:bg-slate-100 [&>table_th]:p-2 [&>table_th]:text-left [&>table_th]:font-semibold
        [&>table_td]:border [&>table_td]:border-slate-200 [&>table_td]:p-2
        ${className}`}
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  );
};
