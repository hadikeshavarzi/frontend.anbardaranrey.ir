import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownToggle, DropdownMenu, Row, Col } from "reactstrap";
import SimpleBar from "simplebar-react";

// API
import { get, patch } from "../../../helpers/api_helper";

// Helper function برای زمان نسبی
const getRelativeTime = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffInSeconds = Math.floor((now - notifDate) / 1000);

  if (diffInSeconds < 60) return "همین الان";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} روز پیش`;
  return `${Math.floor(diffInSeconds / 604800)} هفته پیش`;
};

// آیکون بر اساس نوع
const getNotificationIcon = (type) => {
  const icons = {
    success: { icon: "bx-badge-check", color: "success" },
    info: { icon: "bx-info-circle", color: "info" },
    warning: { icon: "bx-error", color: "warning" },
    danger: { icon: "bx-x-circle", color: "danger" },
    order: { icon: "bx-cart", color: "primary" },
    user: { icon: "bx-user", color: "secondary" },
    product: { icon: "bx-package", color: "info" },
    stock: { icon: "bx-layer", color: "warning" },
    default: { icon: "bx-bell", color: "primary" },
  };

  return icons[type] || icons.default;
};

const NotificationDropdown = () => {
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications
  useEffect(() => {
    if (menu) {
      loadNotifications();
    }
  }, [menu]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await get("/notifications");

      // فرض کنیم response یا آرایه مستقیمه یا {notifications: [...]}
      const notifList = Array.isArray(res) ? res : res.notifications || [];

      setNotifications(notifList);

      // شمارش خوانده نشده‌ها
      const unread = notifList.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      // Mock data برای تست
      setNotifications([
        {
          id: 1,
          type: "order",
          title: "سفارش جدید ثبت شد",
          message: "سفارش شماره 1234 با موفقیت ثبت شد",
          is_read: false,
          created_at: new Date(Date.now() - 180000).toISOString(),
        },
        {
          id: 2,
          type: "stock",
          title: "کمبود موجودی",
          message: "محصول لپ‌تاپ ایسوس به حد کمبود رسیده است",
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          type: "success",
          title: "محصول ارسال شد",
          message: "محصول شما با موفقیت ارسال شد",
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
      setUnreadCount(2);
    }
    setLoading(false);
  };

  // علامت‌گذاری به عنوان خوانده شده
  const markAsRead = async (notificationId) => {
    try {
      await patch(`/notifications/${notificationId}/read`);

      // Update local state
      setNotifications((prev) =>
          prev.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
          )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
    }
  };

  // علامت‌گذاری همه به عنوان خوانده شده
  const markAllAsRead = async () => {
    try {
      await patch("/notifications/read-all");

      setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);
    } catch (err) {
    }
  };

  return (
      <React.Fragment>
        <Dropdown
            isOpen={menu}
            toggle={() => setMenu(!menu)}
            className="dropdown d-inline-block"
            tag="li"
        >
          <DropdownToggle
              className="btn header-item noti-icon position-relative"
              tag="button"
              id="page-header-notifications-dropdown"
          >
            <i className="bx bx-bell bx-tada" />
            {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            )}
          </DropdownToggle>

          <DropdownMenu className="dropdown-menu dropdown-menu-lg p-0 dropdown-menu-end">
            {/* Header */}
            <div className="p-3">
              <Row className="align-items-center">
                <Col>
                  <h6 className="m-0">اعلانات</h6>
                </Col>
                <div className="col-auto">
                  {unreadCount > 0 && (
                      <button
                          onClick={markAllAsRead}
                          className="btn btn-sm btn-link text-decoration-none p-0"
                      >
                        علامت‌گذاری همه
                      </button>
                  )}
                </div>
              </Row>
            </div>

            {/* Notifications List */}
            <SimpleBar style={{ maxHeight: "300px" }}>
              {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                  </div>
              ) : notifications.length === 0 ? (
                  <div className="text-center p-4">
                    <i className="bx bx-bell-off display-4 text-muted d-block mb-2" />
                    <p className="text-muted mb-0">اعلانی وجود ندارد</p>
                  </div>
              ) : (
                  notifications.map((notification) => {
                    const iconData = getNotificationIcon(notification.type);

                    return (
                        <Link
                            key={notification.id}
                            to="#"
                            className={`text-reset notification-item ${
                                !notification.is_read ? "bg-light" : ""
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                        >
                          <div className="d-flex">
                            <div className="avatar-xs me-3">
                        <span
                            className={`avatar-title bg-${iconData.color} rounded-circle font-size-16`}
                        >
                          <i className={`bx ${iconData.icon}`} />
                        </span>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mt-0 mb-1">
                                {notification.title}
                                {!notification.is_read && (
                                    <span className="badge bg-danger ms-2">جدید</span>
                                )}
                              </h6>
                              <div className="font-size-12 text-muted">
                                <p className="mb-1">{notification.message}</p>
                                <p className="mb-0">
                                  <i className="mdi mdi-clock-outline" />{" "}
                                  {getRelativeTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                    );
                  })
              )}
            </SimpleBar>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-2 border-top d-grid">
                  <Link
                      className="btn btn-sm btn-link font-size-14 text-center"
                      to="/notifications"
                  >
                    <i className="mdi mdi-arrow-left-circle me-1"></i>
                    مشاهده همه
                  </Link>
                </div>
            )}
          </DropdownMenu>
        </Dropdown>
      </React.Fragment>
  );
};

export default NotificationDropdown;