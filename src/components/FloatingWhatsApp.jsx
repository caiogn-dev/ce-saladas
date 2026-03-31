import { useState } from 'react';
import './FloatingWhatsApp.css';

const WHATSAPP_NUMBER = '5563991386719';
const WHATSAPP_MESSAGE = 'Olá! Gostaria de mais informações sobre a CE Saladas 🥗';

export default function FloatingWhatsApp() {
  const [hovered, setHovered] = useState(false);

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`floating-whatsapp${hovered ? ' floating-whatsapp--hovered' : ''}`}
      aria-label="Fale conosco pelo WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="floating-whatsapp__tooltip">Fale conosco!</span>
      <svg
        className="floating-whatsapp__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          d="M16 0C7.163 0 0 7.163 0 16c0 2.833.74 5.49 2.035 7.8L0 32l8.418-2.01A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.854l-.485-.29-5.003 1.196 1.23-4.867-.318-.5A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.907c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.895.2-.265.398-1.028 1.294-1.26 1.56-.232.265-.464.298-.863.1-.398-.2-1.682-.62-3.203-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.812.179-.178.398-.465.597-.697.2-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.2-.895-2.16-1.227-2.957-.323-.776-.65-.671-.895-.683l-.763-.013c-.265 0-.697.1-1.062.497-.365.398-1.394 1.362-1.394 3.32s1.427 3.851 1.626 4.116c.2.265 2.809 4.287 6.808 6.014.951.41 1.694.656 2.272.839.955.303 1.824.26 2.511.158.766-.114 2.355-.962 2.687-1.892.332-.93.332-1.727.232-1.892-.099-.166-.364-.265-.763-.465z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}
