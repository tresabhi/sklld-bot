import { Button, Text } from '@radix-ui/themes';
import { CSSProperties, ComponentProps } from 'react';
import { asset } from '../core/blitzkrieg/asset';

type ModuleButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
  selected?: boolean;
  first?: boolean;
  last?: boolean;
  rowChild?: boolean;
  discriminator?: string;
} & (
    | {
        type: 'module';
        module: string;
      }
    | {
        type: 'shell';
        shell: string;
      }
    | {
        type: 'equipment';
        equipment: number;
      }
    | {
        type: 'consumable';
        consumable: number;
      }
    | {
        type: 'camouflage';
      }
  );

export function ModuleButton({
  selected,
  style,
  first = false,
  last = false,
  rowChild,
  discriminator,
  disabled,
  ...props
}: ModuleButtonProps) {
  const imageStyles: CSSProperties = {
    width: 32,
    height: 32,
    position: 'absolute',
    opacity: disabled ? 0.5 : 1,
    transform: 'scale(0.75)',
  };

  if (props.type === 'module') {
    imageStyles.top = '50%';
    imageStyles.left = '50%';
    imageStyles.transform = 'translate(calc(-50% + 2px), calc(-50% + 2px))';
  } else if (props.type === 'camouflage') {
    imageStyles.top = '50%';
    imageStyles.left = '50%';
    imageStyles.transform = 'translate(calc(-50% + 4px), calc(-50% + 4px))';
  }

  return (
    <Button
      disabled={disabled}
      radius="medium"
      color={selected ? undefined : 'gray'}
      variant={selected ? 'surface' : 'soft'}
      style={{
        padding: 0,
        width: 48,
        height: 40,
        position: 'relative',
        borderTopLeftRadius: first ? undefined : 0,
        borderTopRightRadius: last ? undefined : 0,
        borderBottomLeftRadius: first ? undefined : 0,
        borderBottomRightRadius: last ? undefined : 0,
        margin: rowChild ? -0.5 : 'unset',
        ...style,
      }}
      {...(props as unknown as ComponentProps<typeof Button>)}
    >
      <img
        draggable={false}
        src={asset(
          props.type === 'module'
            ? `icons/modules/${props.module}.webp`
            : props.type === 'shell'
              ? `icons/shells/${props.shell}.webp`
              : props.type === 'consumable'
                ? `icons/consumables/${props.consumable}.webp`
                : props.type === 'camouflage'
                  ? `icons/camo.webp`
                  : `icons/equipment/${props.equipment}.webp`,
        )}
        style={imageStyles}
      />
      {discriminator !== undefined && (
        <Text
          size="1"
          weight="bold"
          style={{
            zIndex: 1,
            position: 'absolute',
            top: '50%',
            right: 8,
            textAlign: 'right',
          }}
        >
          {discriminator}
        </Text>
      )}
    </Button>
  );
}
