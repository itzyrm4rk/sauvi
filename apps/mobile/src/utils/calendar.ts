import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import { Toast } from '../components/ui/toastConfig';

/**
 * Ouvre l'application Calendrier native avec un événement pré-rempli PRÊT À ENREGISTRER.
 *
 * Android :
 *   1. Tente l'URL Google Calendar (https://calendar.google.com/calendar/r/eventedit?...)
 *      qui ouvre un formulaire pré-rempli dans Google Agenda (app native ou navigateur).
 *   2. Fallback : intent Android INSERT avec tous les champs.
 *   3. Fallback final : content:// pour ouvrir l'agenda sur la bonne date.
 *
 * iOS :
 *   Génère un fichier .ics intercepté nativement par Apple Calendar → une seule pression "Ajouter".
 */
export async function openNativeCalendar(
  date: Date,
  title: string,
  description: string,
): Promise<void> {
  const eventDate = new Date(date);
  eventDate.setHours(9, 0, 0, 0);

  if (Platform.OS === 'android') {
    // ── Méthode 1 : Google Calendar URL (formulaire pré-rempli, bouton Enregistrer visible) ──
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const year = eventDate.getFullYear();
    const month = pad(eventDate.getMonth() + 1);
    const day = pad(eventDate.getDate());
    // Format attendu par Google Calendar : YYYYMMDDTHHmmssZ
    const dtStart = `${year}${month}${day}T090000`;
    const dtEnd = `${year}${month}${day}T100000`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${dtStart}/${dtEnd}&sf=true&output=xml`;

    try {
      const canOpen = await Linking.canOpenURL(googleCalendarUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(googleCalendarUrl);
        return;
      }
    } catch {
      // Continuer vers fallback
    }

    // ── Méthode 2 : Intent Android natif INSERT (Samsung, MIUI, AOSP Calendar…) ──
    const startTime = eventDate.getTime();
    const endTime = startTime + 60 * 60 * 1000;
    const intentUrl = `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir%2Fevent;S.title=${encodeURIComponent(title)};S.description=${encodeURIComponent(description)};l.beginTime=${startTime};l.endTime=${endTime};end`;

    try {
      await Linking.openURL(intentUrl);
      return;
    } catch {
      // Continuer vers fallback
    }

    // ── Méthode 3 : Ouvrir l'agenda directement à la date ──
    const calDateUrl = `content://com.android.calendar/time/${eventDate.getTime()}`;
    try {
      await Linking.openURL(calDateUrl);
      return;
    } catch {
      Toast.show({
        type: 'info',
        text1: 'Calendrier',
        text2: "Aucune application Agenda n'a pu être ouverte sur cet appareil.",
      });
    }
  } else {
    // ── iOS : fichier .ics intercepté nativement par Apple Calendar ──
    try {
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      const year = eventDate.getFullYear();
      const month = pad(eventDate.getMonth() + 1);
      const day = pad(eventDate.getDate());

      const dtStart = `${year}${month}${day}T090000`;
      const dtEnd = `${year}${month}${day}T100000`;
      const uid = `sauvi-${Date.now()}@sauvi.app`;

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SAUVI//Don de sang//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        "DESCRIPTION:Rappel : vous pouvez donner votre sang aujourd'hui !",
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const file = new File(Paths.cache, `prochain_don_${Date.now()}.ics`);
      file.write(icsContent);

      await Sharing.shareAsync(file.uri, {
        UTI: 'public.calendar-event',
        mimeType: 'text/calendar',
      });
    } catch {
      // Fallback iOS : ouvrir Apple Calendar
      const calshowUrl = 'calshow:';
      const canOpen = await Linking.canOpenURL(calshowUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(calshowUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: "Impossible d'ouvrir l'agenda sur cet appareil.",
        });
      }
    }
  }
}

export const exportToCalendarICS = openNativeCalendar;
export const addToCalendar = openNativeCalendar;
