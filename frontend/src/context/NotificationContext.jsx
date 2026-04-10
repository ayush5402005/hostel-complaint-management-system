import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const setUnread      = useCallback((count) => setUnreadCount(count), []);
  const incrementUnread = useCallback(() => setUnreadCount(c => c + 1), []);
  const resetUnread    = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnread, incrementUnread, resetUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};
