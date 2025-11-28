import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";

// Components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import MemberCard from "./MemberCard";
import StatsCard from "./StatsCard";
import LatestRequests from "./LatestRequests";

const Dashboard = () => {
  const [member, setMember] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ API URL از environment variable یا پیش‌فرض
  const API_BASE = import.meta.env.VITE_API_URL || 'https://cms.anbardaranrey.ir';
  const API_URL = `${API_BASE}/api`;

  useEffect(() => {
    const userData = localStorage.getItem("member");
    const token = localStorage.getItem("token");


    if (!userData || !token) {
      return;
    }

    const _member = JSON.parse(userData);

    // ✅ دریافت اطلاعات عضو از Payload

    fetch(`${API_URL}/members/${_member.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {

          setMember(data);
        })
        .catch((err) => {
          // استفاده از داده localStorage در صورت خطا
          setMember(_member);
        })
        .finally(() => {
          // member load شد (موفق یا ناموفق)
          // حالا requests را بگیر
          fetchRequests(_member.id, token);
        });

  }, [API_BASE, API_URL]);

  // ✅ تابع جداگانه برای دریافت requests با handling خطای 404
  const fetchRequests = (memberId, token) => {
    fetch(`${API_URL}/requests?where[member][equals]=${memberId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
        .then(res => {
          if (!res.ok) {
            // اگر 404 است، collection وجود ندارد - مشکلی نیست
            if (res.status === 404) {
              return { docs: [] };
            }
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setRequests(data.docs || []);
        })
        .catch((err) => {
          setRequests([]);
        })
        .finally(() => {
          setLoading(false);
        });
  };

  return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="داشبورد" breadcrumbItem="پرتال اعضا" />

          <Row>
            <Col xl="4">
              <MemberCard member={member} loading={loading} />
            </Col>

            <Col xl="8">
              <StatsCard requests={requests} />
            </Col>
          </Row>

          <Row>
            <Col xl="12">
              <LatestRequests requests={requests} />
            </Col>
          </Row>
        </Container>
      </div>
  );
};

export default Dashboard;