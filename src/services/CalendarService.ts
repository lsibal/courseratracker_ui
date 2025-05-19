import { db } from '../firebase/database';
import { ref, set, get } from 'firebase/database';
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
      
      // Update Firebase with Hourglass schedule ID
      const hourglassSchedule = hourglassResponse.data;
      const firebaseDataWithId = {
        ...firebaseData,
        hourglassId: hourglassSchedule.id // Store Hourglass ID
      };

      await set(firebaseEventRef, firebaseDataWithId);

      return {
        firebase: firebaseDataWithId,
        hourglass: hourglassSchedule
      };
    } catch (error) {
      console.error('Error in createSchedule:', error);
      throw error;
    }
  }

  async updateScheduleStatus(scheduleId: string, status: string) {
    try {
      console.log('Updating schedule status:', { scheduleId, status });

      // Get the hourglass ID from Firebase first
      const eventRef = ref(db, `events/${scheduleId}`);
      const eventSnapshot = await get(eventRef);
      const eventData = eventSnapshot.val();
      
      if (!eventData?.hourglassId) {
        throw new Error('No Hourglass ID found for this schedule');
      }

      // Update Firebase
      await set(eventRef, { ...eventData, status });

      // Update Hourglass using the stored ID
      if (status === 'CANCELLED') {
        const hourglassData = {
          id: eventData.hourglassId,
          status: "CANCELLED"
        };

        await api.put(`/api/schedules/${eventData.hourglassId}/status`, hourglassData);
      }

      return true;
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  }
}

export default new CalendarService();