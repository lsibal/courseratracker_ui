import { useState } from 'react';
import CalendarView from '../components/Calendar/CalendarView';
import Sidebar from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>(['mySchedules']);
  const { currentUser } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle filter changes from Sidebar
  const handleFilterChange = (filters: string[]) => {
    setActiveFilters(filters);
  };

  // Filter events based on active filters
  const filterEvents = (events: any[]) => {
    if (activeFilters.includes('allSchedules')) {
      return events;
    }
    if (activeFilters.includes('mySchedules')) {
      return events.filter(event => event.createdBy === currentUser?.uid);
    }
    return [];
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onFilterChange={handleFilterChange}
      />
      <div className="flex-1 overflow-auto">
        <CalendarView 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          filterEvents={filterEvents}
        />
      </div>
    </div>
  );
}