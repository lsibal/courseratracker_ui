import { Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div 
      className={`h-screen bg-white text-black transition-all duration-300 ease-in-out border-r border-gray-200 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}
    >
      {isOpen && (
        <div className="p-5 h-full flex flex-col">          
          <div className="flex-grow">
            <h2 className="text-base font-semibold text-gray-700 mb-4">My schedules</h2>
            <nav className="space-y-3">
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">FIGMA101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">REACTJS101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">RUBY101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">APPDEV101</span>
              </div>
            </nav>
            
            <h2 className="text-base font-semibold text-gray-700 mt-8 mb-4">Other schedules</h2>
            <nav className="space-y-3">
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">PYTHON101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">CYBERSECURITY101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">JAVA101</span>
              </div>
              <div className="rounded hover:bg-gray-100 p-2 flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-gray-600" />
                <span className="text-sm">CSHARP101</span>
              </div>
            </nav>
          </div>
          
          <div className="mt-auto">
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