import { db } from '../firebase/database';
import { ref, set } from 'firebase/database';
import api from '../utils/server';

interface HourglassSchedule {
  resources: {
    id: number;
  }[];
  timeslot: {
    start: string;
    end: string;
  };
}

export class CalendarService {
  // Create schedule in both Firebase and Hourglass
  async createSchedule(eventData: any) {
    try {
      // 1. Create in Firebase
      const firebaseEventRef = ref(db, `events/${eventData.id}`);
      await set(firebaseEventRef, eventData);

      // 2. Create in Hourglass
      const hourglassData: HourglassSchedule = {
        resources: [
          {
            id: parseInt(eventData.resources[0].id)
          }
        ],
        timeslot: {
          start: eventData.start,
          end: eventData.end
        }
      };
      const hourglassResponse = await api.post('/api/schedules', hourglassData);

      return {
        firebase: eventData,
        hourglass: hourglassResponse.data
      };
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  // Update schedule status in both systems
  async updateScheduleStatus(scheduleId: string, status: string) {
    try {
      // 1. Update in Firebase
      const firebaseRef = ref(db, `events/${scheduleId}`);
      await set(firebaseRef, { status });

      // 2. Update in Hourglass (only if status is CANCELLED)
      if (status === 'CANCELLED') {
        await api.put(`/api/schedules/${scheduleId}/status`, {
          id: scheduleId,
          status: "CANCELLED"
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  }
}

export default new CalendarService();