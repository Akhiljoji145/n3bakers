import { createAudioPlayer } from 'expo-audio';

let player = null;

export const playNotificationSound = async () => {
    try {
        if (!player) {
            player = createAudioPlayer(require('../../assets/notification-tone.wav'));
            player.volume = 0.45;
        }

        // expo-audio doesn't auto-reset: seek to start before playing
        player.seekTo(0);
        player.play();
    } catch (error) {
        console.log('Notification sound failed', error);
    }
};
