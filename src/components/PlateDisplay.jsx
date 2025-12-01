import React from "react";
import "../assets/scss/PlateDisplay.scss";

/**
 * کامپوننت نمایش پلاک خودرو ایرانی
 * @param {Object} plateData - اطلاعات پلاک
 */
const PlateDisplay = ({ plateData }) => {
  if (!plateData) return <span className="text-muted">-</span>;

  // بررسی تمام فیلدهای ممکن
  const {
    left2,
    iranRight,
    mid3,
    middle3,
    letter,
    right2
  } = plateData;

  // استفاده از نام‌های مختلف برای سازگاری
  const leftDigits = left2 || "";
  const middleDigits = mid3 || middle3 || "";
  const letterChar = letter || "";
  const rightDigits = right2 || "";
  const iranText = iranRight || "ایران";

  // بررسی اینکه آیا اطلاعات پلاک وجود دارد
  const hasPlateData = 
    (leftDigits && leftDigits.trim()) ||
    (middleDigits && middleDigits.trim()) ||
    (letterChar && letterChar.trim()) ||
    (rightDigits && rightDigits.trim());

  if (!hasPlateData) {
    return <span className="text-muted">-</span>;
  }

  return (
    <div className="iranian-plate">
      <div className="plate-container">
        {/* بخش راست - کد استان + ایران */}
        <div className="plate-section plate-right">
          
          <div className="iran-section">
            <div className="iran-flag"></div>
            <div className="iran-text">{iranText}</div>
          </div>
        </div>

        {/* بخش وسط - سه رقم */}
        <div className="plate-section plate-middle">
          <span className="plate-number">{middleDigits || "000"}</span>
        </div>

        {/* بخش حرف */}
        <div className="plate-section plate-letter">
          <span className="plate-char">{letterChar || "الف"}</span>
        </div>

        {/* بخش چپ - دو رقم */}
        <div className="plate-section plate-left">
          <span className="plate-number">{leftDigits || "00"}</span>
        </div>
      </div>
    </div>
  );
};

export default PlateDisplay;