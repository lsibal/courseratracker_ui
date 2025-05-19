import BaseModal from './BaseModal';
import moment from 'moment';
import { validateCourseraUrl } from '../../utils/validation';
import { useState } from 'react';

interface Course {
  id: number;
  name: string;
}

interface Event {
  id: string;
  start: Date;
  end: Date;
  slotNumber: string;
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourse: string;
  startDate: string;
  endDate: string;
  onCourseChange: (courseName: string, courseId: number) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSave: () => void;
  isEditing?: boolean;
  selectedSlot: string;
  existingEvents: Event[];
  courseraLink?: string;
  onCourseraLinkChange: (link: string) => void;
}

export default function EventFormModal({
  isOpen,
  onClose,
  courses,
  selectedCourse,
  startDate,
  endDate,
  onCourseChange,
  onStartDateChange,
  onEndDateChange,
  onSave,
  isEditing = false,
  selectedSlot,
  existingEvents,
  courseraLink = '',
  onCourseraLinkChange
}: EventFormModalProps) {
  const [courseraError, setCourseraError] = useState<string>('');

  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const course = courses.find(c => c.name === selectedValue);
    if (course) {
      console.log('Selected course:', course.name, 'ID:', course.id); // Debug log
      onCourseChange(course.name, course.id);
    }
  };

  const validateDates = (start: string, end: string): string | null => {
    const today = moment().startOf('day');
    const startDate = moment(start);
    const endDate = moment(end);

    if (startDate.isBefore(today)) {
      return "Start date must be in the future";
    }

    if (endDate.isBefore(startDate)) {
      return "End date must be after start date";
    }

    // Check for slot overlaps
    const hasOverlap = existingEvents.some(event => {
      // Skip checking the current event being edited
      if (isEditing && event.id === selectedCourse) return false;

      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);

      // Check if same slot and dates overlap
      if (event.slotNumber === selectedSlot) {
        return (
          (startDate.isBetween(eventStart, eventEnd, 'day', '[]')) ||
          (endDate.isBetween(eventStart, eventEnd, 'day', '[]')) ||
          (eventStart.isBetween(startDate, endDate, 'day', '[]')) ||
          (eventEnd.isBetween(startDate, endDate, 'day', '[]'))
        );
      }
      return false;
    });

    if (hasOverlap) {
      return "Selected dates overlap with an existing schedule in this slot";
    }

    return null;
  };

  const handleCourseraLinkChange = (value: string) => {
    if (value && !validateCourseraUrl(value)) {
      setCourseraError('Please enter a valid Coursera URL (coursera.org)');
    } else {
      setCourseraError('');
    }
    onCourseraLinkChange(value);
  };

  const handleSave = () => {
    const dateError = validateDates(startDate, endDate);
    if (dateError) {
      alert(dateError);
      return;
    }

    if (courseraLink && !validateCourseraUrl(courseraLink)) {
      alert('Please enter a valid Coursera URL');
      return;
    }

    onSave();
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Enter'} course details`}
    >
      <div className="space-y-4">
        {/* Existing course select */}
        <div>
          <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">
            Course Name
          </label>
          <select
            id="course-name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={selectedCourse}
            onChange={handleCourseSelect}
          >
            <option value="" disabled>Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date inputs with min date validation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={startDate}
            min={moment().add(1, 'days').format('YYYY-MM-DD')}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={endDate}
            min={startDate || moment().add(1, 'days').format('YYYY-MM-DD')}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        {/* Update Coursera Link field */}
        <div>
          <label htmlFor="coursera-link" className="block text-sm font-medium text-gray-700 mb-1">
            Coursera Link (Optional)
          </label>
          <input
            type="url"
            id="coursera-link"
            value={courseraLink}
            onChange={(e) => handleCourseraLinkChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              courseraError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://www.coursera.org/..."
          />
          {courseraError && (
            <p className="mt-1 text-sm text-red-500">{courseraError}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            disabled={!selectedCourse || !startDate || !endDate}
          >
            Save
          </button>
        </div>
      </div>
    </BaseModal>
  );
}