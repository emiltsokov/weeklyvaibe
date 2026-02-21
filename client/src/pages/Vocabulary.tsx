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
  Badge,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { AppHeader } from '../components/AppHeader';

interface Term {
  id: string;
  name: string;
  abbreviation: string;
  tagline: string;
  icon: string;
  color: string;
  formula?: string;
  unit?: string;
  description: string;
  science: string;
  example: string;
  ranges: { label: string; value: string; color: string }[];
}

const terms: Term[] = [
  {
    id: 'tss',
    name: 'Training Stress Score',
    abbreviation: 'TSS',
    tagline: 'How hard was your workout?',
    icon: '🔥',
    color: 'orange',
    formula: 'TSS = (duration × IF² × 100) / FTP',
    unit: 'points',
    description:
      'Training Stress Score quantifies the overall training load of a single workout. It combines duration and intensity into a single number, making it easy to compare different types of sessions.',
    science:
      'Developed by Dr. Andrew Coggan, TSS is based on Normalized Power (NP) and Functional Threshold Power (FTP). A workout at your FTP for exactly one hour produces a TSS of 100. The score accounts for the non-linear physiological cost of intensity — efforts above threshold are weighted more heavily than easy efforts.',
    example:
      'A 1-hour easy ride might score TSS 40, while a 1-hour race-effort ride could score TSS 120+. A 2-hour moderate ride might be TSS 100.',
    ranges: [
      { label: 'Recovery', value: '< 150 / week', color: 'green' },
      { label: 'Moderate', value: '150–300 / week', color: 'blue' },
      { label: 'High', value: '300–450 / week', color: 'yellow' },
      { label: 'Very High', value: '> 450 / week', color: 'red' },
    ],
  },
  {
    id: 'ctl',
    name: 'Chronic Training Load',
    abbreviation: 'CTL',
    tagline: 'Your long-term fitness trend',
    icon: '📈',
    color: 'purple',
    formula: 'CTL = exponentially weighted avg of daily TSS over ~42 days',
    unit: 'TSS/day',
    description:
      'Chronic Training Load represents your fitness — the rolling average of your training stress over approximately 6 weeks. It reflects accumulated training adaptations and general readiness.',
    science:
      'CTL uses an exponentially weighted moving average (EWMA) with a time constant of 42 days. Each day\'s TSS is weighted, with more recent days having slightly more influence. This models how the body retains fitness — adaptations build slowly over weeks of consistent training but decay without continued stimulus. A higher CTL means you have a larger "fitness bank" to draw from.',
    example:
      'A recreational athlete might have a CTL of 30–50, a competitive amateur 60–90, and a professional cyclist 100–150+.',
    ranges: [
      { label: 'Beginner', value: '< 40', color: 'green' },
      { label: 'Intermediate', value: '40–70', color: 'blue' },
      { label: 'Competitive', value: '70–100', color: 'purple' },
      { label: 'Elite', value: '> 100', color: 'orange' },
    ],
  },
  {
    id: 'atl',
    name: 'Acute Training Load',
    abbreviation: 'ATL',
    tagline: 'Your recent fatigue level',
    icon: '⚡',
    color: 'yellow',
    formula: 'ATL = exponentially weighted avg of daily TSS over ~7 days',
    unit: 'TSS/day',
    description:
      'Acute Training Load represents your fatigue — the rolling average of your training stress over approximately 7 days. It reflects the immediate physiological cost of recent training.',
    science:
      'ATL uses an exponentially weighted moving average with a 7-day time constant, capturing short-term training load. When ATL is much higher than CTL, you are accumulating fatigue faster than your body can adapt. The body\'s acute response to training includes glycogen depletion, muscle micro-damage, hormonal shifts, and nervous system fatigue — all of which dissipate within days of rest.',
    example:
      'After a hard training block your ATL might spike to 120, while your CTL stays at 70. After a rest week, ATL could drop to 40 while CTL only drops slightly to 65.',
    ranges: [
      { label: 'Rested', value: '< 50', color: 'green' },
      { label: 'Moderate', value: '50–80', color: 'blue' },
      { label: 'Fatigued', value: '80–120', color: 'yellow' },
      { label: 'Overreaching', value: '> 120', color: 'red' },
    ],
  },
  {
    id: 'tsb',
    name: 'Training Stress Balance',
    abbreviation: 'TSB',
    tagline: 'Are you fresh or fatigued?',
    icon: '⚖️',
    color: 'blue',
    formula: 'TSB = CTL − ATL (yesterday\'s values)',
    unit: 'points',
    description:
      'Training Stress Balance is the difference between your fitness (CTL) and fatigue (ATL). It indicates your current form — whether you are fresh enough to perform at your best or carrying too much fatigue.',
    science:
      'TSB is based on the Impulse-Response model from Banister (1975). The key insight is that both fitness and fatigue are responses to training, but fatigue dissipates faster. Peak performance occurs when fitness is high but fatigue has been shed — typically TSB between +10 and +25. This is the principle behind tapering: you reduce training to let fatigue fall while fitness remains elevated.',
    example:
      'During heavy training, TSB might be −20 (fatigued). After a taper week, TSB rises to +15 — the ideal "race-ready" zone. A TSB of +30 or more means you may be losing fitness.',
    ranges: [
      { label: 'Overreaching', value: '< −30', color: 'red' },
      { label: 'Training', value: '−30 to −10', color: 'yellow' },
      { label: 'Optimal', value: '−10 to +15', color: 'green' },
      { label: 'Detraining', value: '> +25', color: 'gray' },
    ],
  },
  {
    id: 'suffer-score',
    name: 'Suffer Score',
    abbreviation: 'Suffer Score',
    tagline: 'Strava\'s heart-rate effort metric',
    icon: '💔',
    color: 'red',
    unit: 'points',
    description:
      'Suffer Score is Strava\'s proprietary measure of how hard an activity was based on heart rate data. It weights time spent in higher heart rate zones more heavily than lower zones.',
    science:
      'The score is calculated by dividing your heart rate into five zones (based on your max HR). Time in each zone is multiplied by a zone-specific weighting factor — Zone 1 contributes very little, while Zone 5 contributes significantly. The weighted values are summed to produce the final score. This reflects the exponential increase in metabolic cost and recovery demand as intensity rises.',
    example:
      'An easy 30-minute jog might score 15–25. A hard 1-hour interval session could score 80–120. A marathon or century ride can exceed 200+.',
    ranges: [
      { label: 'Easy', value: '0–50', color: 'green' },
      { label: 'Moderate', value: '50–100', color: 'blue' },
      { label: 'Tough', value: '100–200', color: 'orange' },
      { label: 'Extreme', value: '> 200', color: 'red' },
    ],
  },
  {
    id: 'zone-distribution',
    name: 'Heart Rate Zone Distribution',
    abbreviation: 'HR Zones',
    tagline: 'Where you spend your effort',
    icon: '❤️',
    color: 'pink',
    unit: '% of time',
    description:
      'Heart rate zones divide your effort into five intensity bands based on your maximum heart rate. Tracking zone distribution helps ensure the right mix of easy and hard training.',
    science:
      'The five-zone model is based on physiological thresholds. Zone 1–2 (< 75% max HR) uses primarily aerobic fat metabolism. Zone 3 (75–85%) is the tempo zone near the ventilatory threshold. Zone 4 (85–95%) is near the lactate threshold where blood lactate begins accumulating. Zone 5 (> 95%) is VO₂max effort. The 80/20 rule — 80% low intensity, 20% high intensity — is supported by research on elite endurance athletes.',
    example:
      'Zone 1: < 60% max HR (recovery) | Zone 2: 60–70% (endurance) | Zone 3: 70–80% (tempo) | Zone 4: 80–90% (threshold) | Zone 5: 90–100% (VO₂max)',
    ranges: [
      { label: 'Zone 1', value: '< 60% max HR', color: 'gray' },
      { label: 'Zone 2', value: '60–70%', color: 'blue' },
      { label: 'Zone 3', value: '70–80%', color: 'green' },
      { label: 'Zone 4', value: '80–90%', color: 'yellow' },
      { label: 'Zone 5', value: '90–100%', color: 'red' },
    ],
  },
  {
    id: 'recovery-status',
    name: 'Recovery Status',
    abbreviation: 'Recovery',
    tagline: 'When can you train hard again?',
    icon: '🔋',
    color: 'green',
    description:
      'Recovery Status estimates how ready you are for the next hard effort based on your most recent activity, its intensity, and the time elapsed since. It helps prevent overtraining by recommending rest or easy days.',
    science:
      'Recovery is multi-factorial: muscle glycogen replenishment takes 24–48 hours, muscle fiber repair 48–72 hours, and nervous system recovery can take even longer after maximal efforts. High-intensity work (Zone 4–5) causes disproportionate fatigue compared to time spent. The algorithm considers the ratio of high-intensity to total effort and time since last workout to estimate recovery state.',
    example:
      '🟢 Ready to Train: 48+ hours since last hard session, low Z4/5 percentage. 🟡 Light Day: recent moderate effort, some fatigue. 🔴 Rest Day: recent high-intensity session, insufficient recovery time.',
    ranges: [
      { label: '🟢 Ready', value: 'Go hard!', color: 'green' },
      { label: '🟡 Light', value: 'Easy effort only', color: 'yellow' },
      { label: '🔴 Rest', value: 'Recovery needed', color: 'red' },
    ],
  },
];

