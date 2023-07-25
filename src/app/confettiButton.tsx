'use client'

import React from 'react';
import { Button } from '@nextui-org/react';
import confetti from 'canvas-confetti';

export default function ConfettiButton() {
  const handleConfetti = () => {
    confetti();
  };

  return (
    <Button
      auto
      rounded
      ripple={false}
      size="xl"
      onClick={handleConfetti}
      css={{
        boxShadow: '$md',
        position: 'relative',
        overflow: 'visible',
        px: '$18',
        '&:after': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 1,
          borderRadius: '$pill',
          transition: 'all 0.4s ease'
        },
        '&:hover': {
          transform: 'translateY(-5px)',
          '&:after': {
            transform: 'scaleX(1.5) scaleY(1.6)',
            opacity: 0
          }
        },
        '&:active': {
          transform: 'translateY(-2px)'
        }
      }}
    >
      Click me
    </Button>
  );
};