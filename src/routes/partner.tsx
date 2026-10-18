import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireUser, Shell, errMsg } from "@/components/canteen-ui";
import { submitPartner } from "@/lib/canteen/api";

export const Route = createFileRoute("/partner")({ component: PartnerPage });

function PartnerPage() {
  return <RequireUser><PartnerBody /></RequireUser>;
}

function PartnerBody() {
  const [orgName, setOrg] = useState("");
  const [campusName, setCampus] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Shell title="Partner" back={{ href: "/", label: "Home" }}>
      <h1 className="font-display text-4xl font-semibold">Partner your canteen</h1>
      <p className="mt-2 max-w-xl text-muted">Tell us the campus. A platform admin can open the tenant, counters and menu after review.</p>
      {done ? <p className="mt-6 rounded-3xl bg-foam p-4">Request saved. We will use the email on your account.</p> : (
        <form
          className="mt-6 max-w-xl space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPartner({ data: { orgName, campusName, note } })
              .then(() => setDone(true))
              .catch((error) => toast.error(errMsg(error)));
          }}
        >
          <input value={orgName} onChange={(e) => setOrg(e.target.value)} placeholder="Institution" className="w-full rounded-2xl border border-line bg-foam px-3 py-3" required />
          <input value={campusName} onChange={(e) => setCampus(e.target.value)} placeholder="Campus or hostel" className="w-full rounded-2xl border border-line bg-foam px-3 py-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Counters, peak hours, anything we should know" className="w-full rounded-2xl border border-line bg-foam px-3 py-3" />
          <button type="submit" className="rounded-full bg-chili px-5 py-3 font-semibold text-foam">Send request</button>
        </form>
      )}
    </Shell>
  );
}
