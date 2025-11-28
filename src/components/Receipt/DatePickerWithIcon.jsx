// src/components/Receipt/DatePickerWithIcon.jsx
import React from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import "../../assets/scss/DatePickerWithIcon.scss";

const DatePickerWithIcon = ({
                                value,
                                onChange,
                                placeholder,
                                label,
                                error,
                                disabled = false,
                                minDate,
                                maxDate,
                                className = ""
                            }) => {
    return (
        <div className={`date-picker-wrapper ${className} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
            {label && <label className="date-picker-label">{label}</label>}

            <div className="date-picker-input-group">
                <span className="date-picker-icon">
                    <i className="ri-calendar-event-line"></i>
                </span>

                <DatePicker
                    value={value}
                    onChange={onChange}
                    calendar={persian}
                    locale={persian_fa}
                    format="YYYY/MM/DD"
                    inputClass="date-picker-input"
                    containerClassName="date-picker-container"
                    placeholder={placeholder || "انتخاب تاریخ"}
                    disabled={disabled}
                    minDate={minDate}
                    maxDate={maxDate}
                    weekDays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}

                    portal   // 👈 مهم‌ترین بخش
                    arrow={false}
                    highlightToday
                />


                {value && !disabled && (
                    <button
                        type="button"
                        className="date-picker-clear"
                        onClick={() => onChange(null)}
                        title="پاک کردن"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                )}
            </div>

            {error && <span className="date-picker-error">{error}</span>}
        </div>
    );
};

export default DatePickerWithIcon;
