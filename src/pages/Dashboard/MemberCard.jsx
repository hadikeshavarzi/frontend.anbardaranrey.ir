import React from "react";
import { Card, CardBody, Row, Col } from "reactstrap";

const MemberCard = ({ member, loading }) => {


    if (loading || !member) {
        console.log('⚠️ MemberCard: Still loading or no member data');
        return (
            <Card>
                <CardBody>
                    <p className="text-center">در حال بارگذاری...</p>
                </CardBody>
            </Card>
        );
    }


    // محاسبه روزهای باقیمانده
    const calculateDaysRemaining = (expireDate) => {
        if (!expireDate) return null;
        const today = new Date();
        const expire = new Date(expireDate);
        const diffTime = expire - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = calculateDaysRemaining(member.license_expire_date);

    // تعیین وضعیت رنگ
    const getStatusColor = (days) => {
        if (!days) return "secondary";
        if (days < 0) return "danger";
        if (days <= 30) return "warning";
        return "success";
    };

    const statusColor = getStatusColor(daysRemaining);

    return (
        <Card>
            <CardBody>
                <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                        <img
                            src={member.member_image?.url || "/default-avatar.png"}
                            alt={member.full_name}
                            className="avatar-md rounded-circle"
                        />
                    </div>
                    <div className="flex-grow-1">
                        <h5 className="font-size-16 mb-1">{member.full_name}</h5>
                        <p className="text-muted mb-2">کد عضویت: {member.member_code}</p>
                        <p className="text-muted mb-0">موبایل: {member.mobile}</p>
                    </div>
                </div>

                <hr />

                <Row>
                    <Col xs="6">
                        <div className="mt-3">
                            <p className="text-muted mb-1">نام کسب و کار</p>
                            <h6 className="font-size-14">
                                {member.business_name || 'تعریف نشده'}
                            </h6>
                        </div>
                    </Col>
                    <Col xs="6">
                        <div className="mt-3">
                            <p className="text-muted mb-1">شماره جواز</p>
                            <h6 className="font-size-14">
                                {member.license_number || 'ندارد'}
                            </h6>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col xs="6">
                        <div className="mt-3">
                            <p className="text-muted mb-1">تاریخ صدور جواز</p>
                            <h6 className="font-size-14">
                                {member.license_issue_date
                                    ? new Date(member.license_issue_date).toLocaleDateString('fa-IR')
                                    : 'ندارد'}
                            </h6>
                        </div>
                    </Col>
                    <Col xs="6">
                        <div className="mt-3">
                            <p className="text-muted mb-1">تاریخ انقضا</p>
                            <h6 className="font-size-14">
                                {member.license_expire_date
                                    ? new Date(member.license_expire_date).toLocaleDateString('fa-IR')
                                    : 'ندارد'}
                            </h6>
                        </div>
                    </Col>
                </Row>

                {daysRemaining !== null && (
                    <div className="mt-3">
                        <div className={`alert alert-${statusColor} mb-0`} role="alert">
                            <strong>
                                {daysRemaining < 0
                                    ? `جواز منقضی شده (${Math.abs(daysRemaining)} روز پیش)`
                                    : `${daysRemaining} روز تا انقضا جواز`}
                            </strong>
                        </div>
                    </div>
                )}

                <div className="mt-3">
                    <p className="text-muted mb-1">نشانی</p>
                    <p className="font-size-14">{member.address || 'ثبت نشده'}</p>
                </div>
            </CardBody>
        </Card>
    );
};

export default MemberCard;
