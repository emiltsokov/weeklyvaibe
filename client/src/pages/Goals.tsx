import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Skeleton,
  useToast,
  Flex,
  Spacer,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Image,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAuth,
  useCurrentGoal,
  useGoalHistory,
  useSetGoal,
  useLogout,
  type GoalType,
  type ActivityFilter,
} from '../lib/api';

function GoalForm({ onSuccess }: { onSuccess: () => void }) {
  const [type, setType] = useState<GoalType>('duration');
  const [target, setTarget] = useState<number>(5);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const setGoalMutation = useSetGoal();
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setGoalMutation.mutate(
      { type, target, activityFilter },
      {
        onSuccess: () => {
          toast({
            title: 'Goal set!',
            description: `Your weekly goal has been set.`,
            status: 'success',
            duration: 3000,
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to set goal',
            status: 'error',
            duration: 3000,
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">Set Weekly Goal</Heading>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">
                Goal Type
              </FormLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as GoalType)}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
              >
                <option style={{ background: '#2D3748', color: 'white' }} value="duration">Duration (hours)</option>
                <option style={{ background: '#2D3748', color: 'white' }} value="distance">Distance (km)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">
                Target {type === 'duration' ? '(hours)' : '(km)'}
              </FormLabel>
              <NumberInput
                value={target}
                onChange={(_, val) => setTarget(val || 0)}
                min={0.5}
                max={type === 'duration' ? 40 : 500}
                step={type === 'duration' ? 0.5 : 5}
              >
                <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                <NumberInputStepper>
                  <NumberIncrementStepper borderColor="gray.600" color="white" />
                  <NumberDecrementStepper borderColor="gray.600" color="white" />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">
                Activity Type
              </FormLabel>
              <Select
                value={activityFilter}
                onChange={(e) =>
                  setActivityFilter(e.target.value as ActivityFilter)
                }
                bg="gray.700"
                borderColor="gray.600"
                color="white"
              >
                <option style={{ background: '#2D3748', color: 'white' }} value="all">All Activities</option>
                <option style={{ background: '#2D3748', color: 'white' }} value="run">Running</option>
                <option style={{ background: '#2D3748', color: 'white' }} value="ride">Cycling</option>
                <option style={{ background: '#2D3748', color: 'white' }} value="swim">Swimming</option>
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="purple"
              isLoading={setGoalMutation.isPending}
              mt={2}
            >
              Set Goal
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
}

function GoalTrackerWidget() {
  const { data, isLoading } = useCurrentGoal();

  if (isLoading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="150px" />
        </CardHeader>
        <CardBody>
          <Skeleton height="100px" />
        </CardBody>
      </Card>
    );
  }

  if (!data?.hasGoal || !data.goal) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={3} py={4}>
            <Text fontSize="xl">🎯</Text>
            <Text color="gray.400" textAlign="center">
              No goal set for this week.
              <br />
              Set one to start tracking!
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const { goal, burnout } = data;

  const statusConfig = {
    'on-track': { color: 'green', label: '✨ On Track', gradient: 'linear(to-r, green.400, green.600)' },
    behind: { color: 'yellow', label: '📉 Behind', gradient: 'linear(to-r, yellow.400, orange.500)' },
    overachieving: { color: 'purple', label: '⚡ Crushing It', gradient: 'linear(to-r, purple.400, pink.500)' },
  };

  const config = statusConfig[goal.status];
  const displayProgress = Math.min(goal.percentComplete, 150);

  const activityLabels: Record<string, string> = {
    all: 'All Activities',
    run: 'Running',
    ride: 'Cycling',
    swim: 'Swimming',
  };

  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="sm">Weekly Goal Progress</Heading>
          <Badge colorScheme={config.color}>{config.label}</Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        {/* Burnout Warning */}
        {burnout?.warning && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Burnout Warning!</AlertTitle>
              <AlertDescription fontSize="sm">
                {burnout.message}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Thermometer Progress Bar */}
        <Box mb={4}>
          <Box
            position="relative"
            bg="gray.700"
            borderRadius="full"
            h="32px"
            overflow="hidden"
          >
            {/* Progress fill */}
            <Box
              position="absolute"
              top={0}
              left={0}
              h="100%"
              w={`${Math.min(displayProgress, 100)}%`}
              bgGradient={config.gradient}
              borderRadius="full"
              transition="width 0.5s ease"
            />
            {/* 100% marker */}
            <Box
              position="absolute"
              top={0}
              left="100%"
              transform="translateX(-2px)"
              h="100%"
              w="2px"
              bg="white"
              opacity={0.5}
            />
            {/* Overflow indicator */}
            {goal.percentComplete > 100 && (
              <Box
                position="absolute"
                top={0}
                left="100%"
                h="100%"
                w={`${Math.min(goal.percentComplete - 100, 50)}%`}
                bgGradient="linear(to-r, pink.500, red.500)"
                opacity={0.7}
              />
            )}
            {/* Progress text */}
            <Flex
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              align="center"
              justify="center"
            >
              <Text fontWeight="bold" fontSize="sm" color="white" textShadow="0 1px 2px rgba(0,0,0,0.5)">
                {goal.percentComplete}%
              </Text>
            </Flex>
          </Box>
        </Box>

        {/* Stats */}
        <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
          <Box textAlign="center" bg="gray.700" borderRadius="md" p={3}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {goal.progress}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Current ({goal.unit})
            </Text>
          </Box>
          <Box textAlign="center" bg="gray.700" borderRadius="md" p={3}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {goal.target}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Target ({goal.unit})
            </Text>
          </Box>
        </Grid>

        {/* Message */}
        <Text fontSize="sm" color="gray.400" textAlign="center">
          {goal.message}
        </Text>

        {/* Activity filter badge */}
        <HStack justify="center" mt={3}>
          <Badge variant="outline" colorScheme="purple">
            {activityLabels[goal.activityFilter]}
          </Badge>
        </HStack>
      </CardBody>
    </Card>
  );
}

function GoalHistoryTable() {
  const { data, isLoading } = useGoalHistory(8);

  if (isLoading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="120px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="40px" width="100%" />
            ))}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const history = data?.history || [];

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Heading size="sm">Goal History</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.400" textAlign="center">
            No goal history yet
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">Goal History</Heading>
      </CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Week</Th>
              <Th>Target</Th>
              <Th isNumeric>Progress</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {history.map((g) => (
              <Tr key={g.id}>
                <Td>
                  <Text fontSize="sm" color="gray.300">
                    {new Date(g.weekStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm" color="white">
                    {g.target} {g.unit}
                  </Text>
                </Td>
                <Td isNumeric>
                  <HStack justify="flex-end" spacing={2}>
                    <Progress
                      value={Math.min(g.percentComplete, 100)}
                      size="sm"
                      width="60px"
                      borderRadius="full"
                      colorScheme={
                        g.percentComplete >= 100
                          ? 'green'
                          : g.percentComplete >= 70
                            ? 'yellow'
                            : 'red'
                      }
                    />
                    <Text fontSize="sm" color="gray.300" width="40px">
                      {g.percentComplete}%
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  {g.completed ? (
                    <Badge colorScheme="green">✓</Badge>
                  ) : (
                    <Badge colorScheme="gray">-</Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

export function Goals() {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { refetch } = useCurrentGoal();
  const logoutMutation = useLogout();

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" shadow="sm" py={4} borderBottom="1px" borderColor="gray.700">
        <Container maxW="6xl">
          <Flex align="center">
            <HStack spacing={3}>
              <IconButton
                aria-label="Back to dashboard"
                icon={<ArrowBackIcon />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'gray.600' }}
                onClick={() => navigate('/dashboard')}
              />
              <Image src="/logo.png" alt="Weekly Vaibe" boxSize="36px" objectFit="contain" />
              <Heading size="md" bgGradient="linear(to-r, brand.400, accent.400)" bgClip="text">
                Goals
              </Heading>
            </HStack>
            <Spacer />
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.400">
                {user?.profile.firstName} {user?.profile.lastName}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                color="gray.300"
                _hover={{ bg: 'gray.600' }}
                onClick={() => logoutMutation.mutate()}
                isLoading={logoutMutation.isPending}
              >
                Logout
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="6xl" py={8}>
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
          <GridItem>
            <VStack spacing={6} align="stretch">
              <GoalForm onSuccess={() => refetch()} />
              <GoalHistoryTable />
            </VStack>
          </GridItem>

          <GridItem>
            <GoalTrackerWidget />
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
