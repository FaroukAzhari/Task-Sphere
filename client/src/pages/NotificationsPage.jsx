import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import { acceptTeamInvitationApi, declineTeamInvitationApi } from "../api/projectApi";
import { fetchNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from "../api/notificationApi";
import LoadingState from "../components/common/LoadingState";

const NotificationsPage = () => {
  const { user } = useAuth();
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

  const acceptInviteMutation = useMutation({
    mutationFn: acceptTeamInvitationApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] }),
      ]);
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: declineTeamInvitationApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] }),
      ]);
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
        {notificationsQuery.data.map((notification) => {
          const isPendingInvite =
            notification.type === "team_invite" &&
            notification.metadata?.status === "pending" &&
            !notification.isRead;

          return (
            <div
              key={notification._id}
              className={`rounded-2xl border p-4 transition ${
                notification.isRead ? "border-slate-200 bg-white" : "border-teal-200 bg-[linear-gradient(135deg,#f0fdfa,#ffffff)] shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  {isPendingInvite ? (
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                      Pending acceptance
                    </span>
                  ) : null}
                </div>
                {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!notification.isRead ? (
                  <button
                    type="button"
                    onClick={() => markReadMutation.mutate(notification._id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    Mark read
                  </button>
                ) : null}

                {isPendingInvite ? (
                  <>
                    <button
                      type="button"
                      onClick={() => acceptInviteMutation.mutate({ teamId: notification.metadata.teamId, userId: user._id })}
                      className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineInviteMutation.mutate({ teamId: notification.metadata.teamId, userId: user._id })}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      Decline
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
        {notificationsQuery.data.length === 0 && <p className="text-sm text-slate-500">No notifications yet.</p>}
      </div>
    </div>
  );
};

export default NotificationsPage;
