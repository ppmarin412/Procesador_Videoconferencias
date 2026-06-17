import MeetingForm from "@/components/meeting-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-5xl">
        <MeetingForm />
      </div>
    </main>
  );
}