import { CalendarIcon, Edit, Trash2, User, Link as LinkIcon, StickyNote } from 'lucide-react';
import BaseModal from './BaseModal';
import moment from 'moment';
import { SLOT_COLORS, Event } from '../Calendar/constants';
import { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

interface UserProfile {
  name: string;
  department: string;
  email: string;
}

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onEdit: () => void;
  onDelete: (eventId: string) => void;
  canEdit: boolean;
}

export default function EventViewModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  canEdit
}: EventViewModalProps) {
  const [creator, setCreator] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (event?.createdBy) {
        const db = getDatabase();
        const userRef = ref(db, `users/${event.createdBy}`);
        try {
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setCreator(snapshot.val() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchCreatorProfile();
  }, [event?.createdBy]);

  if (!event) return null;

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      width="wide"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <button 
                onClick={onEdit}
                className="text-blue-500 hover:text-blue-600"
                aria-label="Edit event"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete(event.id)}
                className="text-red-500 hover:text-red-600"
                aria-label="Delete event"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
          <div className="h-4 w-4 rounded-full" style={{ 
            backgroundColor: SLOT_COLORS[event.slotNumber]
          }} />
          <span className="font-medium">{event.slotNumber}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <CalendarIcon size={18} className="mr-2" />
            <span>
              {moment(event.start).format('MMM D')} - {moment(event.end).format('MMM D, YYYY')}
            </span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 pt-2 border-t">
          <User size={18} className="mr-2" />
          <div className="space-y-1">
            <div className="font-medium">Created by:</div>
            {creator ? (
              <div className="text-sm">
                <div>{creator.name}</div>
                <div className="text-gray-500">{creator.department}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </div>
        </div>

        {event?.courseraLink && (
          <div className="flex items-center text-gray-600 pt-2 border-t">
            <LinkIcon size={18} className="mr-2" />
            <div className="space-y-1">
              <div className="font-medium">Coursera Link:</div>
              <a 
                href={event.courseraLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 break-all"
              >
                {event.courseraLink}
              </a>
            </div>
          </div>
        )}

        {event?.notes && (
          <div className="flex items-start text-gray-600 pt-2 border-t">
            <StickyNote size={18} className="mr-2 mt-1" />
            <div className="space-y-1">
              <div className="font-medium">Notes:</div>
              <div className="text-sm whitespace-pre-wrap">{event.notes}</div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}