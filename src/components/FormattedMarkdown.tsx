import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface FormattedMarkdownProps {
  children: string;
  className?: string;
}

/**
 * FormattedMarkdown renders markdown content while parsing mathematical equations 
 * ($...$ for inline, $$...$$ or \[...\] for block math) using remark-math and rehype-katex.
 */
export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ children, className = "" }) => {
  if (!children) return null;

  // Pre-process text to standardize delimiters like \[...\] and \(...\) to $$...$$ and $...$ for remark-math
  const normalizedText = children
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$ $1 $$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$ $1 $');

  return (
    <div className={`markdown-body text-slate-200 text-xs sm:text-sm leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizedText}
      </Markdown>
    </div>
  );
};

export default FormattedMarkdown;
