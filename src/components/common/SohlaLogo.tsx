import React from 'react';

interface SohlaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  withGlow?: boolean;
  className?: string;
  lightMode?: boolean;
}

export const SohlaLogo: React.FC<SohlaLogoProps> = ({
  size = 'md',
  withTagline = false,
  withGlow = true,
  className = '',
  lightMode = false
}) => {
  const sizeClasses = {
    sm: 'text-xl tracking-wide',
    md: 'text-2xl sm:text-3xl tracking-wide',
    lg: 'text-3xl sm:text-4xl tracking-wider',
    xl: 'text-4xl sm:text-5xl tracking-wider font-extrabold'
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing aura behind logo */}
        {withGlow && (
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 via-amber-500/20 to-blue-500/30 rounded-full blur-lg opacity-75 animate-pulse-glow pointer-events-none" />
        )}

        <div className={`relative flex items-center font-display font-black tracking-tight ${sizeClasses[size]}`}>
          {/* 'S' in crisp white / dark */}
          <span className={`${lightMode ? 'text-slate-900' : 'text-white'} drop-shadow-sm`}>S</span>

          {/* 'O' custom African Sun & River Ocean Wave mark */}
          <div className="relative inline-flex items-center justify-center mx-0.5 w-[1.1em] h-[1.1em]">
            {/* Sun Rays */}
            <svg
              className="absolute inset-0 w-full h-full animate-spin [animation-duration:24s]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="32" stroke="#F59E0B" strokeWidth="4" strokeDasharray="6 6" />
              <g fill="#F59E0B">
                <circle cx="50" cy="8" r="4" />
                <circle cx="50" cy="92" r="4" />
                <circle cx="8" cy="50" r="4" />
                <circle cx="92" cy="50" r="4" />
                <circle cx="20" cy="20" r="3.5" />
                <circle cx="80" cy="80" r="3.5" />
                <circle cx="20" cy="80" r="3.5" />
                <circle cx="80" cy="20" r="3.5" />
              </g>
            </svg>

            {/* Inner Sun & River Wave */}
            <div className="w-[72%] h-[72%] rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center overflow-hidden shadow-inner relative">
              {/* Wave SVG inside 'O' */}
              <svg
                className="absolute bottom-0 w-full h-[55%]"
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
                fill="#0284C7"
              >
                <path d="M0,25 C30,40 40,10 70,25 C85,32 95,20 100,25 L100,50 L0,50 Z" />
                <path d="M0,32 C25,45 50,22 75,35 C90,40 95,30 100,32 L100,50 L0,50 Z" fill="#38BDF8" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* 'HLA' */}
          <span className={`${lightMode ? 'text-slate-900' : 'text-white'} drop-shadow-sm`}>H</span>
          <span className={`${lightMode ? 'text-slate-900' : 'text-white'} drop-shadow-sm`}>L</span>
          <span className={`${lightMode ? 'text-slate-900' : 'text-white'} drop-shadow-sm`}>A</span>
        </div>
      </div>

      {withTagline && (
        <span className={`text-xs sm:text-sm font-medium tracking-normal mt-0.5 drop-shadow-sm ${lightMode ? 'text-slate-600' : 'text-slate-100'}`}>
          Your Everyday. Simplified.
        </span>
      )}
    </div>
  );
};
