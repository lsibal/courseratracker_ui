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
  async createSchedule(eventData: any) {
    try {
      console.log('Creating schedule with data:', eventData); // Debug log

      // Get the resource ID directly from the resources array
      const resourceId = eventData.resources[0]?.id;
      console.log('Resource ID extracted:', resourceId); // Debug log

      if (!resourceId || isNaN(resourceId)) {
        throw new Error('Invalid resource ID. Please select a valid course.');
      }

      // Create in Firebase
      const firebaseData = {
        ...eventData,
        status: 'CREATED'
      };

      const firebaseEventRef = ref(db, `events/${eventData.id}`);
      await set(firebaseEventRef, firebaseData);

      // Create in Hourglass with exact format
      const hourglassData = {
        resources: [{ 
          id: resourceId // Using the numeric ID
        }],
        timeslot: {
          start: eventData.start,
          end: eventData.end
        }
      };

      console.log('Sending to Hourglass:', hourglassData); // Debug log
      const hourglassResponse = await api.post('/api/schedules', hourglassData);

      return {
        firebase: firebaseData,
        hourglass: hourglassResponse.data
      };
    } catch (error) {
      console.error('Error in createSchedule:', error);
      throw error;
    }
  }

  async updateScheduleStatus(scheduleId: string, status: string) {
    try {
      console.log('Updating schedule status:', { scheduleId, status });

      // 1. Update Firebase
      const firebaseRef = ref(db, `events/${scheduleId}`);
      await set(firebaseRef, { status });

      // 2. Update Hourglass - Use the numeric schedule ID
      if (status === 'CANCELLED') {
        // Remove any 'event_' prefix if present and convert to number
        const cleanId = scheduleId.replace('event_', '');
        const hourglassData = {
          id: parseInt(cleanId),
          status: "CANCELLED"
        };

        console.log('Sending cancellation to Hourglass:', hourglassData);
        await api.put(`/api/schedules/${cleanId}/status`, hourglassData);
      }

      return true;
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  }
}

export default new CalendarService();