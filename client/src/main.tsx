import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const theme = extendTheme({
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
        color: 'white',
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
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.100',
      },
    },
    StatLabel: {
      baseStyle: {
        color: 'gray.400',
      },
    },
    StatNumber: {
      baseStyle: {
        color: 'white',
      },
    },
    StatHelpText: {
      baseStyle: {
        color: 'gray.300',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'gray.400',
            borderColor: 'gray.700',
          },
          td: {
            borderColor: 'gray.700',
            color: 'white',
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
