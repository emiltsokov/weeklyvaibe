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
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { useAuth, useDashboard, useSyncMutation, useLogout, type WeekComparison } from '../lib/api';

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
          <StatLabel color="gray.500" fontSize="sm">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl">
            {value}
            {unit && (
              <Text as="span" fontSize="md" color="gray.500" ml={1}>
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
          <Text fontSize="sm" color="gray.500">
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
          <Box mt={4} p={4} bg="orange.50" borderRadius="md">
            <HStack justify="space-between">
              <Text fontWeight="medium" color="orange.700">
                Total Suffer Score
              </Text>
              <Badge colorScheme="orange" fontSize="lg" px={3} py={1}>
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
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {activity.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(activity.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={typeColors[activity.type] || 'gray'} fontSize="xs">
                      {activity.type}
                    </Badge>
                  </Td>
                  <Td isNumeric fontSize="sm">
                    {activity.distance} km
                  </Td>
                  <Td isNumeric fontSize="sm">
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
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" shadow="sm" py={4}>
        <Container maxW="6xl">
          <Flex align="center">
            <HStack spacing={4}>
              <Heading size="md" color="brand.500">
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
            <WeeklySummarySection
              weekComparison={dashboard?.weekComparison}
              isLoading={isDashboardLoading}
            />
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* All-time stats */}
              <Card>
                <CardBody>
                  <HStack justify="space-around">
                    <Stat textAlign="center">
                      <StatLabel>Total Activities</StatLabel>
                      <StatNumber>{dashboard?.athlete.totalActivitiesAllTime ?? '-'}</StatNumber>
                    </Stat>
                    <Stat textAlign="center">
                      <StatLabel>Total Distance</StatLabel>
                      <StatNumber>
                        {dashboard?.athlete.totalDistanceAllTime ?? '-'}
                        <Text as="span" fontSize="md" color="gray.500">
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
