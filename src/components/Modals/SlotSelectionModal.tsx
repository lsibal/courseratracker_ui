import { SLOT_COLORS } from '../Calendar/constants';
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
          <button
            key={name}
            onClick={() => onSlotSelect(name, event)}
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
    </BaseModal>
  );
}