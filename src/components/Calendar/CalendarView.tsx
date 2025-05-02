import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Plus, 
  X, 
  Edit,
  User,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/server';
import { ref, set, query, orderByChild, onValue } from 'firebase/database';
import { db } from '../../firebase/database';

// Setup localizer
const localizer = momentLocalizer(moment);

// Color mapping for slots
const SLOT_COLORS = {
  'SLOT 1': '#FF6B6B', // Coral red
  'SLOT 2': '#4ECDC4', // Turquoise
  'SLOT 3': '#45B7D1', // Sky blue
  'SLOT 4': '#96CEB4', // Sage green
  'SLOT 5': '#FF9000', // Orange
  'SLOT 6': '#D4A5A5', // Dusty rose
  'SLOT 7': '#9B59B6'  // Purple
} as const;

// Define event interface
interface Event {
  id: string;
  title: string;
  slotNumber: keyof typeof SLOT_COLORS;
  start: Date;
  end: Date;
  timeslot: Timeslot;
  resources: Resource[];
  attendees?: number;
  createdBy?: string; // Add this property
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
  filterEvents: (events: any[]) => any[];  // Add this prop
}

export default function CalendarView({ 
  isSidebarOpen, 
  toggleSidebar,
  filterEvents 
}: CalendarViewProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>('month');
  const [isSimplifiedView, setIsSimplifiedView] = useState<boolean>(false);
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
  // const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  // const [endTime, setEndTime] = useState<string>('');

  const navigate = useNavigate();
  const { logout, currentUser } = useAuth(); // Add currentUser

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Event style getter
  const eventStyleGetter = (event: Event) => {
    return {
      style: {
        backgroundColor: SLOT_COLORS[event.slotNumber]
      }
    };
  };

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    // Get events that overlap with the selected date
    const dateEvents = events.filter(event => {
      const selectedDate = moment(date).format('YYYY-MM-DD');
      const eventStart = moment(event.start).format('YYYY-MM-DD');
      const eventEnd = moment(event.end).format('YYYY-MM-DD');
      // Check if the selected date falls within the event's date range
      return selectedDate >= eventStart && selectedDate <= eventEnd;
    });

    for (let i = 1; i <= 7; i++) {
      const slotName = `SLOT ${i}`;
      // Find if there's an event in this slot
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
      // If slot has an event, show view modal
      setSelectedEvent(event);
      setShowViewModal(true);
      setShowSlotModal(false);
    } else {
      // If slot is free, continue with creation flow
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

    // Set both times to 00:00
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T00:00:00`);
    
    // Validate date range
    if (endDateTime <= startDateTime) {
      alert('End date must be after start date');
      return;
    }

    const eventId = selectedEvent ? selectedEvent.id : Date.now().toString();

    try {
      // Check for overlapping events in the same slot
      const overlappingEvents = events.filter(event => {
        // Only check events in the same slot
        if (event.slotNumber !== selectedSlot) return false;
        
        // Skip checking against self when editing
        if (selectedEvent && event.id === selectedEvent.id) return false;

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Check for ANY overlap between date ranges
        return (
          // New event starts before existing event ends AND
          // New event ends after existing event starts
          (startDateTime <= eventEnd && endDateTime >= eventStart)
        );
      });

      // Log overlapping events for debugging
      if (overlappingEvents.length > 0) {
        console.log('Overlapping events found:', overlappingEvents);
        
        // Sort overlapping events by start date for clearer error message
        const sortedOverlaps = overlappingEvents.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        // Show all conflicting dates in the error message
        const conflicts = sortedOverlaps.map(event => 
          `${moment(event.start).format('MMM D')} to ${moment(event.end).format('MMM D, YYYY')}`
        ).join(', ');

        throw new Error(
          `Slot ${selectedSlot} already has bookings during these dates: ${conflicts}. ` +
          `Please choose different dates or a different slot.`
        );
      }

      // If we reach here, there are no overlaps - proceed with saving
      const eventData = {
        id: eventId,
        title: selectedCourse,
        slotNumber: selectedSlot as keyof typeof SLOT_COLORS,
        start: startDateTime,
        end: endDateTime,
        timeslot: {
          id: parseInt(selectedSlot.split(' ')[1]),
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        resources: [{ id: 7 }],
        createdBy: selectedEvent ? selectedEvent.createdBy : currentUser?.uid
      };

      // Reference to Firebase
      const eventRef = ref(db, `events/${eventId}`);

      // Update or create the event
      await set(eventRef, {
        ...eventData,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString()
      });

      // Update local state
      if (selectedEvent) {
        setEvents(events.map(e => e.id === eventId ? eventData : e));
      } else {
        setEvents([...events, eventData]);
      }

      // Reset form and close modal
      setShowCreateModal(false);
      setSelectedEvent(null);
      setSelectedCourse('');
      setStartDate('');
      // setStartTime('');
      setEndDate('');
      // setEndTime('');
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
      // Reference to Firebase
      const eventRef = ref(db, `events/${eventId}`);
      
      // Delete the event
      await set(eventRef, null);
      
      // Update local state
      setEvents(events.filter(e => e.id !== eventId));
      
      // Close the modal
      setShowViewModal(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Fetch events from Firebase
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
            start: typeof event.start === 'string' ? new Date(event.start) : new Date(event.start),
            end: typeof event.end === 'string' ? new Date(event.end) : new Date(event.end),
            timeslot: {
              id: event.timeslot.id,
              start: event.timeslot.start,
              end: event.timeslot.end
            },
            resources: event.resources || [],
            attendees: event.attendees,
            createdBy: event.createdBy || currentUser?.uid // Add creator info
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
      console.log('Response data:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchEvents();
    fetchCourses();

    // Cleanup subscription on unmount
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

  const toggleView = () => {
    setIsSimplifiedView(!isSimplifiedView);
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      setShowSlotModal(false);
      setShowCreateModal(false);
      setShowViewModal(false);
    }
  };

  const displayEvents = filterEvents(events);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
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
          
          {/* View toggle section */}
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
              setSelectedDate(new Date()); // Set to current date when clicking Add Event
              setShowSlotModal(true);      // Show slot selection first
            }} 
            className="ml-4 bg-blue-500 text-white px-3 py-1 rounded-md flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className={`flex-1 ${isSimplifiedView ? 'simplified-view' : ''}`}>
        <Calendar
          localizer={localizer}
          events={displayEvents} // Use filtered events here
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={date}
          onNavigate={setDate}
          view={view as View}
          onView={(newView: View) => setView(newView)}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          selectable
          onSelectSlot={handleDateSelect}
          views={['month']} // 'week', 'day'
          toolbar={false}
        />
      </div>

      {/* Slot Selection Modal */}
      {showSlotModal && selectedDate && (
        <div 
          className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button 
              onClick={() => setShowSlotModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Available Slots</h2>
              <p className="text-sm text-gray-500 mt-1">
                {moment(selectedDate).format('dddd, MMMM D, YYYY')}
              </p>
            </div>
            <div className="space-y-2">
              {generateTimeSlots(selectedDate).map(({ name, event }) => (
                <button
                  key={name}
                  onClick={() => handleSlotSelect(name, event)}
                  className={`w-full p-3 flex items-center justify-between rounded-md border 
                    ${event ? 'bg-gray-50 border-gray-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">{name}</span>
                    {event && (
                      <span className="text-sm text-gray-500">
                        • {event.title}
                      </span>
                    )}
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: SLOT_COLORS[name as keyof typeof SLOT_COLORS] }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-[#00000098] flex items-center justify-center z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Enter course details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <select
                  id="course-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateEvent}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              <div className="flex items-center space-x-2">
                {currentUser?.uid === selectedEvent.createdBy && (
                  <>
                    <button 
                      onClick={() => {
                        setShowViewModal(false);
                        setShowCreateModal(true);
                        setSelectedCourse(selectedEvent.title);
                        setStartDate(moment(selectedEvent.start).format('YYYY-MM-DD'));
                        setEndDate(moment(selectedEvent.end).format('YYYY-MM-DD'));
                        setSelectedSlot(selectedEvent.slotNumber);
                      }}
                      className="text-blue-500 hover:text-blue-600"
                      aria-label="Edit event"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Delete event"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Slot info */}
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <div className="h-4 w-4 rounded-full" style={{ 
                  backgroundColor: SLOT_COLORS[selectedEvent.slotNumber] 
                }} />
                <span className="font-medium">{selectedEvent.slotNumber}</span>
              </div>

              {/* Timeslot info */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon size={18} className="mr-2" />
                  <span>
                    {moment(selectedEvent.start).format('MMM D')} - {moment(selectedEvent.end).format('MMM D, YYYY')}
                  </span>
                </div>
              </div>

              {/* Creator info */}
              <div className="flex items-center text-gray-600 pt-2 border-t">
                <User size={18} className="mr-2" />
                <span>Created by: {selectedEvent.createdBy}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}