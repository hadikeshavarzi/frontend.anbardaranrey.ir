import React from "react";
import { Card, CardBody } from "reactstrap";

const WelcomeComp = ({ member, loading }) => {
    if (loading) return <p>در حال دریافت اطلاعات...</p>;

    return (
        <Card>
            <CardBody>
                <h4 className="card-title mb-3">خوش آمدید!</h4>

                {member ? (
                    <div className="d-flex align-items-center">
                        <div className="avatar-md me-3">
              <span className="avatar-title rounded-circle bg-primary text-white font-size-24">
                {member.full_name?.charAt(0)}
              </span>
                        </div>

                        <div>
                            <h5 className="mb-1">{member.full_name}</h5>
                            <p className="text-muted mb-0">موبایل: {member.mobile}</p>
                            <p className="text-muted mb-0">کد عضویت: {member.member_code}</p>
                        </div>
                    </div>
                ) : (
                    <p>اطلاعات عضو یافت نشد</p>
                )}
            </CardBody>
        </Card>
    );
};


export default WelcomeComp;
