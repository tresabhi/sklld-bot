import { PageWrapper } from '../../../components/PageWrapper';
import { TierListTiles } from '../../../components/TierList/Tiles';
import { TierListTable } from '../../../components/TierList/Table';
import { TankopediaPersistent } from '../../../stores/tankopediaPersistent';

export function Page() {
  return (
    <TankopediaPersistent.Provider>
      <Content />
    </TankopediaPersistent.Provider>
  );
}

function Content() {
  return (
    <PageWrapper color="orange">
      <TierListTable />
      <TierListTiles />
    </PageWrapper>
  );
}