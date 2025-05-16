import BaseModal from './BaseModal';

interface Course {
  id: number;
  name: string;
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
  isEditing = false
}: EventFormModalProps) {
  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const course = courses.find(c => c.name === selectedValue);
    if (course) {
      console.log('Selected course:', course.name, 'ID:', course.id); // Debug log
      onCourseChange(course.name, course.id);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Enter'} course details`}
    >
      <div className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </BaseModal>
  );
}