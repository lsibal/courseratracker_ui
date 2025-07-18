import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'default' | 'wide'; // Add width prop
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  width = 'default' // Default value
}: BaseModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalWidthClass = width === 'wide' ? 'w-[600px]' : 'w-96';

  return (
    <div 
      className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className={`bg-white rounded-lg p-6 ${modalWidthClass} relative`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        {title && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}