import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type Socket, io } from 'socket.io-client';
import { Toast } from '../components/ui/toastConfig';
import { env } from '../config/env';
import type { DonorWaitlistItem } from '../store/api/sosApi';
import type { RootState } from '../store/index';

const baseUrl = env.EXPO_PUBLIC_API_URL.replace('/api', '');
const SOCKET_URL = `${baseUrl}/sos`;

export function useSosWaitlist(sosId: string) {
  const [waitlist, setWaitlist] = useState<DonorWaitlistItem[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (!token || !sosId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', sosId);
    });

    newSocket.on('waitlist:update', (data: { sosId: string; waitlist: DonorWaitlistItem[] }) => {
      if (data.sosId === sosId) {
        setWaitlist(data.waitlist);
      }
    });

    newSocket.on(
      'sos:donor_joined',
      (data: { sosId: string; donor: { id?: string; name?: string; bloodType?: string } }) => {
        if (data.sosId === sosId) {
          const donorName = data.donor?.name || 'Un donneur';
          const bloodType = data.donor?.bloodType ? ` (${data.donor.bloodType})` : '';
          Toast.show({
            type: 'success',
            text1: 'Nouveau donneur disponible !',
            text2: `${donorName}${bloodType} vient de rejoindre la file d'attente.`,
          });
        }
      },
    );

    newSocket.on('sos:closed', (data: { sosId: string }) => {
      if (data.sosId === sosId) {
        Toast.show({
          type: 'info',
          text1: 'Information',
          text2: 'Ce SOS a été clôturé par le demandeur.',
        });
      }
    });

    newSocket.on('sos:expired', (data: { sosId: string }) => {
      if (data.sosId === sosId) {
        Toast.show({
          type: 'info',
          text1: 'Alerte expirée',
          text2: 'Ce SOS a atteint sa date limite et est désormais expiré.',
        });
      }
    });
    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket SOS:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_room', sosId);
      newSocket.disconnect();
    };
  }, [sosId, token]);

  return { waitlist, socket, setWaitlist };
}
