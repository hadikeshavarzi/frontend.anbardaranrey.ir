import React from "react";
import { Card, CardBody } from "reactstrap";

const MemberInfoCard = ({ member }) => {
    if (!member) return null;

    const formatDate = (d) => {
        if (!d) return "-";
        return new Date(d).toLocaleDateString("fa-IR");
    };

    return (
        <Card>
            <CardBody>
                <h4 className="mb-4">👤 اطلاعات عضو</h4>

                {/* عکس پروفایل */}
                {member.member_image?.url && (
                    <div className="text-center mb-3">
                        <img
                            src={member.member_image.url}
                            alt="member"
                            style={{
                                width: 90,
                                height: 90,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid #ddd",
                            }}
                        />
                    </div>
                )}

                <p><strong>نام:</strong> {member.full_name}</p>
                <p><strong>نام پدر:</strong> {member.father_name || "-"}</p>
                <p><strong>کد ملی:</strong> {member.national_id || "-"}</p>

                <p><strong>موبایل:</strong> {member.mobile}</p>
                <p><strong>تلفن ثابت:</strong> {member.phone || "-"}</p>
                <p><strong>کد عضویت:</strong> {member.member_code}</p>

                <p><strong>نام کسب‌وکار:</strong> {member.business_name || "-"}</p>
                <p><strong>نام شرکت:</strong> {member.company_name || "-"}</p>
                <p><strong>شماره ثبت:</strong> {member.registration_number || "-"}</p>

                <p><strong>دسته‌بندی:</strong> {member.category}</p>
                <p><strong>وضعیت عضو:</strong> {member.member_status}</p>

                <p><strong>تاریخ تولد:</strong> {formatDate(member.birth_date)}</p>

                <hr />

                <h5 className="mb-3">📜 اطلاعات پروانه</h5>

                <p><strong>شماره پروانه:</strong> {member.license_number || "-"}</p>
                <p><strong>تاریخ صدور:</strong> {formatDate(member.license_issue_date)}</p>
                <p><strong>تاریخ انقضا:</strong> {formatDate(member.license_expire_date)}</p>

                {/* تصویر پروانه */}
                {member.license_image?.url && (
                    <div className="mt-2">
                        <strong>تصویر پروانه:</strong>
                        <br />
                        <img
                            src={member.license_image.url}
                            alt="license"
                            style={{
                                width: "100%",
                                maxWidth: 250,
                                borderRadius: 8,
                                marginTop: 8,
                            }}
                        />
                    </div>
                )}

                <hr />

                <p><strong>آدرس:</strong> {member.address || "-"}</p>
            </CardBody>
        </Card>
    );
};

export default MemberInfoCard;
