import { useRef } from 'react';
import styles from './VideoWinButton.module.css';

interface VideoWinButtonProps {
  onOpen: () => void;
}

const VideoWinButton = ({ onOpen }: VideoWinButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <button ref={buttonRef} type="button" onClick={onOpen} className={styles.button} title="Video stream">
      <img src="./icons/VideoStreaming_512.png" alt="" className={styles.icon} />
    </button>
  );
};

export default VideoWinButton;
