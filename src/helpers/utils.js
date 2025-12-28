// تبدیل تاریخ میلادی به شمسی
export const toPersianDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return "-";
    }
};

// تبدیل عدد به فرمت ۳ رقم ۳ رقم (مثلاً 1,000,000)
export const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return Number(num).toLocaleString();
};