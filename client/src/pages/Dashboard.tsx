import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  SkeletonText,
  HStack,
  VStack,
  Avatar,
  Button,
  IconButton,
  Badge,
  useToast,
  Flex,
  Spacer,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  Image,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { useAuth, useDashboard, useSyncMutation, useLogout, useRecovery, useBalance, useFeedback, useRefreshFeedback, type WeekComparison } from '../lib/api';

function StatCard({
  label,
  value,
  unit,
  change,
  isLoading,
}: {
  label: string;
  value: number | string;
  unit?: string;
  change?: number | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Skeleton height="20px" mb={2} />
          <Skeleton height="36px" mb={2} />
          <Skeleton height="16px" width="60%" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel color="gray.400" fontSize="sm">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" color="white">
            {value}
            {unit && (
              <Text as="span" fontSize="md" color="gray.400" ml={1}>
                {unit}
              </Text>
            )}
          </StatNumber>
          {change !== null && change !== undefined && (
            <StatHelpText mb={0}>
              <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(change)}% vs last week
            </StatHelpText>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
}

function RecoveryWidget({ isLoading }: { isLoading?: boolean }) {
  const { data: recovery, isLoading: isRecoveryLoading } = useRecovery();

  const loading = isLoading || isRecoveryLoading;

  const statusConfig = {
    ready: { color: 'green', bg: 'green.900', label: '🟢 Ready to Train', description: 'Go hard!' },
    light: { color: 'yellow', bg: 'yellow.900', label: '🟡 Light Day', description: 'Easy effort recommended' },
    rest: { color: 'red', bg: 'red.900', label: '🔴 Rest Day', description: 'Recovery needed' },
  };

  const status = recovery?.status || 'ready';
  const config = statusConfig[status];

  if (loading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="120px" />
        </CardHeader>
        <CardBody pt={2}>
          <Skeleton height="60px" borderRadius="md" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">Recovery Status</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <Box bg={config.bg} borderRadius="md" p={4} mb={3} borderWidth="1px" borderColor={`${config.color}.700`}>
          <VStack spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color={`${config.color}.300`}>
              {config.label}
            </Text>
            <Text fontSize="sm" color={`${config.color}.400`}>
              {config.description}
            </Text>
          </VStack>
        </Box>

        {recovery?.lastActivity && (
          <Box>
            <Text fontSize="xs" color="gray.400" mb={2}>
              Last Activity: {recovery.lastActivity.name}
            </Text>
            {recovery.lastActivity.zone4_5Percentage > 0 && (
              <Tooltip label="Time spent in Zone 4-5 (high intensity)">
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.400">High Intensity</Text>
                    <Text fontSize="xs" fontWeight="medium" color="red.400">
                      {recovery.lastActivity.zone4_5Percentage.toFixed(0)}%
                    </Text>
                  </HStack>
                  <Progress
                    value={recovery.lastActivity.zone4_5Percentage}
                    size="sm"
                    colorScheme={recovery.lastActivity.zone4_5Percentage > 40 ? 'red' : recovery.lastActivity.zone4_5Percentage > 20 ? 'yellow' : 'green'}
                    borderRadius="full"
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        )}

        {!recovery?.lastActivity && (
          <Text fontSize="sm" color="gray.400" textAlign="center">
            No recent activities found
          </Text>
        )}
      </CardBody>
    </Card>
  );
}

function BalanceWidget({ isLoading }: { isLoading?: boolean }) {
  const { data: balance, isLoading: isBalanceLoading } = useBalance();

  const loading = isLoading || isBalanceLoading;

  const trendConfig: Record<string, { label: string; color: string }> = {
    building: { label: '📈 Building', color: 'purple' },
    maintaining: { label: '➡️ Maintaining', color: 'blue' },
    recovering: { label: '📉 Recovering', color: 'green' },
  };

  const fatigueConfig: Record<string, { label: string; color: string }> = {
    fresh: { label: 'Fresh', color: 'green' },
    optimal: { label: 'Optimal', color: 'blue' },
    tired: { label: 'Tired', color: 'yellow' },
    exhausted: { label: 'Exhausted', color: 'red' },
  };

  const defaultFatigueConfig = { label: 'Unknown', color: 'gray' };
  const defaultTrendConfig = { label: '➡️ Maintaining', color: 'blue' };

  if (loading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="120px" />
        </CardHeader>
        <CardBody pt={2}>
          <Skeleton height="100px" />
        </CardBody>
      </Card>
    );
  }

  const trend = balance?.trend || 'maintaining';
  const fatigue = balance?.fatigueLevel || 'fresh';
  const fatigueInfo = fatigueConfig[fatigue] || defaultFatigueConfig;
  const trendInfo = trendConfig[trend] || defaultTrendConfig;

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">Training Balance</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <Grid templateColumns="1fr 1fr" gap={4}>
          {/* Weekly TSS */}
          <Box textAlign="center">
            <CircularProgress
              value={Math.min((balance?.weeklyTSS || 0) / 500 * 100, 100)}
              size="80px"
              color="purple.500"
              thickness="8px"
            >
              <CircularProgressLabel fontWeight="bold" fontSize="md" color="white">
                {Math.round(balance?.weeklyTSS || 0)}
              </CircularProgressLabel>
            </CircularProgress>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Weekly TSS
            </Text>
          </Box>

          {/* TSB Score */}
          <Box textAlign="center">
            <CircularProgress
              value={Math.min(Math.max((balance?.tsb || 0) + 50, 0), 100)}
              size="80px"
              color={fatigueInfo.color + '.500'}
              thickness="8px"
            >
              <CircularProgressLabel fontWeight="bold" fontSize="md" color="white">
                {balance?.tsb?.toFixed(0) || 0}
              </CircularProgressLabel>
            </CircularProgress>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Form (TSB)
            </Text>
          </Box>
        </Grid>

        <HStack justify="space-between" mt={4}>
          <Badge colorScheme={trendInfo.color} px={2} py={1}>
            {trendInfo.label}
          </Badge>
          <Badge colorScheme={fatigueInfo.color} px={2} py={1}>
            {fatigueInfo.label}
          </Badge>
        </HStack>

        <HStack justify="space-between" mt={3} fontSize="xs" color="gray.400">
          <Tooltip label="Chronic Training Load (6-week average)">
            <Text>CTL: {balance?.ctl?.toFixed(0) || 0}</Text>
          </Tooltip>
          <Tooltip label="Acute Training Load (7-day total)">
            <Text>ATL: {balance?.atl?.toFixed(0) || 0}</Text>
          </Tooltip>
          <Text>{balance?.activitiesCount || 0} activities</Text>
        </HStack>
      </CardBody>
    </Card>
  );
}

function AICoachWidget({ isLoading }: { isLoading?: boolean }) {
  const { data: feedback, isLoading: isFeedbackLoading } = useFeedback();
  const refreshMutation = useRefreshFeedback();

  const loading = isLoading || isFeedbackLoading;

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    motivation: { icon: '💪', color: 'blue', bg: 'blue.900' },
    warning: { icon: '⚠️', color: 'orange', bg: 'orange.900' },
    advice: { icon: '💡', color: 'purple', bg: 'purple.900' },
    celebration: { icon: '🎉', color: 'green', bg: 'green.900' },
  };

  const defaultConfig = { icon: '🤖', color: 'gray', bg: 'gray.700' };

  if (loading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="120px" />
        </CardHeader>
        <CardBody pt={2}>
          <SkeletonText noOfLines={3} spacing={3} />
        </CardBody>
      </Card>
    );
  }

  const feedbackType = feedback?.type || 'motivation';
  const config = typeConfig[feedbackType] || defaultConfig;

  return (
    <Card>
      <CardHeader pb={2}>
        <Flex align="center" justify="space-between">
          <HStack>
            <Text fontSize="lg">{config.icon}</Text>
            <Heading size="sm">AI Coach</Heading>
          </HStack>
          <Tooltip label={feedback?.canRefresh ? "Refresh insight" : "Cached for 6 hours"}>
            <IconButton
              aria-label="Refresh feedback"
              icon={<RepeatIcon />}
              size="xs"
              variant="ghost"
              isLoading={refreshMutation.isPending}
              isDisabled={!feedback?.canRefresh}
              onClick={() => refreshMutation.mutate()}
              color="gray.400"
              _hover={{ color: 'white' }}
            />
          </Tooltip>
        </Flex>
      </CardHeader>
      <CardBody pt={2}>
        <Box bg={config.bg} borderRadius="md" p={4} borderWidth="1px" borderColor={`${config.color}.700`}>
          <Text color="white" fontSize="sm" lineHeight="tall">
            {feedback?.message || "Keep up the great work! Listen to your body and train smart."}
          </Text>
        </Box>
        {feedback?.cachedAt && (
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="right">
            Updated {new Date(feedback.cachedAt).toLocaleTimeString()}
          </Text>
        )}
      </CardBody>
    </Card>
  );
}

