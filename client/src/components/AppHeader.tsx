import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Avatar,
  Button,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLogout } from '../lib/api';

function NavButton({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Button
      size="sm"
      variant={isActive ? 'solid' : 'ghost'}
      bg={isActive ? 'whiteAlpha.200' : 'transparent'}
      color={isActive ? 'white' : 'gray.300'}
      _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
      fontWeight="semibold"
      onClick={() => navigate(to)}
    >
      {label}
    </Button>
  );
}

export function AppHeader({ syncButton }: { syncButton?: React.ReactNode }) {
  const location = useLocation();
  const { data: user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <Box bg="gray.800" shadow="sm" py={3} borderBottom="1px" borderColor="gray.700">
      <Container maxW="6xl">
        <Flex align="center">
          {/* Brand + Nav */}
          <HStack spacing={6}>
            <Heading
              size="md"
              bgGradient="linear(to-r, brand.400, accent.400)"
              bgClip="text"
              letterSpacing="tight"
              fontWeight="bold"
            >
              Weekly Vaibe
            </Heading>

            <HStack spacing={1}>
              <NavButton
                label="Dashboard"
                to="/dashboard"
                isActive={location.pathname === '/dashboard'}
              />
            </HStack>
          </HStack>

          <Spacer />

          {/* Actions */}
          <HStack spacing={3}>
            <NavButton
              label="Weekly Goal"
              to="/weekly-goal"
              isActive={location.pathname === '/weekly-goal'}
            />
            {syncButton}
            <HStack spacing={2}>
              <Avatar
                size="sm"
                name={`${user?.profile.firstName} ${user?.profile.lastName}`}
                src={user?.profile.profilePicture}
              />
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="gray.300"
                display={{ base: 'none', md: 'block' }}
              >
                {user?.profile.firstName}
              </Text>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              fontWeight="medium"
              onClick={() => logoutMutation.mutate()}
              isLoading={logoutMutation.isPending}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
