import React from 'react';

interface MabiconsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MabiconsLogo: React.FC<MabiconsLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#264478] flex flex-col items-center justify-between p-1.5 shadow-md shadow-slate-950/40 select-none ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: '#254479' }}
    >
      {/* Top right white corner badge with user/gear icon */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-white clip-corner flex items-center justify-center pt-0.5 pr-0.5">
        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#254479] fill-current">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>

      {/* Main vector logo graphic */}
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="200" height="200" rx="24" fill="#244478" />

        {/* Top-Right Triangle Corner Badge */}
        <polygon points="135,0 200,0 200,65" fill="#FFFFFF" />

        {/* HR User Icon in Corner Badge */}
        <path
          d="M172 18 C176.4 18 180 21.6 180 26 C180 30.4 176.4 34 172 34 C167.6 34 164 30.4 164 26 C164 21.6 167.6 18 172 18 Z M172 37 C177.3 37 185 39.7 185 43 L185 47 L159 47 L159 43 C159 39.7 166.7 37 172 37 Z"
          fill="#244478"
        />

        {/* Lowercase 'm' letterform */}
        <path
          d="M32 58 L57 58 L57 74 C62 62 73 56 86 56 C99 56 109 63 113 74 C119 62 131 56 145 56 C163 56 174 67 174 88 L174 142 L149 142 L149 93 C149 82 143 76 134 76 C124 76 117 83 117 96 L117 142 L92 142 L92 93 C92 82 86 76 77 76 C68 76 61 83 61 96 L61 142 L32 142 L32 58 Z"
          fill="#FFFFFF"
        />

        {/* 'mabicons' text below */}
        <text
          x="100"
          y="172"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="bold"
          fontSize="31"
          letterSpacing="-0.5"
        >
          mabicons
        </text>
      </svg>
    </div>
  );
};
