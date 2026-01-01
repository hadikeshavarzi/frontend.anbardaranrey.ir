import React, { useState, useEffect } from "react";
import { Container, Card, CardBody, Table, Button, Badge, Modal, ModalHeader, ModalBody } from "reactstrap";
import { Link } from "react-router-dom";
import { getMySystemUsers } from "../../services/memberService";
import AddSystemUserForm from "./AddSystemUserForm";

const SystemUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    // تابع لود کردن لیست
    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getMySystemUsers();
            setUsers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="font-size-18 m-0">مدیریت پرسنل و دسترسی‌ها</h4>
                    <Button color="primary" onClick={() => setModal(true)}>
                        <i className="bx bx-user-plus me-1"></i> تعریف کارمند جدید
                    </Button>
                </div>

                <Card>
                    <CardBody>
                        <div className="table-responsive">
                            <Table className="align-middle table-nowrap table-hover">
                                <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>نام کارمند</th>
                                    <th>شماره موبایل</th>
                                    <th>نقش</th>
                                    <th>تعداد دسترسی</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.id}>
                                        <td>{index + 1}</td>
                                        <td className="fw-bold">{user.full_name}</td>
                                        <td dir="ltr" className="text-end">{user.mobile}</td>
                                        <td>
                                            <Badge color="info" className="font-size-12">کارمند</Badge>
                                        </td>
                                        <td>
                                            {user.permissions && user.permissions.length > 0 ? (
                                                <Badge color="primary" pill>{user.permissions.length} مورد</Badge>
                                            ) : (
                                                <span className="text-muted small">--</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge color={user.member_status === 'active' ? 'success' : 'danger'}>
                                                {user.member_status === 'active' ? 'فعال' : 'غیرفعال'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/members/edit/${user.id}`}
                                                className="btn btn-outline-warning btn-sm"
                                                title="تغییر دسترسی‌ها"
                                            >
                                                <i className="bx bx-shield-quarter me-1"></i>
                                                مدیریت دسترسی
                                            </Link>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            هنوز کارمندی تعریف نکرده‌اید.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>

                {/* مودال افزودن */}
                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)}>تعریف کارمند جدید</ModalHeader>
                    <ModalBody>
                        <AddSystemUserForm onSuccess={() => { setModal(false); loadUsers(); }} />
                    </ModalBody>
                </Modal>

            </Container>
        </div>
    );
};

export default SystemUsersList;