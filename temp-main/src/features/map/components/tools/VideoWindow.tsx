import { useEffect, useRef, useState } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import styles from './VideoWindow.module.css';

interface VideoPlayerProps {
  wsUrl?: string;
  isOpen: boolean;
}

interface JsmpegPlayerInstance {
  destroy: () => void;
}

const VideoPlayer = ({ wsUrl = 'ws://localhost:9001', isOpen }: VideoPlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<JsmpegPlayerInstance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setLoading(true);
      return;
    }
    if (!canvasRef.current) return;
    const player = new JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
      loop: true,
      onVideoDecode: () => setLoading(false),
    }) as JsmpegPlayerInstance;
    playerRef.current = player;
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen, wsUrl]);

  if (!isOpen) return null;

  return (
    <div className={styles.dock}>
      {loading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      ) : null}
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={640} height={360} className={styles.canvas} />
      </div>
    </div>
  );
};

export default VideoPlayer;
