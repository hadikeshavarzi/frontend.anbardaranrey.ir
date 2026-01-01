import React, { useState } from "react";
import { Form, Label, Input, Button, Spinner, Alert } from "reactstrap";
import { createSystemUser } from "../../services/memberService"; // سرویسی که قبلا ساختیم
import { toast } from "react-toastify";

const AddSystemUserForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({ full_name: "", mobile: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.mobile) {
            setError("لطفاً نام و شماره موبایل را وارد کنید.");
            return;
        }

        setLoading(true);
        setError(null);

        // ارسال درخواست ساخت کاربر سیستم
        const result = await createSystemUser(formData);

        setLoading(false);

        if (result.success) {
            toast.success("کارمند با موفقیت تعریف شد.");
            toast.info("کارمند می‌تواند با همین شماره موبایل وارد سیستم شود.");
            // پاک کردن فرم
            setFormData({ full_name: "", mobile: "" });
            // اطلاع به کامپوننت والد برای بستن مودال یا رفرش لیست
            if (onSuccess) onSuccess();
        } else {
            setError(result.error || "خطا در ثبت اطلاعات");
        }
    };

    return (
        <div className="p-2">
            {error && <Alert color="danger">{error}</Alert>}

            <div className="mb-3">
                <Label>نام و نام خانوادگی کارمند</Label>
                <Input
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="مثال: علی رضایی"
                />
            </div>

            <div className="mb-3">
                <Label>شماره موبایل (نام کاربری)</Label>
                <Input
                    type="tel"
                    dir="ltr"
                    className="text-start"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                    placeholder="09xxxxxxxxx"
                    maxLength={11}
                />
                <small className="text-muted">
                    کارمند با این شماره می‌تواند لاگین کند و کد تایید برایش پیامک می‌شود.
                </small>
            </div>

            <div className="d-grid">
                <Button color="success" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm"/> : "ثبت و ایجاد کاربر"}
                </Button>
            </div>
        </div>
    );
};

export default AddSystemUserForm;