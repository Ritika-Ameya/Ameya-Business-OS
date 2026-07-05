import type { ComponentProps } from "react";
import { DialogContent } from "@/shared/ui/dialog";

type DialogContentProps = ComponentProps<typeof DialogContent>;

function isNestedOverlayTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('[data-slot="select-content"]') ||
      target.closest('[data-slot="select-item"]') ||
      target.closest('[data-slot="dropdown-menu-content"]') ||
      target.closest('[role="listbox"]')
  );
}

/** Prevents Radix Dialog from closing when interacting with portaled Select/Dropdown content. */
export const preventNestedOverlayDismiss: Pick<
  DialogContentProps,
  "onPointerDownOutside" | "onInteractOutside"
> = {
  onPointerDownOutside: (event) => {
    if (isNestedOverlayTarget(event.target)) {
      event.preventDefault();
    }
  },
  onInteractOutside: (event) => {
    if (isNestedOverlayTarget(event.target)) {
      event.preventDefault();
    }
  },
};
