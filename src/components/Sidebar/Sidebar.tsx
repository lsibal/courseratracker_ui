import { Calendar, LogOut, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDatabase, ref, onValue } from 'firebase/database';
import moment from 'moment';

interface SidebarProps {
  isOpen: boolean;
  onFilterChange?: (filters: string[]) => void;
}

interface SlotEvent {
  slotNumber: string;
  title: string;
  createdBy: string;
  start: string;
  end: string;
}

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

export default function Sidebar({ isOpen, onFilterChange }: SidebarProps) {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [filters, setFilters] = useState({
    mySchedules: true,
    allSchedules: false
  });
  const [slotEvents, setSlotEvents] = useState<Record<string, SlotEvent[]>>({});

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
            <div className="space-y-3">
              {Object.entries(slotEvents).map(([slot, events]) => {
                const filteredEvents = events.filter(event => 
                  filters.allSchedules || (filters.mySchedules && event.createdBy === currentUser?.uid)
                );

                // Skip rendering if there are no events after filtering
                if (filteredEvents.length === 0) return null;

                return (
                  <div key={slot} className="rounded-lg border border-gray-200">
                    <div 
                      className="p-2 flex items-center rounded-t-lg"
                      style={{ 
                        backgroundColor: SLOT_COLORS[slot as keyof typeof SLOT_COLORS],
                        opacity: 0.9
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-3 text-white" />
                      <span className="text-sm font-medium text-white">{slot}</span>
                    </div>
                    <div className="p-2 space-y-2 hover:bg-gray-50 transition-colors duration-200">
                      {filteredEvents.map((event, index) => (
                        <div key={index} className="text-xs space-y-1">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-gray-500">{formatDateRange(event.start, event.end)}</div>
                          <div className="text-gray-400 truncate">{event.createdBy}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer section - fixed at bottom */}
          <div className="p-5 border-t bg-white">
            {/* User Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{currentUser?.email}</p>
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
    </div>
  );
}