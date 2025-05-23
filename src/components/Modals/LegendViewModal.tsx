import BaseModal from './BaseModal';
import { DEPARTMENT_COLORS } from '../Calendar/constants';

interface LegendViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegendViewModal({ isOpen, onClose }: LegendViewModalProps) {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Department Colors"
    >
      <div className="space-y-2">
        {Object.entries(DEPARTMENT_COLORS).map(([department, color]) => (
          <div 
            key={department}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors"
          >
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{department}</span>
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}