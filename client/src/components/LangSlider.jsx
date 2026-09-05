import React, { useContext } from 'react';
import { LangContext } from '../lang';

export default function LangSlider({ variant = 'navbar' }) {
  const { lang, toggleLang } = useContext(LangContext);

  return (
    <div className={`lang-slider lang-slider--${variant}`} role="group" aria-label="Language">
      <button
        className={`lang-slider__opt ${lang === 'en' ? 'lang-slider__opt--active' : ''}`}
        onClick={() => lang !== 'en' && toggleLang()}
        aria-pressed={lang === 'en'}
      >
        En
      </button>
      <button
        className={`lang-slider__opt ${lang === 'hi' ? 'lang-slider__opt--active' : ''}`}
        onClick={() => lang !== 'hi' && toggleLang()}
        aria-pressed={lang === 'hi'}
      >
        हि
      </button>
    </div>
  );
}
