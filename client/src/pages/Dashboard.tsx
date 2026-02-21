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
  IconButton,
  Badge,
  useToast,
  Flex,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { RepeatIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDashboard, useSyncMutation, useRecovery, useBalance, useFeedback, useRefreshFeedback, useCurrentGoal, useWeeklyTrend, type WeekComparison } from '../lib/api';
import { AppHeader } from '../components/AppHeader';

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
        <HStack justify="space-between">
          <Heading size="sm">🔋 Recovery Status</Heading>
          <Tooltip label="Learn about Recovery Status">
            <IconButton
              as={RouterLink}
              to="/vocabulary#recovery-status"
              aria-label="Learn about Recovery Status"
              icon={<InfoOutlineIcon />}
              size="xs"
              variant="ghost"
              color="gray.500"
              _hover={{ color: 'green.300' }}
            />
          </Tooltip>
        </HStack>
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
                <Tooltip label="Time spent in Zone 4-5 (high intensity) — click to learn more">
                <Box as={RouterLink} to="/vocabulary#zone-distribution" display="block" _hover={{ opacity: 0.8 }}>
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
        <HStack justify="space-between">
          <Heading size="sm">⚖️ Training Balance</Heading>
          <Tooltip label="Learn about TSS, CTL, ATL & TSB">
            <IconButton
              as={RouterLink}
              to="/vocabulary#tsb"
              aria-label="Learn about Training Balance"
              icon={<InfoOutlineIcon />}
              size="xs"
              variant="ghost"
              color="gray.500"
              _hover={{ color: 'blue.300' }}
            />
          </Tooltip>
        </HStack>
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
            <Text
              as={RouterLink}
              to="/vocabulary#tss"
              fontSize="xs"
              color="gray.400"
              mt={1}
              _hover={{ color: 'orange.300', textDecoration: 'underline' }}
              cursor="pointer"
            >
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
            <Text
              as={RouterLink}
              to="/vocabulary#tsb"
              fontSize="xs"
              color="gray.400"
              mt={1}
              _hover={{ color: 'blue.300', textDecoration: 'underline' }}
              cursor="pointer"
            >
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
            <Text as={RouterLink} to="/vocabulary#ctl" _hover={{ color: 'purple.300' }}>CTL: {balance?.ctl?.toFixed(0) || 0}</Text>
          </Tooltip>
          <Tooltip label="Acute Training Load (7-day total)">
            <Text as={RouterLink} to="/vocabulary#atl" _hover={{ color: 'yellow.300' }}>ATL: {balance?.atl?.toFixed(0) || 0}</Text>
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
    advice: { icon: '🤖', color: 'purple', bg: 'purple.900' },
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

