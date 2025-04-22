import { getDatabase, ref, set, get, query, orderByChild } from 'firebase/database';
import { app } from './config';

export const db = getDatabase(app);

export const saveEventToDatabase = async (eventData: any) => {
  // Ensure dates are serialized to strings before saving
  const serializedEvent = {
    ...eventData,
    start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
    end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end
  };
  
  const eventRef = ref(db, `events/${eventData.id}`);
  await set(eventRef, serializedEvent);
};

export const getEventsFromDatabase = async () => {
  const eventsRef = ref(db, 'events');
  const snapshot = await get(query(eventsRef, orderByChild('start')));
  const events: any[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const eventData = childSnapshot.val();
    
    // Convert string dates back to Date objects
    events.push({
      ...eventData,
      start: new Date(eventData.start),
      end: new Date(eventData.end)
    });
  });
  
  return events;
};