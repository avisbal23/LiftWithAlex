import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Globe, Play, FileText } from "lucide-react";

interface URLPreviewProps {
  url: string;
  className?: string;
}

interface URLMetadata {
  title?: string;
  description?: string;
  image?: string;
  domain: string;
  isYouTube: boolean;
  youtubeId?: string;
}

const extractURLMetadata = (url: string): URLMetadata => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Check if it's a YouTube URL
    const isYouTube = domain.includes('youtube.com') || domain.includes('youtu.be');
    let youtubeId = '';
    
    if (isYouTube) {
      if (domain.includes('youtu.be')) {
        youtubeId = urlObj.pathname.slice(1);
      } else {
        youtubeId = urlObj.searchParams.get('v') || '';
      }
    }
    
    return {
      domain,
      isYouTube,
      youtubeId,
    };
  } catch {
    return {
      domain: 'Unknown',
      isYouTube: false,
    };
  }
};

const getYouTubeThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const getFaviconUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

export function URLPreview({ url, className = "" }: URLPreviewProps) {
  const [metadata, setMetadata] = useState<URLMetadata | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const urlData = extractURLMetadata(url);
    setMetadata(urlData);
  }, [url]);

  if (!metadata) return null;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderIcon = () => {
    if (metadata.isYouTube) {
      return <Play className="w-5 h-5 text-red-500" />;
    }
    return <Globe className="w-5 h-5 text-blue-500" />;
  };

  const renderThumbnail = () => {
    if (metadata.isYouTube && metadata.youtubeId && !imageError) {
      return (
        <div className="relative">
          <img
            src={getYouTubeThumbnail(metadata.youtubeId)}
            alt="YouTube thumbnail"
            className="w-full h-24 object-cover rounded"
            onError={() => setImageError(true)}
            data-testid="img-youtube-thumbnail"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 text-white p-2 rounded-full">
              <Play className="w-4 h-4" fill="currentColor" />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center">
        <FileText className="w-8 h-8 text-gray-500" />
      </div>
    );
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 ${className}`}
      onClick={handleClick}
      data-testid={`card-url-preview-${metadata.domain}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-20">
            {renderThumbnail()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {renderIcon()}
              <img
                src={getFaviconUrl(metadata.domain)}
                alt="favicon"
                className="w-4 h-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {metadata.domain}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
            </div>
            
            <div className="space-y-1">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {metadata.isYouTube ? 'YouTube Video' : `Link to ${metadata.domain}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {url}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to detect URLs in text
export const detectURLs = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
};

// Helper function to render text with URL previews
export const renderTextWithURLs = (text: string) => {
  const urls = detectURLs(text);
  
  if (urls.length === 0) {
    return <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>;
  }

  // Split text and insert URL previews
  let parts = [text];
  urls.forEach(url => {
    const newParts: (string | { type: 'url'; url: string })[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const segments = part.split(url);
        for (let i = 0; i < segments.length; i++) {
          if (i > 0) {
            newParts.push({ type: 'url', url });
          }
          if (segments[i]) {
            newParts.push(segments[i]);
          }
        }
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return (
    <div className="space-y-3">
      <div>
        {parts.map((part, index) => {
          if (typeof part === 'object' && part.type === 'url') {
            return (
              <a
                key={index}
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                data-testid={`link-url-${index}`}
              >
                {part.url}
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
      
      {/* URL Preview Tiles */}
      <div className="space-y-2 mt-3">
        {urls.map((url, index) => (
          <URLPreview key={`${url}-${index}`} url={url} />
        ))}
      </div>
    </div>
  );
};