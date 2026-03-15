'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationsAsRead,
  type Notification,
} from '@/lib/notifications/actions';

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread count badge and opens a modal
 * showing recent notifications when clicked.
 */
export function NotificationBell() {
  const { isSignedIn } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const result = await getUnreadNotificationCount();
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isSignedIn]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    try {
      const result = await getNotifications(50);
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!isSignedIn) return;

    fetchUnreadCount();
    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isSignedIn, fetchUnreadCount, fetchNotifications]);

  // Handle modal open
  const handleOpen = async () => {
    setIsOpen(true);
    const result = await getNotifications(50);
    if (result.success) {
      setNotifications(result.notifications);

      // Mark all visible notifications as read
      const unreadIds = result.notifications
        .filter((n) => !n.read_at)
        .map((n) => n.id);

      if (unreadIds.length > 0) {
        await markNotificationsAsRead(unreadIds);
        await fetchUnreadCount(); // Refresh count
        // Update local state to reflect read status
        setNotifications((prev) =>
          prev.map((n) =>
            unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
      }
    }
  };

  // Handle modal close
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isSignedIn) {
    return null;
  }

  const modalContent = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={handleClose}
        aria-hidden="true"
        style={{ zIndex: 999999 }}
      />
      {/* Modal */}
      <div 
        className="fixed right-4 top-16 md:right-8 md:top-20 w-[90vw] max-w-md max-h-[75vh] bg-[#0b0b0c] border-2 border-transparent rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          zIndex: 1000000,
          backgroundImage: 'linear-gradient(#0b0b0c, #0b0b0c), linear-gradient(135deg, #8e4ec6, #ff0080)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 0 40px rgba(142, 78, 198, 0.3), 0 0 80px rgba(255, 0, 128, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-purple-300">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                aria-label="Close notifications"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
                    <svg
                      className="w-8 h-8 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No notifications yet</p>
                  <p className="text-gray-500 text-xs mt-1">You'll see updates here when your claims are reviewed</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative p-4 hover:bg-white/5 transition-all duration-200 ${
                        !notification.read_at 
                          ? 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-l-2 border-purple-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'claim_approved'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          {notification.type === 'claim_approved' ? (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className={`text-sm font-semibold ${
                              !notification.read_at ? 'text-white' : 'text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read_at && (
                              <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2 overflow-hidden text-ellipsis" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(notification.created_at)}
                            </p>
                            {notification.item_id && (
                              <span className="text-xs text-purple-400/70">
                                • Item
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
    </>
  ) : null;

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg
          className="w-6 h-6 md:w-7 md:h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal - Rendered via Portal to document.body */}
      {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
