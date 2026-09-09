import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownContent({ content, className, isUser = false }: MarkdownContentProps) {
  if (isUser) {
    return <p className={cn('whitespace-pre-wrap leading-relaxed text-sm', className)}>{content}</p>;
  }

  // Clean leading/trailing quotes if the model wrapped the entire response in quotes
  let cleaned = content.trim();
  if (cleaned.startsWith('"{') || cleaned.startsWith('"[')) {
    // leave json alone
  } else if (
    (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) ||
    (cleaned.startsWith('\'') && cleaned.endsWith('\'') && cleaned.length > 2)
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return (
    <div className={cn('text-[13.5px] leading-relaxed text-gray-700', className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
          b: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
          h1: ({ children }) => (
            <h1 className="mt-3.5 mb-2 text-[15px] font-extrabold text-gray-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-1.5 text-[14px] font-bold text-gray-900 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2.5 mb-1 text-[13.5px] font-bold text-lacvay-green-dark first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => <hr className="my-3 border-gray-200" />,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 rounded-r-xl border-l-4 border-lacvay-green bg-lacvay-green/5 py-2 pl-3.5 pr-2.5 text-xs text-gray-700">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-[12px] font-mono font-medium text-lacvay-green-dark">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lacvay-green underline decoration-lacvay-green/30 hover:decoration-lacvay-green"
            >
              {children}
            </a>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
