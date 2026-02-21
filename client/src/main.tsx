import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const theme = extendTheme({
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace',
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.8125rem',  // 13px
    md: '0.875rem',   // 14px
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    shorter: 1.2,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
  },
  letterSpacings: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  colors: {
    brand: {
      50: '#FFFDF0',
      100: '#FFFACC',
      200: '#FFF299',
      300: '#FFE866',
      400: '#FFD933',
      500: '#FFD700', // Logo gold/yellow
      600: '#CCAC00',
      700: '#998100',
      800: '#665600',
      900: '#332B00',
    },
    accent: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6', // Logo purple
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'gray.100',
        fontSize: 'md',
        lineHeight: 'base',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
    },
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'gray.800',
          borderColor: 'gray.700',
          borderWidth: '1px',
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'white',
        fontWeight: 'semibold',
        letterSpacing: 'tight',
      },
      sizes: {
        '2xl': { fontSize: '2xl', lineHeight: 'shorter' },
        xl: { fontSize: 'xl', lineHeight: 'shorter' },
        lg: { fontSize: 'lg', lineHeight: 'short' },
        md: { fontSize: 'md', lineHeight: 'short' },
        sm: { fontSize: 'sm', lineHeight: 'short' },
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.100',
        lineHeight: 'base',
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: 'sm',
        fontWeight: 'medium',
        letterSpacing: 'wide',
        textTransform: 'none',
      },
    },
    Badge: {
      baseStyle: {
        fontWeight: 'semibold',
        fontSize: 'xs',
        letterSpacing: 'wide',
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        letterSpacing: 'wide',
      },
    },
    StatLabel: {
      baseStyle: {
        color: 'gray.400',
        fontSize: 'xs',
        fontWeight: 'medium',
        letterSpacing: 'wider',
        textTransform: 'uppercase',
      },
    },
    StatNumber: {
      baseStyle: {
        color: 'white',
        fontWeight: 'bold',
        letterSpacing: 'tight',
      },
    },
    StatHelpText: {
      baseStyle: {
        color: 'gray.300',
        fontSize: 'xs',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'gray.400',
            borderColor: 'gray.700',
            fontSize: 'xs',
            fontWeight: 'semibold',
            letterSpacing: 'wider',
            textTransform: 'uppercase',
          },
          td: {
            borderColor: 'gray.700',
            color: 'white',
            fontSize: 'sm',
          },
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
