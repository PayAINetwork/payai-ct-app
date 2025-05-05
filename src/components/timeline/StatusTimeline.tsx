import React from 'react';

export type TimelineStatus = 'Unfunded' | 'Funded' | 'Work Started' | 'Work Delivered' | 'Complete';

export interface StatusTimelineProps {
  currentStatus: TimelineStatus;
  statusTimestamps: Record<TimelineStatus, string | Date>;
}

const statuses: TimelineStatus[] = ['Unfunded', 'Funded', 'Work Started', 'Work Delivered', 'Complete'];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, statusTimestamps }) => {
  const currentIndex = statuses.indexOf(currentStatus);
  const now = new Date();

  const getRelativeTime = (date: Date) => {
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="overflow-x-auto">
        <div className="flex items-center">
          {statuses.map((status, idx) => (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    idx <= currentIndex
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="text-xs mt-2 text-center">{status}</span>
                {statusTimestamps[status] && (
                  <time
                    className="text-xxs text-gray-500 mt-1"
                    dateTime={new Date(statusTimestamps[status]).toISOString()}
                    title={new Date(statusTimestamps[status]).toLocaleString()}
                  >
                    {getRelativeTime(new Date(statusTimestamps[status]))}
                  </time>
                )}
              </div>
              {idx < statuses.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    idx < currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Activity Log */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Activity Log</h3>
        <ul className="space-y-2">
          {statuses
            .map((status) => ({ status, timestamp: new Date(statusTimestamps[status]) }))
            .filter(({ timestamp }) => !isNaN(timestamp.getTime()))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map(({ status, timestamp }) => (
              <li key={status} className="flex items-center text-gray-600">
                <span className="w-2 h-2 mr-2 rounded-full bg-gray-400" />
                <span className="text-sm">{status}</span>
                <time
                  className="ml-auto text-xs text-gray-500"
                  dateTime={timestamp.toISOString()}
                  title={timestamp.toLocaleString()}
                >
                  {getRelativeTime(timestamp)}
                </time>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}; 