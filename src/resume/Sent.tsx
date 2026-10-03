export function Sent() {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-24 md:px-0">
      <h1 className="font-pixel text-[44px] leading-none font-normal text-ink">Message sent</h1>
      <p className="mt-4">Thank you. I will reply to the email you gave.</p>
      <p className="mt-6">
        <a className="text-accent underline-offset-2 hover:underline" href="/resume/">
          Back to resume
        </a>
      </p>
    </main>
  );
}
