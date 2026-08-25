import { Dialog as DialogPrimitive } from 'bits-ui';
import Content from './dialog-content.svelte';
import Description from './dialog-description.svelte';
import Overlay from './dialog-overlay.svelte';
import Title from './dialog-title.svelte';

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;

export {
  Close,
  Content,
  Description,
  Close as DialogClose,
  Content as DialogContent,
  Description as DialogDescription,
  Overlay as DialogOverlay,
  Title as DialogTitle,
  Trigger as DialogTrigger,
  Overlay,
  //
  Root as Dialog,
  Root,
  Title,
  Trigger,
};
