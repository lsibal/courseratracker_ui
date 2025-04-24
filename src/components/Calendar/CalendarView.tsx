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
  Edit 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/server';
import { getDatabase, ref, set, query, orderByChild, onValue } from 'firebase/database';
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
  const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

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
    // Get events for the selected date
    const dateEvents = events.filter(event => 
      moment(event.start).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD')
    );

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
  
    const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
    const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);
  
    // Generate unique ID for the event
    const eventId = Date.now().toString();
  
    // First, create the schedule in the API
    try {
      // Format the data as expected by the API
      const scheduleData = {
        timeslot: {
          id: parseInt(selectedSlot.split(' ')[1]), // Extract slot number
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        resources: [{ id: 7 }] // Assuming resourceId is 7 as used in example
      };
  
      console.log('Sending schedule data to API:', scheduleData);
      
      // Send the request to create a schedule
      const response = await api.post('/api/schedules', scheduleData);
      console.log('Schedule creation response:', response.data);
      
      // Create a new event object for the UI
      const newEvent: Event = {
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
        attendees: response.data?.attendees || 0,
        createdBy: currentUser?.uid // Add creator info
      };
      
      // Store the event in Firebase for persistence
      const eventRef = ref(db, `events/${newEvent.id}`);
      await set(eventRef, {
        ...newEvent,
        start: newEvent.start.toISOString(),
        end: newEvent.end.toISOString()
      });
      
      // Update the UI with the new event
      setEvents([...events, newEvent]);
      setShowCreateModal(false);
      
      // Reset form
      setSelectedCourse('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      
    } catch (error) {
      console.error('Error creating schedule:', error);
      
      // Create a local event anyway even if API fails
      const fallbackEvent: Event = {
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
        createdBy: currentUser?.uid // Add creator info
      };
      
      // Save to Firebase even if API fails
      try {
        const eventRef = ref(db, `events/${fallbackEvent.id}`);
        await set(eventRef, {
          ...fallbackEvent,
          start: fallbackEvent.start.toISOString(),
          end: fallbackEvent.end.toISOString()
        });
        
        setEvents([...events, fallbackEvent]);
        setShowCreateModal(false);
        
        // Reset form
        setSelectedCourse('');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        
        // Let the user know what happened
        alert('Could not save to Hourglass API, but saved locally');
      } catch (fbError) {
        console.error('Failed to save event to Firebase:', fbError);
        alert('Failed to create event. Please try again.');
      }
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
          <h1 className="text-xl font-semibold">Hourglass</h1>
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
            onClick={() => setShowCreateModal(true)} 
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
        <div className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-[#00000098] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Enter course name</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
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
        <div className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button 
              onClick={() => setShowViewModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
                <button className="text-blue-500" aria-label="Edit event">
                  <Edit size={18} />
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {moment(selectedEvent.start).format('MMMM D')} - {moment(selectedEvent.end).format('MMMM D')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <CalendarIcon size={18} className="mr-2 text-gray-500" />
                <span>{moment(selectedEvent.start).format('dddd, MMMM D')}</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>{selectedEvent.attendees || 0} attendees</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}