function WeeklySummarySection({
  weekComparison,
  isLoading,
}: {
  weekComparison?: WeekComparison;
  isLoading: boolean;
}) {
  const stats = weekComparison?.current;
  const changes = weekComparison?.changes;

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="md">This Week</Heading>
        {stats && (
          <Text fontSize="sm" color="gray.400">
            {new Date(stats.weekStart).toLocaleDateString()} -{' '}
            {new Date(stats.weekEnd).toLocaleDateString()}
          </Text>
        )}
      </CardHeader>
      <CardBody pt={2}>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <StatCard
            label="Distance"
            value={stats?.totalDistance ?? 0}
            unit="km"
            change={changes?.distance}
            isLoading={isLoading}
          />
          <StatCard
            label="Duration"
            value={stats?.totalDuration ?? 0}
            unit="hrs"
            change={changes?.duration}
            isLoading={isLoading}
          />
          <StatCard
            label="Elevation"
            value={stats?.totalElevation ?? 0}
            unit="m"
            change={changes?.elevation}
            isLoading={isLoading}
          />
          <StatCard
            label="Activities"
            value={stats?.totalActivities ?? 0}
            change={changes?.activities}
            isLoading={isLoading}
          />
        </Grid>

        {stats?.totalSufferScore && (
          <Box mt={4} p={4} bg="accent.900" borderRadius="md" borderWidth="1px" borderColor="accent.700">
            <HStack justify="space-between">
              <Text fontWeight="medium" color="accent.300">
                Total Suffer Score
              </Text>
              <Badge colorScheme="purple" fontSize="lg" px={3} py={1}>
                {stats.totalSufferScore}
              </Badge>
            </HStack>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}

function RecentActivitiesSection({
  activities,
  isLoading,
}: {
  activities?: Array<{
    id: string;
    name: string;
    type: string;
    distance: number;
    duration: number;
    sufferScore: number | null;
    date: string;
  }>;
  isLoading: boolean;
}) {
  const typeColors: Record<string, string> = {
    Run: 'green',
    Ride: 'blue',
    Swim: 'cyan',
    Walk: 'teal',
    Hike: 'orange',
    Workout: 'purple',
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Recent Activities</Heading>
      </CardHeader>
      <CardBody pt={0}>
        {isLoading ? (
          <VStack spacing={3} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonText key={i} noOfLines={2} spacing={2} />
            ))}
          </VStack>
        ) : (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Activity</Th>
                <Th>Type</Th>
                <Th isNumeric>Distance</Th>
                <Th isNumeric>Duration</Th>
                <Th isNumeric>Effort</Th>
              </Tr>
            </Thead>
            <Tbody>
              {activities?.map((activity) => (
                <Tr key={activity.id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1} color="white">
                        {activity.name}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {new Date(activity.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={typeColors[activity.type] || 'gray'} fontSize="xs">
                      {activity.type}
                    </Badge>
                  </Td>
                  <Td isNumeric fontSize="sm" color="white">
                    {activity.distance} km
                  </Td>
                  <Td isNumeric fontSize="sm" color="white">
                    {activity.duration} min
                  </Td>
                  <Td isNumeric>
                    {activity.sufferScore ? (
                      <Badge colorScheme="orange">{activity.sufferScore}</Badge>
                    ) : (
                      <Text color="gray.400" fontSize="xs">
                        -
                      </Text>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}

export function Dashboard() {
  const toast = useToast();
  const { data: user } = useAuth();
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const syncMutation = useSyncMutation();
  const logoutMutation = useLogout();

  const handleSync = () => {
    syncMutation.mutate(30, {
      onSuccess: (data) => {
        toast({
          title: 'Sync complete',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      },
      onError: () => {
        toast({
          title: 'Sync failed',
          description: 'Could not sync activities from Strava',
          status: 'error',
          duration: 3000,
        });
      },
    });
  };

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" shadow="sm" py={4} borderBottom="1px" borderColor="gray.700">
        <Container maxW="6xl">
          <Flex align="center">
            <HStack spacing={3}>
              <Image src="/logo.png" alt="Weekly Vaibe" boxSize="36px" objectFit="contain" />
              <Heading size="md" bgGradient="linear(to-r, brand.400, accent.400)" bgClip="text">
                Weekly Vaibe
              </Heading>
            </HStack>
            <Spacer />
            <HStack spacing={4}>
              <IconButton
                aria-label="Sync activities"
                icon={<RepeatIcon />}
                variant="ghost"
                isLoading={syncMutation.isPending}
                onClick={handleSync}
              />
              <HStack>
                <Avatar
                  size="sm"
                  name={`${user?.profile.firstName} ${user?.profile.lastName}`}
                  src={user?.profile.profilePicture}
                />
                <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.profile.firstName} {user?.profile.lastName}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
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
              <WeeklySummarySection
                weekComparison={dashboard?.weekComparison}
                isLoading={isDashboardLoading}
              />

              {/* Training Balance */}
              <BalanceWidget isLoading={isDashboardLoading} />
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Recovery Status */}
              <RecoveryWidget isLoading={isDashboardLoading} />

              {/* AI Coach */}
              <AICoachWidget isLoading={isDashboardLoading} />

              {/* All-time stats */}
              <Card>
                <CardBody>
                  <HStack justify="space-around">
                    <Stat textAlign="center">
                      <StatLabel color="gray.400">Total Activities</StatLabel>
                      <StatNumber color="white">{dashboard?.athlete.totalActivitiesAllTime ?? '-'}</StatNumber>
                    </Stat>
                    <Stat textAlign="center">
                      <StatLabel color="gray.400">Total Distance</StatLabel>
                      <StatNumber color="white">
                        {dashboard?.athlete.totalDistanceAllTime ?? '-'}
                        <Text as="span" fontSize="md" color="gray.400">
                          {' '}
                          km
                        </Text>
                      </StatNumber>
                    </Stat>
                  </HStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <RecentActivitiesSection
              activities={dashboard?.recentActivities}
              isLoading={isDashboardLoading}
            />
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
