import React from "react";
import { Card, CardBody, Table } from "reactstrap";

const typeLabels = {
    fuel: "درخواست سوخت",
    license: "درخواست جواز",
    dispute: "درخواست حل اختلاف",
    other: "درخواست متفرقه",
};

const statusLabels = {
    pending: "در حال بررسی",
    approved: "تأیید شده",
    rejected: "رد شده",
};

const LatestRequests = ({ requests }) => {
    return (
        <Card>
            <CardBody>
                <h4 className="mb-4">📄 آخرین درخواست‌ها</h4>

                <Table className="table table-striped">
                    <thead>
                    <tr>
                        <th>نوع</th>
                        <th>توضیحات</th>
                        <th>وضعیت</th>
                        <th>تاریخ</th>
                    </tr>
                    </thead>

                    <tbody>
                    {requests?.map((r, i) => (
                        <tr key={i}>
                            <td>{typeLabels[r.type]}</td>
                            <td>{r.description || "-"}</td>
                            <td>{statusLabels[r.status]}</td>
                            <td>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</td>
                        </tr>
                    ))}

                    {(!requests || requests.length === 0) && (
                        <tr>
                            <td colSpan="4" className="text-center">
                                هنوز هیچ درخواستی ثبت نشده است
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </CardBody>
        </Card>
    );
};

export default LatestRequests;
