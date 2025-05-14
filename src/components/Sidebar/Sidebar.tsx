import { Calendar, LogOut, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import moment from 'moment';
import EventViewModal from '../Modals/EventViewModal';
import { DEPARTMENT_COLORS } from '../Calendar/constants'; // Add this import

interface SidebarProps {
  isOpen: boolean;
  onFilterChange?: (filters: string[]) => void;
}

interface SlotEvent {
  id: string;
  slotNumber: string;
  title: string;
  createdBy: string;
  start: string;
  end: string;
}

interface UserProfile {
  name: string;
  email: string;
  department: string;
}

export default function Sidebar({ isOpen, onFilterChange }: SidebarProps) {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [filters, setFilters] = useState({
    mySchedules: true,
    allSchedules: false
  });
  const [slotEvents, setSlotEvents] = useState<Record<string, SlotEvent[]>>({});
  const [selectedEvent, setSelectedEvent] = useState<SlotEvent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [eventCreators, setEventCreators] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, 'events');

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events: Record<string, SlotEvent[]> = {};
      
      // Initialize slots
      ['SLOT 1', 'SLOT 2', 'SLOT 3', 'SLOT 4', 'SLOT 5', 'SLOT 6', 'SLOT 7'].forEach(slot => {
        events[slot] = [];
      });

      snapshot.forEach((childSnapshot) => {
        const event = childSnapshot.val();
        if (event.slotNumber) {
          events[event.slotNumber].push({
            id: childSnapshot.key,
            slotNumber: event.slotNumber,
            title: event.title,
            createdBy: event.createdBy,
            start: event.start,
            end: event.end
          });
        }
      });

      setSlotEvents(events);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const db = getDatabase();
      const userRef = ref(db, `users/${currentUser.uid}`);
      
      const unsubscribe = onValue(userRef, (snapshot) => {
        setUserProfile(snapshot.val());
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    const db = getDatabase();
    const uniqueCreatorIds = [...new Set(
      Object.values(slotEvents)
        .flat()
        .map(event => event.createdBy)
    )];

    uniqueCreatorIds.forEach(async (creatorId) => {
      if (!eventCreators[creatorId]) {
        const userRef = ref(db, `users/${creatorId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setEventCreators(prev => ({
            ...prev,
            [creatorId]: snapshot.val() as UserProfile
          }));
        }
      }
    });
  }, [slotEvents]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFilterChange = (filterName: 'mySchedules' | 'allSchedules') => {
    const newFilters = {
      ...filters,
      [filterName]: !filters[filterName]
    };
    setFilters(newFilters);

    const activeFilters = Object.entries(newFilters)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);
    
    if (onFilterChange) {
      onFilterChange(activeFilters);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    return `${moment(start).format('MMM D')} - ${moment(end).format('MMM D')}`;
  };

  const handleEventClick = (event: SlotEvent) => {
    setSelectedEvent(event);
  };

  return (
    <div 
      className={`h-screen bg-white text-black transition-all duration-300 ease-in-out border-r border-gray-200 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}
    >
      {isOpen && (
        <div className="h-full flex flex-col">
          {/* Main content - scrollable */}
          <div className="flex-1 overflow-y-auto p-5">          
            {/* Filter Section */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Filter className="h-4 w-4 text-gray-600 mr-2" />
                <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.mySchedules}
                    onChange={() => handleFilterChange('mySchedules')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">My Schedules</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.allSchedules}
                    onChange={() => handleFilterChange('allSchedules')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">All Schedules</span>
                </label>
              </div>
            </div>

            {/* Slots Section - Only show slots with events */}
            <div className="space-y-1">
              {Object.entries(slotEvents).map(([slot, events]) => {
                const filteredEvents = events.filter(event => 
                  filters.allSchedules || (filters.mySchedules && event.createdBy === currentUser?.uid)
                );

                if (filteredEvents.length === 0) return null;

                return (
                  <div key={slot} className="mb-1">
                    {filteredEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="rounded-lg overflow-hidden mb-2 border border-gray-200"
                        onClick={() => handleEventClick(event)}
                      >
                        <div 
                          className="p-3 cursor-pointer"
                          style={{
                            backgroundColor: DEPARTMENT_COLORS[eventCreators[event.createdBy]?.department as keyof typeof DEPARTMENT_COLORS] || '#808080',
                            opacity: 0.9
                          }}
                        >
                          <div className="text-white">
                            <div className="font-medium text-sm">{event.title}</div>
                            <div className="text-xs opacity-90">{formatDateRange(event.start, event.end)}</div>
                            <div className="text-xs mt-1 opacity-80">
                              {eventCreators[event.createdBy]?.name || 'Loading...'}
                              {eventCreators[event.createdBy] && (
                                <> • {eventCreators[event.createdBy].department}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer section - fixed at bottom */}
          <div className="p-5 border-t border-[#0000005c] bg-white space-y-3">
            {/* User Profile */}
            <div 
              className="flex items-center p-2 rounded"
              style={{ 
                backgroundColor: DEPARTMENT_COLORS[userProfile?.department as keyof typeof DEPARTMENT_COLORS] || '#808080',
                opacity: 0.9
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">{userProfile?.name || 'User'}</p>
                <p className="text-xs text-white/80">{userProfile?.department}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              className="w-full rounded bg-red-500 text-white p-2 flex items-center justify-center hover:bg-red-600 space-x-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>
      )}
      {selectedEvent && (
        <EventViewModal 
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={{
            ...selectedEvent,
            start: new Date(selectedEvent.start),
            end: new Date(selectedEvent.end),
            slotNumber: selectedEvent.slotNumber as keyof typeof DEPARTMENT_COLORS,
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          canEdit={false}
        />
      )}
    </div>
  );
}