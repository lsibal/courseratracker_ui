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
  selectedEvent?: Event | null;
  notes?: string;
  onNotesChange: (notes: string) => void;
  // New props for custom course creation
  isCreatingCustomCourse?: boolean;
  onToggleCustomCourse?: (creating: boolean) => void;
  customCourseName?: string;
  onCustomCourseNameChange?: (name: string) => void;
  customCourseDescription?: string;
  onCustomCourseDescriptionChange?: (description: string) => void;
  onCreateCustomCourse?: () => void;
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
  onCourseraLinkChange,
  selectedEvent,
  notes = '',
  onNotesChange,
  // New props with defaults
  isCreatingCustomCourse = false,
  onToggleCustomCourse = () => {},
  customCourseName = '',
  onCustomCourseNameChange = () => {},
  customCourseDescription = '',
  onCustomCourseDescriptionChange = () => {},
  onCreateCustomCourse = () => {},
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

    // Check for slot overlaps - FIX: Proper event ID comparison and slot validation
    const hasOverlap = existingEvents.some(event => {
      // Skip checking the current event being edited
      if (isEditing && selectedEvent && event.id === selectedEvent.id) {
        return false;
      }

      // Only check events in the same slot
      if (event.slotNumber === selectedSlot) {
        // Check if there's date overlap
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        
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

    if (!courseraLink) {
      alert('Please enter a Coursera URL');
      return;
    }

    if (!validateCourseraUrl(courseraLink)) {
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
      width="wide"
    >
      <div className="space-y-4">
        {/* Debug info to help troubleshoot */}
        {isEditing && selectedEvent && (
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-2">
            Editing event: {selectedEvent.id} | Slot: {selectedSlot}
          </div>
        )}

        {/* Course selection section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Course
            </label>
            <button
              type="button"
              onClick={() => onToggleCustomCourse(!isCreatingCustomCourse)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isCreatingCustomCourse ? 'Select from list' : 'Create new course'}
            </button>
          </div>
          
          {isCreatingCustomCourse ? (
            <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customCourseName}
                  onChange={(e) => onCustomCourseNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course name (e.g., ML-101)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customCourseDescription}
                  onChange={(e) => onCustomCourseDescriptionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course description"
                />
              </div>
              <button
                type="button"
                onClick={onCreateCustomCourse}
                disabled={!customCourseName.trim() || !customCourseDescription.trim()}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
              >
                Create Course & Select
              </button>
            </div>
          ) : (
            <select
              id="course-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          )}
        </div>

        {/* Slot display (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selected Slot</label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            {selectedSlot}
          </div>
        </div>

        {/* Date inputs with min date validation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={startDate}
            min={moment().add(1, 'days').format('YYYY-MM-DD')}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={endDate}
            min={startDate || moment().add(1, 'days').format('YYYY-MM-DD')}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        {/* Coursera Link field */}
        <div>
          <label htmlFor="coursera-link" className="block text-sm font-medium text-gray-700 mb-1">
            Coursera Link <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="coursera-link"
            value={courseraLink}
            onChange={(e) => handleCourseraLinkChange(e.target.value)}
            required
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              courseraError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="https://www.coursera.org/..."
          />
          {courseraError && (
            <p className="mt-1 text-sm text-red-500">{courseraError}</p>
          )}
        </div>

        {/* Notes field */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes here..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!selectedCourse || !startDate || !endDate || !courseraLink}
          >
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}