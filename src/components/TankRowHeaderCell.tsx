import { IconButton, Table } from '@radix-ui/themes';
import { TankDefinition } from '../core/blitzkit/tankDefinitions';
import { tankIcon } from '../core/blitzkit/tankIcon';
import { classIcons } from './ClassIcon';
import { Link } from './Link';
import { ScienceIcon } from './ScienceIcon';

interface TankRowHeaderCellProps {
  tank: TankDefinition;
}

export function TankRowHeaderCell({ tank }: TankRowHeaderCellProps) {
  const Icon = classIcons[tank.class];

  return (
    <Table.RowHeaderCell style={{ display: 'flex' }}>
      <Link href={`/tools/tankopedia/${tank.id}`} tabIndex={-1}>
        <img
          alt={tank.name}
          draggable={false}
          src={tankIcon(tank.id)}
          style={{
            margin: 'calc(-1 * var(--table-cell-padding)) 0',
            height: 'calc(100% + 2 * var(--table-cell-padding))',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
          }}
        />
      </Link>

      <Link
        color={
          tank.treeType === 'collector'
            ? 'blue'
            : tank.treeType === 'premium'
              ? 'amber'
              : 'gray'
        }
        highContrast={tank.treeType === 'researchable'}
        underline="hover"
        wrap="nowrap"
        href={`/tools/tankopedia/${tank.id}`}
        style={{
          paddingLeft: 'var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}
      >
        <Icon width="1em" height="1em" />

        {tank.name}

        {tank.testing && (
          <IconButton size="1" ml="1">
            <ScienceIcon style={{ width: '1em', height: '1em' }} />
          </IconButton>
        )}
      </Link>
    </Table.RowHeaderCell>
  );
}