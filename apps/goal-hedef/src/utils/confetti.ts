import confetti from 'canvas-confetti';

export const triggerGoalCelebration = () => {
  // Sol taraftan konfeti
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.1, y: 0.8 },
    colors: ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f43f5e']
  });

  // Sağ taraftan konfeti
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.9, y: 0.8 },
    colors: ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f43f5e']
  });
};

export const triggerSmallCelebration = (xRatio = 0.5, yRatio = 0.5) => {
  confetti({
    particleCount: 35,
    spread: 45,
    origin: { x: xRatio, y: yRatio },
    colors: ['#10b981', '#34d399', '#6ee7b7']
  });
};
