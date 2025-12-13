export const selectStyles = {
  /* کنترل اصلی */
  control: (base, state) => ({
    ...base,
    backgroundColor: "#fff",
    borderColor: state.isFocused ? "#556ee6" : "#ced4da",
    minHeight: 38,
    borderRadius: 6,
    boxShadow: state.isFocused
      ? "0 0 0 0.15rem rgba(85, 110, 230, 0.25)"
      : "none",
    transition: "all 0.15s ease-in-out",
    "&:hover": {
      borderColor: state.isFocused ? "#556ee6" : "#bfc6d1",
    },
    direction: "rtl",
  }),

  /* فضای مقدار */
  valueContainer: (base) => ({
    ...base,
    padding: "2px 12px",
    direction: "rtl",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#495057",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#74788d",
  }),

  /* ورودی متن (search input) */
  input: (base) => ({
    ...base,
    color: "#495057",
    margin: 0,
    padding: 0,
  }),

  /* حذف جداکننده ایندیکاتور */
  indicatorSeparator: () => ({
    display: "none",
  }),

  /* فلش ↓ */
  dropdownIndicator: (base) => ({
    ...base,
    padding: 6,
    color: "#74788d",
    "&:hover": {
      color: "#495057",
    },
  }),

  /* دکمه پاک کردن */
  clearIndicator: (base) => ({
    ...base,
    cursor: "pointer",
    color: "#6c757d",
    "&:hover": {
      color: "#f46a6a",
    },
  }),

  /* منوی بازشونده */
  menuPortal: (base) => ({
    ...base,
    zIndex: 999999,
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#fff",
    border: "1px solid #ced4da",
    borderRadius: 6,
    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
    marginTop: 2,
    zIndex: 999999,
  }),

  menuList: (base) => ({
    ...base,
    padding: 0,
  }),

  /* گزینه‌ها */
  option: (base, state) => ({
    ...base,
    padding: "6px 12px",
    backgroundColor: state.isSelected
      ? "#556ee6"
      : state.isFocused
      ? "#f3f4f7"
      : "#fff",
    color: state.isSelected ? "#fff" : "#495057",
    cursor: "pointer",
    textAlign: "right",
  }),

  /* پیام خالی */
  noOptionsMessage: (base) => ({
    ...base,
    padding: "8px 12px",
    fontSize: "90%",
    color: "#74788d",
    textAlign: "center",
  }),

  /* مالتی سلکت */
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#eef0f4",
    borderRadius: 4,
    padding: "2px 6px",
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "#495057",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#6c757d",
    "&:hover": {
      backgroundColor: "#f46a6a",
      color: "#fff",
    },
  }),
};
