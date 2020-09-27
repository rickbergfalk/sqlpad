import { Dialog } from '@reach/dialog';
import CloseIcon from 'mdi-react/CloseIcon';
import React from 'react';
import styles from './Modal.module.css';
import IconButton from './IconButton';

export interface Props extends React.HTMLAttributes<HTMLElement> {
  title: string;
  visible?: boolean;
  onClose?: () => void;
  width: string | number;
}

function Modal({ title, visible, onClose, width, children }: Props) {
  if (visible) {
    return (
      <Dialog
        aria-label={title}
        onDismiss={onClose}
        className={styles.Dialog}
        style={{
          width,
        }}
      >
        <div className={styles.titleWrapper}>
          <span>{title}</span>
          {onClose && (
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
        <div className={styles.dialogBody}>{children}</div>
      </Dialog>
    );
  }
  return null;
}

export default Modal;
