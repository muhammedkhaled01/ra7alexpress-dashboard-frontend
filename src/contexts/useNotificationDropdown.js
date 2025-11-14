import { useContext } from 'react';
import NotificationContext from "@/contexts/NotificationContext.js";

const useNotificationDropdown = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationDropdown must be used within a NotificationDropdownProvider');
  }
  return context;
};

export default useNotificationDropdown;
