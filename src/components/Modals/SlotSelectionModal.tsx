import { DEPARTMENT_COLORS } from '../Calendar/constants';
import BaseModal from './BaseModal';
import moment from 'moment';

interface SlotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  slots: Array<{ name: string; event: any | null }>;
  onSlotSelect: (name: string, event: any | null) => void;
}

export default function SlotSelectionModal({ 
  isOpen, 
  onClose, 
  selectedDate,
  slots,
  onSlotSelect 
}: SlotSelectionModalProps) {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Available Slots"
    >
      <p className="text-sm text-gray-500 mt-1 mb-4">
        {selectedDate && moment(selectedDate).format('dddd, MMMM D, YYYY')}
      </p>
      <div className="space-y-2">
        {slots.map(({ name, event }) => (
          <div 
            key={name}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSlotSelect(name, event)}
          >
            <div 
              className="w-4 h-4 rounded-full"
              style={{ 
                backgroundColor: event ? DEPARTMENT_COLORS[event.department as keyof typeof DEPARTMENT_COLORS] : '#808080'
              }}
            />
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">{name}</span>
              {event && (
                <span className="text-sm text-gray-500">
                  • {event.title}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}