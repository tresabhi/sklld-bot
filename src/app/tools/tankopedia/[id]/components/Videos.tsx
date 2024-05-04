import { Flex, Heading, Link, Separator } from '@radix-ui/themes';
import { use } from 'react';
import PageWrapper from '../../../../../components/PageWrapper';
import { videoDefinitions } from '../../../../../core/blitzkit/videos';
import { useFullScreen } from '../../../../../hooks/useFullScreen';
import { useDuel } from '../../../../../stores/duel';

export function Videos() {
  const isFullScreen = useFullScreen();
  const tank = useDuel((state) => state.protagonist!.tank);
  const awaitedVideoDefinitions = use(videoDefinitions);
  const videos = awaitedVideoDefinitions[tank.id]?.videos ?? [];

  if (isFullScreen || videos.length === 0) return null;

  return (
    <PageWrapper>

      <Flex direction="column" gap="4" mt="4" align="start">
        <Heading size="6">Review videos</Heading>

        <Flex gap="3" wrap="wrap">
          {videos.map((video) => (
            <Link
              key={video}
              href={`https://www.youtube.com/watch?v=${video}`}
              target="_blank"
            >
              <img
                src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`}
                style={{
                  aspectRatio: '16 / 9',
                  objectFit: 'cover',
                  height: 128,
                  borderRadius: 8,
                }}
              />
            </Link>
          ))}
        </Flex>
      </Flex>
    </PageWrapper>
  );
}
