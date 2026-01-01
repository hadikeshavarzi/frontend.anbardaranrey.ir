import React, { useEffect, useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import SimpleBar from "simplebar-react";
import MetisMenu from "metismenujs";
import { withTranslation } from "react-i18next";

// دیتا
import { sidebarData } from "./SidebarData";

const SidebarContent = (props) => {
  const ref = useRef();
  const menuRef = useRef(null);
  const location = useLocation();
  const [menuItems, setMenuItems] = useState([]);

  // ==========================================
  // ۱. استخراج و اصلاح اطلاعات کاربر
  // ==========================================
  const getUserData = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const user = JSON.parse(stored);

      // تشخیص دقیق نقش (Role)
      const role = user.role || user.member_details?.role;

      // گرفتن پرمیشن‌ها و تبدیل از String به Array در صورت نیاز
      let perms = user.permissions || user.member_details?.permissions || [];
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          // اگر فرمت JSON نبود، پاکسازی و تبدیل دستی
          perms = perms.replace(/[\[\]"]/g, '').split(',').map(p => p.trim());
        }
      }

      return {
        role: role,
        permissions: Array.isArray(perms) ? perms : []
      };
    } catch (e) {
      console.error("Sidebar Error parsing user data:", e);
      return null;
    }
  }, []);

  // ==========================================
  // ۲. تابع بررسی دسترسی (Admin Priority)
  // ==========================================
  const hasAccess = useCallback((requiredPerm) => {
    const user = getUserData();
    if (!user) return false;

    // ✅ شرط طلایی: ادمین همه منوها را می‌بیند
    if (user.role === 'admin') return true;

    // اگر آیتم عمومی بود
    if (!requiredPerm) return true;

    // بررسی پرمیشن برای سایر نقش‌ها
    return user.permissions.includes(requiredPerm);
  }, [getUserData]);

  // ==========================================
  // ۳. فیلتر کردن هوشمند آیتم‌های منو
  // ==========================================
  useEffect(() => {
    const filtered = sidebarData.map((item) => {
      // الف) بررسی هدرها
      if (item.isHeader) {
        return hasAccess(item.permission) ? item : null;
      }

      // ب) بررسی منوهای دارای زیرمنو (SubItems)
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter((sub) => hasAccess(sub.permission));

        // اگر زیرمنو داشت اما هیچ‌کدام مجاز نبود، کل منو را حذف کن
        if (visibleSubItems.length === 0) return null;

        return { ...item, subItems: visibleSubItems };
      }

      // ج) منوهای تکی ساده
      return hasAccess(item.permission) ? item : null;
    }).filter(Boolean); // حذف موارد null

    setMenuItems(filtered);
  }, [hasAccess]);

  // ==========================================
  // ۴. مدیریت MetisMenu و استیت‌های فعال
  // ==========================================
  useEffect(() => {
    if (menuItems.length > 0) {
      const initMenu = () => {
        // ریست کردن متیس‌منو برای جلوگیری از تداخل
        if (menuRef.current) {
          try { menuRef.current.dispose(); } catch (e) {}
        }

        const ul = document.getElementById("side-menu");
        if (ul) {
          menuRef.current = new MetisMenu("#side-menu");
          activeMenu();
        }
      };

      const timer = setTimeout(initMenu, 200);
      return () => {
        clearTimeout(timer);
        if (menuRef.current) menuRef.current.dispose();
      };
    }
  }, [menuItems, location.pathname]);

  const activeMenu = useCallback(() => {
    const pathName = location.pathname;
    const ul = document.getElementById("side-menu");
    if (!ul) return;
    const items = ul.getElementsByTagName("a");
    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        activateParentDropdown(items[i]);
        break;
      }
    }
  }, [location.pathname]);

  const activateParentDropdown = (item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;
      if (parent2 && parent2.id !== "side-menu") {
        parent2.classList.add("mm-show");
        const parent3 = parent2.parentElement;
        if (parent3) {
          parent3.classList.add("mm-active");
          const childAnchor = parent3.querySelector("a.has-arrow");
          if (childAnchor) childAnchor.classList.add("mm-active");
        }
      }
    }
  };

  const getLabel = (label) => props.t ? props.t(label) || label : label;

  return (
      <React.Fragment>
        <SimpleBar className="h-100" ref={ref}>
          <div id="sidebar-menu">
            <ul className="metismenu list-unstyled" id="side-menu">
              {menuItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.isHeader ? (
                        <li className="menu-title">{getLabel(item.label)}</li>
                    ) : item.subItems ? (
                        <li>
                          <Link to="/#" className="has-arrow waves-effect">
                            <i className={item.icon}></i>
                            <span>{getLabel(item.label)}</span>
                          </Link>
                          <ul className="sub-menu" aria-expanded="false">
                            {item.subItems.map((sub, subIndex) => (
                                <li key={subIndex}>
                                  <Link to={sub.url} className="waves-effect">
                                    {getLabel(sub.label)}
                                  </Link>
                                </li>
                            ))}
                          </ul>
                        </li>
                    ) : (
                        <li>
                          <Link to={item.url} className="waves-effect">
                            <i className={item.icon}></i>
                            <span>{getLabel(item.label)}</span>
                          </Link>
                        </li>
                    )}
                  </React.Fragment>
              ))}
            </ul>
          </div>
        </SimpleBar>
      </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withTranslation()(SidebarContent);