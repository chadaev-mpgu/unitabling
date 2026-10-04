import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as ListRow } from './ListRow.vue';
export { default as ListRowDragHandle } from './ListRowDragHandle.vue';
export { default as ListRowDescription } from './ListRowDescription.vue';
export { default as ListRowTitle } from './ListRowTitle.vue';
export { default as ListRowValue } from './ListRowValue.vue';

export const listRowVariants = cva(
  'relative grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-center overflow-hidden rounded-[4px] px-3 py-1 text-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
export type ListRowVariants = VariantProps<typeof listRowVariants>;
