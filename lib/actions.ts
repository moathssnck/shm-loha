

export const playNotificationSound = () => {
    const audio=new Audio('/ringtone-you-would-be-glad-to-know.mp3')
    if (audio) {
      audio!.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }
  };
