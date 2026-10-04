import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Sidebar } from './Sidebar.vue';
export { default as SidebarGroup } from './SidebarGroup.vue';
export { default as SidebarItem } from './SidebarItem.vue';
export { default as SidebarSeparator } from './SidebarSeparator.vue';

export const sidebarItemVariants = cva(
  'relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      active: {
        true: 'bg-primary-subtle text-primary hover:bg-primary-subtle/90',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
export type SidebarItemVariants = VariantProps<typeof sidebarItemVariants>;
