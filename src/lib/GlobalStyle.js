'use client';

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    padding: 0;
    margin: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.font.sans};
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 260ms ${({ theme }) => theme.ease.out},
                color 260ms ${({ theme }) => theme.ease.out};
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.gradient.mesh};
    pointer-events: none;
    z-index: 0;
  }

  h1, h2, h3, h4, h5, h6, p, figure { margin: 0; }
  ul, ol { margin: 0; padding: 0; list-style: none; }

  a { color: inherit; text-decoration: none; }

  button, input, select, textarea {
    font: inherit;
    color: inherit;
  }

  button { cursor: pointer; }

  img { max-width: 100%; display: block; }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
    border-radius: 6px;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text};
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderStrong};
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  @media print {
    body::before { display: none; }
    .no-print { display: none !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyle;
