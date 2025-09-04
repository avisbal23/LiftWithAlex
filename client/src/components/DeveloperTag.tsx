import { useState } from "react";

export function DeveloperTag() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      data-testid="developer-tag"
    >
      <div 
        className={`
          text-2xl transition-all duration-300 ease-in-out
          ${isHovered 
            ? 'opacity-100 scale-125 rotate-12' 
            : 'opacity-60 scale-100 rotate-0'
          }
        `}
        style={{
          filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
        }}
      >
        🐕
      </div>
    </div>
  );
}