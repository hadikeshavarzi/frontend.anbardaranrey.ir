import PropTypes from "prop-types";
import React, { useEffect, useRef, useCallback } from "react";

// Scrollbar
import SimpleBar from "simplebar-react";

// MetisMenu
import MetisMenu from "metismenujs";

// Router
import { Link, useLocation } from "react-router-dom";

// i18n
import { withTranslation } from "react-i18next";
import withRouter from "../Common/withRouter";

const SidebarContent = () => {
  const ref = useRef();
  const path = useLocation();

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show");
        const parent3 = parent2.parentElement;

        if (parent3) {
          parent3.classList.add("mm-active");
          parent3.childNodes[0].classList.add("mm-active");
          const parent4 = parent3.parentElement;
          if (parent4) {
            parent4.classList.add("mm-show");
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show");
              parent5.childNodes[0].classList.add("mm-active");
            }
          }
        }
      }
      scrollElement(item);
    }
  }, []);

  const removeActivation = (items) => {
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      const parent = item.parentElement;

      item.classList.remove("active");
      if (!parent) continue;

      const parent2El = parent.childNodes?.length && parent.childNodes[1] ? parent.childNodes[1] : null;

      if (parent2El && parent2El.id !== "side-menu") {
        parent2El.classList.remove("mm-show");
      }

      parent.classList.remove("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.remove("mm-show");
        const parent3 = parent2.parentElement;

        if (parent3) {
          parent3.classList.remove("mm-active");
          parent3.childNodes[0].classList.remove("mm-active");
          const parent4 = parent3.parentElement;

          if (parent4) {
            parent4.classList.remove("mm-show");
            const parent5 = parent4.parentElement;

            if (parent5) {
              parent5.classList.remove("mm-show");
              parent5.childNodes[0].classList.remove("mm-active");
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;

    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");

    removeActivation(items);

    for (let i = 0; i < items.length; i++) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }

    if (matchingMenuItem) activateParentDropdown(matchingMenuItem);
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
    activeMenu();
  }, []);

  useEffect(() => {
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
      <React.Fragment>
        <SimpleBar className="h-100" ref={ref}>
          <div id="sidebar-menu">
            <ul className="metismenu list-unstyled" id="side-menu">

              {/* ================================================== */}
              <li className="menu-title">داشبورد</li>
              {/* ================================================== */}
              <li>
                <Link to="/dashboard">
                  <i className="bx bx-home-circle"></i>
                  <span>صفحه اصلی</span>
                </Link>
              </li>

              {/* ================================================== */}
              <li className="menu-title">اطلاعات پایه</li>
              {/* ================================================== */}

              {/* مدیریت اعضا */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-user-pin"></i>
                  <span>مدیریت اعضا</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/members/add">ثبت عضو جدید</Link></li>
                  <li><Link to="/members/list">لیست اعضا</Link></li>
                </ul>
              </li>

              {/* مشتریان */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-group"></i>
                  <span>مشتریان</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/customers/add">ثبت مشتری</Link></li>
                  <li><Link to="/customers/list">لیست مشتریان</Link></li>
                </ul>
              </li>

              {/* کالاها */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-cube"></i>
                  <span>کالا و انبار</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/inventory/add-product">تعریف کالا</Link></li>
                  <li><Link to="/inventory/product-list">لیست کالاها</Link></li>
                  <li><Link to="/inventory/category-list">دسته‌بندی‌ها</Link></li>
                  <li><Link to="/inventory/unit-list">واحدهای سنجش</Link></li>
                </ul>
              </li>

              {/* ================================================== */}
              <li className="menu-title">عملیات انبار</li>
              {/* ================================================== */}

              {/* رسید کالا (ورود) */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-import"></i>
                  <span>رسید کالا (ورود)</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/receipt/form">ثبت رسید جدید</Link></li>
                  <li><Link to="/receipt/list">لیست رسیدها</Link></li>
                </ul>
              </li>

              {/* ترخیص کالا */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-task"></i>
                  <span>ترخیص کالا</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/clearances/form">درخواست ترخیص</Link></li>
                  <li><Link to="/clearances/report">کارتابل ترخیص</Link></li>
                </ul>
              </li>

              {/* بارگیری */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-truck"></i>
                  <span>بارگیری</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/loading/create">صدور دستور بارگیری</Link></li>
                  <li><Link to="/loading/list">لیست دستورها</Link></li>
                </ul>
              </li>

              {/* خروج و باسکول */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-exit"></i>
                  <span>خروج و باسکول</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/exit/create">ثبت خروج نهایی</Link></li>
                  <li><Link to="/exit/list">لیست خروج‌ها</Link></li>
                </ul>
              </li>

              {/* ================================================== */}
              <li className="menu-title">امور مالی</li>
              {/* ================================================== */}

              {/* 1. حسابداری */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-file"></i>
                  <span>حسابداری</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/accounting/coding">مدیریت کدینگ (GL)</Link></li>
                  <li><Link to="/accounting/documents">دفتر اسناد حسابداری</Link></li>
                  <li><Link to="/accounting/new">ثبت سند دستی</Link></li>
                </ul>
              </li>

              {/* 2. خزانه‌داری */}
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-money"></i>
                  <span>خزانه‌داری و چک</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/accounting/treasury-form">دریافت و پرداخت جدید</Link></li>
                  <li><Link to="/accounting/list">لیست اسناد خزانه</Link></li>
                  <li><Link to="/accounting/check-operations">کارتابل چک‌ها</Link></li>
                  <li><Link to="/accounting/definitions">تعاریف (بانک/صندوق)</Link></li>
                </ul>
              </li>

              {/* ================================================== */}
              <li className="menu-title">گزارش‌ها</li>
              {/* ================================================== */}

              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-bar-chart-square"></i>
                  <span>گزارشات مالی</span>
                </Link>
                <ul className="sub-menu">
                  <li><Link to="/accounting/reports/journal">دفتر روزنامه</Link></li>
                  <li><Link to="/accounting/reports/customers">مانده حساب مشتریان</Link></li>
                  <li><Link to="/accounting/reports/comprehensive">مرور جامع حساب‌ها</Link></li>
                  <li><Link to="/accounting/reports/ledger">گردش حساب (معین/تفصیلی)</Link></li>

                </ul>
              </li>

              {/* ================================================== */}
              <li className="menu-title">سیستم</li>
              {/* ================================================== */}
              <li>
                <Link to="/settings">
                  <i className="bx bx-cog"></i>
                  <span>تنظیمات</span>
                </Link>
              </li>

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

export default withRouter(withTranslation()(SidebarContent));