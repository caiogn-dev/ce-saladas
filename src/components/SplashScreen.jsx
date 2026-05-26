import { useEffect, useRef, useState } from 'react';
import ShaderBackground from './ui/ShaderBackground';

const SPLASH_MS = 2000;
const FADE_MS   = 600;

const SplashScreen = ({ store, onDone }) => {
  const [fading, setFading] = useState(false);
  const dismissed = useRef(false);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    setFading(true);
    setTimeout(() => onDone?.(), FADE_MS);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, SPLASH_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoSrc = store?.logo_url || '/icon-512.png';
  const name    = store?.name || 'Cê Saladas';

  return (
    <div
      className={`splash${fading ? ' splash--out' : ''}`}
      onClick={dismiss}
      role="presentation"
      aria-hidden="true"
    >
      <ShaderBackground className="splash__canvas" />

      <div className="splash__center">
        <div className="splash__ring" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={name}
          width={120}
          height={120}
          className="splash__logo"
          onError={(e) => { e.currentTarget.src = '/icon-512.png'; }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
