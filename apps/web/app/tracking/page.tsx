import { Suspense } from "react";
import TrackingClient from "./TrackingClient";

export default function TrackingPage() {
  return <Suspense fallback={<div style={{textAlign:"center",padding:80}}>Loading...</div>}><TrackingClient /></Suspense>;
}