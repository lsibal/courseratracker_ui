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
import { ref, set, query, orderByChild, onValue, get, getDatabase } from 'firebase/database';
import { db } from '../../firebase/database';
import SlotSelectionModal from '../Modals/SlotSelectionModal';
import EventViewModal from '../Modals/EventViewModal';
import EventFormModal from '../Modals/EventFormModal';
import { SLOT_COLORS, DEPARTMENT_COLORS } from './constants';
import { sanitizeInput } from '../../utils/sanitize';
import CalendarService from '../../services/CalendarService';

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
  createdBy: string;  // Remove optional
  department: string; // Remove optional
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
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [eventCreators, setEventCreators] = useState<Record<string, {department: string}>>({});

  const { currentUser } = useAuth();

  useEffect(() => {
    const db = getDatabase();
    const uniqueCreatorIds = [...new Set(events.map(event => event.createdBy))];

    uniqueCreatorIds.forEach(async (creatorId) => {
      if (creatorId && !eventCreators[creatorId]) {
        const userRef = ref(db, `users/${creatorId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setEventCreators(prev => ({
            ...prev,
            [creatorId]: snapshot.val()
          }));
        }
      }
    });
  }, [events]);

  const eventStyleGetter = (event: Event) => {
    const creatorDepartment = event.createdBy ? 
      eventCreators[event.createdBy]?.department : 
      'Others';

    return {
      style: {
        backgroundColor: DEPARTMENT_COLORS[creatorDepartment as keyof typeof DEPARTMENT_COLORS] || '#808080',
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

  const handleCourseChange = (courseName: string, courseId: number) => {
    console.log('Course selected:', courseName, 'ID:', courseId); // Debug log
    setSelectedCourse(courseName);
    setSelectedCourseId(courseId);
  };

  const handleCreateEvent = async () => {
    if (!selectedDate || !selectedSlot || !startDate || !endDate || !selectedCourse) return;

    try {
      const sanitizedCourse = sanitizeInput(selectedCourse);
      const startDateTime = new Date(`${startDate}T00:00:00`);
      const endDateTime = new Date(`${endDate}T23:59:59`);

      const eventId = selectedEvent ? selectedEvent.id : `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const eventData = {
        id: eventId,
        title: sanitizedCourse,
        courseId: selectedCourseId, // Add this explicitly
        selectedCourse: selectedCourse,
        slotNumber: selectedSlot,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        resources: [{
          id: selectedCourseId, // Make sure we're using the numeric ID
          name: selectedCourse
        }],
        timeslot: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        createdBy: currentUser?.uid || '',
        department: currentUser?.department || 'Others',
        lastUpdated: new Date().toISOString()
      };

      await CalendarService.createSchedule(eventData);

      // Reset form
      setShowCreateModal(false);
      setSelectedEvent(null);
      setSelectedCourse('');
      setStartDate('');
      setEndDate('');
      setSelectedSlot('');

    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(error.message || 'Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await CalendarService.updateScheduleStatus(eventId, 'CANCELLED');
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
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          };

          if (!isNaN(reconstructedEvent.start.getTime()) && !isNaN(reconstructedEvent.end.getTime())) {
            fetchedEvents.push(reconstructedEvent);
          }
        });
        
        setEvents(fetchedEvents.sort((a, b) => a.start.getTime() - b.start.getTime()));
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
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    
    const initializeEvents = async () => {
      try {
        // Set up real-time listener first
        const eventsRef = ref(db, 'events');
        const eventsQuery = query(eventsRef, orderByChild('start'));
        
        unsubscribe = onValue(eventsQuery, (snapshot) => {
          if (!mounted) return;

          const fetchedEvents: Event[] = [];
          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            // Ensure proper date conversion
            const reconstructedEvent: Event = {
              ...event,
              start: new Date(event.start),
              end: new Date(event.end)
            };

            if (!isNaN(reconstructedEvent.start.getTime()) && !isNaN(reconstructedEvent.end.getTime())) {
              fetchedEvents.push(reconstructedEvent);
            }
          });
          
          setEvents(fetchedEvents.sort((a, b) => a.start.getTime() - b.start.getTime()));
        });

      } catch (error) {
        console.error('Failed to initialize events:', error);
      }
    };

    initializeEvents();
    fetchCourses();

    return () => {
      mounted = false;
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
        onCourseChange={handleCourseChange}
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