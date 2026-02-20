import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';

function StravaIcon(props: { boxSize?: string | number }) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"
      />
      <path
        fill="currentColor"
        fillOpacity="0.6"
        d="M7.778 4.278L12.234 13h2.385L7.778 0 0 13h2.39z"
      />
    </Icon>
  );
}

export function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    auth_denied: 'Authorization was denied. Please try again.',
    no_code: 'No authorization code received.',
    token_exchange: 'Failed to connect with Strava. Please try again.',
  };

  return (
    <Box minH="100vh" bg="gray.50" py={20}>
      <Container maxW="md">
        <VStack spacing={8} textAlign="center">
          <VStack spacing={4}>
            <Heading size="2xl" color="gray.800">
              Weekly Vaibe
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Smart Training Tracker
            </Text>
          </VStack>

          <Box bg="white" p={8} borderRadius="xl" shadow="lg" w="full">
            <VStack spacing={6}>
              <Text color="gray.600" fontSize="lg">
                Connect your Strava account to track your training progress, analyze weekly trends,
                and optimize your recovery.
              </Text>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    {errorMessages[error] || 'An error occurred. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                as="a"
                href="/auth/strava"
                size="lg"
                bg="brand.500"
                color="white"
                _hover={{ bg: 'brand.600' }}
                leftIcon={<StravaIcon boxSize={6} />}
                w="full"
              >
                Connect with Strava
              </Button>
            </VStack>
          </Box>

          <VStack spacing={2} color="gray.500" fontSize="sm">
            <Text>Features:</Text>
            <Text>📊 Weekly training summaries</Text>
            <Text>📈 Week-over-week comparisons</Text>
            <Text>💪 Stress and recovery tracking</Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
