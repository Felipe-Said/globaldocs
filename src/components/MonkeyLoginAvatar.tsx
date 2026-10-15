import React from 'react';

interface MonkeyLoginAvatarProps {
  covered: boolean;
  active: boolean;
}

export const MonkeyLoginAvatar: React.FC<MonkeyLoginAvatarProps> = ({ covered, active }) => (
  <div
    className={`monkey-login-avatar${covered ? ' is-covered' : ''}${active ? ' is-active' : ''}`}
    aria-hidden="true"
  >
    <svg className="monkey-login-face" viewBox="0 0 166 166" role="presentation">
      <circle cx="83" cy="83" r="78" fill="#f4f1ec" />
      <circle cx="27" cy="82" r="20" fill="#8b5e3c" stroke="#3c302a" strokeWidth="3" />
      <circle cx="139" cy="82" r="20" fill="#8b5e3c" stroke="#3c302a" strokeWidth="3" />
      <circle cx="27" cy="82" r="10" fill="#d9a878" />
      <circle cx="139" cy="82" r="10" fill="#d9a878" />
      <path d="M35 70C35 31 54 13 83 13s48 18 48 57v27c0 34-21 56-48 56S35 131 35 97V70Z" fill="#755038" stroke="#3c302a" strokeWidth="3" />
      <path d="M44 76c0-24 15-42 34-42 9 0 17 4 22 11 18 1 31 18 31 39 0 11-4 21-10 29-8 20-21 32-38 32-24 0-43-23-43-51 0-7 1-13 4-18Z" fill="#d9a878" />
      <ellipse cx="83" cy="107" rx="31" ry="27" fill="#edc79e" />
      <g className="monkey-login-eyes">
        <ellipse className="monkey-login-eye" cx="65" cy="78" rx="5" ry="7" fill="#2f2925" />
        <ellipse className="monkey-login-eye" cx="101" cy="78" rx="5" ry="7" fill="#2f2925" />
        <circle cx="63.5" cy="75.5" r="1.5" fill="#fff" />
        <circle cx="99.5" cy="75.5" r="1.5" fill="#fff" />
      </g>
      <path className="monkey-login-brow monkey-login-brow-left" d="M55 65c6-4 13-4 19 0" fill="none" stroke="#3c302a" strokeWidth="3" strokeLinecap="round" />
      <path className="monkey-login-brow monkey-login-brow-right" d="M92 65c6-4 13-4 19 0" fill="none" stroke="#3c302a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="83" cy="96" rx="5" ry="4" fill="#8b5e3c" />
      <path className="monkey-login-mouth" d="M69 113c7 8 21 8 28 0" fill="none" stroke="#3c302a" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 63c5-28 21-42 42-42 19 0 33 12 38 34-10-10-21-15-34-15-19 0-34 8-46 23Z" fill="#68452f" />
    </svg>

    <svg className="monkey-login-hands" viewBox="0 0 166 166" role="presentation">
      <path d="M-8 151C13 126 35 105 54 91" fill="none" stroke="#755038" strokeWidth="18" strokeLinecap="round" />
      <path d="M174 151c-21-25-43-46-62-60" fill="none" stroke="#755038" strokeWidth="18" strokeLinecap="round" />
      <g className="monkey-login-hand-left">
        <ellipse cx="58" cy="78" rx="25" ry="20" fill="#d9a878" stroke="#3c302a" strokeWidth="3" transform="rotate(-14 58 78)" />
        <path d="M37 72c10-12 24-17 39-11M38 80c12-9 26-12 41-5M42 89c12-6 24-7 36-1" fill="none" stroke="#b77f55" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="monkey-login-hand-right">
        <ellipse cx="108" cy="78" rx="25" ry="20" fill="#d9a878" stroke="#3c302a" strokeWidth="3" transform="rotate(14 108 78)" />
        <path d="M129 72c-10-12-24-17-39-11M128 80c-12-9-26-12-41-5M124 89c-12-6-24-7-36-1" fill="none" stroke="#b77f55" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);
