import React from 'react';

interface AfricanBorderPatternProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  width?: number | string;
}

export const AfricanBorderPattern: React.FC<AfricanBorderPatternProps> = ({
  className = '',
  orientation = 'vertical',
  width = 28
}) => {
  return (
    <div
      className={`relative overflow-hidden select-none pointer-events-none ${className}`}
      style={{
        width: orientation === 'vertical' ? width : '100%',
        height: orientation === 'horizontal' ? width : '100%'
      }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 40 160"
      >
        <defs>
          <pattern
            id="african-chevron-pattern"
            width="40"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Background base */}
            <rect width="40" height="80" fill="#B91C1C" />

            {/* Navy / Dark Chevron */}
            <polygon points="0,0 20,20 40,0 40,12 20,32 0,12" fill="#0F172A" />

            {/* Gold / Amber Chevron */}
            <polygon points="0,14 20,34 40,14 40,24 20,44 0,24" fill="#F59E0B" />

            {/* White Pinstripe */}
            <polygon points="0,25 20,45 40,25 40,28 20,48 0,28" fill="#FFFDF8" />

            {/* Turquoise / Teal Chevron */}
            <polygon points="0,30 20,50 40,30 40,42 20,62 0,42" fill="#0284C7" />

            {/* Deep Red / Coral Chevron */}
            <polygon points="0,44 20,64 40,44 40,54 20,74 0,54" fill="#DC2626" />

            {/* Gold Center Diamond Row */}
            <polygon points="20,56 26,62 20,68 14,62" fill="#FBBF24" />
            <polygon points="0,56 6,62 0,68" fill="#FBBF24" />
            <polygon points="40,56 40,68 34,62" fill="#FBBF24" />

            {/* Dark Blue & White zigzags */}
            <polygon points="0,66 20,86 40,66 40,76 20,96 0,76" fill="#1E293B" />
            <polygon points="0,70 20,90 40,70 40,73 20,93 0,73" fill="#FFFFFF" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#african-chevron-pattern)" />
      </svg>
    </div>
  );
};
