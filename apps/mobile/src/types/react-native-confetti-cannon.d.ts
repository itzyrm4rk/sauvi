declare module 'react-native-confetti-cannon' {
  import type { ViewProps } from 'react-native';

  export interface ConfettiCannonProps extends ViewProps {
    count?: number;
    origin?: { x: number; y: number };
    colors?: string[];
    fallSpeed?: number;
    explosionSpeed?: number;
    fadeOut?: boolean;
    autoStart?: boolean;
    autoStartDelay?: number;
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
  }

  export default class ConfettiCannon extends React.Component<ConfettiCannonProps> {
    start: () => void;
  }
}
