import { db } from '../firebase/database';
import { ref, set, get, remove, query, orderByChild, equalTo, onValue } from 'firebase/database';
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
  // Check if a slot is already booked for date range
  async checkSlotAvailability(slotNumber: string, startDate: string, endDate: string, excludeEventId?: string) {
    console.log(`Checking availability for slot ${slotNumber} from ${startDate} to ${endDate}, excluding ${excludeEventId}`);
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        // Get all events in this slot
        const eventsRef = ref(db, 'events');
        const slotQuery = query(eventsRef, orderByChild('slotNumber'), equalTo(slotNumber));
        
        onValue(slotQuery, (snapshot) => {
          let isAvailable = true;
          
          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            
            // Skip the current event being edited
            if (excludeEventId && event.id === excludeEventId) {
              return;
            }
            
            // Convert dates for comparison
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();
            const newStart = new Date(startDate).getTime();
            const newEnd = new Date(endDate).getTime();
            
            // Check for overlap
            const hasOverlap = (
              (newStart >= eventStart && newStart <= eventEnd) || // New start date falls within existing event
              (newEnd >= eventStart && newEnd <= eventEnd) ||     // New end date falls within existing event
              (newStart <= eventStart && newEnd >= eventEnd)      // New event completely encompasses existing event
            );
            
            if (hasOverlap) {
              console.log(`Overlap detected with event ${event.id}: ${event.title}`);
              isAvailable = false;
            }
          });
          
          resolve(isAvailable);
        }, {
          onlyOnce: true
        });
      } catch (error) {
        console.error('Error checking slot availability:', error);
        reject(error);
      }
    });
  }

  async createSchedule(eventData: any) {
    try {
      console.log('Creating schedule with data:', eventData);

      // Get the resource ID directly from the resources array
      const resourceId = eventData.resources[0]?.id;
      console.log('Resource ID extracted:', resourceId);

      if (!resourceId || isNaN(resourceId)) {
        throw new Error('Invalid resource ID. Please select a valid course.');
      }
      
      // First, check if the slot is available for these dates
      const isAvailable = await this.checkSlotAvailability(
        eventData.slotNumber,
        eventData.start,
        eventData.end,
        eventData.id // Exclude this event if we're editing
      );
      
      if (!isAvailable) {
        throw new Error(`Slot ${eventData.slotNumber} is already booked for the selected dates. Please choose different dates or a different slot.`);
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

      console.log('Sending to Hourglass:', hourglassData);
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

      // If status is CANCELLED, update Hourglass first then remove from Firebase
      if (status === 'CANCELLED') {
        const hourglassData = {
          id: eventData.hourglassId,
          status: "CANCELLED"
        };

        // Update Hourglass first
        await api.put(`/api/schedules/${eventData.hourglassId}/status`, hourglassData);
        
        // Then remove from Firebase
        await remove(eventRef);
      } else {
        // For other statuses, just update Firebase
        await set(eventRef, { ...eventData, status });
      }

      return true;
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  }
}

export default new CalendarService();