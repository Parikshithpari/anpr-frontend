import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const BASE_URL = "https://anpr-api.gconnectt.com";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const orderId  = searchParams.get("orderId");
  const called   = useRef(false);          // ✅ prevents double call

  useEffect(() => {
    if (orderId && !called.current) {
      called.current = true;               // ✅ mark as called immediately
      window.location.href = `${BASE_URL}/api/payment/verify-and-register?merchantOrderId=${orderId}`;
    }
  }, [orderId]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Segoe UI, sans-serif",
      background: "#f5edea"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ fontSize: "18px", fontWeight: "600", color: "#5C1F1F" }}>
          Verifying your payment...
        </p>
        <p style={{ fontSize: "13px", color: "#9a6060" }}>
          Please wait, do not close this page.
        </p>
      </div>
    </div>
  );
};

export default PaymentReturn;