import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ExternalLink, RotateCcw } from "lucide-react";

interface URLPreview {
  title: string;
  description: string;
  siteName: string;
  previewImage: string;
  type: string;
  url: string;
  error?: string;
}

interface FlippableCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  personalNotes?: string;
  referenceUrl?: string;
  urlPreview?: URLPreview;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlippableCard({
  id,
  name,
  imageUrl,
  personalNotes,
  referenceUrl,
  urlPreview,
  onEdit,
  onDelete
}: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="relative h-80"
      style={{ perspective: '1000px' }}
      data-testid={`card-supplement-${id}`}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-600 ${isFlipped ? '' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side - Supplement Image */}
        <div 
          className="absolute w-full h-full rounded-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Card className="h-full cursor-pointer" onClick={handleFlip}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 min-h-[200px]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    data-testid={`img-supplement-${id}`}
                  />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">💊</div>
                    <p className="text-sm">No image</p>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-lg text-center truncate" data-testid={`text-name-${id}`}>
                {name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                Click to flip for details
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Side - Personal Notes and URL Preview */}
        <div 
          className="absolute w-full h-full rounded-lg"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg truncate flex-1" data-testid={`text-back-name-${id}`}>
                  {name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlip}
                  data-testid={`button-flip-back-${id}`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                {/* Personal Notes Section */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Personal Notes
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-h-[80px]">
                    {personalNotes ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300" data-testid={`text-notes-${id}`}>
                        {personalNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No personal notes added yet
                      </p>
                    )}
                  </div>
                </div>

                {/* URL Preview Section */}
                {referenceUrl && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Reference Link
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      {urlPreview && urlPreview.title && !urlPreview.error ? (
                        <div className="space-y-2" data-testid={`url-preview-${id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {urlPreview.title}
                              </h5>
                              {urlPreview.siteName && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {urlPreview.siteName}
                                </Badge>
                              )}
                            </div>
                            {urlPreview.previewImage && (
                              <img
                                src={urlPreview.previewImage}
                                alt="Preview"
                                className="w-12 h-12 object-cover rounded ml-2"
                              />
                            )}
                          </div>
                          {urlPreview.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                            }}>
                              {urlPreview.description}
                            </p>
                          )}
                          <a
                            href={referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                            data-testid={`link-reference-${id}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Link
                          </a>
                        </div>
                      ) : (
                        <a
                          href={referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          data-testid={`link-reference-${id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {referenceUrl}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(id)}
                  className="flex-1"
                  data-testid={`button-edit-${id}`}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  data-testid={`button-delete-${id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}