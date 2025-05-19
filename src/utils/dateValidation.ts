export const validateScheduleDates = (startDate: Date, endDate: Date): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (start < tomorrow) {
    return "Start date must be at least tomorrow or later";
  }
  if (end < tomorrow) {
    return "End date must be at least tomorrow or later";
  }
  if (end < start) {
    return "End date must be after start date";
  }
  return null;
};

export const checkSlotOverlap = (
  events: any[], 
  newStart: Date, 
  newEnd: Date, 
  slotNumber: string,
  excludeEventId?: string
): boolean => {
  return events.some(event => {
    // Only check events in the same slot
    if (event.slotNumber !== slotNumber) {
      return false; // Different slots can have same dates
    }

    // Skip checking against the event being edited
    if (excludeEventId && event.id === excludeEventId) {
      return false;
    }

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    return (
      (newStart <= eventEnd && newEnd >= eventStart)
    );
  });
};