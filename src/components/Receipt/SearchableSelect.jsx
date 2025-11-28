// src/components/Receipt/SearchableSelect.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "reactstrap";

/**
 * کامپوننت Select قابل جستجو با Portal
 */
const SearchableSelect = ({
                              options = [],
                              value,
                              onChange,
                              placeholder = "جستجو و انتخاب...",
                              disabled = false,
                              ...inputProps
                          }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // پیدا کردن label مقدار انتخاب شده
    const selectedLabel = useMemo(() => {
        const found = options.find((opt) => opt.value === value);
        return found ? found.label : "";
    }, [options, value]);

    // فیلتر کردن گزینه‌ها بر اساس جستجو
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const term = searchTerm.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(term) ||
                opt.value.toLowerCase().includes(term)
        );
    }, [options, searchTerm]);

    // محاسبه موقعیت dropdown
    const calculatePosition = useCallback(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = Math.min(200, filteredOptions.length * 45 + 10);

        // تعیین جهت باز شدن
        const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownStyle({
            position: "fixed",
            width: rect.width,
            left: rect.left,
            ...(openUp
                    ? { bottom: window.innerHeight - rect.top + 2 }
                    : { top: rect.bottom + 2 }
            ),
            maxHeight: 200,
            zIndex: 999999,
        });
    }, [filteredOptions.length]);

    // باز کردن dropdown
    const openDropdown = useCallback(() => {
        calculatePosition();
        setIsOpen(true);
        setSearchTerm("");
    }, [calculatePosition]);

    // بستن dropdown با کلیک بیرون
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                calculatePosition();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen, calculatePosition]);

    // انتخاب گزینه
    const handleSelect = (opt) => {
        onChange(opt.value);
        setIsOpen(false);
        setSearchTerm("");
    };

    // مدیریت کلید
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearchTerm("");
        }
        if (e.key === "Enter" && filteredOptions.length === 1) {
            e.preventDefault();
            handleSelect(filteredOptions[0]);
        }
        if (e.key === "Enter" && inputProps.onKeyDown) {
            if (filteredOptions.length !== 1) {
                inputProps.onKeyDown(e);
            }
        }
    };

    // Dropdown content
    const dropdownContent = isOpen && !disabled && (
        <div
            ref={dropdownRef}
            className="searchable-dropdown-portal"
            style={{
                ...dropdownStyle,
                overflowY: "auto",
                backgroundColor: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
        >
            {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                    <div
                        key={opt.value}
                        className={`searchable-option ${opt.value === value ? "selected" : ""}`}
                        onClick={() => handleSelect(opt)}
                        style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            backgroundColor: opt.value === value ? "rgba(234, 88, 12, 0.08)" : "transparent",
                            borderBottom: "1px solid #f1f5f9",
                            textAlign: "right",
                            transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                opt.value === value ? "rgba(234, 88, 12, 0.08)" : "transparent";
                        }}
                    >
                        <div style={{ fontWeight: "500", fontSize: "12px", color: "#1e293b", fontFamily: "Vazirmatn, sans-serif" }}>
                            {opt.label}
                        </div>
                        {opt.value !== opt.label && (
                            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px", direction: "ltr", textAlign: "right", fontFamily: "Vazirmatn, sans-serif" }}>
                                {opt.value}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div
                    style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "12px",
                        fontFamily: "Vazirmatn, sans-serif",
                    }}
                >
                    موردی یافت نشد
                </div>
            )}
        </div>
    );

    return (
        <>
            <div
                ref={containerRef}
                className="searchable-select"
                style={{ position: "relative" }}
            >
                <Input
                    ref={inputRef}
                    bsSize="sm"
                    type="text"
                    value={isOpen ? searchTerm : selectedLabel}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) {
                            openDropdown();
                        } else {
                            calculatePosition();
                        }
                    }}
                    onFocus={() => openDropdown()}
                    onKeyDown={handleKeyDown}
                    data-row={inputProps["data-row"]}
                    data-col={inputProps["data-col"]}
                    className="searchable-input"
                    autoComplete="off"
                    style={{
                        paddingLeft: "24px",
                        textAlign: "right",
                    }}
                />

                {/* آیکون dropdown */}
                <span
                    onClick={() => !disabled && (isOpen ? setIsOpen(false) : openDropdown())}
                    style={{
                        position: "absolute",
                        left: "8px",
                        top: "50%",
                        transform: `translateY(-50%) rotate(${isOpen ? "180deg" : "0deg"})`,
                        cursor: disabled ? "default" : "pointer",
                        color: isOpen ? "#ea580c" : "#94a3b8",
                        fontSize: "10px",
                        transition: "all 0.2s",
                    }}
                >
                    ▼
                </span>
            </div>

            {/* Portal برای dropdown - رندر در body */}
            {createPortal(dropdownContent, document.body)}
        </>
    );
};

export default SearchableSelect;
