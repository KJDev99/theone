'use client';

import styled, { ThemeProvider, keyframes } from 'styled-components';
import StyledComponentsRegistry from '@/lib/registry';
import GlobalStyle from '@/lib/GlobalStyle';
import { themes } from '@/lib/theme';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import Shell from '@/components/Shell';
import Toasts from '@/components/Toasts';
import Celebration from '@/components/Celebration';

const spin = keyframes`to { transform: rotate(360deg); }`;

const Splash = styled.div`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;

  span {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2.5px solid ${({ theme }) => theme.colors.border};
    border-top-color: ${({ theme }) => theme.colors.primary};
    animation: ${spin} 700ms linear infinite;
  }
`;

function Themed({ children }) {
  const { theme, ready } = useApp();

  return (
    <ThemeProvider theme={themes[theme] || themes.light}>
      <GlobalStyle />
      {ready ? (
        <AuthProvider>
          <Shell>{children}</Shell>
          <Toasts />
          <Celebration />
        </AuthProvider>
      ) : (
        <Splash>
          <span />
        </Splash>
      )}
    </ThemeProvider>
  );
}

export default function Providers({ children }) {
  return (
    <StyledComponentsRegistry>
      <AppProvider>
        <Themed>{children}</Themed>
      </AppProvider>
    </StyledComponentsRegistry>
  );
}
