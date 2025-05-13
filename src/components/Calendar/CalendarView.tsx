import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/server';
import { ref, set, query, orderByChild, onValue } from 'firebase/database';
import { db } from '../../firebase/database';
import SlotSelectionModal from '../Modals/SlotSelectionModal';
import EventViewModal from '../Modals/EventViewModal';
import EventFormModal from '../Modals/EventFormModal';
import { SLOT_COLORS, DEPARTMENT_COLORS } from './constants';
import { sanitizeInput } from '../../utils/sanitize';

const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  slotNumber: keyof typeof SLOT_COLORS;
  start: Date;
  end: Date;
  timeslot: Timeslot;
  resources: Resource[];
  attendees?: number;
  createdBy?: string;
  department?: string;
}

interface Timeslot {
  id: number;
  start: string;
  end: string;
}

interface Resource {
  id: number;
}

interface Course {
  id: number;
  name: string;
}

interface CalendarViewProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  filterEvents: (events: Event[]) => Event[];
}

export default function CalendarView({ 
  toggleSidebar,
  filterEvents 
}: CalendarViewProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { currentUser } = useAuth();

  const eventStyleGetter = (event: Event) => {
  // Get the department directly from the event object
  // This assumes the event object has a department property
  return {
    style: {
      backgroundColor: DEPARTMENT_COLORS[event.department as keyof typeof DEPARTMENT_COLORS] || '#808080',
      borderRadius: '4px',
      border: 'none',
      color: '#fff',
      padding: '4px 8px',
      fontSize: '0.875rem',
      fontWeight: 500,
      opacity: 0.9,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    }
  };
};

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const dateEvents = events.filter(event => {
      const selectedDate = moment(date).format('YYYY-MM-DD');
      const eventStart = moment(event.start).format('YYYY-MM-DD');
      const eventEnd = moment(event.end).format('YYYY-MM-DD');
      return selectedDate >= eventStart && selectedDate <= eventEnd;
    });

    for (let i = 1; i <= 7; i++) {
      const slotName = `SLOT ${i}`;
      const existingEvent = dateEvents.find(event => event.slotNumber === slotName);
      slots.push({
        name: slotName,
        event: existingEvent || null
      });
    }
    return slots;
  };

  const handleSlotSelect = (slot: string, event: Event | null) => {
    if (event) {
      setSelectedEvent(event);
      setShowViewModal(true);
      setShowSlotModal(false);
    } else {
      setSelectedSlot(slot);
      setShowSlotModal(false);
      setShowCreateModal(true);
    }
  };

  const handleDateSelect = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setShowSlotModal(true);
  };

  const handleCreateEvent = async () => {
    if (!selectedDate || !selectedSlot || !startDate || !endDate || !selectedCourse) return;

    const sanitizedCourse = sanitizeInput(selectedCourse);
    
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T00:00:00`);
    
    if (endDateTime <= startDateTime) {
      alert('End date must be after start date');
      return;
    }

    const eventId = selectedEvent ? selectedEvent.id : Date.now().toString();

    try {
      const overlappingEvents = events.filter(event => {
        if (event.slotNumber !== selectedSlot) return false;
        if (selectedEvent && event.id === selectedEvent.id) return false;

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        return (startDateTime <= eventEnd && endDateTime >= eventStart);
      });

      if (overlappingEvents.length > 0) {
        const sortedOverlaps = overlappingEvents.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        const conflicts = sortedOverlaps.map(event => 
          `${moment(event.start).format('MMM D')} to ${moment(event.end).format('MMM D, YYYY')}`
        ).join(', ');

        throw new Error(
          `Slot ${selectedSlot} already has bookings during these dates: ${conflicts}. ` +
          `Please choose different dates or a different slot.`
        );
      }

      const eventData = {
        id: eventId,
        title: sanitizedCourse,
        slotNumber: selectedSlot as keyof typeof SLOT_COLORS,
        start: startDateTime,
        end: endDateTime,
        timeslot: {
          id: parseInt(selectedSlot.split(' ')[1]),
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        resources: [{ id: 7 }],
        createdBy: selectedEvent ? selectedEvent.createdBy : currentUser?.uid,
        department: currentUser?.department || 'Others' // Ensure department is always set
      };

      const eventRef = ref(db, `events/${eventId}`);

      await set(eventRef, {
        ...eventData,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString()
      });

      if (selectedEvent) {
        setEvents(events.map(e => e.id === eventId ? eventData : e));
      } else {
        setEvents([...events, eventData]);
      }

      setShowCreateModal(false);
      setSelectedEvent(null);
      setSelectedCourse('');
      setStartDate('');
      setEndDate('');
      setSelectedSlot('');

    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(sanitizeInput(error.message) || 'Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
  
    try {
      const eventRef = ref(db, `events/${eventId}`);
      await set(eventRef, null);
      setEvents(events.filter(e => e.id !== eventId));
      setShowViewModal(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const fetchEvents = () => {
    try {
      const eventsRef = ref(db, 'events');
      const eventsQuery = query(eventsRef, orderByChild('start'));
      
      return onValue(eventsQuery, (snapshot) => {
        const fetchedEvents: Event[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const event = childSnapshot.val();
          const reconstructedEvent: Event = {
            id: event.id,
            title: event.title,
            slotNumber: event.slotNumber,
            start: new Date(event.start),
            end: new Date(event.end),
            timeslot: {
              id: event.timeslot.id,
              start: event.timeslot.start,
              end: event.timeslot.end
            },
            resources: event.resources || [],
            attendees: event.attendees,
            createdBy: event.createdBy || currentUser?.uid,
            department: event.department // Make sure this is included
          };

          if (!isNaN(reconstructedEvent.start.getTime()) && !isNaN(reconstructedEvent.end.getTime())) {
            fetchedEvents.push(reconstructedEvent);
          }
        });
        
        fetchedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
        setEvents(fetchedEvents);
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/resources', {
        params: {
          activeOnly: true,
          resourceType: 'Course',
          serviceOffering: '7'
        }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchEvents();
    fetchCourses();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'TODAY') {
      return setDate(new Date());
    }
    
    const newDate = new Date(date);
    
    switch(view) {
      case 'month':
        newDate.setMonth(date.getMonth() + (action === 'NEXT' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(date.getDate() + (action === 'NEXT' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(date.getDate() + (action === 'NEXT' ? 1 : -1));
        break;
    }
    
    setDate(newDate);
  };

  const getHeaderText = () => {
    switch(view) {
      case 'month':
        return moment(date).format('MMMM YYYY');
      case 'week':
        const weekStart = moment(date).startOf('week').format('MMM D');
        const weekEnd = moment(date).endOf('week').format('MMM D, YYYY');
        return `${weekStart} - ${weekEnd}`;
      case 'day':
        return moment(date).format('dddd, MMMM D, YYYY');
      default:
        return moment(date).format('MMMM YYYY');
    }
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const displayEvents = filterEvents(events);

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-md hover:bg-gray-100 mr-2"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold">CourseTrack</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleNavigate('PREV')} 
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-lg px-2">{getHeaderText()}</span>
          
          <button 
            onClick={() => handleNavigate('NEXT')} 
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="ml-4 border border-gray-200 rounded-md overflow-hidden flex">
            <button 
              onClick={() => handleNavigate('TODAY')} 
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
            >
              Today
            </button>
          </div>
          
          <button 
            onClick={() => {
              setSelectedDate(new Date());
              setShowSlotModal(true);
            }} 
            className="ml-4 bg-blue-500 text-white px-3 py-1 rounded-md flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Event
          </button>
        </div>
      </div>

      <div className='flex-1'>
        <Calendar
          localizer={localizer}
          events={displayEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ 
            height: '100%',
            backgroundColor: '#fff',
            padding: '10px'
          }}
          className="rounded-lg shadow-sm"
          date={date}
          onNavigate={setDate}
          view={view as View}
          onView={(newView: View) => setView(newView)}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          selectable
          onSelectSlot={handleDateSelect}
          views={['month']}
          toolbar={false}
        />
      </div>

      <SlotSelectionModal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        selectedDate={selectedDate}
        slots={selectedDate ? generateTimeSlots(selectedDate) : []}
        onSlotSelect={handleSlotSelect}
      />

      <EventFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courses={courses}
        selectedCourse={selectedCourse}
        startDate={startDate}
        endDate={endDate}
        onCourseChange={setSelectedCourse}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSave={handleCreateEvent}
        isEditing={!!selectedEvent}
      />

      <EventViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        event={selectedEvent}
        onEdit={() => {
          setShowViewModal(false);
          setShowCreateModal(true);
          if (selectedEvent) {
            setSelectedCourse(selectedEvent.title);
            setStartDate(moment(selectedEvent.start).format('YYYY-MM-DD'));
            setEndDate(moment(selectedEvent.end).format('YYYY-MM-DD'));
            setSelectedSlot(selectedEvent.slotNumber);
          }
        }}
        onDelete={handleDeleteEvent}
        canEdit={currentUser?.uid === selectedEvent?.createdBy}
      />
    </div>
  );
}