function TermVisual({ term }: { term: Term }) {
  if (term.id === 'tsb') {
    return (
      <Flex justify="center" gap={4} py={4} wrap="wrap">
        {term.ranges.map((r) => (
          <VStack key={r.label} spacing={1}>
            <CircularProgress
              value={
                r.label === 'Overreaching'
                  ? 15
                  : r.label === 'Training'
                    ? 45
                    : r.label === 'Optimal'
                      ? 75
                      : 95
              }
              size="70px"
              color={`${r.color}.400`}
              thickness="10px"
              trackColor="gray.700"
            >
              <CircularProgressLabel fontSize="xs" color="white" fontWeight="bold">
                {r.label === 'Overreaching'
                  ? '−30'
                  : r.label === 'Training'
                    ? '−15'
                    : r.label === 'Optimal'
                      ? '+5'
                      : '+30'}
              </CircularProgressLabel>
            </CircularProgress>
            <Text fontSize="xs" color={`${r.color}.300`} fontWeight="medium">
              {r.label}
            </Text>
          </VStack>
        ))}
      </Flex>
    );
  }

  if (term.id === 'zone-distribution') {
    const zones = [
      { pct: 10, label: 'Z1', color: 'gray' },
      { pct: 40, label: 'Z2', color: 'blue' },
      { pct: 25, label: 'Z3', color: 'green' },
      { pct: 15, label: 'Z4', color: 'yellow' },
      { pct: 10, label: 'Z5', color: 'red' },
    ];
    return (
      <VStack spacing={2} py={4} w="full">
        {zones.map((z) => (
          <HStack key={z.label} w="full" spacing={3}>
            <Text fontSize="xs" color="gray.300" w="24px" textAlign="right">
              {z.label}
            </Text>
            <Box flex={1}>
              <Progress
                value={z.pct}
                size="sm"
                colorScheme={z.color}
                borderRadius="full"
                bg="gray.700"
              />
            </Box>
            <Text fontSize="xs" color="gray.400" w="30px">
              {z.pct}%
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  }

  return (
    <Flex justify="center" gap={3} py={4} wrap="wrap">
      {term.ranges.map((r) => (
        <Badge
          key={r.label}
          colorScheme={r.color}
          px={3}
          py={1}
          borderRadius="md"
          fontSize="xs"
        >
          {r.label}: {r.value}
        </Badge>
      ))}
    </Flex>
  );
}

function TermCard({ term }: { term: Term }) {
  return (
    <Card id={term.id} scrollMarginTop="80px">
      <CardHeader pb={2}>
        <HStack justify="space-between" align="start">
          <HStack spacing={3}>
            <Text fontSize="2xl">{term.icon}</Text>
            <VStack align="start" spacing={0}>
              <HStack spacing={2}>
                <Heading size="sm" color="white">
                  {term.name}
                </Heading>
                <Badge colorScheme={term.color} fontSize="xs" variant="solid">
                  {term.abbreviation}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.400">
                {term.tagline}
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        {/* Visual */}
        <TermVisual term={term} />

        <Divider borderColor="gray.700" my={3} />

        {/* Description */}
        <Text color="gray.300" fontSize="sm" lineHeight="tall" mb={3}>
          {term.description}
        </Text>

        {/* Formula if present */}
        {term.formula && (
          <Box bg="gray.700" borderRadius="md" p={3} mb={3}>
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.400" fontWeight="semibold">
                Formula:
              </Text>
              <Text fontSize="sm" color="purple.300" fontFamily="mono" fontWeight="medium">
                {term.formula}
              </Text>
            </HStack>
          </Box>
        )}

        {/* Science explanation accordion */}
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton
              px={0}
              _hover={{ bg: 'transparent' }}
              _expanded={{ color: 'purple.300' }}
            >
              <HStack flex="1">
                <Text fontSize="sm" fontWeight="semibold" color="purple.400">
                  🔬 The Science
                </Text>
              </HStack>
              <AccordionIcon color="purple.400" />
            </AccordionButton>
            <AccordionPanel px={0} pb={2}>
              <Text color="gray.400" fontSize="sm" lineHeight="tall">
                {term.science}
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Example */}
        <Box
          bg={`${term.color}.900`}
          borderRadius="md"
          p={3}
          mt={2}
          borderWidth="1px"
          borderColor={`${term.color}.700`}
        >
          <Text fontSize="xs" color={`${term.color}.300`} fontWeight="semibold" mb={1}>
            💡 Example
          </Text>
          <Text fontSize="sm" color="gray.300" lineHeight="tall">
            {term.example}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
}

export function Vocabulary() {
  return (
    <Box minH="100vh" bg="gray.900">
      <AppHeader />

      <Container maxW="6xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Page Header */}
          <Box textAlign="center" mb={2}>
            <Heading
              size="lg"
              bgGradient="linear(to-r, brand.400, accent.400)"
              bgClip="text"
              mb={2}
            >
              📖 Training Vocabulary
            </Heading>
            <Text color="gray.400" fontSize="md" maxW="lg" mx="auto">
              Understand the key metrics that power your training insights. Each term is explained
              with real science and practical examples.
            </Text>
          </Box>

          {/* How They Connect */}
          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Heading size="sm" color="white">
                  🔗 How These Metrics Connect
                </Heading>
                <Text color="gray.400" fontSize="sm" lineHeight="tall" textAlign="center" maxW="2xl">
                  Each workout generates a <Badge colorScheme="orange">TSS</Badge>. Your daily TSS
                  values feed into <Badge colorScheme="purple">CTL</Badge> (fitness, 42-day average)
                  and <Badge colorScheme="yellow">ATL</Badge> (fatigue, 7-day average). The difference
                  between them is your <Badge colorScheme="blue">TSB</Badge> (form). When TSB is
                  positive, you're fresh; when negative, you're carrying fatigue. Your{' '}
                  <Badge colorScheme="red">Suffer Score</Badge> and{' '}
                  <Badge colorScheme="pink">HR Zones</Badge> add detail to each session, while{' '}
                  <Badge colorScheme="green">Recovery Status</Badge> translates everything into an
                  actionable recommendation.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Term Cards */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
            {terms.map((term) => (
              <GridItem key={term.id}>
                <TermCard term={term} />
              </GridItem>
            ))}
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}
