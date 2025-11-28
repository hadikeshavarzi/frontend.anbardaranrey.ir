import {
  LOGIN_USER,
  LOGIN_SUCCESS,
  LOGOUT_USER,
  LOGOUT_USER_SUCCESS,
  API_ERROR,
} from "./actionTypes";

const initialState = {
  user: JSON.parse(localStorage.getItem("authUser")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: "",
};

const login = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        loading: true,
        error: "",
      };

    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,                    // 🔥 کاربر داخل state ذخیره می‌شود
        token: localStorage.getItem("token"),    // 🔥 token هم ذخیره می‌شود
      };

    case LOGOUT_USER:
      return { ...state };

    case LOGOUT_USER_SUCCESS:
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
      };

    case API_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default login;