function GoalWidget({ isLoading }: { isLoading?: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading: isGoalLoading } = useCurrentGoal();

  const loading = isLoading || isGoalLoading;

  if (loading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="100px" />
        </CardHeader>
        <CardBody pt={2}>
          <Skeleton height="50px" />
        </CardBody>
      </Card>
    );
  }

  if (!data?.hasGoal || !data.goal) {
    return (
      <Card cursor="pointer" onClick={() => navigate('/weekly-goal')} _hover={{ borderColor: 'purple.500' }}>
        <CardBody>
          <HStack justify="center" spacing={3} py={2}>
            <Text fontSize="xl">🎯</Text>
            <VStack spacing={0} align="start">
              <Text fontWeight="medium" color="white">Set a Weekly Goal</Text>
              <Text fontSize="sm" color="gray.400">Track your progress</Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  const { goal, burnout } = data;

  const statusConfig = {
    'on-track': { color: 'green', label: '✨ On Track' },
    behind: { color: 'yellow', label: '📉 Behind' },
    overachieving: { color: 'purple', label: '⚡ Crushing It' },
  };

  const config = statusConfig[goal.status];

  return (
    <Card cursor="pointer" onClick={() => navigate('/weekly-goal')} _hover={{ borderColor: 'purple.500' }}>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="sm">🎯 Weekly Goal</Heading>
          <Badge colorScheme={config.color} fontSize="xs">{config.label}</Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        {burnout?.warning && (
          <Badge colorScheme="orange" mb={2} fontSize="xs">⚠️ Burnout Risk</Badge>
        )}
        <Box position="relative" bg="gray.700" borderRadius="full" h="24px" overflow="hidden">
          <Box
            position="absolute"
            top={0}
            left={0}
            h="100%"
            w={`${Math.min(goal.percentComplete, 100)}%`}
            bgGradient="linear(to-r, purple.400, pink.500)"
            borderRadius="full"
            transition="width 0.5s ease"
          />
          <Flex position="absolute" top={0} left={0} right={0} bottom={0} align="center" justify="center">
            <Text fontWeight="bold" fontSize="xs" color="white" textShadow="0 1px 2px rgba(0,0,0,0.5)">
              {goal.progress} / {goal.target} {goal.unit} ({goal.percentComplete}%)
            </Text>
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
}

function WeeklyTrendWidget({ isLoading: parentLoading }: { isLoading?: boolean }) {
  const { data, isLoading: isTrendLoading } = useWeeklyTrend(6);

  const loading = parentLoading || isTrendLoading;
  const trend = data?.trend || [];

  if (loading) {
    return (
      <Card>
        <CardHeader pb={2}>
          <Skeleton height="20px" width="160px" />
        </CardHeader>
        <CardBody pt={2}>
          <Skeleton height="120px" />
        </CardBody>
      </Card>
    );
  }

  if (trend.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.400" fontSize="sm" textAlign="center">
            No weekly data available yet. Sync more activities!
          </Text>
        </CardBody>
      </Card>
    );
  }

  // Find max values for bar scaling
  const maxDistance = Math.max(...trend.map((w) => w.distance), 1);
  const maxDuration = Math.max(...trend.map((w) => w.duration), 1);

  // Average stats
  const avgDistance = trend.reduce((s, w) => s + w.distance, 0) / trend.length;
  const avgDuration = trend.reduce((s, w) => s + w.duration, 0) / trend.length;
  const avgActivities = trend.reduce((s, w) => s + w.activities, 0) / trend.length;

  // Current week vs average
  const current = trend[trend.length - 1];
  const distVsAvg = avgDistance > 0 ? Math.round(((current.distance - avgDistance) / avgDistance) * 100) : 0;
  const durVsAvg = avgDuration > 0 ? Math.round(((current.duration - avgDuration) / avgDuration) * 100) : 0;

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">📊 6-Week Trend</Heading>
        <Text fontSize="xs" color="gray.400">
          How this week compares to previous weeks
        </Text>
      </CardHeader>
      <CardBody pt={2}>
        {/* Distance bar chart */}
        <Box mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" color="gray.400" fontWeight="semibold">
              Distance (km)
            </Text>
            <Badge colorScheme={distVsAvg >= 0 ? 'green' : 'red'} fontSize="2xs">
              {distVsAvg >= 0 ? '+' : ''}{distVsAvg}% vs avg
            </Badge>
          </HStack>
          <HStack spacing={1} align="end" h="60px">
            {trend.map((week, i) => {
              const pct = (week.distance / maxDistance) * 100;
              const isCurrent = i === trend.length - 1;
              return (
                <Tooltip
                  key={week.weekStart}
                  label={`${week.weekLabel}: ${week.distance} km`}
                >
                  <Box
                    flex={1}
                    h={`${Math.max(pct, 4)}%`}
                    bg={isCurrent ? 'purple.400' : 'gray.600'}
                    borderRadius="sm"
                    transition="all 0.3s"
                    _hover={{ bg: isCurrent ? 'purple.300' : 'gray.500' }}
                  />
                </Tooltip>
              );
            })}
          </HStack>
          <HStack spacing={1} mt={1}>
            {trend.map((week, i) => (
              <Text
                key={week.weekStart}
                flex={1}
                fontSize="2xs"
                color={i === trend.length - 1 ? 'purple.300' : 'gray.500'}
                textAlign="center"
                noOfLines={1}
              >
                {week.weekLabel}
              </Text>
            ))}
          </HStack>
        </Box>

        {/* Duration bar chart */}
        <Box mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" color="gray.400" fontWeight="semibold">
              Duration (hrs)
            </Text>
            <Badge colorScheme={durVsAvg >= 0 ? 'green' : 'red'} fontSize="2xs">
              {durVsAvg >= 0 ? '+' : ''}{durVsAvg}% vs avg
            </Badge>
          </HStack>
          <HStack spacing={1} align="end" h="60px">
            {trend.map((week, i) => {
              const pct = (week.duration / maxDuration) * 100;
              const isCurrent = i === trend.length - 1;
              return (
                <Tooltip
                  key={week.weekStart}
                  label={`${week.weekLabel}: ${week.duration} hrs`}
                >
                  <Box
                    flex={1}
                    h={`${Math.max(pct, 4)}%`}
                    bg={isCurrent ? 'blue.400' : 'gray.600'}
                    borderRadius="sm"
                    transition="all 0.3s"
                    _hover={{ bg: isCurrent ? 'blue.300' : 'gray.500' }}
                  />
                </Tooltip>
              );
            })}
          </HStack>
        </Box>

        {/* Average summary */}
        <Divider borderColor="gray.700" mb={3} />
        <HStack justify="space-around" fontSize="xs" color="gray.400">
          <VStack spacing={0}>
            <Text fontWeight="bold" color="white" fontSize="sm">
              {avgDistance.toFixed(1)}
            </Text>
            <Text>avg km/wk</Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontWeight="bold" color="white" fontSize="sm">
              {avgDuration.toFixed(1)}
            </Text>
            <Text>avg hrs/wk</Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontWeight="bold" color="white" fontSize="sm">
              {avgActivities.toFixed(1)}
            </Text>
            <Text>avg acts/wk</Text>
          </VStack>
        </HStack>
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
        <Heading size="md">📅 This Week</Heading>
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
          <Box
            as={RouterLink}
            to="/vocabulary#suffer-score"
            display="block"
            mt={4}
            p={4}
            bg="accent.900"
            borderRadius="md"
            borderWidth="1px"
            borderColor="accent.700"
            _hover={{ borderColor: 'accent.500', textDecoration: 'none' }}
            transition="border-color 0.2s"
          >
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Text fontWeight="medium" color="accent.300">
                  Total Suffer Score
                </Text>
                <InfoOutlineIcon boxSize={3} color="accent.500" />
              </HStack>
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
        <Heading size="md">🏃 Recent Activities</Heading>
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
                <Th isNumeric>
                  <HStack justify="flex-end" spacing={1}>
                    <Text>Effort</Text>
                    <Tooltip label="Learn about Suffer Score">
                      <Box as={RouterLink} to="/vocabulary#suffer-score">
                        <InfoOutlineIcon boxSize={3} color="gray.500" _hover={{ color: 'red.300' }} />
                      </Box>
                    </Tooltip>
                  </HStack>
                </Th>
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
                      <Badge colorScheme={
                        activity.sufferScore > 200 ? 'red' :
                        activity.sufferScore > 100 ? 'orange' :
                        activity.sufferScore > 50 ? 'blue' : 'green'
                      }>{activity.sufferScore}</Badge>
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
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const syncMutation = useSyncMutation();

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
      <AppHeader
        syncButton={
          <IconButton
            aria-label="Sync activities"
            icon={<RepeatIcon />}
            variant="ghost"
            color="gray.400"
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            size="sm"
            isLoading={syncMutation.isPending}
            onClick={handleSync}
          />
        }
      />

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

              {/* Goal Tracker */}
              <GoalWidget isLoading={isDashboardLoading} />

              {/* All-time stats */}
              <Card>
                <CardHeader pb={1}>
                  <Heading size="sm" color="gray.400" fontWeight="medium">
                    🏅 All-Time Totals
                  </Heading>
                </CardHeader>
                <CardBody pt={2}>
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

          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Recovery Status */}
              <RecoveryWidget isLoading={isDashboardLoading} />

              {/* AI Coach */}
              <AICoachWidget isLoading={isDashboardLoading} />

              {/* 6-Week Trend */}
              <WeeklyTrendWidget isLoading={isDashboardLoading} />
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
