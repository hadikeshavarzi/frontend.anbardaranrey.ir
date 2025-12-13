// src/components/Receipt/DatePickerWithIcon.jsx
import React, { useEffect, useMemo, useCallback, useRef } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import "../../assets/scss/DatePickerWithIcon.scss";

/* ------------------------------------------------------------
   Utils
------------------------------------------------------------ */

// تبدیل Date میلادی به ISO بدون مشکل timezone
const toLocalISODate = (date) => {
    if (!date) return null;
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

// تبدیل هر ورودی به DateObject شمسی
const toPersianDateObject = (value) => {
    if (!value) return null;

    // اگر ISO string باشد
    if (typeof value === "string") {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return new DateObject({
            date: d,
            calendar: persian,
            locale: persian_fa,
        });
    }

    // اگر Date میلادی باشد
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return new DateObject({
            date: value,
            calendar: persian,
            locale: persian_fa,
        });
    }

    // اگر DateObject باشد
    if (value instanceof DateObject) {
        return value;
    }

    return null;
};

// نرمال‌سازی minDate / maxDate
const normalizeLimit = (value) => {
    if (!value) return undefined;
    return toPersianDateObject(value);
};

// روزهای هفته شمسی
const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

const DatePickerWithIcon = ({
    value,
    onChange,
    placeholder = "انتخاب تاریخ",
    label,
    error,
    disabled = false,
    minDate,
    maxDate,
    className = "",
    defaultToday = true,
    clearable = true,
    name,
}) => {
    const initializedRef = useRef(false);

    // مقدار شمسی امن برای DatePicker
    const safeValue = useMemo(() => {
        return toPersianDateObject(value);
    }, [value]);

    // مقدار نمایشی
    const displayedValue = useMemo(() => {
        if (safeValue) return safeValue;

        if (defaultToday && !disabled) {
            return new DateObject({
                calendar: persian,
                locale: persian_fa,
            });
        }

        return null;
    }, [safeValue, defaultToday, disabled]);

    // ست کردن تاریخ امروز فقط یک بار
    useEffect(() => {
        if (initializedRef.current) return;

        if (defaultToday && !value && !disabled && onChange) {
            initializedRef.current = true;
            const today = new DateObject({
                calendar: persian,
                locale: persian_fa,
            });
            onChange(toLocalISODate(today.toDate()), name);
        }
    }, [defaultToday, value, disabled, onChange, name]);

    // تغییر تاریخ
    const handleChange = useCallback(
        (val) => {
            if (!val) {
                onChange?.(null, name);
                return;
            }

            try {
                const isoDate = toLocalISODate(val.toDate());
                onChange?.(isoDate, name);
            } catch (err) {
                console.error("DatePicker conversion error:", err);
            }
        },
        [onChange, name]
    );

    // پاک کردن تاریخ
    const handleClear = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange?.(null, name);
        },
        [onChange, name]
    );

    // کلاس‌های wrapper
    const wrapperClasses = useMemo(() => {
        const classes = ["date-picker-wrapper"];
        if (className) classes.push(className);
        if (error) classes.push("has-error");
        if (disabled) classes.push("is-disabled");
        return classes.join(" ");
    }, [className, error, disabled]);

    const showClearButton = clearable && safeValue && !disabled;

    return (
        <div className={wrapperClasses}>
            {label && (
                <label className="form-label mb-1" htmlFor={name}>
                    {label}
                </label>
            )}

            <div className="position-relative">
                <DatePicker
                    value={displayedValue}
                    onChange={handleChange}
                    calendar={persian}
                    locale={persian_fa}
                    format="YYYY/MM/DD"
                    weekDays={WEEK_DAYS}
                    containerClassName="w-100"
                    inputClass="form-control text-center"
                    placeholder={placeholder}
                    disabled={disabled}
                    minDate={normalizeLimit(minDate)}
                    maxDate={normalizeLimit(maxDate)}
                    highlightToday
                    editable={false}
                    arrow={false}
                    portal
                    portalTarget={document.body}
                    zIndex={9999}
                    name={name}
                />

                {showClearButton && (
                    <button
                        type="button"
                        className="btn btn-link text-muted position-absolute top-50 translate-middle-y end-0 me-2 p-0"
                        style={{ zIndex: 10 }}
                        onClick={handleClear}
                        title="پاک کردن"
                        aria-label="پاک کردن تاریخ"
                    >
                        <i className="ri-close-line fs-5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="text-danger small mt-1" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};

export default React.memo(DatePickerWithIcon);
