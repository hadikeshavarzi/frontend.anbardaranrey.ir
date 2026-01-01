import PropTypes from "prop-types";
import React, { useEffect } from "react"; // ✅ useEffect اضافه شد

import { Routes, Route } from "react-router-dom";
import { connect, useDispatch } from "react-redux"; // ✅ useDispatch اضافه شد

import { useSelector } from "react-redux";
import { createSelector } from "reselect";

// ✅ ایمپورت اکشن لاگین (مسیر را چک کنید، معمولا همین است)
import { loginSuccess } from "./store/actions";

// Import Routes all
import { authProtectedRoutes, publicRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import HorizontalLayout from "./components/HorizontalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Import scss
import "./assets/scss/theme.scss";

import fakeBackend from "/src/helpers/AuthType/fakeBackend";

// Activating fake backend
fakeBackend();

const App = (props) => {
  const dispatch = useDispatch(); // ✅ تعریف دیسپچ

  // =========================================================
  // ✅ بخش جدید: بازیابی اطلاعات کاربر بعد از رفرش
  // =========================================================
  useEffect(() => {
    // اطلاعاتی که در Login.jsx ذخیره کردیم را می‌خوانیم
    const authUser = localStorage.getItem("authUser");
    const user = localStorage.getItem("user");

    if (authUser || user) {
      try {
        const userData = JSON.parse(authUser || user);
        console.log("🔄 App: Restoring user session...", userData);

        // اطلاعات را دوباره به ریداکس تزریق می‌کنیم تا سیستم بفهمد لاگین هستیم
        dispatch(loginSuccess(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, [dispatch]);
  // =========================================================


  const LayoutProperties = createSelector(
      (state) => state.Layout,
      (layout) => ({
        layoutType: layout.layoutType,
      })
  );

  const {
    layoutType
  } = useSelector(LayoutProperties);

  function getLayout(layoutType) {
    let layoutCls = VerticalLayout;
    switch (layoutType) {
      case "horizontal":
        layoutCls = HorizontalLayout;
        break;
      default:
        layoutCls = VerticalLayout;
        break;
    }
    return layoutCls;
  }

  const Layout = getLayout(layoutType);

  return (
      <React.Fragment>
        <Routes>
          {publicRoutes.map((route, idx) => (
              <Route
                  path={route.path}
                  element={<NonAuthLayout>{route.component}</NonAuthLayout>}
                  key={idx}
                  exact={true}
              />
          ))}

          {authProtectedRoutes.map((route, idx) => (
              <Route
                  path={route.path}
                  element={
                    <Authmiddleware>
                      <Layout>{route.component}</Layout>
                    </Authmiddleware>
                  }
                  key={idx}
                  exact={true}
              />
          ))}
        </Routes>
      </React.Fragment>
  );
};

App.propTypes = {
  layout: PropTypes.any,
};

const mapStateToProps = (state) => {
  return {
    layout: state.Layout,
  };
};

export default connect(mapStateToProps, null)(App);