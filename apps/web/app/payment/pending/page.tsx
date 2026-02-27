import { Suspense } from "react";
import PaymentPendingClient from "./PaymentPendingClient";

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPendingClient />
    </Suspense>
  );
}
