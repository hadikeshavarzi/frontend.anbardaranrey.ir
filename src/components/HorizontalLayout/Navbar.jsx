import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { Collapse } from "reactstrap";
import { Link } from "react-router-dom";
import withRouter from "../Common/withRouter";
import classname from "classnames";
import { connect } from "react-redux";
import { get } from "../../helpers/api_helper";

const Navbar = (props) => {
  const [inventory, setInventory] = useState(false);
  const [transactions, setTransactions] = useState(false);
  const [reports, setReports] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // لود اطلاعات کاربر
  useEffect(() => {
    async function loadUserInfo() {
      setLoading(true);
      try {
        const res = await get("/users/me");
        setUserInfo(res);
      } catch (err) {
      }
      setLoading(false);
    }
    loadUserInfo();
  }, []);

  useEffect(() => {
    var matchingMenuItem = null;
    var ul = document.getElementById("navigation");
    var items = ul.getElementsByTagName("a");
    removeActivation(items);
    for (var i = 0; i < items.length; ++i) {
      if (window.location.pathname === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  });

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;
      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        if (parent.classList.contains("active")) {
          parent.classList.remove("active");
        }
      }
    }
  };

  function activateParentDropdown(item) {
    item.classList.add("active");
    const parent = item.parentElement;
    if (parent) {
      parent.classList.add("active");
      const parent2 = parent.parentElement;
      if (parent2) {
        parent2.classList.add("active");
        const parent3 = parent2.parentElement;
        if (parent3) {
          parent3.classList.add("active");
          const parent4 = parent3.parentElement;
          if (parent4) {
            parent4.classList.add("active");
          }
        }
      }
    }
    return false;
  }

  return (
      <React.Fragment>
        <div className="topnav">
          <div className="container-fluid">
            <nav
                className="navbar navbar-light navbar-expand-lg topnav-menu"
                id="navigation"
            >
              <Collapse
                  isOpen={props.leftMenu}
                  className="navbar-collapse"
                  id="topnav-menu-content"
              >
                <ul className="navbar-nav">
                  {/* داشبورد */}
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">
                      <i className="bx bx-home-circle me-2"></i>
                      داشبورد
                    </Link>
                  </li>

                  {/* انبارداری */}
                  <li className="nav-item dropdown">
                    <Link
                        to="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          setInventory(!inventory);
                        }}
                        className="nav-link dropdown-toggle arrow-none"
                    >
                      <i className="bx bx-layer me-2"></i>
                      انبارداری <div className="arrow-down"></div>
                    </Link>
                    <div
                        className={classname("dropdown-menu", { show: inventory })}
                    >
                      <Link to="/inventory/unit-list" className="dropdown-item">
                        <i className="bx bx-layer font-size-16 me-2"></i>
                        واحدهای کالا
                      </Link>
                      <Link to="/inventory/category-list" className="dropdown-item">
                        <i className="bx bx-category font-size-16 me-2"></i>
                        دسته‌بندی‌ها
                      </Link>
                      <Link to="/inventory/product-list" className="dropdown-item">
                        <i className="bx bx-package font-size-16 me-2"></i>
                        کالاها
                      </Link>
                      <Link to="/inventory/warehouse-list" className="dropdown-item">
                        <i className="bx bx-store font-size-16 me-2"></i>
                        انبارها
                      </Link>
                    </div>
                  </li>

                  {/* حرکات انبار */}
                  <li className="nav-item dropdown">
                    <Link
                        to="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          setTransactions(!transactions);
                        }}
                        className="nav-link dropdown-toggle arrow-none"
                    >
                      <i className="bx bx-transfer me-2"></i>
                      حرکات انبار <div className="arrow-down"></div>
                    </Link>
                    <div
                        className={classname("dropdown-menu", {
                          show: transactions,
                        })}
                    >
                      <Link to="/transactions/stock-in" className="dropdown-item">
                        <i className="bx bx-import font-size-16 me-2"></i>
                        ورود کالا
                      </Link>
                      <Link to="/transactions/stock-out" className="dropdown-item">
                        <i className="bx bx-export font-size-16 me-2"></i>
                        خروج کالا
                      </Link>
                      <Link to="/transactions/transfer" className="dropdown-item">
                        <i className="bx bx-transfer font-size-16 me-2"></i>
                        انتقال بین انبارها
                      </Link>
                    </div>
                  </li>

                  {/* گزارشات */}
                  <li className="nav-item dropdown">
                    <Link
                        to="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          setReports(!reports);
                        }}
                        className="nav-link dropdown-toggle arrow-none"
                    >
                      <i className="bx bx-bar-chart-alt-2 me-2"></i>
                      گزارشات <div className="arrow-down"></div>
                    </Link>
                    <div
                        className={classname("dropdown-menu", { show: reports })}
                    >
                      <Link to="/reports/stock" className="dropdown-item">
                        <i className="bx bx-list-ul font-size-16 me-2"></i>
                        گزارش موجودی
                      </Link>
                      <Link to="/reports/transactions" className="dropdown-item">
                        <i className="bx bx-history font-size-16 me-2"></i>
                        گزارش حرکات
                      </Link>
                      <Link to="/reports/value" className="dropdown-item">
                        <i className="bx bx-dollar-circle font-size-16 me-2"></i>
                        گزارش ارزش کالا
                      </Link>
                    </div>
                  </li>

                  {/* اطلاعات کاربر */}
                  {!loading && userInfo && (
                      <li className="nav-item ms-auto">
                        <Link className="nav-link" to="/profile">
                          <div className="d-flex align-items-center">
                            {userInfo.avatar?.url ? (
                                <img
                                    src={userInfo.avatar.url}
                                    alt={userInfo.full_name}
                                    className="avatar-xs rounded-circle me-2"
                                />
                            ) : (
                                <div className="avatar-xs me-2">
                            <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                              {userInfo.full_name?.charAt(0) || "U"}
                            </span>
                                </div>
                            )}
                            <span className="d-none d-md-inline-block">
                          {userInfo.full_name}
                        </span>
                          </div>
                        </Link>
                      </li>
                  )}
                </ul>
              </Collapse>
            </nav>
          </div>
        </div>
      </React.Fragment>
  );
};

Navbar.propTypes = {
  leftMenu: PropTypes.any,
  location: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { leftMenu } = state.Layout;
  return { leftMenu };
};

export default withRouter(connect(mapStatetoProps, {})(Navbar));