import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from "../api/notificationApi";
import LoadingState from "../components/common/LoadingState";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotificationsApi,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (notificationsQuery.isLoading) return <LoadingState label="Loading notifications" />;
  const unreadCount = notificationsQuery.data.filter((notification) => !notification.isRead).length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Activity Inbox</p>
          <h2 className="mt-1 text-xl font-bold">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {unreadCount} unread
          </span>
        <button
          type="button"
          onClick={() => markAllMutation.mutate()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
        >
          Mark all read
        </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {notificationsQuery.data.map((notification) => (
          <button
            key={notification._id}
            type="button"
            onClick={() => markReadMutation.mutate(notification._id)}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              notification.isRead ? "border-slate-200 bg-white" : "border-teal-200 bg-[linear-gradient(135deg,#f0fdfa,#ffffff)] shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
              </div>
              {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> : null}
            </div>
          </button>
        ))}
        {notificationsQuery.data.length === 0 && <p className="text-sm text-slate-500">No notifications yet.</p>}
      </div>
    </div>
  );
};

export default NotificationsPage;
